# P01-F01 · RescueDesk — data-first dashboard UX acceptance contract

Status: **UX audit / proposed remediation**, NOT UX_READY. The issue #67 backend checkpoint has not established a verified BACKEND_READY contract for this increment. This document does not authorize frontend integration.

## Verified baseline (main, 2026-11-17)
- `01-excel-rescue/try.html` has a navy sidebar and four cards labeled “Processing”, “Maximum file size”, “Maximum rows”, “Outputs”. These are **capabilities**, not dataset KPIs. Its sidebar uses fragment links to import/results, with results initially hidden.
- `try-ui.js` already supports a one-click fictional sample, local CSV processing, result counts, and copyable accepted/rejected CSV. `try.js` already returns `rejected` entries with `line` and `reason` plus `sourceRows` and `accepted`; `try-ui.js` currently exposes these reasons only in a copyable rejected CSV textarea. It does **not** expose an interactive row-level diagnosis table, before/after view, charts, filters or downloadable output in this browser preview.
- `workspace.css` includes responsive layout and focus-visible treatment. The main results are two raw CSV textareas. The README distinguishes the browser preview, CLI and authenticated local app.
- Do not present a static KPI dashboard or unimplemented export button as an operational feature.

## One UX correction: results must be data-first, not capability-first
**User job:** Within 60 seconds, a prospective client loads the bundled synthetic CSV, sees the exact acceptance/rejection split, understands *why* a row failed, and obtains a truthful output.

### Current → target journey
1. Initial state: prominent “Try fictional sample” action; capabilities and privacy limits in a secondary explanatory panel, never represented as performance metrics. The primary results region reads “No CSV analyzed yet”.
2. Processing: announce “Validating CSV locally…” in a polite live region, disable duplicate submission; never claim remote upload.
3. Success: summary shows **input rows, accepted, rejected**, all derived from the same processing result. A chart may only visualize these three values with a labeled denominator; do not count headers as rows.
4. Diagnosis: accessible table of synthetic records with CSV record number, status and human-readable reason, for **rejected records** sourced directly from the existing `output.rejected` array (`line`, `reason`), with a filter for rejection reason. Do not claim accepted-row source line numbers: `output.accepted` currently has no source-line mapping. Never invent row reasons from totals.
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
**Independent existing-flow UX correction:** a rejected-row table may use the current `CsvRescuePreview.process()` output without inventing a new backend contract, but frontend implementation still needs coordinated ownership and actual tests. **Backend:** supply a versioned accepted-row source mapping and downloadable export contract, fixtures, security limits and executable evidence before BACKEND_READY for those *new* capabilities. **UX:** only then finalize mapping, wireframe and UX_READY. **Frontend:** implement and test after both gates; avoid editing `try.html`, `try-ui.js` or `workspace.css` concurrently with active frontend work. **Backend:** only merge executor after checks.

Reference direction: user-approved Meridian ERP density and hierarchy; no brand replication, ERP modules or fictitious KPIs. No screenshot, test run, deployment or integration is asserted by this document.

## Reviewable implementation slice (existing browser flow; no new backend contract)
- Render a semantic table from `output.rejected` only, with `<caption>Rejected CSV rows</caption>`, column headers `CSV record number` and `Reason`, and text-only cells (`textContent`, never `innerHTML`). The current processor returns zero-based input indices as `line: index + 2`, accounting for the CSV header; do not infer physical newline numbers for quoted multiline fields.
- If no rows are rejected, render `No rejected records in this analysis` rather than a blank table. Preserve the existing copyable rejected CSV as a secondary action.
- An optional reason filter must operate on `output.rejected` and report `Showing N of M rejected records`; it must not change the overall accepted/rejected KPI totals.
- Acceptance tests (to be executed by frontend, **not executed here**): synthetic sample shows three rejected entries with their exact processor reasons; a clean CSV shows the empty-rejection state; a formula-prefixed email is presented as inert text; selecting a new file removes stale table rows; keyboard navigation and 320 px viewport remain usable.
- This is a targeted improvement to existing processing output, not permission to assert `UX_READY` for the larger E01–E08 product or to add an unverified export button.

