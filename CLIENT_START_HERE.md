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
| You need a review-only fictional sales lead queue | [CRM Lead Intelligence](04-crm-lead-intelligence/README.md) | Bounded CSV triage, company suppression and review findings; no outreach |
| You need an offline small-business page | [Landing Page Studio](05-landing-page-studio/index.html) | Responsive page with local-only validation; no live form submission |
| You need repeatable quotation output | [Document Factory](06-document-factory/README.md) | JSON-to-HTML quotation, synthetic sample and tests |
| You need to audit inconsistent CSV records | [Data Quality Auditor](07-data-quality-auditor/README.md) | Schema checks, deduplication/anomaly findings and audit trail |
| You need to compare permitted local HTML snapshots | [Site Change Monitor](08-site-change-monitor/README.md) | Offline text-only change comparison; no crawling or notifications |

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
- Eight numbered projects are now integrated in main with source, synthetic examples and tests; project 04–08 workflows are **prototypes**, not client-ready products. Passing CI/test results must be verified for the exact commit before claiming success.
- No prototype is represented as a completed customer contract or production deployment.
- No paid-client references, fabricated testimonials or invented performance metrics are used.
