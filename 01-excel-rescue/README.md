# Excel Rescue — CRM CSV Cleanup

**Client problem:** exported contact files often contain inconsistent dates, duplicate emails and invalid rows.

**Deliverables:** normalized CSV, rejected-record audit CSV, command-line script, unit tests and fictional sample data.

## Run (Python 3.11+, no third-party dependencies)

```bash
cd 01-excel-rescue
python clean.py sample.csv --output cleaned.csv --rejects rejected.csv
python -m unittest test_clean.py -v
```

**Expected sample:** 1 accepted record and 3 rejected records. Case-insensitive duplicate emails are treated as ambiguous: **all** occurrences are rejected rather than trusting the first one. Reconcile duplicates against an independently trusted CRM before deciding which record is genuine. Dates support ISO and DD/MM/YYYY. US-format dates must be converted and reviewed before import; ambiguous dates are not inferred automatically. Free-text name and city cells that begin with formula markers are prefixed with an apostrophe; emails beginning with spreadsheet formula markers are rejected and logged, rather than silently changing canonical email identifiers. This excludes a small subset of uncommon but otherwise valid email addresses, a deliberate security/data-integrity tradeoff.

**Security controls:** source input is limited to 5 MB / 20,000 rows and 2,048 characters per cell. Output files will not overwrite existing paths or follow pre-existing symlink targets. Use optional `--expected-sha256 HASH` supplied from a **trusted independent channel** to detect source modification. Input authenticity is **not** guaranteed by checksums supplied by the same untrusted party.

**Scope limitation:** This is a standalone CSV transformation, not an authenticated CRM integration. It has not been tested against proprietary Excel workbook features, hostile filesystem races, concurrent writers or customer data.

**Demonstration only.** Synthetic contacts; no personal customer data.