## Focused UX refinement · record numbering and multi-line CSV (2026-11-17)

**Problem:** the parser counts parsed CSV *records*, not physical file lines. A quoted cell may contain line breaks; showing `line: index + 2` as a physical line number would direct the operator to the wrong location. The current `rejectCsv` column is named `line` for compatibility, but the interface must not silently reinterpret its meaning.

**Decision (existing output only):** render the column header **CSV record #** and a persistent explanation: “Record numbers include the header as record 1. Quoted line breaks do not increment record numbers.” Use the exact numeric `output.rejected[].line` value; do not add a physical-line link or a jump-to-source affordance. The optional filter labels the reason, never a fabricated source location. This is a documentation-only correction, not a change to the backend schema.

**Desktop wireframe (semantic order):** title / fictional-local-data badge → sample/import actions → validation status → three totals from the processor → “Rejected records” heading + reason filter + “Showing N of M” → horizontally bounded table (CSV record #, reason) → copyable CSV outputs. **Mobile (320 px):** same DOM order, single-column totals and filter, table in a labeled horizontal-scroll region with no viewport-wide overflow; the existing output copy controls remain reachable without hover.

**Observable acceptance cases (pending execution):** (1) CSV with a quoted newline and a later invalid email displays the processor's record index, not a claimed physical line; (2) sorted rejection records retain the original record indices; (3) changing the file clears stale diagnostics; (4) focus remains visible and the table has a caption and header associations; (5) no user-controlled field is inserted via HTML parsing. Frontend owns implementation/testing once its existing-flow changes are coordinated. The wider dashboard remains **NOT UX_READY** pending verified BACKEND_READY.

## Focused UX refinement · failure recovery and stale-results prevention (2026-11-17)

**Observed in main:** `try-ui.js` resets the results region on a new file selection and displays a generic validation failure message in `#feedback`; `#result` is initially hidden. The independent frontend PR #91 owns contextual result navigation. This design change does not edit that PR's UI files or change processing rules.

**Decision:** when validation fails, keep the last attempted file selection available for correction/retry, but **never** show results, KPIs, rejected-row filters or export/copy actions from an earlier file. The error must identify a recoverable next action without echoing untrusted CSV contents. On a fresh selection, clear prior diagnostic filters and totals before asynchronous reading begins. An earlier file read finishing late must not repopulate the view or move focus away from the newer task.

**Testable state matrix:**

| Trigger | Visible content | Navigation and keyboard | Status copy |
| --- | --- | --- | --- |
| Initial / selection cleared | No results or stale KPIs | Import available; results link absent from Tab order | “Choose a fictional CSV or try the sample.” |
| Valid sample completes | Counts and diagnostics from this run only | Results destination available; focus on results heading | “Preview complete: A accepted, B rejected.” |
| Invalid header or malformed CSV | No old results, copy/export unavailable | Import remains reachable; results destination unavailable | “Unable to validate. Check headers and CSV formatting, then retry.” |
| Oversized file | No old results, copy/export unavailable | File chooser remains reachable | “File exceeds the 1 MB local preview limit.” |
| Selection changes during pending read | New selection owns loading/empty state | No stale result focus or results destination | New selection feedback, not prior file's outcome |

**Accessibility acceptance:** expose status through the existing polite live region; avoid placing the entire page in `aria-busy`, blocking keyboard access or automatically focusing the file input on ordinary validation errors. Preserve a visible focus indicator and non-color error wording at 320 px and 200% zoom. Distinguish processing errors from a successful analysis containing zero accepted rows: the latter is a completed result, not a failed upload. Browser/keyboard/E2E verification is still required; these are acceptance criteria, not observed passes.
