"""Offline B2B lead triage demo. Never contacts people or verifies ownership of email."""
import argparse
import csv
import hashlib
import io
import json
import os
import stat
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
                key = company.casefold()
                # Unknown suppression flags are not evidence of permission to contact.
                # Evaluate both flags independently: a malformed agency flag must not
                # obscure an explicit opt-out (or vice versa).
                try:
                    agency = yes_no(row["agency"])
                except (ValueError, AttributeError):
                    agency = None
                try:
                    opted_out = yes_no(row["opt_out"])
                except (ValueError, AttributeError):
                    opted_out = None
                if agency is not False or opted_out is not False:
                    suppressed.add(key)
                    selected.pop(key, None)
                    reason = ("opted out" if opted_out is True else
                              "agency excluded" if agency is True else
                              "ambiguous suppression flag; human review required")
                    rejected.append({"row": number, "reason": reason})
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


def read_input(path):
    """Bound local input before allocating; reject symlinks and non-regular files."""
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
        raise ValueError("input exceeds 1 MB")
    return data


def main():
    parser = argparse.ArgumentParser(description="Offline lead triage; no external calls")
    parser.add_argument("csv_file", type=Path)
    args = parser.parse_args()
    try:
        data = read_input(args.csv_file)
        result = analyze_bytes(data)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
