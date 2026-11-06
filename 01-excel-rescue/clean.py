"""Clean CRM CSV with explicit bounds and no silent duplicate precedence.

This is an offline transformation of operator-approved input, NOT a CRM
authorization/authenticity system. A trusted expected SHA-256 can detect tampering.
"""
from __future__ import annotations

import argparse
from collections import Counter
import csv
from datetime import datetime
import hashlib
import hmac
import io
from pathlib import Path
import re
import unicodedata

FIELDS = ("name", "email", "signup_date", "city")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MAX_BYTES = 5_000_000
MAX_ROWS = 20_000
MAX_CELL = 2_048


def resembles_spreadsheet_formula(value: str) -> bool:
    """Treat Unicode format/control characters and whitespace as ignorable prefix.

    Protects CSV spreadsheet consumers that normalize invisible prefixes before
    interpreting a cell. It is intentionally conservative, not a guarantee
    about the behavior of every spreadsheet application.
    """
    for char in value:
        if char.isspace() or unicodedata.category(char) in ("Cf", "Cc"):
            continue
        return char in ("=", "+", "-", "@")
    return False


def safe_cell(value: str) -> str:
    """Conservatively escape CSV formula-leading free text."""
    value = " ".join(str(value or "").split())
    if len(value) > MAX_CELL:
        raise ValueError("field too long")
    if resembles_spreadsheet_formula(value):
        return "'" + value
    return value


def normalize_date(value: str) -> str:
    value = str(value or "").strip()
    if not value:
        return ""
    # Business policy: slash dates are day/month/year. Ambiguous US-format
    # exports must be converted/approved before import.
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    raise ValueError("invalid date (requires ISO or DD/MM/YYYY)")


def normalize(row: dict[str, str]) -> dict[str, str]:
    if None in row or any(len(str(v or "")) > MAX_CELL for v in row.values()):
        raise ValueError("malformed row or field too long")
    email = str(row.get("email") or "").strip().lower()
    if len(email) > 320 or not EMAIL_PATTERN.fullmatch(email):
        raise ValueError("invalid email")
    if email.lstrip("\ufeff\u200b\u200c\u200d").startswith(("=", "+", "-", "@")):
        raise ValueError("unsafe email prefix for spreadsheet export")
    name = safe_cell(row.get("name") or "")
    if not name:
        raise ValueError("missing name")
    return {
        "name": name,
        "email": email,
        "signup_date": normalize_date(row.get("signup_date") or ""),
        "city": safe_cell(row.get("city") or ""),
    }


def clean_rows(rows):
    """Reject ALL occurrences of duplicate emails to prevent first-record poisoning."""
    valid, rejected = [], []
    for number, row in enumerate(rows, start=2):
        if number > MAX_ROWS + 1:
            raise ValueError("CSV row limit exceeded")
        try:
            valid.append((number, normalize(row)))
        except ValueError as exc:
            rejected.append({"line": number, "reason": str(exc)})
    counts = Counter(record["email"] for _, record in valid)
    cleaned = []
    for number, record in valid:
        if counts[record["email"]] != 1:
            rejected.append({"line": number, "reason": "duplicate email (all occurrences rejected)"})
        else:
            cleaned.append(record)
    rejected.sort(key=lambda item: item["line"])
    return cleaned, rejected


def process(source: Path, destination: Path, rejects_file: Path,
            expected_sha256: str | None = None) -> tuple[int, int]:
    paths = [source.resolve(), destination.resolve(), rejects_file.resolve()]
    if len(set(paths)) != 3:
        raise ValueError("input, clean output and reject output paths must differ")
    # Never overwrite existing output files, including symbolic links.
    if destination.exists() or destination.is_symlink() or rejects_file.exists() or rejects_file.is_symlink():
        raise FileExistsError("output already exists; choose new output paths")
    with source.open("rb") as stream:
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("CSV input exceeds 5 MB limit")
    digest = hashlib.sha256(raw).hexdigest()
    if expected_sha256 is not None:
        if not re.fullmatch(r"[a-fA-F0-9]{64}", expected_sha256):
            raise ValueError("expected SHA-256 must be 64 hex characters")
        if not hmac.compare_digest(digest, expected_sha256.lower()):
            raise ValueError("CSV input SHA-256 mismatch")
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
    if not reader.fieldnames:
        raise ValueError("CSV header is required")
    if len(reader.fieldnames) != len(set(reader.fieldnames)):
        raise ValueError("duplicate CSV header fields are not allowed")
    if set(reader.fieldnames) != set(FIELDS):
        raise ValueError("CSV header must contain exactly: " + ", ".join(FIELDS))
    cleaned, rejected = clean_rows(reader)
    for path in (destination, rejects_file):
        path.parent.mkdir(parents=True, exist_ok=True)
    # Both outputs are created exclusively. If either write fails, remove
    # only files this invocation created. This is best-effort rollback, not
    # a transaction: concurrent readers may briefly observe one output.
    created = []
    try:
        for path, fields, records in (
            (destination, FIELDS, cleaned),
            (rejects_file, ("line", "reason"), rejected),
        ):
            with path.open("x", encoding="utf-8", newline="") as stream:
                created.append(path)
                writer = csv.DictWriter(stream, fieldnames=fields)
                writer.writeheader()
                writer.writerows(records)
    except Exception:
        for path in reversed(created):
            path.unlink(missing_ok=True)
        raise
    return len(cleaned), len(rejected)


def main() -> None:
    parser = argparse.ArgumentParser(description="Bounded CRM CSV cleanup")
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path("cleaned.csv"))
    parser.add_argument("--rejects", type=Path, default=Path("rejected.csv"))
    parser.add_argument("--expected-sha256", help="SHA-256 obtained from a trusted channel")
    args = parser.parse_args()
    good, bad = process(args.source, args.output, args.rejects, args.expected_sha256)
    print(f"Accepted: {good}; rejected: {bad}")


if __name__ == "__main__":
    main()
