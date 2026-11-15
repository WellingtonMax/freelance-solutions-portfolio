# Freelance Solutions Portfolio

**Eight practical software demonstrations for small-business workflows** — spreadsheets, analytics, API exports, lead review, landing pages, document generation, data auditing and offline change detection.

[Explore the eight-project showcase](index.html) · [How to evaluate the work](CLIENT_START_HERE.md) · [Automated test workflow](.github/workflows/portfolio-ci.yml) · [Security policy](SECURITY.md)

> **Portfolio in progress.** These are original **fictional demonstrations**, not completed paid engagements or customer testimonials. Development is **AI-assisted**; human review is required before commercial use. The presence of code in `main` does **not** mean a project is production-ready, hosted or independently security-certified.

## The eight core projects

**Eight HTML source links (GitHub code view, not interactive mobile demos):**

1. [Excel Rescue — CSV preview](01-excel-rescue/try.html)
2. [Sales Intelligence — preview](02-sales-intelligence/demo-ui.html)
3. [API Bridge — preview](03-api-bridge/demo-ui.html)
4. [CRM Lead Intelligence — preview](04-crm-lead-intelligence/demo-ui.html)
5. [Landing Page Studio — preview](05-landing-page-studio/index.html)
6. [Document Factory — preview](06-document-factory/demo-ui.html)
7. [Data Quality Auditor — preview](07-data-quality-auditor/demo-ui.html)
8. [Site Change Monitor — preview](08-site-change-monitor/demo-ui.html)

> **Preview limitation:** GitHub displays linked HTML as source code, not as a running interface. These are **not hosted demo URLs**. The local browser previews are separate from the Python CLI workflows; no public deployment or production readiness is implied.

