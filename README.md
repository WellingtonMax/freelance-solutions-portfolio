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
| [04 CRM Lead Intelligence](04-crm-lead-intelligence/) | Review-only hiring-signal scoring, suppression and duplicate detection | Python stdlib | Prototype; verify CI |
| [05 Landing Page Studio](05-landing-page-studio/index.html) | Responsive accessible page with local-only form validation | HTML, CSS, JavaScript | Prototype; verify CI |
| [06 Document Factory](06-document-factory/) | Print-ready quotation HTML from bounded JSON | Python stdlib | Prototype; verify CI |
| [07 Data Quality Auditor](07-data-quality-auditor/) | Source-hashed anomaly report with row-level issue codes | Python stdlib | Prototype; verify CI |
| [08 Site Change Monitor](08-site-change-monitor/) | Permission-based offline HTML snapshot comparison | Python stdlib | Prototype; verify CI |

## Product lab: critical mineral procurement intelligence

**[StrataSignal](https://github.com/WellingtonMax/stratasignal)** is maintained in its own product repository. It provides local sourcing concentration, stock scenarios, metadata triage, experimental delay estimates and reporting-period comparisons. See the [product scope](https://github.com/WellingtonMax/stratasignal/blob/main/README.md), [market research](https://github.com/WellingtonMax/stratasignal/blob/main/docs/MARKET_RESEARCH_PT.md) and [synthetic monthly demonstration](https://github.com/WellingtonMax/stratasignal/blob/main/demo/monthly/report.html) (download to open locally). The portfolio keeps the showcase and links; implementation, tests and product development belong in the standalone repository. Commercial validation remains pending.

## Remaining portfolio roadmap (not implemented yet)

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
- Dependencies are deliberately minimized: Python demos use Python 3.11+ and the standard library; Landing Page Studio uses native browser APIs and Node's built-in test runner.
- Each project README includes reproducible commands.

**Maintainer:** WellingtonMax. **Workflow:** AI-assisted development with responsible human review.
