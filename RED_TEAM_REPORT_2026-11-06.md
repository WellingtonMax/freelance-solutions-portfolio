# Second-Pass Adversarial Security Review — 2026-11-06

> **Scope:** Three offline Python demonstration projects in this repository. All testing used synthetic strings and CSV files. No employer, client account, external API, production system, credentials, or Upwork account was targeted. This is **not** a penetration test or a production security certification.

## Executive result

The first version of the hardened demonstrations passed its original 31 tests but had untested input-validation edge cases. A follow-up review identified four independent failures grouped into three classes: duplicate header poisoning, unexpected extra CSV cells, and Unicode prefix evasion of spreadsheet-formula escaping.

**Proof:** the initial red-team test-only [GitHub Actions run](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/42160048702) failed at the Excel Rescue step (duplicate header and Unicode cases). As CI stopped at the first failing stage, Sales Intelligence and API Bridge were not executed in that initial run. The corresponding behavior of those projects was reproduced separately with isolated Python CSV/string operations.

**Fix validation:** [GitHub Actions run](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/42160230635) completed successfully with **39 unit tests** across the projects: Excel Rescue 14, Sales Intelligence 12, API Bridge 13. [CodeQL scan](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/42160230630) also completed successfully. Successful CodeQL execution **does not establish that zero alerts exist** or that the software is secure.

## Findings and fixes

| ID | Area | Reproduction | Fix | Result |
|---|---|---|---|---|
| RT-01 | Excel Rescue: CSV duplicate headers | Python `csv.DictReader` silently selects the final value from two identical email header columns | Reject duplicated header names and require expected schema | Regression test passed |
| RT-02 | Excel Rescue: spreadsheet formula escaping | A format code point followed by whitespace then a formula marker bypassed a narrow prefix check | Look through leading Unicode format/control characters and whitespace before escaping | Regression test passed |
| RT-03 | Sales Intelligence: untrusted CSV fields | Extra row values were stored under `None` by `csv.DictReader` and silently ignored; duplicate headers could replace a field | Reject unexpected extra row fields, duplicate column names and mismatched schema | Regression tests passed |
| RT-04 | API Bridge: CSV formula escaping and DNS labels | Unicode format + whitespace prefixes bypassed the CSV safety prefix check; hostname parser accepted malformed double-dot labels | Same conservative formula detection plus per-label DNS hostname validation | Regression tests passed |

## Example synthetic payloads (non-executable)

- Duplicate CSV header: `name,email,email,signup_date,city` with differing email values on the same row.
- Suspicious spreadsheet cell: a UTF-8 BOM/format character followed by whitespace and a formula-leading character.
- Sales export with six declared headers but seven values in a data row.
- Invalid operator-supplied hostname with an empty DNS label (`api..example.org`).

The tests demonstrate **input validation flaws**; no commands were executed from spreadsheet formulas and no data was exfiltrated.

## Residual risk and scope

- Spreadsheet software may normalize Unicode/whitespace differently. Prefixing an apostrophe is a common conservative control but must be evaluated in the actual consumer, including Excel/LibreOffice and re-export behavior.
- This demo does not establish file authenticity; hash/total verification requires independently trusted source data. Additional field-level authenticity or reconciliation belongs in the production design.
- Direct-access CLI paths and the API host allowlist are **trusted operator inputs**. They are not safe to expose directly as untrusted web/API request parameters; implement server-side authorization and filesystem/network sandboxing if deploying an integration.
- The API demo refuses automatic credentials and includes some SSRF mitigations, but network policies, proxies, DNS infrastructure, transport edge cases and organizational authorization remain out of scope.
- Exports with multiple output files are not guaranteed to be transactional; filesystem or disk failures may leave partial artifacts. Production workflows should use a transactional manifest/staging pattern.
- CodeQL and unit tests do not replace software composition analysis, browser-specific validation, fuzzing, dynamic security testing, access control tests or an independent security review.

## Next recommended security work

1. Add corpus-driven fuzz/property tests for Unicode, CSV quoting, BOM and malformed rows.
2. Investigate atomic multi-file export/rollback and untrusted output directories.
3. Add end-to-end isolated integration tests for public DNS validation and pinned HTTPS, without reaching private networks.
4. Before any client deployment, create an environment-specific threat model and enforce server-side permissions and outbound network policies.

**Disposition:** Security regression fixes may be merged after CI verification. These are **portfolio demonstrations**, not production-ready security-hardened services.
