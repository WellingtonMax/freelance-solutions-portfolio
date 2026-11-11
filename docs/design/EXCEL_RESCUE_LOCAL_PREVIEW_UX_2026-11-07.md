# Excel Rescue — local CSV preview UX handoff

**Date:** 2026-11-07  
**Scope:** design and UX specification only, for `01-excel-rescue/try.html` and its browser-side presentation.  
**Status:** proposed, not implemented or browser-validated. AI-assisted fictional demonstration; human review required.

## Evidence from current repository

- `try.html` is a local-only CSV preview with a file input, `Process locally` action, live status paragraph, two readonly output textareas, and explicit 1 MB / 2,000-row limits.
- The shared `demo.css` has detailed styling for the audit showcase, but no dedicated file-input, action-button, textarea, or form layout rules for the local-preview workflow.
- The page already declares a restrictive CSP and includes `try.js` and `try-ui.js`; do not weaken the policy or modify validation rules as part of a visual change.
- `demo.html` and its filter interaction have an independent frontend PR (#17); the portfolio landing page has another (#19). Avoid editing their files.
- The preview is not the Python CLI, is not a hosted upload service, and must not imply that data are transmitted or safely processed for production.

## Primary user journey

**Goal:** a potential client should understand and try a fictional local CSV transformation without guessing the required input or whether processing succeeded.

1. **Understand (0–10 seconds):** heading, concise browser-local promise, visible fictional-data warning and explicit limitations.
2. **Prepare (10–20 seconds):** show the exact required column names as selectable code, a clear file-picker label and an optional *download fictional example CSV* action **only if a versioned, verified sample file is provided by frontend**. Do not create a nonfunctional CTA.
3. **Run:** show the selected filename and actionable state before the button is activated; explain that the action is local and capped at 1 MB / 2,000 rows.
4. **Interpret:** on success, display accepted and rejected counts, then separate clearly labeled readonly outputs. Make copying straightforward without promising a clipboard action that is not implemented.
5. **Recover:** distinguish missing selection, invalid CSV/header, size/row limit, processing error, and successful zero-accepted-record result; retain input and offer a safe retry.
6. **Verify:** link to Python reference, limitations and tests; keep the distinction between browser preview and Python implementation explicit.

## Layout and visual design

Use existing dark palette and system fonts from `demo.css`, but propose isolated `.local-preview`-scoped styles to avoid affecting `demo.html` or its concurrent PR. Avoid new packages, fonts, images, remote scripts and trackers.

### Desktop ≥ 960 CSS px

- Main content max width ~1100 px; introduction above a two-column workspace (input/controls ~40%, result/interpretation ~60%).
- File-picker label, constraints and primary action stay together in one visible form region.
- Results area uses distinct headings, count summary, and two separate output panels; no horizontal page overflow.
- Trust/limitations appear after or beside the workspace, not between input and output.

### Tablet 600–959 CSS px

- Stack introduction, file picker/action, feedback, result summary, accepted CSV and rejected CSV in that order.
- Keep minimum readable text sizes and touch targets around 44 × 44 CSS px.

### Mobile 320–599 CSS px

- One-column layout with 16 px-ish content gutters, full-width file action and primary button, wrapping filename, and scrollable monospace textareas.
- No clipped controls or horizontal page overflow at 320 and 375 px.
- Output labels must remain visible while interacting with their textareas.

## Content / state matrix

| State | Status wording (suggested) | User action | Accessibility |
| --- | --- | --- | --- |
| Initial | “Choose a fictional CSV file to preview locally.” | Choose file | File input has visible label and constraints |
| Selected | “Selected: {filename}. Ready to process locally.” | Process locally | Filename text wraps; do not interpolate as HTML |
| Missing file | “Choose a CSV file before processing.” | Choose file | Associate error with file control |
| Processing | “Processing in this browser tab…” | Wait; prevent duplicate run if needed | Announce transition without repeated live-region spam |
| Success | “Preview complete: {accepted} accepted, {rejected} rejected.” | Inspect outputs | Counts as text; results focusable by headings |
| Zero accepted | “Preview complete: no records accepted. Review rejection reasons.” | Inspect rejected output | Not presented as a transport or system error |
| Invalid input | “This file could not be previewed. Check CSV headers and format.” | Choose corrected file | Specific error if implementation can distinguish cause |
| Limit exceeded | “File exceeds the local preview limit (1 MB or 2,000 rows).” | Choose smaller file | Avoid showing truncated output as complete |
| Unexpected failure | “The preview did not complete. Your file was not uploaded.” | Retry with fictional data | No unsupported claim that processing succeeded |

These are **copy recommendations**, not assertions that the existing parser currently exposes every state. Frontend must map actual error codes/messages before implementing; backend owns the canonical data-validation contract.

## Accessibility acceptance criteria

- Use native `label`, `input type=file`, and `button` semantics; no simulated clickable div.
- Preserve a single polite status region for progress/success; avoid announcing the full CSV contents. Errors must be discoverable through status text and, where appropriate, `aria-describedby` on the file input.
- Do not rely on mint/pink color alone for outcome. Every result and failure has a textual label.
- Focus indicator remains visible on input, button, links and outputs; keyboard tab order follows reading order.
- Textarea content can be selected with keyboard; long CSV rows scroll inside output, not the viewport.
- Respect reduced-motion preference and 200% text zoom. Check contrast of muted labels and status colors rather than claiming WCAG conformance without measurement.
- Never put untrusted filenames or CSV values into `innerHTML`; use text content. Preserve existing CSP.

## Frontend handoff and tests

1. Inspect `try-ui.js` and `try.js` before wiring the proposed states; retain current security constraints and actual parser behavior.
2. Implement isolated styling in a new stylesheet or scoped selectors only after coordinating with the frontend owner; avoid changing shared `demo.css` selectors used by `demo.html`.
3. Add DOM-level tests for initial, selected, missing-file, invalid, successful and zero-accepted states where observable; check no unsafe HTML injection through filenames or CSV content.
4. Test keyboard-only flow and manually inspect 320, 375, 768, 1280 CSS px plus 200% zoom; capture evidence if browser tooling is available.
5. Verify all local navigation links, current CI on the implementation commit, and the no-network claim in the actual runtime. No deployment without separate approval.

## Ownership and coordination

**Design/UX:** this specification and review of copy, hierarchy and visual consistency.  
**Frontend:** implementation and UI tests on its own `frontend/` branch after coordination; no change to backend, migrations or authentication.  
**Backend/security:** only consult if validation semantics or data-processing contract need modification.

**Risks:** state wording could contradict the real `try-ui.js` error model; file input rendering varies by browser; mobile textareas can cause overflow; accessibility and contrast remain unverified until runtime testing.  
**Rollback:** close this documentation-only PR or revert its single new file. No existing application behavior changes.
