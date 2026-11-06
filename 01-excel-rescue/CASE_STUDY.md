# Case Study 01 — Excel Rescue

> **Fictional business scenario.** Original demonstration; not paid customer work.

## The brief

A small service company has an exported CSV of CRM contacts. Emails differ in capitalization, dates use mixed conventions, and duplicate contacts create unreliable follow-up lists. Staff want a clean export **without silently discarding bad records**.

## Solution

A Python command-line tool:

- validates the input header;
- normalizes emails, whitespace and dates;
- rejects every occurrence of a duplicate email for manual reconciliation;
- writes a separate CSV listing rejected rows and reasons;
- protects text columns against basic spreadsheet formula injection.

## Before → after (fictional example)

**Input:** [sample.csv](sample.csv), four rows including duplicate and invalid email entries.

**Expected transformation:**

| Outcome | Example |
|---|---|
| Accepted | Bob Lima |
| Rejected | Both occurrences of Alice's email; invalid email |
| Date normalization | `05/11/2026` → `2026-11-05` |
| Email normalization | ` ALICE@EXAMPLE.COM ` → `alice@example.com` |

Expected count: **1 accepted, 3 rejected** for the provided fixture. This is the expected result from the fixture, not a measurement of a real customer's dataset.

## Verify it

```bash
cd 01-excel-rescue
python clean.py sample.csv --output cleaned.csv --rejects rejected.csv
python -m unittest test_clean.py -v
```

Inspect `cleaned.csv` and `rejected.csv`. The test suite checks normalization, duplicate detection, invalid values, formula-injection handling and the file pipeline.

## Handover scope

- Reusable script: [clean.py](clean.py)
- Synthetic input: [sample.csv](sample.csv)
- Unit tests: [test_clean.py](test_clean.py)
- [Operational README](README.md)

**Caveats:** Handles CSV, not native Excel macros or workbooks; supports ISO and DD/MM/YYYY only; does not connect to a live CRM. To stop silent duplicate poisoning, all ambiguous duplicate records are rejected and require trusted external reconciliation. Input is bounded to 5 MB / 20,000 rows; SHA-256 comparison is optional and depends on an independently trusted value. Ambiguous dates, data schemas and duplicate rules must be agreed for a real engagement.

**Status:** implemented. Independent runtime/CI verification still needs confirmation.
