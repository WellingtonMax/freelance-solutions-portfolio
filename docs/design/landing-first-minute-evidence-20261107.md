# 05 Landing Page Studio — first-minute UX evidence and review contract

Status: design specification only; no frontend or backend code changed. Base: `feat/eight-project-sprint-20261106` (not merged into main at time of inspection). This document is scoped to project 05, one of the eight agreed projects.

## Verified interface inventory
- `index.html`: fictional Meridian Workshop landing page, skip link, Services/Contact anchors, three service cards, local-only enquiry form, CSP disallowing network and form submissions.
- `style.css`: two-column hero/contact and three-column services, stacked below 720px; focus outlines.
- `site.js`: first-error string returned by `validateEnquiry`; submit prevents default and writes to `#feedback` with `textContent`.
- `test_site.cjs`: synthetic validation and static no-network checks. No real browser or screen-reader test is evidenced by these files.
- This demo exists on a feature branch; do not claim it is deployed or integrated into main.

## Single improvement: evidence-led first-minute journey
A prospective client should be able to distinguish a polished *visual landing page* from a *working enquiry intake*. The current primary CTA says “Preview the enquiry form”, but the resulting state is only validation, not an actual request. Keep this distinction prominent without obscuring the design work.

### Desktop (>= 721px)
1. Hero eyebrow: **Fictional website demonstration**. Headline remains product-like; supporting copy should identify the sample business without suggesting real availability.
2. Primary CTA: **Try local form validation** (links to `#contact`); secondary text beside or immediately below CTA: **No enquiry is submitted**.
3. Service cards retain equal hierarchy and concise titles; keep heading and body reading order logical.
4. Contact heading: **Test the enquiry form**; immediately beneath: **Use fictional details. This checks input in your browser only; nothing is sent or saved.**
5. Validation result should be visually separated from the privacy explanation, not styled like a successful submission receipt.

### Mobile (320–720px)
- Hero text, CTA and privacy disclaimer appear before decorative artwork; no horizontal scroll at 320px or 200% zoom.
- Form labels remain above their inputs; target height >= 44 CSS px for CTA and submit.
- Error text wraps without clipping; avoid relying on colour alone.
- Skip link is keyboard reachable and visible on focus.

### Form-state microcopy contract
| State | Visible text | Meaning |
| --- | --- | --- |
| Initial | “Nothing has been checked yet.” | No implied submission |
| Invalid | “Please correct the highlighted field. Nothing was sent.” | No false success |
| Valid | “Fields look valid. Demo only — nothing was sent or saved.” | Validation, not delivery |
| Unexpected UI failure | “Validation could not complete. Try again; nothing was sent.” | No phantom request |
| No JavaScript | “This demo requires JavaScript for local validation. No data will be submitted.” | Honest fallback |

Field-level errors should be associated with their respective inputs via `aria-describedby`, `aria-invalid` toggled on validation, and focus moved to the first invalid field after submission. Keep a single summary status region with `role=status` for valid feedback; use `role=alert` or an equivalent accessible announcement for errors, avoiding duplicate announcements. Preserve user-entered values during validation, clear stale errors when fixed, and never echo raw field contents into HTML.

## Accessibility and safety acceptance checks
1. Keyboard-only: skip link, navigation, CTA, all fields and submit reachable in a logical order; focus visible.
2. Widths 320, 375, 768 and 1280 CSS px plus 200% zoom: no clipped fields, horizontal page overflow or hidden status.
3. Submit empty form, invalid email, short summary and valid synthetic values; correct field receives focus and an associated error, and success never says “sent”.
4. Try literal `<img src=x onerror=alert(1)>`, quotes, bidi controls and very long strings: no executable markup, broken layout or input reflection; maintain text-only rendering and length bounds.
5. Offline developer-tools network panel: no requests, analytics, storage, or form submission. Do not add external fonts, trackers or services.
6. Screen reader: page title, headings, navigation landmark, field labels and feedback have unambiguous names; decorative artwork does not obscure reading order.
7. Respect reduced-motion preference if animation is introduced. Verify text and control contrast against WCAG AA; do not claim certification without testing.
8. Existing Node tests still pass; add UI-focused tests for focus/error associations if the frontend implementation changes behaviour.

## Handoff
Frontend owns `05-landing-page-studio/index.html`, `style.css`, `site.js` and interface tests. Backend owns any future real intake, authentication, rate limits and persistence. Do not modify those files concurrently with frontend work. This design spec intentionally does not claim that the existing demo sends enquiries.

Reproduce baseline locally from the feature branch:
```sh
cd 05-landing-page-studio
node --test test_site.cjs
# Open index.html locally; manually inspect keyboard flow and responsive widths
```
The commands above are instructions, **not evidence that tests were executed**.

