# 04 — CRM Lead Intelligence (fictional demonstration)

**Fictional brief:** A small recruitment sales team needs to sort a manually authorized company list without accidentally contacting agencies or opted-out companies.

**Business outcome:** explainable hiring-signal prioritization and a review queue. **No outreach is performed.** No contact verification, scraping, email delivery, CRM login, API credentials, LinkedIn/WhatsApp automation, or legal compliance certification.

## Run and verify (Python 3.11+, standard library)

```bash
cd 04-crm-lead-intelligence
python triage.py sample.csv
python -m unittest discover -v
```

Synthetic sample uses reserved `.example` email domains. Output is JSON with ranked leads, rejected row numbers/reasons, source SHA-256, and explicit `requires_human_review` status. Email addresses are **syntax-checked only**. Agency flag and opt-out flag are supplied data; they are not independently verified.

## Acceptance criteria
- Exact CSV schema: `company,role,openings,agency,email,opt_out`.
- Exclude agencies, opted-out records and invalid fields; explain rejections.
- Deduplicate by normalized company name, keeping the strongest hiring signal.
- Reject formula-like input, oversize files and malformed CSV; no network access.
- Human must review lawful basis, freshness, consent, suppression and identity before any contact.

## Limits and threat model
Trust boundary: untrusted local CSV to review-only JSON. Size limited to 1 MB / 5,000 rows; no multitenancy or authentication because this is not a service. Malicious Unicode, ownership misidentification, invalid consent or stale leads remain risks. Score is a simple heuristic, **not ML** or a verified lead quality probability. Output may contain contact fields; avoid using customer data or recording sensitive output in logs.

**Status:** prototype; local synthetic tests provided. **Fictional demonstration / AI-assisted development / human review required.** Not production-ready.
