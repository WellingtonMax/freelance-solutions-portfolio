# Fictional review queue (offline browser demonstration)

Open `review.html` directly in a browser, then select **Load fictional sample**. **Inspect review queue** moves keyboard focus to the candidates section. This is a static view of the checked-in, fictional `sample.csv` processed by `triage.py`; it does not contact anyone or fetch data.

The browser uses the same output keys as the Python CLI: `status`, `auto_send`, `verification`, `source_sha256`, `leads[]` and `rejected[]`. It **does not** score or re-triage candidates. The source hash corresponds to the UTF-8 sample with a final newline; recheck if that file changes. No suppressed-company KPI is inferred from rejected rows. Emails are deliberately not shown in the UI.

Run `python triage.py sample.csv` and compare the output to the fixture in `review.js`. Run `node --test test_review.cjs` for UI contract tests, and `python -m unittest discover -v` for Python tests. Test manually at 320, 375, 768 and 1280 px, keyboard-only and 200% zoom. Browser testing and CI status must be independently verified.

Safety: local-only, no dependencies, network, telemetry, HTML injection, sending, or actual customer data. Strings are rendered as text nodes. The interface is not a compliance or deliverability check. For live data, backend review and a separately authorized data-handling contract would be required.

Design handoff: PR #41. Base dependency: PR #11, not merged to main at authoring time. Do not merge without human review.
