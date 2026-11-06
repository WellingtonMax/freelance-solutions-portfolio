"""Local CSV schema/data quality auditor. Reports anomalies without leaking raw rows."""
import argparse
import csv
import hashlib
import io
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
            if not MONEY.fullmatch(value):
                issues.append({"row": line, "code": "INVALID_AMOUNT"})
            else:
                try:
                    amounts.append((line, Decimal(value)))
                except InvalidOperation:
                    issues.append({"row": line, "code": "INVALID_AMOUNT"})
            raw_date = row["updated_at"].strip()
            try:
                if len(raw_date) != 10 or date.fromisoformat(raw_date).isoformat() != raw_date:
                    raise ValueError
            except ValueError:
                issues.append({"row": line, "code": "INVALID_DATE"})
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


def main():
    parser = argparse.ArgumentParser(description="Offline CSV schema and quality checks")
    parser.add_argument("input_csv", type=Path)
    args = parser.parse_args()
    if args.input_csv.stat().st_size > MAX_BYTES:
        parser.error("CSV exceeds 1 MB")
    print(json.dumps(audit(args.input_csv.read_bytes()), indent=2))


if __name__ == "__main__":
    main()
