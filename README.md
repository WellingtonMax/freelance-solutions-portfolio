# Freelance Solutions Portfolio — AI-Assisted, Human-Reviewed

[View the client-facing showcase](index.html) · [Python test workflow](.github/workflows/portfolio-ci.yml) · [CodeQL security scanning](.github/workflows/codeql.yml) · [Security policy and threat model](SECURITY.md) · [Adversarial test report (Nov 2026)](RED_TEAM_REPORT_2026-11-06.md)

**Original demonstration projects**, developed to showcase practical deliverables for freelance clients. This is a portfolio-in-progress, not a record of paid client work.

**Approach:** security-aware scope and threat modeling → implementation → negative/security tests → documentation → human review. AI-assisted development is disclosed; outcomes are verified before delivery. All sample organizations and data are fictional.

## Implemented demonstrations (unit tests and adversarial checks configured in GitHub Actions; check current CI status)

| Project | What a client receives | Tech | Status |
|---|---|---|---|
| [01 Excel Rescue](01-excel-rescue/) · [Sample audit demo](01-excel-rescue/demo.html) | CSV cleanup, duplicate removal and rejection log | Python standard library | Implemented; verify CI |
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

## Product lab: critical mineral procurement intelligence

**[StrataSignal](https://github.com/WellingtonMax/stratasignal)** is maintained in its own product repository. It provides local sourcing concentration, stock scenarios, metadata triage, experimental delay estimates and reporting-period comparisons. See the [product scope](https://github.com/WellingtonMax/stratasignal/blob/main/README.md), [market research](https://github.com/WellingtonMax/stratasignal/blob/main/docs/MARKET_RESEARCH_PT.md) and [synthetic monthly demonstration](https://github.com/WellingtonMax/stratasignal/blob/main/demo/monthly/report.html) (download to open locally). The portfolio keeps the showcase and links; implementation, tests and product development belong in the standalone repository. Commercial validation remains pending.

## Planned portfolio expansion (not implemented yet)

4. **CRM Workflow:** lead normalization, rules engine, follow-up queues.
5. **Landing Page Studio:** accessible, responsive site with validated contact form.
6. **Document Factory:** batch generation of reports and PDF documents.
7. **Data Quality Auditor:** schema checks, anomaly reports, data lineage.
8. **Web Monitor:** permitted website status/change alerts without bypassing access restrictions.
9. **Bug Fix Laboratory:** documented regression cases, patches and automated tests.
10. **Business Operations API:** documented CRUD API, permissions and integration tests.

## Quality and ethical boundaries

- Never present these demos as completed paid contracts or customer testimonials.
- No client data, credentials, private repositories or proprietary material in these examples.
- Automated tests cover demonstrated behavior; further security and environment-specific testing is needed for deployment.
- Dependencies are deliberately minimized: projects 1–3 run with Python 3.11+ and the standard library.
- Each project README includes reproducible commands.

**Maintainer:** WellingtonMax. **Workflow:** AI-assisted development with responsible human review.
