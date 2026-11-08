# Landing Page Studio — reproducible accessibility acceptance matrix

Scope: project 05, PR #46 head `2e237dd3dc3206412ba09dc3c640d99f0389e4ba` inspected in source on 2026-11-08; re-check the head before acceptance. Design/UX QA handoff only. No browser or assistive-technology test is claimed here.

## Single improvement: verify validation recovery as a complete keyboard journey

The interface currently renders per-field messages via `textContent`, focuses the first invalid input and announces a polite atomic status. Static presence of ARIA attributes does not prove that a screen reader announces the relevant error when focus moves. Acceptance requires observing the actual sequence, including correction and resubmission.

### Manual verification protocol (offline, synthetic input only)

1. Open `05-landing-page-studio/index.html` locally, with developer tools Network open and preserve log enabled. Do not enter real personal data.
2. Keyboard-only: Tab from the address bar. The “Skip to content” link must become visible on focus and move to `#main`. Continue through navigation, CTA and the form in DOM order. Visible focus indicator must not be clipped.
3. Submit the empty form. Focus must move to Name. Each invalid input must expose `aria-invalid="true"` and its own visible message through `aria-describedby`. The status must say nothing was sent, without implying an actual submission.
4. Correct Name with `Sample Person`. Its error must clear, while Email and Project summary errors remain. The summary must show `(2 remaining)` and then the singular wording when only one error remains; focus must not jump unexpectedly on typing.
5. After the first invalid submit, edit a previously valid Name field into a blank or whitespace-only value. Its field-specific error must appear immediately, without hiding the existing Email/Message errors. Correct it and verify only its own error clears. Then enter `sample@example.invalid` and `Fictional workspace redesign enquiry`. Submit again. All error states must clear and the status must explicitly say nothing was sent or saved. Verify no requests or storage mutations; this is a local-only prototype.
6. Retry with `Bad\u0001Name`, `bad-address` and `short`; confirm meaningful field-specific errors, no HTML injection, no reflected raw input in feedback and no crash.
7. Repeat at 320px, 375px, desktop >= 1280px and 200% zoom: no horizontal page scrolling, clipped messages or inaccessible controls. At narrow widths the CTA and privacy disclaimer must precede decorative art.
8. With NVDA + Firefox or VoiceOver + Safari (record browser/OS/reader versions), submit invalid values and verify whether the first focused input announces both its label and the associated error. Verify whether the atomic status is announced once and is not duplicated or suppressed by the focus move. Record actual observations, not just DOM inspection.

### Evidence table to fill before marking PR ready

| Scenario | Browser/viewport/assistive tech | Expected | Observed | Pass/fail |
|---|---|---|---|---|
| Skip link and keyboard order | TBD | Reach main and form without pointer | Not run | Pending |
| Three invalid fields | TBD | Focus first invalid; three associated errors | Not run | Pending |
| Edit one invalid field | TBD | Only its error clears | Not run | Pending |
| Make previously valid field invalid after failed submit | TBD | New field error appears immediately; existing errors persist; summary count adjusts | Not run | Pending |
| Resolve final highlighted error without submitting | TBD | Ask for revalidation; do not revert to untouched message | Not run | Pending |
| Edit after successful local validation | TBD | Withdraw previous success; show “Form changed since validation. Validate again; nothing was sent.” | Not run | Pending |
| Valid fictional values | TBD | Local-only confirmation | Not run | Pending |
| Hostile characters | TBD | Safe, specific errors | Not run | Pending |
| Narrow/zoom layout | TBD | No overflow or clipping | Not run | Pending |
| Screen-reader announcement | TBD | Label + error, non-duplicated status | Not run | Pending |
| Network/storage inspection | TBD | No submission or persistence | Not run | Pending |

## Source-level evidence and limitations (2026-11-08)

At frontend head `2e237dd`, `site.js` revalidates the edited field when `lastSubmitHadErrors` is true, and `test_site.cjs` includes `after a failed attempt, editing a previously valid field reveals a new error`. This is **static review of a regression test, not an executed test**. The test suite, actual keyboard behavior and screen-reader announcements remain pending; the last queried commit had no pull-request-triggered workflow runs returned. Avoid treating the absence of runs as a passing CI result.

## Integration constraints

PR #46 is a draft based on `feat/eight-project-sprint-20261106`, not main. PR #11 is a draft and currently conflicts with main; do not rebase or merge stacked work without backend coordination. Design does not modify frontend files, authentication, storage or backend. Node tests in `05-landing-page-studio/test_site.cjs` are useful but cannot substitute for this manual accessibility evidence.

If an announcement is missing, frontend should preserve the existing safe `textContent` approach, then test a narrowly scoped fix. Do not add live error alerts to every field without testing for duplicate speech. Backend owns final integration order and merges.

## Current source contract (PR #46, head `2e237dd`, 2026-11-08)

The authoritative source is `05-landing-page-studio/site.js` on the frontend branch, not older proposals. The form starts with **“Nothing has been checked yet.”** Submitting three empty fields displays three associated errors and **“Please correct the highlighted fields (3 remaining). Nothing was sent.”** Editing a field after a failed attempt revalidates that field and updates the count; with one remaining error the singular message is **“Please correct the highlighted field. Nothing was sent.”** When the last error clears, the status asks for another validation, rather than claiming that the form was untouched. Editing after a successful local validation withdraws the earlier success and displays **“Form changed since validation. Validate again; nothing was sent.”** A valid subsequent submit says **“Fields look valid. Demo only — nothing was sent or saved.”**

These strings are verified **in source only**, not in an executed browser. Do not use the historical “Details changed” proposal or the obsolete instruction to revert to the untouched message. Do not claim screen-reader announcements from the presence of `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, or `aria-describedby` alone. The live-region timing, focus transition, 200% zoom and 320px layout require observed testing before marking the PR ready. A change to the summary wording or ARIA strategy must be coordinated with frontend #46 and tested for duplicate speech.

### Integration gate

Keep design #45 and frontend #46 as drafts until the current head SHAs, test execution, manual accessibility evidence and dependency chain are checked. Both target `feat/eight-project-sprint-20261106`, not `main`; structural #11 remains a conflicting draft as inspected. No backend changes, merges, deployment or client data are authorized by this document.
