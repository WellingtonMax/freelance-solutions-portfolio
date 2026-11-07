# API Bridge — Offline Mapper UX & CSP Implementation Handoff

**Status:** Design/UX handoff only. The working mapper is proposed in [frontend PR #29](https://github.com/WellingtonMax/freelance-solutions-portfolio/pull/29), not in `main`. Do not claim a deployed demo or production API connection.

## Focused finding: the page's visual design may be blocked

The proposed `03-api-bridge/mapper.html` embeds a `<style>` block while declaring a restrictive Content Security Policy with `style-src 'self'`. A conforming browser **blocks inline styles** without a nonce, hash or explicit unsafe-inline permission. Consequently, the intended two-column workspace, contrast, focus outlines and mobile breakpoint may not render. This is a **source-level CSP incompatibility**, not a browser-tested failure. Preserve the restrictive policy: **do not** add `unsafe-inline`.

**Frontend ownership / acceptance:** extract the exact current styles into a new same-origin `03-api-bridge/mapper.css`, link it with `<link rel="stylesheet" href="mapper.css">`, and remove the inline style block. Keep `style-src 'self'`, `connect-src 'none'`, and the external same-origin `mapper.js`. Do not edit the Python exporter, auth, or security policy outside this static page. Coordinate changes in PR #29 rather than independently editing its three files.

## One-minute client journey

1. **Understand (0–10 s):** title, “Fictional offline sample” and a short promise: select JSON fields and preview a spreadsheet-ready CSV. Keep the distinct Python HTTPS exporter clearly described as separate.
2. **Inspect (10–20 s):** user edits the supplied three fictional records and activates **Inspect fields**. Announce record count, available fields and next action. For invalid JSON, show an actionable error next to the editor; preserve input.
3. **Choose (20–35 s):** checked fields appear as a named group with a clear selection count. Preserve native checkbox keyboard behavior and avoid auto-preview on every keystroke.
4. **Preview (35–45 s):** preview CSV in a scrollable, focusable text region. Give an explicit empty/invalid selection message. If the JSON or field selection changes, clearly mark the old preview as stale and disable download.
5. **Export (45–60 s):** **Download fictional CSV** is enabled only after preview. Explain that this is a browser-local Blob export and is not the authorized network API exporter.

## Desktop and mobile visual contract

- **Desktop 1280 px:** input/editor and selection/output form two balanced columns; each panel has a distinct heading, ample spacing and visible action hierarchy.
- **Tablet 768 px and mobile 375/320 px:** one column in task order: edit → inspect → choose → preview → download. No page-level horizontal scrolling; the CSV code region may scroll horizontally.
- **200% zoom:** content reflows without hidden controls. Keyboard focus remains visible on links, buttons, editor, checkboxes and CSV preview.
- **Status semantics:** `role="status"` should communicate progress/success without stealing focus. Validation failures should be discoverable by screen readers (e.g., `role="alert"` for errors or explicit focus/description); do not rely on color alone.
- **Typography:** use readable system UI for controls and monospace only for JSON/CSV. Maintain accessible contrast for muted copy and disabled controls.

## Security, privacy and truthfulness constraints

- Never render user-provided JSON, field names or CSV as HTML; use `textContent` and text nodes.
- Keep the 50,000-character / 200-record / 50-field bounds and formula-escape behavior. The current label “50 KB” is not identical to a 50,000-character JavaScript limit; align the microcopy to **“50,000 characters”**.
- The source currently inserts a three-record fictional example. Never imply live API fetching, credential handling, upload, client records or production-ready spreadsheet safety.
- Keep the CSP restrictive and do not introduce third-party assets, fonts, analytics or external requests.

## Verification checklist for frontend / reviewer

- [ ] Under the actual CSP, browser developer tools report **no blocked inline stylesheet** and computed grid/focus/mobile styles apply.
- [ ] At 320, 375, 768 and 1280 px, the form is legible, controls are reachable, and only the CSV preview scrolls horizontally.
- [ ] At 200% zoom, tab through all controls; focus indicator is visible.
- [ ] Invalid JSON, zero records, too many records, invalid field names and zero selected columns yield understandable messages without exposing HTML.
- [ ] Editing JSON or changing a checkbox invalidates previous CSV and disables download.
- [ ] Sample download is explicitly fictional, and the page makes no network requests.
- [ ] Run `node --test 03-api-bridge/mapper.test.cjs`, `node --check 03-api-bridge/mapper.js`, and relevant CI; report actual results, not assumptions.

## Coordination and ownership

This document is intentionally separate from PR #29's HTML/JS/tests, from the backend-owned Python exporter, and from PR #19's root portfolio index. The frontend agent should address the CSP/styles mismatch **within PR #29** and report the browser checks there. Design will review visual consistency afterward. No merge or deployment is authorized by this handoff.
