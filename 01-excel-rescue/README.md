# Excel Rescue — CRM CSV Cleanup

[Try a local CSV in your browser](try.html) — an optional browser-only preview, with no external requests, dependencies or backend. The browser preview supports up to **1 MB and 2,000 rows**, validates exact unique headers, parses quoted CSV, rejects ambiguous duplicates and exports accepted/rejected records as copyable text. The reference Python CLI is more comprehensive (5 MB and 20,000 rows); the JavaScript implementation is independently tested but **not certified behaviorally equivalent** to Python. Use only synthetic/non-sensitive data in the demo.

**Fictional client brief:** A small business needs a transparent way to identify duplicate or malformed CRM contacts before import. **Acceptance criteria:** preserve valid unique contacts; reject every occurrence of ambiguous duplicate emails; report invalid rows without executing spreadsheet formulas; avoid uploading customer files. **Status:** offline prototype with automated tests; not a production CRM integration. AI-assisted development, human review required.

[Explore the offline sample audit](demo.html) — a static, accessible walkthrough of the exact synthetic sample, with interactive accepted/rejected filters. It does **not** process uploaded files or claim to be the Python application. CI verifies its rows and counts against the actual Python cleaner. The walkthrough uses local `demo.js` and `demo.css` with a restrictive CSP that rejects inline script/style execution. It does not send data to a server or accept uploads.


**Client problem:** exported contact files often contain inconsistent dates, duplicate emails and invalid rows.

**Deliverables:** normalized CSV, rejected-record audit CSV, command-line script, unit tests and fictional sample data.

## Run (Python 3.11+, no third-party dependencies)

```bash
cd 01-excel-rescue
python clean.py sample.csv --output cleaned.csv --rejects rejected.csv
python -m unittest test_clean.py -v
```

**Expected sample:** 1 accepted record and 3 rejected records. Case-insensitive duplicate emails are treated as ambiguous: **all** occurrences are rejected rather than trusting the first one. Reconcile duplicates against an independently trusted CRM before deciding which record is genuine. Dates support ISO and DD/MM/YYYY. US-format dates must be converted and reviewed before import; ambiguous dates are not inferred automatically. Free-text name and city cells that begin with formula markers are prefixed with an apostrophe; emails beginning with spreadsheet formula markers are rejected and logged, rather than silently changing canonical email identifiers. This excludes a small subset of uncommon but otherwise valid email addresses, a deliberate security/data-integrity tradeoff.

**Additional hardening:** duplicate or unexpected CSV header names are rejected rather than silently overwritten. Values whose leading Unicode format/control characters and whitespace could obscure a spreadsheet-formula prefix are conservatively escaped. The behavior is covered by dedicated adversarial regression tests.

**Security controls:** source input is limited to 5 MB / 20,000 rows and 2,048 characters per cell. Output files will not overwrite existing paths or follow pre-existing symlink targets. Use optional `--expected-sha256 HASH` supplied from a **trusted independent channel** to detect source modification. Input authenticity is **not** guaranteed by checksums supplied by the same untrusted party.

**Cross-engine verification:** `python -m unittest test_differential.py -v` invokes the real Node.js browser processor and Python cleaner on the same synthetic CSV fixtures, then compares accepted records and rejection reports. It checks quoted fields, reordered headers, duplicate case-folded emails, invalid dates, Unicode formula prefixes and UTF-8 BOM. Two deliberate policy differences remain: the browser fails closed on malformed row widths and unclosed quotes, while Python may reject a row or tolerate an unclosed quote. These differences are explicitly asserted; this is not a claim of full behavioral equivalence. Node.js is required for this additional test.\n\n**Failure recovery:** if an output write fails, the cleaner attempts to delete files created during that invocation, leaving existing files untouched. This is **best-effort rollback, not atomic multi-file publication**: concurrent readers may see a partial result before cleanup, and untrusted directories or filesystem races are out of scope. Only run with operator-controlled output paths.

**Scope limitation:** This is a standalone CSV transformation, not an authenticated CRM integration. It has not been tested against proprietary Excel workbook features, hostile filesystem races, concurrent writers or customer data.

**Demonstration only.** Synthetic contacts; no personal customer data.
