# Freelance Solutions Portfolio — AI-Assisted, Human-Reviewed

[View the client-facing showcase](index.html) · [Python test workflow](.github/workflows/portfolio-ci.yml) · [CodeQL security scanning](.github/workflows/codeql.yml) · [Security policy and threat model](SECURITY.md) · [Adversarial test report (Nov 2026)](RED_TEAM_REPORT_2026-11-06.md)

**Original demonstration projects**, developed to showcase practical deliverables for freelance clients. This is a portfolio-in-progress, not a record of paid client work.

**Approach:** security-aware scope and threat modeling → implementation → negative/security tests → documentation → human review. AI-assisted development is disclosed; outcomes are verified before delivery. All sample organizations and data are fictional.

## Implemented demonstrations (unit tests and adversarial checks configured in GitHub Actions; check current CI status)

| Project | What a client receives | Tech | Status |
|---|---|---|---|
| [01 Excel Rescue](01-excel-rescue/) · [Sample audit demo](01-excel-rescue/demo.html) · [Local web app](01-excel-rescue/WEBAPP.md) | CSV cleanup, user login, local SQLite job history and audit exports | Python standard library / SQLite | Local app implemented; verify CI; not public-hosting ready |
| [02 Sales Intelligence](02-sales-intelligence/) | Sales KPIs in JSON and a portable HTML report | Python standard library | Implemented; verify CI |
| [03 API Bridge](03-api-bridge/) | Controlled JSON-to-CSV API export with retries | Python standard library | Implemented; verify CI |

## Product lab: critical mineral procurement intelligence

**[StrataSignal](https://github.com/WellingtonMax/stratasignal)** is maintained in its own product repository. It provides local sourcing concentration, stock scenarios, metadata triage, experimental delay estimates and reporting-period comparisons. See the [product scope](https://github.com/WellingtonMax/stratasignal/blob/main/README.md), [market research](https://github.com/WellingtonMax/stratasignal/blob/main/docs/MARKET_RESEARCH_PT.md) and [synthetic monthly demonstration](https://github.com/WellingtonMax/stratasignal/blob/main/demo/monthly/report.html) (download to open locally). The portfolio keeps the showcase and links; implementation, tests and product development belong in the standalone repository. Commercial validation remains pending.

## Five additional demos under review (04–08)

These five demos are **proposed changes, not part of `main`**. Review [draft PR #11](https://github.com/WellingtonMax/freelance-solutions-portfolio/pull/11) and its [security/negative-test follow-up PR #12](https://github.com/WellingtonMax/freelance-solutions-portfolio/pull/12) before describing them as integrated deliverables. The branches must be reconciled with each other and with the current main; passing tests on a branch does not validate the eventual merged result.

| Proposed demo | Fictional business scenario | Explicit limitation |
|---|---|---|
| 04 CRM Lead Intelligence | Normalize and triage synthetic leads | No messages or external CRM writes |
| 05 Landing Page Studio | Accessible responsive offline landing page | No form submission or public deployment |
| 06 Document Factory | Generate escaped quotation HTML from synthetic JSON | No verified production document workflow |
| 07 Data Quality Auditor | Validate schema, duplicates and anomaly flags | Input provenance remains operator responsibility |
| 08 Site Change Monitor | Compare permitted offline snapshots | No live crawling or monitoring service |

**Current scope is exactly projects 01–08.** No projects 09–10 are authorized. All demos are fictional demonstrations, AI-assisted development, pending human review and environment-specific security assessment before deployment. [Sales Intelligence export recovery PR #10](https://github.com/WellingtonMax/freelance-solutions-portfolio/pull/10) is also awaiting reconciliation and review.

## Quality and ethical boundaries

- Never present these demos as completed paid contracts or customer testimonials.
- No client data, credentials, private repositories or proprietary material in these examples.
- Automated tests cover demonstrated behavior; further security and environment-specific testing is needed for deployment.
- Dependencies are deliberately minimized: projects 1–3 run with Python 3.11+ and the standard library.
- Each project README includes reproducible commands.

**Maintainer:** WellingtonMax. **Workflow:** AI-assisted development with responsible human review.
