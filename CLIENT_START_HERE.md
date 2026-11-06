# Client Start Here — Proof Before Promises

**What this is:** an original, AI-assisted technical portfolio. It showcases demonstrations, not commissioned client contracts. The included businesses and source datasets are fictional, apart from explicitly identified public testing APIs.

## Can you see the result before hiring?

Yes. Every completed demonstration aims to include:

1. **The business problem** in plain English.
2. **A small representative input**, with synthetic data.
3. **An expected output** that you can inspect and reproduce.
4. **The implementation and tests**, including the commands to run them.
5. **The handover package** and honest limits of what has or has not been validated.

### Choose the problem that looks most like yours

| Your problem | Demonstration | Typical deliverables |
|---|---|---|
| Messy spreadsheets, duplicate contacts, inconsistent dates | [Excel Rescue](01-excel-rescue/CASE_STUDY.md) | Cleaned CSV, error log, reusable script and tests |
| You have sales exports but no clear monthly metrics | [Sales Intelligence](02-sales-intelligence/CASE_STUDY.md) | Reproducible summary, browser-viewable report, source code |
| You copy data from a JSON API into spreadsheets manually | [API Bridge](03-api-bridge/CASE_STUDY.md) | Configurable API export, tests, security notes and instructions |
| You need to triage company leads without sending messages | [CRM Lead Intelligence](04-crm-lead-intelligence/README.md) | Bounded synthetic CSV review queue and suppression rules |
| Your business needs a clear sample website | [Landing Page Studio](05-landing-page-studio/README.md) | Responsive page and no-send validation |
| You retype quotes by hand | [Document Factory](06-document-factory/README.md) | Offline HTML quotations and decimal-safe totals |
| Your exports contain unreliable records | [Data Quality Auditor](07-data-quality-auditor/README.md) | Schema, duplicates, anomaly reports |
| You need to compare approved page captures | [Site Change Monitor](08-site-change-monitor/README.md) | Offline snapshot change report without scraping |

## A predictable project workflow

**1 — Clarify.** Agree on sample inputs, exact outputs, exclusions, business rules and acceptance criteria. Do not send credentials or sensitive production data during initial scoping.

**2 — Prototype.** Reproduce the client's problem using permitted, synthetic or carefully sanitized data.

**3 — Verify.** Run and document relevant unit/integration tests, sample outputs, exceptional cases and known limitations. No claims of being 'bug-free' or 'fully secure'.

**4 — Handover.** Deliver source files, a README with run instructions, agreed artifacts and an issue list when follow-up work is required.

**5 — Support.** Corrections or revisions depend on the actual agreement; no unsupported service guarantees.

## AI use and confidentiality

This portfolio was developed with AI assistance and human review. AI tools can help accelerate engineering and documentation; project-specific approvals, security review and outcome validation remain essential. For commissioned work, AI usage must comply with the customer's contractual requirements and privacy constraints. No client credentials, unpublished source code, clinical data, or confidential material should enter a demonstration repository.

## Current limits

- This repository is a **portfolio-in-progress**.
- Eight projects have source, synthetic sample data and tests configured; passing CI/test results must be verified independently before claiming success.
- Planned projects are not represented as finished.
- No paid-client references, fabricated testimonials or invented performance metrics are used.
