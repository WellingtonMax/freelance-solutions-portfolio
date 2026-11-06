"""Local-first Excel Rescue: authenticated CSV processing with private SQLite storage.

Requires Python 3.11+. Binds only to 127.0.0.1; NEVER expose this HTTP app
directly on a public network. See WEBAPP.md for security limits.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from getpass import getpass
import hashlib
import hmac
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import tempfile
import threading
import time
from urllib.parse import urlsplit
import uuid

from clean import MAX_BYTES, process

WEB = Path(__file__).resolve().parent / "web"
COOKIE = "er_session"
SESSION_TTL = 8 * 3600
USER_RE = re.compile(r"[a-z][a-z0-9_.-]{2,39}\Z")


class Problem(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status, self.message = status, message


def derive(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    return ":".join(["scrypt", salt.hex(), digest.hex()])


def verify(password, value):
    try:
        algo, salt, digest = value.split(":")
        if algo != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt),
                                n=16384, r=8, p=1, dklen=32)
        return hmac.compare_digest(actual, bytes.fromhex(digest))
    except (ValueError, TypeError, MemoryError):
        return False


DUMMY_HASH = derive("unknown-account-equal-cost-verification")


class Store:
    def __init__(self, directory):
        self.directory = Path(directory).expanduser().absolute()
        if self.directory.is_symlink():
            raise ValueError("Data folder must not be a symlink")
        self.directory.mkdir(parents=True, mode=0o700, exist_ok=True)
        if os.name == "posix":
            self.directory.chmod(0o700)
        self.path = self.directory / "excel_rescue.sqlite3"
        if self.path.is_symlink():
            raise ValueError("Database must not be a symlink")
        if not self.path.exists():
            fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            os.close(fd)
        if os.name == "posix":
            self.path.chmod(0o600)
        with self.db() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE,
              secret TEXT NOT NULL, created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
              token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL
              REFERENCES users(id) ON DELETE CASCADE,
              csrf TEXT NOT NULL, expires_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
            CREATE TABLE IF NOT EXISTS jobs (
              id TEXT PRIMARY KEY, owner INTEGER NOT NULL
              REFERENCES users(id) ON DELETE CASCADE,
              filename TEXT NOT NULL, created_at INTEGER NOT NULL,
              source_sha256 TEXT NOT NULL, accepted INTEGER NOT NULL,
              rejected INTEGER NOT NULL, clean BLOB NOT NULL, rejects BLOB NOT NULL
            );
            CREATE INDEX IF NOT EXISTS jobs_owner ON jobs(owner,created_at);
            """)

    @contextmanager
    def db(self):
        conn = sqlite3.connect(self.path, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA secure_delete=ON")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def create_user(self, username, password):
        username = username.strip().lower()
        if not USER_RE.fullmatch(username):
            raise ValueError("Username needs 3-40 lowercase letters/numbers/_/./-")
        if not 12 <= len(password) <= 128 or len(password.encode()) > 512:
            raise ValueError("Password needs 12-128 characters")
        with self.db() as conn:
            conn.execute("INSERT INTO users(username,secret,created_at) VALUES(?,?,?)",
                         (username, derive(password), int(time.time())))

    def check_login(self, username, password):
        with self.db() as conn:
            user = conn.execute("SELECT id,username,secret FROM users WHERE username=?",
                                (username,)).fetchone()
        good = verify(password, user["secret"] if user else DUMMY_HASH)
        return dict(user) if user and good else None

    def login(self, user_id):
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        with self.db() as conn:
            conn.execute("DELETE FROM sessions WHERE expires_at<=?", (int(time.time()),))
            conn.execute("INSERT INTO sessions VALUES(?,?,?,?)",
                         (hashlib.sha256(token.encode()).hexdigest(), user_id,
                          csrf, int(time.time()) + SESSION_TTL))
        return token, csrf

    def session(self, token):
        if not token or len(token) > 256:
            return None
        with self.db() as conn:
            row = conn.execute("""
              SELECT s.user_id,u.username,s.csrf FROM sessions s
              JOIN users u ON u.id=s.user_id
              WHERE s.token_hash=? AND s.expires_at>?""",
              (hashlib.sha256(token.encode()).hexdigest(), int(time.time()))).fetchone()
        return dict(row) if row else None

    def logout(self, token):
        with self.db() as conn:
            conn.execute("DELETE FROM sessions WHERE token_hash=?",
                         (hashlib.sha256(token.encode()).hexdigest(),))

    def list_jobs(self, user_id):
        with self.db() as conn:
            rows = conn.execute("""
              SELECT id,filename,created_at,source_sha256,accepted,rejected
              FROM jobs WHERE owner=? ORDER BY created_at DESC,id DESC LIMIT 100
              """, (user_id,)).fetchall()
        return [dict(row) for row in rows]

    def run(self, owner, filename, raw):
        # Only output data is stored; uploads are removed with TemporaryDirectory.
        with tempfile.TemporaryDirectory(prefix="excel-rescue-") as directory:
            base = Path(directory)
            input_file = base / "source.csv"
            input_file.write_bytes(raw)
            if os.name == "posix":
                input_file.chmod(0o600)
            try:
                accepted, rejected = process(input_file, base / "clean.csv",
                                             base / "rejects.csv")
            except (ValueError, UnicodeError) as exc:
                raise Problem(422, "Invalid CSV: " + str(exc)[:150]) from exc
            clean, rejects = (base / "clean.csv").read_bytes(), (base / "rejects.csv").read_bytes()
        job_id = uuid.uuid4().hex
        with self.db() as conn:
            number = conn.execute("SELECT COUNT(*) FROM jobs WHERE owner=?", (owner,)).fetchone()[0]
            if number >= 100:
                raise Problem(409, "100 stored jobs maximum; delete older jobs")
            conn.execute("""INSERT INTO jobs
              (id,owner,filename,created_at,source_sha256,accepted,rejected,clean,rejects)
              VALUES(?,?,?,?,?,?,?,?,?)""",
              (job_id, owner, filename, int(time.time()), hashlib.sha256(raw).hexdigest(),
               accepted, rejected, clean, rejects))
        return {"id": job_id, "filename": filename, "accepted": accepted,
                "rejected": rejected}

    def output(self, owner, job_id, kind):
        with self.db() as conn:
            column = "clean" if kind == "cleaned" else "rejects"
            row = conn.execute("SELECT " + column + " FROM jobs WHERE owner=? AND id=?",
                               (owner, job_id)).fetchone()
        return bytes(row[0]) if row else None

    def delete(self, owner, job_id):
        with self.db() as conn:
            return conn.execute("DELETE FROM jobs WHERE owner=? AND id=?",
                                (owner, job_id)).rowcount > 0


class WebServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, store):
        if address[0] != "127.0.0.1":
            raise ValueError("Only the loopback address is supported")
        super().__init__(address, Handler)
        self.store = store
        self.attempts = {}
        self.attempt_lock = threading.Lock()

    def rate_check(self, ip, username, failed=False):
        key = (ip, username)
        with self.attempt_lock:
            current = time.monotonic()
            recent = [t for t in self.attempts.get(key, []) if current - t < 900]
            if failed:
                recent.append(current)
            self.attempts[key] = recent
            return len(recent) >= 5

    def rate_clear(self, ip, username):
        with self.attempt_lock:
            self.attempts.pop((ip, username), None)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server: WebServer

    def setup(self):
        super().setup()
        self.connection.settimeout(20)

    def send_bytes(self, status, payload, mime="application/json; charset=utf-8",
                   cookie=None, filename=None):
        self.send_response(status)
        for name, value in (
            ("Content-Type", mime), ("Content-Length", str(len(payload))),
            ("Cache-Control", "no-store"), ("X-Content-Type-Options", "nosniff"),
            ("X-Frame-Options", "DENY"), ("Referrer-Policy", "no-referrer"),
            ("Content-Security-Policy",
             "default-src 'self'; script-src 'self'; style-src 'self'; "
             "connect-src 'self'; img-src 'self'; object-src 'none'; "
             "base-uri 'none'; frame-ancestors 'none'; form-action 'self'"),
        ):
            self.send_header(name, value)
        if cookie is not None:
            self.send_header("Set-Cookie", cookie)
        if filename:
            self.send_header("Content-Disposition", 'attachment; filename="' + filename + '"')
        self.end_headers()
        self.wfile.write(payload)

    def send_json(self, status, obj, cookie=None):
        self.send_bytes(status, json.dumps(obj).encode(), cookie=cookie)

    def require_host(self):
        port = self.server.server_address[1]
        if self.headers.get("Host") not in (f"127.0.0.1:{port}", f"localhost:{port}"):
            raise Problem(400, "Invalid Host")

    def require_origin(self):
        if self.headers.get("Origin") != "http://" + self.headers.get("Host", ""):
            raise Problem(403, "Same-origin request required")

    def body(self, maximum):
        if self.headers.get("Transfer-Encoding"):
            raise Problem(400, "Chunked requests are not supported")
        value = self.headers.get("Content-Length")
        try:
            size = int(value) if value is not None else -1
        except ValueError:
            raise Problem(400, "Invalid body length") from None
        if size < 1:
            raise Problem(411, "Content-Length required")
        if size > maximum:
            raise Problem(413, "Request size limit exceeded")
        return self.rfile.read(size)

    def token(self):
        try:
            cookie = SimpleCookie()
            cookie.load(self.headers.get("Cookie", ""))
            return cookie[COOKIE].value if COOKIE in cookie else ""
        except Exception:
            return ""

    def account(self):
        account = self.server.store.session(self.token())
        if not account:
            raise Problem(401, "Login required")
        return account

    def csrf(self, account):
        value = self.headers.get("X-CSRF-Token", "")
        if not value or not hmac.compare_digest(value, account["csrf"]):
            raise Problem(403, "Invalid CSRF token")

    def route(self, method):
        self.require_host()
        path = urlsplit(self.path).path
        # Never reuse connections when a mutation may have unread request bytes.
        # Prevents a client-supplied body being parsed as a second HTTP request.
        if method in ("POST", "DELETE"):
            self.close_connection = True
        if method == "GET" and path in ("/", "/app.css", "/app.js"):
            file = "index.html" if path == "/" else path[1:]
            mime = ("text/html" if file.endswith(".html") else
                    "text/css" if file.endswith(".css") else "text/javascript")
            self.send_bytes(200, (WEB / file).read_bytes(), mime + "; charset=utf-8")
            return
        if method in ("POST", "DELETE"):
            self.require_origin()
        if method == "POST" and path == "/api/login":
            if self.headers.get_content_type() != "application/json":
                raise Problem(415, "JSON body required")
            try:
                body = json.loads(self.body(2048))
            except (ValueError, UnicodeError):
                raise Problem(400, "Invalid JSON") from None
            if not isinstance(body, dict):
                raise Problem(400, "Invalid credentials")
            user, password = body.get("username"), body.get("password")
            if not isinstance(user, str) or not isinstance(password, str):
                raise Problem(400, "Invalid credentials")
            user = user.strip().lower()[:40]
            if len(password) > 128:
                raise Problem(401, "Invalid credentials")
            ip = self.client_address[0]
            if self.server.rate_check(ip, user):
                raise Problem(429, "Too many attempts; retry later")
            account = self.server.store.check_login(user, password)
            if not account:
                self.server.rate_check(ip, user, failed=True)
                raise Problem(401, "Invalid username or password")
            self.server.rate_clear(ip, user)
            token, csrf = self.server.store.login(account["id"])
            cookie = f"{COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_TTL}"
            self.send_json(200, {"username": user, "csrf": csrf}, cookie)
            return
        if method == "GET" and path == "/api/me":
            account = self.account()
            self.send_json(200, {"username": account["username"], "csrf": account["csrf"]})
            return
        if method == "GET" and path == "/api/jobs":
            account = self.account()
            self.send_json(200, {"jobs": self.server.store.list_jobs(account["user_id"])})
            return
        if method == "POST" and path == "/api/jobs":
            account = self.account()
            self.csrf(account)
            if self.headers.get_content_type() != "text/csv":
                raise Problem(415, "text/csv required")
            supplied = self.headers.get("X-File-Name", "contacts.csv")
            filename = re.sub(r"[^a-zA-Z0-9_.-]", "_",
                              supplied.split("/")[-1].split("\\")[-1])[:100]
            if not filename.lower().endswith(".csv"):
                filename = "contacts.csv"
            result = self.server.store.run(account["user_id"], filename, self.body(MAX_BYTES))
            self.send_json(201, {"job": result})
            return
        if method == "POST" and path == "/api/logout":
            account = self.account()
            self.csrf(account)
            self.server.store.logout(self.token())
            self.send_json(200, {"ok": True},
                           f"{COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0")
            return
        match = re.fullmatch(r"/api/jobs/([0-9a-f]{32})(?:/(cleaned|rejected)\.csv)?", path)
        if match:
            account = self.account()
            job_id, kind = match.groups()
            if method == "DELETE" and kind is None:
                self.csrf(account)
                if not self.server.store.delete(account["user_id"], job_id):
                    raise Problem(404, "Job not found")
                self.send_json(200, {"ok": True})
                return
            if method == "GET" and kind:
                result = self.server.store.output(account["user_id"], job_id, kind)
                if result is None:
                    raise Problem(404, "Job not found")
                self.send_bytes(200, result, "text/csv; charset=utf-8",
                                filename=f"excel-rescue-{job_id[:8]}-{kind}.csv")
                return
        raise Problem(404, "Not found")

    def dispatch(self, method):
        try:
            self.route(method)
        except Problem as exc:
            self.close_connection = True
            self.send_json(exc.status, {"error": exc.message})
        except (BrokenPipeError, ConnectionResetError, TimeoutError):
            self.close_connection = True
        except Exception:
            self.close_connection = True
            self.send_json(500, {"error": "Internal server error"})

    def do_GET(self):
        self.dispatch("GET")

    def do_POST(self):
        self.dispatch("POST")

    def do_DELETE(self):
        self.dispatch("DELETE")


def main():
    parser = argparse.ArgumentParser(description="Excel Rescue local web application")
    parser.add_argument("command", choices=("create-user", "serve"))
    parser.add_argument("--username")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--data-dir", type=Path,
                        default=Path(os.environ.get("EXCEL_RESCUE_DATA_DIR",
                                      str(Path.home() / ".excel-rescue"))))
    args = parser.parse_args()
    store = Store(args.data_dir)
    if args.command == "create-user":
        if not args.username:
            parser.error("--username is required")
        password, confirmation = getpass("New password: "), getpass("Confirm password: ")
        if password != confirmation:
            parser.error("Passwords do not match")
        try:
            store.create_user(args.username, password)
        except (ValueError, sqlite3.IntegrityError) as exc:
            parser.error(str(exc))
        print("Account created successfully.")
    else:
        with WebServer(("127.0.0.1", args.port), store) as web:
            print(f"Excel Rescue: http://127.0.0.1:{web.server_address[1]}")
            print("Local access only; do not expose this HTTP service publicly.")
            try:
                web.serve_forever()
            except KeyboardInterrupt:
                pass


if __name__ == "__main__":
    main()
