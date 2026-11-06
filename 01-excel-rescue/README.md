# Excel Rescue — CRM CSV Cleanup

**Client problem:** exported contact files often contain inconsistent dates, duplicate emails and invalid rows.

**Deliverables:** normalized CSV, rejected-record audit CSV, command-line script, unit tests and fictional sample data.

## Run (Python 3.11+, no third-party dependencies)

```bash
cd 01-excel-rescue
python clean.py sample.csv --output cleaned.csv --rejects rejected.csv
python -m unittest test_clean.py -v
```

**Expected sample:** 2 accepted records and 2 rejected records. Deduplication is case-insensitive by email, retaining the first valid occurrence. Dates support ISO, DD/MM/YYYY and MM/DD/YYYY (ambiguous dates should be standardized by the client). Free-text name and city cells that begin with formula markers are prefixed with an apostrophe; emails beginning with spreadsheet formula markers are rejected and logged, rather than silently changing canonical email identifiers. This excludes a small subset of uncommon but otherwise valid email addresses, a deliberate security/data-integrity tradeoff.

**Scope limitation:** This is a standalone CSV transformation, not an integration with a live CRM. It has not been tested against proprietary Excel workbook features, large files or customer data.

**Demonstration only.** Synthetic contacts; no personal customer data.
