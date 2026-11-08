"""Security and functional regressions for the local Excel Rescue web workspace."""
from http.client import HTTPConnection
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest

from webapp import Store, WebServer, verify, derive

SAMPLE = (Path(__file__).parent / "sample.csv").read_bytes()


class WebAppTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name))
        self.store.create_user("alice", "a-long-secure-passphrase-001")
        self.store.create_user("bob", "another-secure-passphrase-002")
        self.server = WebServer(("127.0.0.1", 0), self.store)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)
        self.temp.cleanup()

    def call(self, method, path, body=None, cookie=None, csrf=None, origin=True, extra=None):
        connection = HTTPConnection("127.0.0.1", self.port, timeout=8)
        headers = {}
        if origin and method in ("POST", "DELETE"):
            headers["Origin"] = "http://127.0.0.1:" + str(self.port)
        if cookie:
            headers["Cookie"] = cookie
        if csrf:
            headers["X-CSRF-Token"] = csrf
        if extra:
            headers.update(extra)
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read()
        received = dict(response.getheaders())
        status = response.status
        connection.close()
        return status, received, data

    def login(self, username="alice", password="a-long-secure-passphrase-001"):
        body = json.dumps({"username": username, "password": password}).encode()
        status, headers, payload = self.call("POST", "/api/login", body,
                        extra={"Content-Type": "application/json"})
        self.assertEqual(status, 200, payload)
        return headers["Set-Cookie"].split(";", 1)[0], json.loads(payload)["csrf"]

    def upload(self, cookie, csrf, raw=SAMPLE):
        return self.call("POST", "/api/jobs", raw, cookie, csrf,
                         extra={"Content-Type": "text/csv", "X-File-Name": "contacts.csv"})

    def test_login_and_password_hash_storage(self):
        with self.store.db() as db:
            row = db.execute("SELECT secret FROM users WHERE username='alice'").fetchone()
        self.assertTrue(row["secret"].startswith("scrypt:"))
        self.assertNotIn("a-long-secure-passphrase-001", row["secret"])
        self.assertTrue(verify("a-long-secure-passphrase-001", row["secret"]))
        self.assertFalse(verify("wrong-password", row["secret"]))
        cookie, csrf = self.login()
        self.assertIn("er_session=", cookie)
        status, _, data = self.call("GET", "/api/me", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(data)["csrf"], csrf)
        status, _, _ = self.call("GET", "/api/jobs")
        self.assertEqual(status, 401)

    def test_login_failure_rate_limit_and_origin_check(self):
        body = json.dumps({"username": "alice", "password": "not-correct"}).encode()
        status, _, _ = self.call("POST", "/api/login", body,
                                 extra={"Content-Type": "application/json"}, origin=False)
        self.assertEqual(status, 403)
        for i in range(5):
            status, _, _ = self.call("POST", "/api/login", body,
                                    extra={"Content-Type": "application/json"})
            self.assertEqual(status, 401)
        status, _, _ = self.call("POST", "/api/login", body,
                                extra={"Content-Type": "application/json"})
        self.assertEqual(status, 429)

    def test_username_rotation_cannot_bypass_global_login_limit(self):
        for i in range(20):
            body = json.dumps({"username": f"unknown{i}", "password": "wrong"}).encode()
            status, _, _ = self.call("POST", "/api/login", body,
                                    extra={"Content-Type": "application/json"})
            self.assertEqual(status, 401)
        # A different username, including a real one, is now throttled.
        body = json.dumps({"username": "alice",
                           "password": "a-long-secure-passphrase-001"}).encode()
        status, _, _ = self.call("POST", "/api/login", body,
                                extra={"Content-Type": "application/json"})
        self.assertEqual(status, 429)
        # Failed username rotation is bounded in the tracking dictionary.
        self.assertLessEqual(len(self.server.attempts), 21)

    def test_expired_rate_limits_release_account_and_global_bucket(self):
        # Deterministic expiry without a 15-minute sleep. Both buckets must
        # expire together; stale failures must not lock out a valid user.
        ip = "127.0.0.1"
        for index in range(20):
            self.assertFalse(self.server.rate_check(ip, f"rotated{index}"))
            self.server.rate_check(ip, f"rotated{index}", failed=True)
        self.assertTrue(self.server.rate_check(ip, "alice"))
        with self.server.attempt_lock:
            for key in list(self.server.attempts):
                self.server.attempts[key] = [t - 901 for t in self.server.attempts[key]]
        cookie, csrf = self.login()
        self.assertIn("er_session=", cookie)
        self.assertTrue(csrf)
        self.assertNotIn((ip, "*"), self.server.attempts)

    def test_expired_unvisited_usernames_are_swept(self):
        # Expired keys must not accumulate merely because their usernames
        # are never used again; do not rely on wall-clock sleeps.
        ip = "127.0.0.1"
        for index in range(12):
            self.server.rate_check(ip, f"stale{index}", failed=True)
        with self.server.attempt_lock:
            for bucket in list(self.server.attempts):
                self.server.attempts[bucket] = [
                    timestamp - 901 for timestamp in self.server.attempts[bucket]
                ]
            self.server.last_attempt_sweep -= 61
        self.assertFalse(self.server.rate_check(ip, "fresh"))
        with self.server.attempt_lock:
            self.assertEqual(self.server.attempts, {})

    def test_processing_download_and_database_output(self):
        cookie, csrf = self.login()
        status, _, data = self.upload(cookie, csrf)
        self.assertEqual(status, 201, data)
        job = json.loads(data)["job"]
        self.assertEqual((job["accepted"], job["rejected"]), (1, 3))
        status, _, data = self.call("GET", "/api/jobs", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertEqual(len(json.loads(data)["jobs"]), 1)
        job_id = job["id"]
        status, headers, cleaned = self.call("GET", "/api/jobs/" + job_id + "/cleaned.csv",
                                            cookie=cookie)
        self.assertEqual(status, 200)
        self.assertIn(b"bob@example.com", cleaned)
        self.assertIn("attachment;", headers["Content-Disposition"])
        status, _, rejects = self.call("GET", "/api/jobs/" + job_id + "/rejected.csv",
                                      cookie=cookie)
        self.assertEqual(status, 200)
        self.assertIn(b"duplicate email", rejects)
        with self.store.db() as db:
            row = db.execute("SELECT clean,rejects FROM jobs WHERE id=?", (job_id,)).fetchone()
        self.assertEqual(bytes(row["clean"]), cleaned)
        self.assertEqual(bytes(row["rejects"]), rejects)

    def test_csrf_and_cross_user_isolation(self):
        cookie, csrf = self.login()
        other_cookie, other_csrf = self.login("bob", "another-secure-passphrase-002")
        status, _, _ = self.upload(cookie, "incorrect")
        self.assertEqual(status, 403)
        status, _, data = self.upload(cookie, csrf)
        self.assertEqual(status, 201, data)
        job_id = json.loads(data)["job"]["id"]
        status, _, data = self.call("GET", "/api/jobs", cookie=other_cookie)
        self.assertEqual(json.loads(data)["jobs"], [])
        for path in ("/api/jobs/" + job_id + "/cleaned.csv",
                     "/api/jobs/" + job_id + "/rejected.csv"):
            status, _, _ = self.call("GET", path, cookie=other_cookie)
            self.assertEqual(status, 404)
        status, _, _ = self.call("DELETE", "/api/jobs/" + job_id,
                                cookie=other_cookie, csrf=other_csrf)
        self.assertEqual(status, 404)
        status, _, _ = self.call("DELETE", "/api/jobs/" + job_id,
                                cookie=cookie, csrf="wrong")
        self.assertEqual(status, 403)
        status, _, _ = self.call("DELETE", "/api/jobs/" + job_id,
                                cookie=cookie, csrf=csrf)
        self.assertEqual(status, 200)
        status, _, _ = self.call("GET", "/api/jobs/" + job_id + "/cleaned.csv",
                                cookie=cookie)
        self.assertEqual(status, 404)

    def test_reject_invalid_and_oversized_uploads(self):
        cookie, csrf = self.login()
        status, _, _ = self.upload(cookie, csrf, b"not,a,valid,schema\nvalue\n")
        self.assertEqual(status, 422)
        # Send only headers: a well-behaved server rejects oversized requests
        # immediately without reading a 5 MB body or waiting for a full upload.
        connection = HTTPConnection("127.0.0.1", self.port, timeout=8)
        connection.putrequest("POST", "/api/jobs")
        connection.putheader("Origin", "http://127.0.0.1:" + str(self.port))
        connection.putheader("Cookie", cookie)
        connection.putheader("X-CSRF-Token", csrf)
        connection.putheader("Content-Type", "text/csv")
        connection.putheader("Content-Length", "5000001")
        connection.endheaders()
        response = connection.getresponse()
        self.assertEqual(response.status, 413)
        response.read()
        connection.close()
        self.assertEqual(self.store.list_jobs(1), [])

    def test_logout_revokes_session(self):
        cookie, csrf = self.login()
        status, _, _ = self.call("POST", "/api/logout", None, cookie, csrf)
        self.assertEqual(status, 200)
        status, _, _ = self.call("GET", "/api/me", cookie=cookie)
        self.assertEqual(status, 401)

    def test_static_assets_and_invalid_host(self):
        status, headers, html = self.call("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn(b"Excel Rescue", html)
        self.assertIn("no-store", headers["Cache-Control"])
        self.assertIn("frame-ancestors 'none'", headers["Content-Security-Policy"])
        status, _, script = self.call("GET", "/app.js")
        self.assertEqual(status, 200)
        self.assertIn(b"textContent", script)
        status, _, _ = self.call("GET", "/api/me", extra={"Host": "attacker.example"})
        self.assertEqual(status, 400)


if __name__ == "__main__":
    unittest.main()
