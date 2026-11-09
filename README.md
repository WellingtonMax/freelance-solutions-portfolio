# Freelance Solutions Portfolio — AI-Assisted, Human-Reviewed

[View the client-facing showcase](index.html) · [Python test workflow](.github/workflows/portfolio-ci.yml) · [CodeQL security scanning](.github/workflows/codeql.yml) · [Security policy and threat model](SECURITY.md) · [Adversarial test report (Nov 2026)](RED_TEAM_REPORT_2026-11-06.md)

**Original demonstration projects**, developed to showcase practical deliverables for freelance clients. This is a portfolio-in-progress, not a record of paid client work.

**Approach:** security-aware scope and threat modeling → implementation → negative/security tests → documentation → human review. AI-assisted development is disclosed; outcomes are verified before delivery. All sample organizations and data are fictional.

## Implemented demonstrations 01–03 (unit tests and adversarial checks configured in GitHub Actions; check current CI status)

| Project | What a client receives | Tech | Status |
|---|---|---|---|
| [01 Excel Rescue](01-excel-rescue/) · [Sample audit demo](01-excel-rescue/demo.html) · [Local web app](01-excel-rescue/WEBAPP.md) | CSV cleanup, user login, local SQLite job history and audit exports | Python standard library / SQLite | Local app implemented; verify CI; not public-hosting ready |
| [02 Sales Intelligence](02-sales-intelligence/) | Sales KPIs in JSON and a portable HTML report | Python standard library | Implemented; verify CI |
| [03 API Bridge](03-api-bridge/) | Controlled JSON-to-CSV API export with retries | Python standard library | Implemented; verify CI |

## Client-ready walkthroughs (fictional demonstrations)

Each case study explains a hypothetical business request, deliverables, a reproducible local verification procedure, and the limits of the demonstration. These are **not client contracts or testimonials**. Development is **AI-assisted** and requires **human review** before client delivery.

| Business need | Case study | Inspect the evidence | Deployment status |
|---|---|---|---|
| Clean unreliable CRM contact exports | [Excel Rescue case study](01-excel-rescue/CASE_STUDY.md) | [Synthetic CSV](01-excel-rescue/sample.csv) · [Offline sample audit](01-excel-rescue/demo.html) · [Tests](01-excel-rescue/test_clean.py) | Offline demonstration; not production-ready |
| Understand sales from exported transactions | [Sales Intelligence case study](02-sales-intelligence/CASE_STUDY.md) | [Synthetic sales CSV](02-sales-intelligence/sample_sales.csv) · [Tests](02-sales-intelligence/test_report.py) | Offline demonstration; not production-ready |
| Export permitted API data to CSV | [API Bridge case study](03-api-bridge/CASE_STUDY.md) | [Exporter](03-api-bridge/bridge.py) · [Mocked transport tests](03-api-bridge/test_bridge.py) | Integration prototype; not production-ready |

**How to evaluate:** open a case study, run its documented commands locally, inspect generated outputs, and review [security controls and residual risks](SECURITY.md). GitHub Actions status must be checked against the relevant commit; a configured workflow alone is not proof of passing tests. The API example may require network access; its automated tests use a simulated transport. No real customer data or credentials are included.


## Veterinary membership & rewards — independent concept demo

**[PawLedger: interactive veterinary loyalty dashboard](demos/vet-loyalty/index.html)** · [Source, technical boundaries and production plan](demos/vet-loyalty/README.md) · [Rewards engine tests](demos/vet-loyalty/test_engine.mjs)

Responsive two-hospital concept with fictional members, enrollment, percentage rewards, buy-X-get-one vouchers, simulated purchases and redemptions, searchable records and safe synthetic CSV export. Pure JavaScript rewards engine tests include idempotency, integer cents and tenant-scoping checks. **In-memory portfolio demo only:** no persistence, authentication, live Stripe or real client association.

## Product lab: critical mineral procurement intelligence

**[StrataSignal](https://github.com/WellingtonMax/stratasignal)** is maintained in its own product repository. It provides local sourcing concentration, stock scenarios, metadata triage, experimental delay estimates and reporting-period comparisons. See the [product scope](https://github.com/WellingtonMax/stratasignal/blob/main/README.md), [market research](https://github.com/WellingtonMax/stratasignal/blob/main/docs/MARKET_RESEARCH_PT.md) and [synthetic monthly demonstration](https://github.com/WellingtonMax/stratasignal/blob/main/demo/monthly/report.html) (download to open locally). The portfolio keeps the showcase and links; implementation, tests and product development belong in the standalone repository. Commercial validation remains pending.

## Document automation demonstration (implemented offline)

**[Document Flow — Word + PandaDoc-style variable template](demos/document-flow/)** · [Interactive preview](demos/document-flow/index.html) — merge a simulated Word revision into a variable-ready source, edit 12 fictional fields, preview the result, export CSV field mapping and a sample API JSON payload, and generate four sample Word files with automated tests. **Offline demonstration only:** no real PandaDoc API call, signing integration, or commercial customer data.

## Integrated prototype demos 04–08 (fictional, AI-assisted, human review required)

These five sources and synthetic fixtures were integrated via [PR #54](https://github.com/WellingtonMax/freelance-solutions-portfolio/pull/54). The corresponding CI and CodeQL workflows succeeded for the **PR head**; check current main-branch checks separately. These are not paid client projects, production services, or verified commercial deployments.

| Project | Demonstration | Evidence and boundaries |
|---|---|---|
| [04 CRM Lead Intelligence](04-crm-lead-intelligence/) | CSV-based, review-only lead prioritization with company-wide suppression | [README](04-crm-lead-intelligence/README.md) · [Synthetic CSV](04-crm-lead-intelligence/sample.csv) · [Tests](04-crm-lead-intelligence/test_triage.py); no outreach |
| [05 Landing Page Studio](05-landing-page-studio/) | Responsive offline page and local enquiry validation | [Open HTML demo](05-landing-page-studio/index.html) · [README](05-landing-page-studio/README.md) · [Tests](05-landing-page-studio/test_site.cjs); no submission |
| [06 Document Factory](06-document-factory/) | HTML quotation generation from bounded fictional JSON | [README](06-document-factory/README.md) · [Sample](06-document-factory/sample.json) · [Tests](06-document-factory/test_factory.py); no signing or PDF claim |
| [07 Data Quality Auditor](07-data-quality-auditor/) | Offline CSV rule checks, anomaly findings, input hash | [README](07-data-quality-auditor/README.md) · [Synthetic CSV](07-data-quality-auditor/sample.csv) · [Tests](07-data-quality-auditor/test_audit.py) |
| [08 Site Change Monitor](08-site-change-monitor/) | Offline comparison of authorized HTML snapshots | [README](08-site-change-monitor/README.md) · [Sample before](08-site-change-monitor/before.html) / [after](08-site-change-monitor/after.html) · [Tests](08-site-change-monitor/test_compare.py); no live scraping |

**Readiness:** all five are integrated prototypes with tested code paths, **not yet commercially viable**. Desktop/mobile hands-on walkthroughs, browser/accessibility validation (where relevant), release-specific security reviews and complete client-facing case studies remain open.

## Quality and ethical boundaries

- Never present these demos as completed paid contracts or customer testimonials.
- No client data, credentials, private repositories or proprietary material in these examples.
- Automated tests cover demonstrated behavior; further security and environment-specific testing is needed for deployment.
- Dependencies are deliberately minimized: Python-based demo scripts use the standard library; the Landing Page Studio tests use Node.js.
- Each project README includes reproducible commands.

**Maintainer:** WellingtonMax. **Workflow:** AI-assisted development with responsible human review.
