# Security Policy & Verification Baseline

> **Status:** security-oriented demonstration portfolio, **NOT** a security-certified product suite. Source code and unit tests do not establish suitability for production deployment.

## Security contact / vulnerability disclosure

Please **do not publish credentials, customer data, working exploits or sensitive vulnerability details in public GitHub issues**. If GitHub private vulnerability reporting is enabled for this repository, use its private report feature. Otherwise, open a public issue asking for a secure contact channel **without disclosing exploit details**. The maintainer will arrange an appropriate private channel; no response time is guaranteed.

## Browser CSV preview (Excel Rescue)

The optional `01-excel-rescue/try.html` offers **local-only** CSV processing (no upload, fetch, analytics or external runtime dependency), with a 1 MB / 2,000 row / 2,048 character per cell limit, strict header/CSV parsing, date checks, formula-prefix handling and rejection of all valid duplicate email identities. It renders output into read-only textarea `value` properties rather than HTML. CSP blocks external connections and inline scripts. Threats include hostile CSV content, spreadsheet formula interpretation, denial of service via unusually complex inputs, data provenance errors and accidental disclosure of sensitive records. It does not establish file authenticity, sandbox a compromised browser extension, provide server-side authentication, or guarantee parity with the Python implementation or every spreadsheet application. Local preview results must be reviewed before import. **Prototype, tested with synthetic input; not production-ready.** Tests run with Node's built-in runner via CI. No agents or external network access are involved.

## Static sample-audit walkthrough (Excel Rescue)

The optional `01-excel-rescue/demo.html` presents fixed synthetic rows from the repository sample and uses only local DOM visibility toggles. No file uploads, cookies, analytics, external requests, third-party dependencies, credentials, or client data are used. A restrictive Content Security Policy permits only same-origin JavaScript and CSS, blocks inline execution, outbound connections and external resources. The demo uses local `demo.js` and `demo.css` files. The HTML meta CSP is defense-in-depth, not a substitute for a reviewed HTTP response header when hosted; embedding environments and browser differences remain unverified. This is a **static educational demo**, not the Python cleaner running in the browser. Automated tests compare the displayed sample outcomes against actual Python output; visual/accessibility review across browsers remains outstanding. A hosted deployment still requires explicit approval and environment review.

## Threat model (initial, non-exhaustive)

| Area | Relevant attack or failure | Current mitigation | Residual risk |
|---|---|---|---|
| Untrusted CSV input | Spreadsheet formula injection, duplicate poisoning and malformed records | Formula prefix/reject, bounded inputs, fail-closed duplicate reconciliation, SHA-256 verification when expected value is trusted | Spreadsheet behaviors vary; hash alone does not establish who supplied the source |
| File handling | Accidental input overwrite, oversized datasets | CSV size/row bounds, exclusive output creation, API response/record limits | Filesystem races, untrusted directories and concurrent writers require environment-specific controls |
| HTML reporting | Script injection or fraudulent financial decisions from corrupted source | HTML encoding for labels, source hash in JSON, optional independent total reconciliation | Data source authentication and ERP-grade cross-checking require actual enterprise integration |
| Remote API | Credential exposure, SSRF, malicious redirects, unreliable network | No API_TOKEN forwarding, HTTPS, exact operator-controlled host allowlist, public DNS IP checks, pinned-IP TLS, no proxies/redirects, request/response limits | Not a multi-user network API; operators control allowlists and URLs; firewall egress policies and enterprise authentication are outside demo scope |
| Repositories and CI | Exposed secrets, malicious dependencies, compromised automation | No committed credentials; minimal runtime libraries; read-only token for tests; CodeQL workflow | Dependency and workflow supply-chain risk; GitHub security features/configuration must be verified |
| AI-agent features (future) | Prompt injection, excessive agency, unauthorized tools, data exfiltration | **Policy only**: tool allowlists, trust-boundaries, least privilege, approvals, costs/time limits, logging required before implementation | No autonomous agent has been implemented or verified in this repository |

