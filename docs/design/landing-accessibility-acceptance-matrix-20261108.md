# Landing Page Studio — reproducible accessibility acceptance matrix

Scope: project 05, PR #46 at `ec99291d4d276100e97a8c59fc754892ba0b5c88`; review against the latest PR head before acceptance. Design/UX QA handoff only. No browser or assistive-technology test is claimed here.

## Single improvement: verify validation recovery as a complete keyboard journey

The interface currently renders per-field messages via `textContent`, focuses the first invalid input and announces a polite atomic status. Static presence of ARIA attributes does not prove that a screen reader announces the relevant error when focus moves. Acceptance requires observing the actual sequence, including correction and resubmission.

### Manual verification protocol (offline, synthetic input only)

1. Open `05-landing-page-studio/index.html` locally, with developer tools Network open and preserve log enabled. Do not enter real personal data.
2. Keyboard-only: Tab from the address bar. The “Skip to content” link must become visible on focus and move to `#main`. Continue through navigation, CTA and the form in DOM order. Visible focus indicator must not be clipped.
3. Submit the empty form. Focus must move to Name. Each invalid input must expose `aria-invalid="true"` and its own visible message through `aria-describedby`. The status must say nothing was sent, without implying an actual submission.
4. Correct Name with `Sample Person`. Its error must clear, while Email and Project summary errors remain. The summary must reflect the remaining errors; focus must not jump unexpectedly on typing.
5. Enter `sample@example.invalid` and `Fictional workspace redesign enquiry`. Submit again. All error states must clear and the status must explicitly say nothing was sent or saved. Verify no requests or storage mutations; this is a local-only prototype.
6. Retry with `Bad\u0001Name`, `bad-address` and `short`; confirm meaningful field-specific errors, no HTML injection, no reflected raw input in feedback and no crash.
7. Repeat at 320px, 375px, desktop >= 1280px and 200% zoom: no horizontal page scrolling, clipped messages or inaccessible controls. At narrow widths the CTA and privacy disclaimer must precede decorative art.
8. With NVDA + Firefox or VoiceOver + Safari (record browser/OS/reader versions), submit invalid values and verify whether the first focused input announces both its label and the associated error. Verify whether the atomic status is announced once and is not duplicated or suppressed by the focus move. Record actual observations, not just DOM inspection.

### Evidence table to fill before marking PR ready

| Scenario | Browser/viewport/assistive tech | Expected | Observed | Pass/fail |
|---|---|---|---|---|
| Skip link and keyboard order | TBD | Reach main and form without pointer | Not run | Pending |
| Three invalid fields | TBD | Focus first invalid; three associated errors | Not run | Pending |
| Edit one invalid field | TBD | Only its error clears | Not run | Pending |
| Valid fictional values | TBD | Local-only confirmation | Not run | Pending |
| Hostile characters | TBD | Safe, specific errors | Not run | Pending |
| Narrow/zoom layout | TBD | No overflow or clipping | Not run | Pending |
| Screen-reader announcement | TBD | Label + error, non-duplicated status | Not run | Pending |
| Network/storage inspection | TBD | No submission or persistence | Not run | Pending |

## Integration constraints

PR #46 is a draft based on `feat/eight-project-sprint-20261106`, not main. PR #11 is a draft and currently conflicts with main; do not rebase or merge stacked work without backend coordination. Design does not modify frontend files, authentication, storage or backend. Node tests in `05-landing-page-studio/test_site.cjs` are useful but cannot substitute for this manual accessibility evidence.

If an announcement is missing, frontend should preserve the existing safe `textContent` approach, then test a narrowly scoped fix. Do not add live error alerts to every field without testing for duplicate speech. Backend owns final integration order and merges.
