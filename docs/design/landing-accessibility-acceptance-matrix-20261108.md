# Landing Page Studio — reproducible accessibility acceptance matrix

Scope: project 05, PR #46 head `6e74ce14be6d33de563295e290a91540e880155b` as inspected on 2026-11-08; re-check the head before acceptance. Design/UX QA handoff only. No browser or assistive-technology test is claimed here.

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
| Resolve final highlighted error without submitting | TBD | Ask for revalidation; do not revert to untouched message | Not run | Pending |
| Edit after successful local validation | TBD | Withdraw previous success; show “Form changed since validation. Validate again; nothing was sent.” | Not run | Pending |
| Valid fictional values | TBD | Local-only confirmation | Not run | Pending |
| Hostile characters | TBD | Safe, specific errors | Not run | Pending |
| Narrow/zoom layout | TBD | No overflow or clipping | Not run | Pending |
| Screen-reader announcement | TBD | Label + error, non-duplicated status | Not run | Pending |
| Network/storage inspection | TBD | No submission or persistence | Not run | Pending |

## Integration constraints

PR #46 is a draft based on `feat/eight-project-sprint-20261106`, not main. PR #11 is a draft and currently conflicts with main; do not rebase or merge stacked work without backend coordination. Design does not modify frontend files, authentication, storage or backend. Node tests in `05-landing-page-studio/test_site.cjs` are useful but cannot substitute for this manual accessibility evidence.

If an announcement is missing, frontend should preserve the existing safe `textContent` approach, then test a narrowly scoped fix. Do not add live error alerts to every field without testing for duplicate speech. Backend owns final integration order and merges.

## Historical UX finding — distinguish correction from a fresh untouched form (2026-11-08)

**Superseded by frontend PR #46 head `6e74ce1` (source inspected, not runtime-tested):** the earlier defect below was addressed in source. `site.js` now retains an attempted-validation flag, uses the corrected-errors message after a failed submit, and after editing a previously successful validation displays **“Form changed since validation. Validate again; nothing was sent.”** Do not treat the historical observation or the earlier proposed **“Details changed”** copy as a current implementation requirement. The manual scenarios above remain pending. This update is a documentation reconciliation only.

Source reviewed: frontend PR #46 head `7fcbde84515a45d573726fe964598fb8789c9fd1`, `05-landing-page-studio/site.js`. On each input event, when no `aria-invalid="true"` fields remain, the status is reset to **“Nothing has been checked yet.”** This also happens after a failed submit followed by successful correction of all three fields. It is a misleading state: validation *has* happened, but the user still must press **Validate enquiry locally** again. This is a design finding, not a browser-observed defect.

**Recommended single frontend behavior change (not implemented by Design):** distinguish initial/pristine, post-submit-invalid, corrected-but-not-resubmitted and post-submit-valid states. After the final highlighted error clears, use **“All highlighted errors are resolved. Validate again to check the form; nothing was sent.”** Preserve the existing valid-submit message **“Fields look valid. Demo only — nothing was sent or saved.”** Editing any field after a valid submit should invalidate the prior confirmation and use **“Details changed. Validate again; nothing was sent.”** Do not imply a saved enquiry or real submission. Keep one stable polite atomic status region and field-associated errors; do not add per-field live alerts without reader testing.

**Acceptance criteria for frontend:** (1) untouched form says nothing checked; (2) invalid submit marks all bad fields; (3) fixing only one keeps other errors; (4) fixing the final error announces *ready to revalidate*, never *nothing checked*; (5) editing after valid submit removes stale success; (6) resubmitting valid fictional values shows the existing local-only confirmation; (7) no raw field values reflected, network, persistence or altered CSP; (8) Node regression tests for the state transitions plus actual keyboard/screen-reader checks before ready-for-review. Record results and exact tested SHA. This is a handoff for frontend PR #46; no frontend code is modified here.