### Excel Rescue export recovery (November 2026)

The CSV cleaner creates both output files with exclusive-create semantics and attempts rollback of its newly created files if either write fails. Fault-injection tests simulate a denied second output and verify removal of the first output; pre-existing outputs are preserved. This does **not** make multi-file publication atomic. Other processes may observe an intermediate output, and malicious concurrent changes to output directories remain outside the trusted local-operator model. The email validation also rejects formula-like prefixes hidden behind Unicode format characters and whitespace.

## Project acceptance criteria

For **every** new project or material change:

1. Document data sources, trust boundaries, user permissions, assets and misuse cases.
2. Validate and constrain external input on a trusted boundary (type, size, shape and allowed values).
3. Treat documents, websites, tool results and model outputs as **untrusted data**, not instructions.
4. Avoid dynamic evaluation, unsafe deserialization, shell execution of user input, and string-built database queries.
5. Keep secrets in supported secret stores/environment configuration, never in code, demo datasets, screenshots, browser logs or issue reports.
6. Use least privilege and independently verify access control on the server side where applicable.
7. Add relevant positive and negative tests (injection, invalid data, oversize, authorization, abuse and failure modes).
8. Check third-party dependencies, license constraints and CI actions; pin and review dependencies where practical.
9. Document unresolved risks and assumptions, including whether tests were actually executed, with links to CI runs when available.
10. **Do not deploy** to a client environment or represent a project as production-ready without reviewing the actual architecture, permissions, data and deployment target.

## AI agent security requirements (before an agent project is shipped)

An agent project must additionally demonstrate:
- Tool allowlist and scoped, revocable credentials, with no arbitrary shell/network privileges by default.
- Explicit user approval for sending communications, purchasing, deleting, deploying or other high-impact external operations.
- Prompt-injection defenses: isolation of external content, tool-argument validation, rejection of instructions in untrusted retrieved content, and tests with adversarial inputs.
- Audit trails, timeouts, rate/usage limits, cost caps and recovery/rollback behavior.
- Tenant/user isolation, retention and data minimization; no sensitive customer information in model requests without clear authorization and safeguards.
- Human review of security-relevant actions and a clear kill switch.

These requirements follow risk themes from [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/) and [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/). Referencing a standard **does not mean certified conformance**.

## Automated security signals

- [Unit tests](.github/workflows/portfolio-ci.yml) run on changed demo files, with a limited read-only GitHub token.
- [CodeQL scanning](.github/workflows/codeql.yml) is configured for Python using extended security queries. The workflow file being present is **not evidence that the scan has passed**; consult the actual GitHub Actions and Security results.
- Public GitHub repositories may offer secret scanning and push protection; check the repository settings before relying on them.
- No third-party runtime Python dependencies are used in demos 01–03; that reduces, but does not remove, supply-chain exposure.

## Cross-implementation differential testing (November 2026)\n\nThe Excel Rescue browser and Python engines now have synthetic-only differential tests. Node is invoked locally with a 5-second subprocess timeout, bounded fixture data, no network access and no credentials. The tests compare accepted and rejected CSV output, and explicitly record two intentional strictness differences: malformed extra row fields and unclosed quotes are rejected at file level by the browser, while Python may handle them at record level. The test does not establish full semantic equivalence or production safety. These controls support the input-validation principles of OWASP ASVS 5.0, without claiming certification. The agentic OWASP Top 10 is not applicable to this non-agent demo.\n\n## Scope and responsible claims

**Allowed:** "Automated tests and static-analysis workflows are configured"; "The script checks these cases"; "No sensitive customer data is used in this demo."

**Not allowed without evidence:** "Security audited", "OWASP compliant", "zero vulnerabilities", "penetration-tested", "production-ready", or "100% secure".

**Last policy review:** November 2026. Reassess for each material change.
