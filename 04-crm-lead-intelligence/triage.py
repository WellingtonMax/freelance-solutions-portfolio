"""Offline B2B lead triage demo. Never contacts people or verifies ownership of email."""
import argparse
import csv
import hashlib
import io
import json
import re
import unicodedata
from pathlib import Path

MAX_BYTES = 1_000_000
MAX_ROWS = 5000
FIELDS = ("company", "role", "openings", "agency", "email", "opt_out")
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}\Z")
DANGEROUS = "=+-@\t\r\n"


def safe_text(value, maximum=160):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError("missing or oversized text field")
    value = unicodedata.normalize("NFKC", value).strip()
    if not value or len(value) > maximum:
        raise ValueError("missing or oversized text field")
    if any(ord(c) < 32 for c in value):
        raise ValueError("control character in field")
    if value.lstrip("\u200b\u200c\u200d\ufeff ").startswith(tuple(DANGEROUS)):
        raise ValueError("spreadsheet formula-like prefix")
    return value


def yes_no(value):
    value = value.strip().lower()
    if value not in ("yes", "no"):
        raise ValueError("expected yes/no")
    return value == "yes"


def analyze_bytes(data):
    if len(data) > MAX_BYTES:
        raise ValueError("input exceeds 1 MB")
    text = data.decode("utf-8-sig", errors="strict")
    try:
        reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
        if reader.fieldnames != list(FIELDS):
            raise ValueError("CSV headers must exactly match documented schema")
        selected = {}
        suppressed = set()
        rejected = []
        for number, row in enumerate(reader, start=2):
            if number > MAX_ROWS + 1:
                raise ValueError("row limit exceeded")
            try:
                if None in row or any(value is None for value in row.values()):
                    raise ValueError("invalid number of columns")
                company = safe_text(row["company"])
                # Suppress first: malformed contacts must not bypass an opt-out.
                agency = yes_no(row["agency"])
                opted_out = yes_no(row["opt_out"])
                key = company.casefold()
                # Conservative company-level suppression: a later opted-out or agency
                # record must invalidate earlier candidates, regardless of CSV order.
                if agency or opted_out:
                    suppressed.add(key)
                    selected.pop(key, None)
                    rejected.append({"row": number, "reason": "opted out" if opted_out else "agency excluded"})
                    continue
                if key in suppressed:
                    rejected.append({"row": number, "reason": "company suppressed by another row"})
                    continue
                role = safe_text(row["role"])
                email = row["email"].strip()
                if len(email) > 254 or not EMAIL.fullmatch(email):
                    raise ValueError("email syntax invalid (not verification)")
                openings = int(row["openings"])
                if not 0 <= openings <= 1000:
                    raise ValueError("openings out of range")
                score = min(openings * 10, 60) + (15 if any(
                    word in role.casefold() for word in ("engineer", "developer", "security")
                ) else 0)
                lead = {"company": company, "role": role, "openings": openings,
                        "email": email, "score": score, "status": "requires_human_review"}
                if key in selected:
                    rejected.append({"row": number, "reason": "duplicate company"})
                    if score > selected[key]["score"]:
                        selected[key] = lead
                else:
                    selected[key] = lead
            except (ValueError, TypeError) as exc:
                rejected.append({"row": number, "reason": str(exc)})
        return {"status": "prototype_no_outreach", "auto_send": False,
                "verification": "email syntax only; not deliverability or consent",
                "source_sha256": hashlib.sha256(data).hexdigest(),
                "leads": sorted(selected.values(), key=lambda x: (-x["score"], x["company"])),
                "rejected": rejected}
    except csv.Error as exc:
        raise ValueError("malformed CSV input") from exc


def main():
    parser = argparse.ArgumentParser(description="Offline lead triage; no external calls")
    parser.add_argument("csv_file", type=Path)
    args = parser.parse_args()
    if args.csv_file.stat().st_size > MAX_BYTES:
        parser.error("input exceeds 1 MB")
    print(json.dumps(analyze_bytes(args.csv_file.read_bytes()), indent=2))


if __name__ == "__main__":
    main()
