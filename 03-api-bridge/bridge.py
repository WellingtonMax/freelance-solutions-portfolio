"""Export operator-approved public HTTPS JSON endpoints to CSV.

The standalone demo intentionally DOES NOT handle API credentials. In particular,
an API_TOKEN environment variable is never sent to a user-selected destination.
For authenticated enterprise integrations use separately-scoped credentials,
server-owned endpoint policies, and a network egress firewall.
"""
from __future__ import annotations

import argparse
import csv
import http.client
import ipaddress
import json
from pathlib import Path
import re
import socket
import ssl
import time
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request

MAX_BYTES = 2_000_000
MAX_RECORDS = 20_000
RETRY_CODES = {429, 500, 502, 503, 504}
SAFE_FIELD = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,63}$")
SAFE_HOST = re.compile(r"^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$")
SAFE_DNS_LABEL = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


def validate_url(url: str, allowed_hosts: set[str]) -> str:
    """Exact host allowlist, HTTPS only; intended for trusted operators."""
    if not isinstance(url, str) or any(c in url for c in "\r\n\t"):
        raise ValueError("URL contains unsafe characters")
    parts = urlsplit(url)
    host = parts.hostname or ""
    if (parts.scheme != "https" or not host or parts.username is not None
            or parts.password is not None or parts.port not in (None, 443)
            or parts.fragment or host.endswith(".")
            or not SAFE_HOST.fullmatch(host)
            or len(host) > 253
            or any(not SAFE_DNS_LABEL.fullmatch(label) for label in host.split("."))
            or "." not in host
            or host.endswith((".local", ".localhost", ".internal", ".test", ".invalid"))):
        raise ValueError("Only valid public HTTPS DNS endpoints are accepted")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError("IP literals are not accepted")
    hosts = {h.lower() for h in allowed_hosts}
    if host.lower() not in hosts:
        raise ValueError("API hostname is not on the allowlist")
    return url


def resolve_public_addresses(hostname: str, resolver=None) -> list[str]:
    """Reject private/special DNS answers and return IPs to CONNECT TO directly.

    The connection is pinned to one validated address. We never re-resolve
    between the policy check and the TCP connection (DNS rebinding defense).
    """
    resolver = resolver or socket.getaddrinfo
    try:
        answers = resolver(hostname, 443, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise ValueError("DNS lookup failed") from exc
    addresses = sorted({item[4][0] for item in answers})
    if not addresses:
        raise ValueError("No DNS addresses were returned")
    for item in addresses:
        if not ipaddress.ip_address(item).is_global:
            raise ValueError("DNS returned a non-public IP address")
    return addresses


class _ManagedResponse:
    def __init__(self, connection, response):
        self.connection, self.response = connection, response

    def __enter__(self):
        return self.response

    def __exit__(self, exc_type, exc, traceback):
        self.connection.close()


def open_public_https(request: Request, timeout: int = 10):
    """No OS proxies, redirects, or implicit credentials; pin public DNS IP.

    Standard TLS hostname verification still authenticates the original DNS name.
    """
    url = urlsplit(request.full_url)
    hostname = url.hostname
    addresses = resolve_public_addresses(hostname)
    connection = http.client.HTTPSConnection(
        hostname, port=443, timeout=timeout, context=ssl.create_default_context()
    )
    raw_socket = socket.create_connection((addresses[0], 443), timeout=timeout)
    try:
        connection.sock = connection._context.wrap_socket(
            raw_socket, server_hostname=hostname
        )
    except Exception:
        raw_socket.close()
        raise
    try:
        target = url.path or "/"
        if url.query:
            target += "?" + url.query
        connection.request("GET", target, headers=dict(request.header_items()))
        response = connection.getresponse()
        if not 200 <= response.status < 300:
            status = response.status
            raise HTTPError(request.full_url, status, "Unexpected HTTP status", None, None)
        return _ManagedResponse(connection, response)
    except Exception:
        connection.close()
        raise


def fetch_json(url: str, allowed_hosts: set[str], transport=None,
               attempts: int = 3, sleeper=time.sleep) -> list[dict]:
    validate_url(url, allowed_hosts)
    if not 1 <= attempts <= 5:
        raise ValueError("attempts must be between 1 and 5")
    transport = transport or open_public_https
    request = Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "Portfolio-API-Bridge/2.0"},
        method="GET",
    )
    for attempt in range(attempts):
        try:
            with transport(request, timeout=10) as response:
                payload = response.read(MAX_BYTES + 1)
                if len(payload) > MAX_BYTES:
                    raise ValueError("API response exceeds 2 MB limit")
                data = json.loads(payload.decode("utf-8"))
            records = data.get("data") if isinstance(data, dict) else data
            if not isinstance(records, list) or not all(isinstance(row, dict) for row in records):
                raise ValueError("JSON must be a list of objects or {'data': [objects]}")
            if len(records) > MAX_RECORDS:
                raise ValueError("API record limit exceeded")
            return records
        except HTTPError as exc:
            if exc.code not in RETRY_CODES or attempt == attempts - 1:
                raise RuntimeError(f"API returned HTTP {exc.code}") from exc
        except (URLError, OSError) as exc:
            if attempt == attempts - 1:
                raise RuntimeError("API connection failed") from exc
        sleeper(min(2 ** attempt, 4))
    raise RuntimeError("API request exhausted retries")


def resembles_spreadsheet_formula(value: str) -> bool:
    """Consider leading Unicode format/control characters and whitespace."""
    for char in value:
        if char.isspace() or unicodedata.category(char) in ("Cf", "Cc"):
            continue
        return char in ("=", "+", "-", "@")
    return False


def safe_csv(value) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False)
    text = str(value).replace("\r", " ").replace("\n", " ").strip()
    if resembles_spreadsheet_formula(text):
        return "'" + text
    return text


def export_rows(records: list[dict], fields: list[str], destination: Path) -> int:
    if (not isinstance(fields, list) or not fields or len(fields) > 50
            or any(not isinstance(field, str) or not SAFE_FIELD.fullmatch(field)
                   for field in fields)
            or len(fields) != len(set(fields))):
        raise ValueError("Provide 1–50 unique safe column names (letters, digits, underscore)")
    if not isinstance(records, list) or len(records) > MAX_RECORDS:
        raise ValueError("API record limit exceeded or invalid records")
    # Reject malformed caller-supplied rows before creating any output artifact.
    # This also protects direct library callers that bypass fetch_json validation.
    if any(not isinstance(record, dict) for record in records):
        raise ValueError("API records must be objects")
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive create: never follow a pre-existing symlink or overwrite exports.
    with destination.open("x", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for record in records:
            writer.writerow({field: safe_csv(record.get(field)) for field in fields})
    return len(records)


def main() -> None:
    parser = argparse.ArgumentParser(description="Authorized public HTTPS JSON API -> CSV")
    parser.add_argument("--url", required=True, help="Approved public HTTPS JSON endpoint")
    parser.add_argument("--host", required=True, action="append",
                        help="Operator-approved exact hostname (not user-supplied)")
    parser.add_argument("--field", required=True, action="append", help="Column name")
    parser.add_argument("--output", type=Path, default=Path("api-export.csv"))
    args = parser.parse_args()
    records = fetch_json(args.url, set(args.host))
    print(f"Exported {export_rows(records, args.field, args.output)} records")


if __name__ == "__main__":
    main()
