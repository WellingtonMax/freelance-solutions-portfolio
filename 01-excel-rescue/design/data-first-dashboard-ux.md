# P01-F01 · RescueDesk — data-first dashboard UX acceptance contract

Status: **UX audit / proposed remediation**, NOT UX_READY. The issue #67 backend checkpoint has not established a verified BACKEND_READY contract for this increment. This document does not authorize frontend integration.

## Verified baseline (main, 2026-11-17)
- `01-excel-rescue/try.html` has a navy sidebar and four cards labeled “Processing”, “Maximum file size”, “Maximum rows”, “Outputs”. These are **capabilities**, not dataset KPIs. Its sidebar uses fragment links to import/results, with results initially hidden.
- `try-ui.js` already supports a one-click fictional sample, local CSV processing, result counts, and copyable accepted/rejected CSV. It does **not** expose an interactive row-level diagnosis table, before/after view, charts, filters or downloadable output in this browser preview.
- `workspace.css` includes responsive layout and focus-visible treatment. The main results are two raw CSV textareas. The README distinguishes the browser preview, CLI and authenticated local app.
- Do not present a static KPI dashboard or unimplemented export button as an operational feature.

## One UX correction: results must be data-first, not capability-first
**User job:** Within 60 seconds, a prospective client loads the bundled synthetic CSV, sees the exact acceptance/rejection split, understands *why* a row failed, and obtains a truthful output.

### Current → target journey
1. Initial state: prominent “Try fictional sample” action; capabilities and privacy limits in a secondary explanatory panel, never represented as performance metrics. The primary results region reads “No CSV analyzed yet”.
2. Processing: announce “Validating CSV locally…” in a polite live region, disable duplicate submission; never claim remote upload.
3. Success: summary shows **input rows, accepted, rejected**, all derived from the same processing result. A chart may only visualize these three values with a labeled denominator; do not count headers as rows.
4. Diagnosis: accessible table of synthetic records with source row number, status and human-readable reason, searchable/filtered only when the processing contract exposes the underlying rows/reasons. Never invent row reasons from totals.
5. Review: show original and normalized values side by side only when source-to-output mapping is available; otherwise explicitly label this capability pending.
6. Output: keep the existing truthful copy actions until actual download/export is implemented and tested. Clearly distinguish accepted from rejected records.

### Layout contract
Desktop ≥1024 px: navy navigation rail, page title + source badge, three data-derived summary cards, diagnostic table as primary surface, supporting “How this works” rail. Mobile 320–767 px: top navigation with all actions reachable, stacked summary cards, horizontally scrollable labeled table or row cards; no clipped action buttons. At 200% zoom preserve keyboard access.

### States and microcopy
- Empty: “No CSV analyzed yet. Try the fictional sample or select a local UTF-8 CSV.”
- Busy: “Validating locally. No file is transmitted.”
- Invalid: “This CSV could not be validated. Check its headers, encoding and row limits.”
- No accepted rows: “All records require review. No accepted CSV is available.”
- Success: “{accepted} accepted · {rejected} rejected out of {sourceRows} rows.”
- Export/copy failure: retain selectable text and an explicit manual-copy fallback.

### Accessibility and data integrity acceptance checks
- Every sidebar destination leads to a real visible view or a clearly named section; no dead/hidden anchor as the only route.
- Primary task operable with keyboard; focus moves to the result heading after processing, not into a hidden element. Status messages are announced without stealing focus.
- Summary numbers must equal actual processed rows; a graphical split has text equivalents and does not use color as sole status cue.
- Filters must update visible counts and announce the filtered subset separately from original totals.
- User-supplied CSV content must render as text, never HTML; avoid network calls and preserve CSP.
- Test sample, invalid headers, empty file, oversized file, duplicate emails, formula-prefixed values, copy denied, and narrow viewport against actual code before marking FRONTEND_READY.

## Coordination and gate
**Backend:** supply versioned row-diagnostic and export contract, fixtures, security limits and executable evidence before BACKEND_READY. **UX:** only then finalize mapping, wireframe and UX_READY. **Frontend:** implement and test after both gates; avoid editing `try.html`, `try-ui.js` or `workspace.css` concurrently with active frontend work. **Backend:** only merge executor after checks.

Reference direction: user-approved Meridian ERP density and hierarchy; no brand replication, ERP modules or fictitious KPIs. No screenshot, test run, deployment or integration is asserted by this document.
