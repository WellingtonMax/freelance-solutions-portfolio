# 07 — Data Quality Auditor

**Fictional brief:** A small supply business needs a trustworthy, reproducible review of catalog export errors before importing them into a reporting system.

**Solution:** offline Python CSV auditor that checks an explicit schema, duplicate IDs, invalid monetary amounts, invalid ISO dates, missing categories and high-amount anomalies. Produces JSON with row numbers and issue codes, not sensitive raw values.

## Run / test

```bash
cd 07-data-quality-auditor
python audit.py sample.csv
python -m unittest discover -v
```

## Acceptance
- Exact `record_id,category,amount,updated_at` schema; no silent acceptance of unknown headers.
- Bounded UTF-8 inputs (1 MB, 10,000 records), strict CSV parsing, unambiguous error codes.
- Source SHA-256 for provenance checking, with the caveat that a hash does not authenticate a supplier.
- Explainable amount anomaly rule: with at least five valid amounts and positive median, flag values above five times the median.
- Negative tests for malformed CSV, formula-like IDs, duplicates and invalid dates.

## Security & limits
Untrusted CSV enters a local, read-only Python tool and is converted to JSON; no network requests or credential handling. The anomaly heuristic may miss fraud or flag legitimate purchases, and is not machine learning. Row-number location assumes conventional line-oriented CSV; embedded newlines may make physical line references imprecise. A production pipeline needs approved schemas, retention policy, source authentication and access controls.

**Status:** tested locally only when recorded by an actual run; **prototype, not production-ready. Fictional demonstration / AI-assisted development / human review required.**

### Hardening update (review branch)
Anomaly thresholds now use only fully valid rows. Invalid dates, IDs, categories and amounts cannot silently influence the amount median. These are explainable heuristics, not audited fraud detection or enterprise data lineage.
