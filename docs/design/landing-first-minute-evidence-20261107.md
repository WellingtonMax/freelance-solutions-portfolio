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

## Next review
Frontend should reference this spec in its own PR, include before/after screenshots at 375px and desktop if available, and record actual test outcomes. Human review required before merge; no deploy authorized.
