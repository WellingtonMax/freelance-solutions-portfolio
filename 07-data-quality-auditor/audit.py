"""Local CSV schema/data quality auditor. Reports anomalies without leaking raw rows."""
import argparse
import csv
import hashlib
import io
import os
import stat
import json
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from statistics import median

MAX_BYTES = 1_000_000
MAX_ROWS = 10000
HEADERS = ["record_id", "category", "amount", "updated_at"]
IDENT = re.compile(r"[A-Za-z0-9_-]{1,40}\Z")
MONEY = re.compile(r"(?:0|[1-9][0-9]{0,9})\.[0-9]{2}\Z")


def audit(data):
    if len(data) > MAX_BYTES:
        raise ValueError("CSV exceeds 1 MB")
    try:
        decoded = data.decode("utf-8-sig")
    except UnicodeError as exc:
        raise ValueError("input must be UTF-8") from exc
    issues = []
    seen = set()
    amounts = []
    try:
        reader = csv.DictReader(io.StringIO(decoded, newline=""), strict=True)
        if reader.fieldnames != HEADERS:
            raise ValueError("unexpected CSV columns")
        count = 0
        for line, row in enumerate(reader, start=2):
            count += 1
            if count > MAX_ROWS:
                raise ValueError("row limit exceeded")
            if None in row or any(v is None for v in row.values()):
                issues.append({"row": line, "code": "SCHEMA_COLUMNS"})
                continue
            issue_count_before_row = len(issues)
            rid = row["record_id"].strip()
            if not IDENT.fullmatch(rid):
                issues.append({"row": line, "code": "INVALID_ID"})
            elif rid in seen:
                issues.append({"row": line, "code": "DUPLICATE_ID"})
            else:
                seen.add(rid)
            category = row["category"].strip()
            if not 1 <= len(category) <= 80 or any(ord(c) < 32 for c in category):
                issues.append({"row": line, "code": "INVALID_CATEGORY"})
            value = row["amount"].strip()
            amount = None
            if not MONEY.fullmatch(value):
                issues.append({"row": line, "code": "INVALID_AMOUNT"})
            else:
                try:
                    amount = Decimal(value)
                except InvalidOperation:
                    issues.append({"row": line, "code": "INVALID_AMOUNT"})
            raw_date = row["updated_at"].strip()
            try:
                if len(raw_date) != 10 or date.fromisoformat(raw_date).isoformat() != raw_date:
                    raise ValueError
            except ValueError:
                issues.append({"row": line, "code": "INVALID_DATE"})
            # Invalid records must not poison the anomaly baseline.
            if len(issues) == issue_count_before_row and amount is not None:
                amounts.append((line, amount))
    except csv.Error as exc:
        raise ValueError("malformed CSV") from exc
    # Heuristic, not an audited fraud detector. Only flag high outliers with enough sample records.
    if len(amounts) >= 5:
        midpoint = median(value for _, value in amounts)
        if midpoint > 0:
            for line, value in amounts:
                if value > 5 * midpoint:
                    issues.append({"row": line, "code": "HIGH_AMOUNT_OUTLIER"})
    return {"status": "prototype", "input_sha256": hashlib.sha256(data).hexdigest(),
            "rows": count, "issues": sorted(issues, key=lambda x: (x["row"], x["code"])),
            "issue_count": len(issues)}


def read_input(path):
    """Bound untrusted local reads; reject non-regular files and final symlinks where supported."""
    flags = os.O_RDONLY | getattr(os, "O_NONBLOCK", 0) | getattr(os, "O_NOFOLLOW", 0)
    fd = os.open(path, flags)
    try:
        if not stat.S_ISREG(os.fstat(fd).st_mode):
            raise ValueError("input must be a regular file")
        with os.fdopen(fd, "rb") as stream:
            fd = -1
            data = stream.read(MAX_BYTES + 1)
    finally:
        if fd != -1:
            os.close(fd)
    if len(data) > MAX_BYTES:
        raise ValueError("CSV exceeds 1 MB")
    return data


def main():
    parser = argparse.ArgumentParser(description="Offline CSV schema and quality checks")
    parser.add_argument("input_csv", type=Path)
    args = parser.parse_args()
    try:
        result = audit(read_input(args.input_csv))
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