**Run the existing browser previews locally (no hosting account):** clone or download this repository, open a terminal in its root, then start a loopback-only static server:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000/index.html](http://127.0.0.1:8000/index.html) **on the same computer** and choose one of the eight entries. To open Excel Rescue directly, visit [http://127.0.0.1:8000/01-excel-rescue/try.html](http://127.0.0.1:8000/01-excel-rescue/try.html). Stop the server with `Ctrl+C`. These addresses work only while the local server is running; they are **not public demo links**. Use fictional input only; this simple static server is for local inspection, not production or network exposure. Browser-based preview behavior must still be tested independently.

All eight numbered projects have source files, synthetic samples and tests integrated into the `main` branch. Some offer browser previews; others are **local command-line tools**, not live web applications. Open each README for exact commands and limitations.

| Project | The problem it demonstrates | What you can inspect | Delivery status |
|---|---|---|---|
| **01 · [Excel Rescue](01-excel-rescue/README.md)** | Clean inconsistent CRM CSV exports and explain rejected or duplicate records | [View HTML preview source — CSV](01-excel-rescue/try.html) · [Synthetic audit walkthrough](01-excel-rescue/demo.html) · [Case study](01-excel-rescue/CASE_STUDY.md) | Local Python tool and optional localhost web app; **prototype**, not public-hosting ready |
| **02 · [Sales Intelligence](02-sales-intelligence/README.md)** | Turn transaction CSV files into actionable revenue metrics | [View HTML preview source](02-sales-intelligence/demo-ui.html) · JSON KPIs, offline HTML report · [Case study](02-sales-intelligence/CASE_STUDY.md) | Offline reporting demonstration; no live business dashboard |
| **03 · [API Bridge](03-api-bridge/README.md)** | Export data from an approved JSON API into CSV | [View HTML preview source](03-api-bridge/demo-ui.html) · Python exporter, mocked-network tests · [Case study](03-api-bridge/CASE_STUDY.md) | Local integration prototype; optional public test API, no enterprise auth |
| **04 · [CRM Lead Intelligence](04-crm-lead-intelligence/README.md)** | Review and prioritize a fictional B2B lead list without contacting anyone | [View HTML preview source](04-crm-lead-intelligence/demo-ui.html) · [Synthetic CSV](04-crm-lead-intelligence/sample.csv), suppression rules, JSON review output and tests | Offline, **review-only** prototype; no outreach, CRM login or contact verification |
| **05 · [Landing Page Studio](05-landing-page-studio/README.md)** | Demonstrate a responsive small-business landing page and enquiry validation | [View HTML preview source](05-landing-page-studio/index.html), CSS/JavaScript and tests | Browser prototype; form validates **locally** and never submits data |
| **06 · [Document Factory](06-document-factory/README.md)** | Generate consistent sample quotations from structured information | [View HTML preview source](06-document-factory/demo-ui.html) · [Synthetic JSON](06-document-factory/sample.json), Python generator, escaped/printable HTML and tests | Offline prototype; does **not** create PDF files automatically |
| **07 · [Data Quality Auditor](07-data-quality-auditor/README.md)** | Detect invalid records, duplicates and unusual amounts in CSV exports | [View HTML preview source](07-data-quality-auditor/demo-ui.html) · [Synthetic CSV](07-data-quality-auditor/sample.csv), rules, JSON findings, source hash and tests | Offline rules-based prototype; no enterprise data lineage or fraud certification |
| **08 · [Site Change Monitor](08-site-change-monitor/README.md)** | Compare two already-authorized HTML captures | [View HTML preview source](08-site-change-monitor/demo-ui.html) · [Before](08-site-change-monitor/before.html) / [after](08-site-change-monitor/after.html) fixtures, visible-text diff and tests | **Offline snapshot comparison**; no crawling, live monitoring or alerts |

**Current readiness:** integration into `main` is confirmed, but none of these entries should be represented as a fully deployed or commercially validated service merely because tests exist. Browser/mobile accessibility reviews, environment-specific security checks and end-to-end acceptance evidence remain necessary according to each project's scope.

## Evaluate a demonstration in a few minutes

1. Start with the [visual showcase](index.html). Its eight numbered entries link to real files in `main`; some links lead to source/instructions instead of a running application.
2. Choose a project and open its **README**. Check the fictional business brief, sample input, expected output and stated exclusions.
3. Run its documented example locally and compare the outcome with its tests. For a concrete command-line example:

```sh
cd 07-data-quality-auditor
python audit.py sample.csv
python -m unittest discover -v
```

4. Review the [security policy and residual risks](SECURITY.md), then inspect [GitHub Actions](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions) for the **specific commit** under consideration. A configured workflow is not evidence that every future commit passed.

### Testing and technical choices

- Python-based core tools use **Python 3.11+** and the standard library. Browser demonstrations use local HTML/CSS/JavaScript; JavaScript tests use Node.js's built-in test runner (Node 20+ for the standalone examples).
- The [portfolio CI workflow](.github/workflows/portfolio-ci.yml) exercises the core Python and JavaScript test suites and checks that all eight projects remain reachable from the showcase. [CodeQL](.github/workflows/codeql.yml) provides static-analysis signals, not a penetration test or security certification.
- [Adversarial testing notes](RED_TEAM_REPORT_2026-11-06.md) document selected negative-test findings at the time of that report; newer code must be evaluated independently.

## Additional concept demonstrations — outside the core eight

These are separate portfolio examples, **not** projects 09 or 10 and not substitutes for completing the eight core projects.

- **[PawLedger — veterinary membership and rewards](demos/vet-loyalty/README.md):** [interactive fictional browser concept](demos/vet-loyalty/index.html) with simulated member/rewards operations. No live Stripe, authentication, persistent database or real clinic/customer association.
- **[Document Flow — Word / PandaDoc-style variables](demos/document-flow/README.md):** [offline interactive preview](demos/document-flow/index.html) of a fictional variable-mapping workflow. No live PandaDoc connection or electronic signing. Its optional Word sample generator uses a separate `python-docx` dependency.
- **[StrataSignal](https://github.com/WellingtonMax/stratasignal):** an independent critical-minerals intelligence concept maintained in **another repository**. Its development and product claims are not part of the eight-project acceptance checklist here.

## Security, ethics and limitations

- **Synthetic examples by default:** sample companies, contacts and business situations are fictional. The optional API Bridge walkthrough can use an explicitly identified **public test API**, so not every example originates from a fictional dataset.
- **No customer secrets or private work:** do not commit credentials, real client data, private code, patient records or proprietary exports to this public repository.
- **Risk controls are scoped:** examples include bounded input, schema validation, CSV/HTML injection defenses and restricted file/network behavior where relevant. Read [SECURITY.md](SECURITY.md) and each project README for remaining threats; references to OWASP guidance do **not** establish compliance.
- **Production deployment is separate work:** authorization, privacy requirements, user/tenant isolation, accessibility, logging, backups, credentials, monitoring and client-specific acceptance criteria require independent review wherever applicable.

**Maintainer:** [WellingtonMax](https://github.com/WellingtonMax) · **Development disclosure:** AI-assisted, fictional demonstration, human review required.