## Implementation reconciliation — 2026-11-08 (PR #46, still unmerged)

This review is based on the current frontend branch source, not on a running browser or screen-reader session. The previous request to report all invalid fields at once **has now been implemented in source**: `validateEnquiryAllFields()` returns per-field errors, the submit handler renders them all and focuses the first invalid field. VM tests for this behavior exist in `test_site.cjs`. Do not repeat the old first-error-only claim or imply these tests have passed.

### Resolved in frontend source: singular/plural feedback (not yet runtime-verified)

At frontend head `67759ad`, `errorSummary(count)` now selects singular for one error and plural for multiple errors, including after edits. The handler returns to **"Nothing has been checked yet."** when the last displayed error clears; this is an *unchecked* state, not a successful validation state. This source-level implementation has **not** been verified in a real browser or screen reader.

**Regression contract now implemented in source (retain these acceptance checks):**
- After submit, announce **"Please correct the highlighted field. Nothing was sent."** for exactly one invalid field and **"Please correct the highlighted fields. Nothing was sent."** for two or three.
- After editing one field, preserve errors on untouched fields. Recalculate the singular/plural summary from the remaining displayed errors without stealing focus.
- When no displayed errors remain after editing, use the neutral **"Nothing has been checked yet."** until a fresh submit. Never imply the data were submitted or validated.
- Keep per-field messages adjacent to their controls with `aria-describedby`, and use `textContent` for feedback. Confirm the chosen live-region strategy with a real screen reader: changing `role` between `alert` and `status` dynamically may not announce consistently.
- Keep network requests, storage, telemetry and submission disabled; use fictional values only.

### Acceptance matrix

| Scenario | Expected visible and accessible state |
| --- | --- |
| Submit with three invalid fields | Three field messages, first invalid field focused, plural summary |
| Correct name, leave email and message invalid | Two messages remain, plural summary, no focus jump |
| Correct email, leave message invalid | One message remains, singular summary |
| Edit last invalid field without submitting | No old error message, neutral *unchecked* summary (not success) |
| Submit all valid synthetic fields | No errors; explicit **"nothing was sent or saved"** result |
| 320/375/768/1280px, 200% zoom, keyboard and screen reader | No clipping or focus loss; feedback understandable without colour alone |

### Evidence and integration status

- Reviewed actual `site.js`, `index.html` and `test_site.cjs` on `frontend/landing-validation-feedback-20261107`. All-fields behavior is present in source and tests are written, **but Node, browser and screen-reader tests were not executed in this design review**. Local GitHub DNS access failed; GitHub connector file reads succeeded.
- PR #46 remains open and draft; PR #11 remains open, draft and non-mergeable in the current GitHub response. The repository has 36 open PRs. Do not claim these features are on `main`.
- Frontend owns the implementation and tests; backend alone decides merges after dependencies, CI and conflicts are resolved. No deploy is authorized.

## Next review

Verify live-region announcement behavior in a real browser, then record actual Node/CI results. Avoid another design PR for the same component while frontend is working in its existing PR.


## Reconciled accessibility review — stable live-region contract (2026-11-08)

**Source-verified correction:** At the current `frontend/landing-validation-feedback-20261107` branch, `index.html` declares `#feedback` as `role="status" aria-live="polite"`, and `site.js` changes **only** `feedback.textContent`. It does **not** dynamically change `role`. The earlier claim that this branch toggled `alert` and `status` was inaccurate and must not be used as a merge blocker. This reconciliation supersedes that claim.

**One remaining UX acceptance improvement:** add `aria-atomic="true"` to the persistent status element so short summary updates are treated as a complete message. The field-level `aria-describedby` and focus-to-first-invalid-field flow already exist in source; do not duplicate the live-region markup or create a second alert without assistive-technology evidence. Frontend owns the one-line markup change and its regression test; design does not edit shared frontend files.

**Verify before declaring ready:** (1) inspect the actual frontend head SHA and diff; (2) confirm `#feedback` retains `role=status`, `aria-live=polite` and `aria-atomic=true` after the change; (3) check submit with three, one and zero errors, plus edits after failed submission; (4) verify first invalid field focus and accessible description; (5) run `cd 05-landing-page-studio && node --test test_site.cjs`, then test keyboard and one named browser/screen-reader combination; (6) inspect at 320/375/768/1280px and 200% zoom. Use only synthetic values, verify no network requests or raw-input HTML reflection, and report actual results rather than inferring compliance.

**Integration:** This design document remains on a feature-branch-based draft PR (#45). Frontend PR #46 is also a draft on the unmerged feature branch. The structural PR #11 was observed open, draft and non-mergeable. No CI, browser or assistive-technology test was executed during this documentation correction; backend retains sole merge authority.
