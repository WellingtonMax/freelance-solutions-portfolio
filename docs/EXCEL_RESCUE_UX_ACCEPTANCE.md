# Excel Rescue — UX acceptance protocol (P0, issue #67)

Status: **verification checklist, not executed evidence**. Applies to `01-excel-rescue/try.html` and the one-click sample behavior merged from PR #84. No backend contract or feature gate is inferred from this document.

## One-minute visitor journey
1. Open the browser preview. Verify the fictional/offline scope, required CSV headers and 1 MB / 2,000-row limits are visible without opening documentation.
2. Activate **Try fictional sample**. Expect validation and visible accepted/rejected outputs without a second click on the integrated `main`; record a defect if this fails.
3. Read accepted/rejected totals and the explicit manual-review warning. Copy either CSV or use the documented manual selection fallback.
4. Return to the documentation and distinguish the browser-only preview from the Python reference tool.

## Reproducible manual checks — capture result and screenshot
| Check | Steps | Acceptance |
|---|---|---|
| Narrow mobile | Set viewport to 320 and 375 CSS px; repeat at 768 and 1280 | No clipped controls, overlapping text or horizontal scrolling caused by layout |
| Keyboard | Starting at page top, use Tab/Shift+Tab and Enter/Space through sample, file, validate and copy actions | Visible focus, logical order, no keyboard trap; skip link reaches preview |
| Zoom and reflow | At a 1280 CSS-px desktop viewport, set browser zoom to 200% and 400%; at 400%, repeat the sample, file, validate and copy flow using keyboard only | At an effective 320 CSS-px layout width, page content and controls reflow without two-dimensional page scrolling, clipping or loss of function; horizontal scrolling within CSV output textareas is permitted where essential to preserve CSV text |
| Screen reader | Navigate headings, form labels and status updates with a screen reader | Inputs and outputs have understandable names; errors and completion announced once; focus movement is understandable |
| Windows forced-colors / high contrast | Enable Windows High Contrast (or emulate `forced-colors: active` in browser devtools); traverse sample, file selection, Validate, copy and disabled actions with keyboard | Text, input boundaries, buttons, disabled states and focus indicators remain distinguishable using system colors; do not infer native Windows behavior solely from emulation |
| Empty state | Load page with no file chosen; activate Validate | Helpful feedback, no stale success or invented output |
| Invalid input | Use a *synthetic* CSV with missing required header; then an oversized local synthetic file | Clear rejection, bounded processing, no accepted-data claim |
| Recovery | After invalid input, run fictional sample again | Feedback clears or updates correctly; outputs reflect the latest run |
| Copy permission denied | Deny clipboard permission or open where clipboard APIs are unavailable; click both copy actions | No false “copied” success; manual text-selection fallback remains available |
| Hostile CSV displayed as text | Supply only a synthetic CSV containing `<img src=x onerror=alert(1)>` in a text field and a formula-leading field such as `=1+1` | No script execution or HTML interpretation; warnings/rejections follow documented browser rules, without claiming universal spreadsheet safety |
| Repeated actions | Start validation and promptly choose a different synthetic file or rerun the sample | Final totals and outputs correspond to the latest selection; no stale success announcement |
| Data disclosure | Inspect page copy and browser network activity | Fictional data identified; no claim of server-side processing or production readiness |

Record browser/version, operating system, viewport, commit SHA, result (PASS/FAIL/NOT RUN), screenshots or recording, and issue/PR for every defect. Do not record personal data. No pass is implied by this checklist.

## Post-merge acceptance of PRs #83 and #84 — still unverified

This section is a **test specification**, not evidence of a run. Both PRs were merged on 15/11/2026: frontend #84 (`ac2108f0f5871b9abc355ce03dd88a3a9933405b`) and design #83 (`d01e7970a44546b76dcd46ae0e8d2486e8d8aa33`). The observed `main` was `14736abd67adc7ce5141b94fa3dd30bf13eb0177` at this documentation update. **Merge does not establish browser acceptance.** Run these scenarios against a fresh checkout of the current `main`, recording its exact SHA; do not re-merge closed PR heads onto `main`. Keep the browser preview distinct from the Python reference implementation.

| Scenario | Reproduction with synthetic inputs | Expected observable result |
|---|---|---|
| One-click sample | Reload; select **Try fictional sample** once | Accepted/rejected totals and both copyable outputs appear without activating **Validate CSV**; status reflects the sample, not a pending local file |
| Pending read superseded | Choose a large but within-limit fictional CSV; before its read settles, activate the fictional sample | The sample remains the final visible result; no stale file completion or error overwrites its totals, outputs or announcement |
| Stale read rejection | Simulate a failed earlier file read after the sample has completed, using the existing frontend regression harness | Earlier failure cannot replace sample success, reveal stale CSV or cause a misleading error announcement |
| Recover after rejection | Validate a synthetic CSV with a missing required header, then activate the sample | Error is replaced by current sample feedback; result region and copy controls reflect only the latest operation |
| Narrow viewport + zoom | Repeat sample, copy and error recovery at 320/375 CSS px and 400% zoom | Controls and long headers remain readable, focus visible, no clipped status or horizontal page overflow; output textarea may scroll horizontally |
| Clipboard blocked | Deny clipboard permission and attempt both copy buttons after sample completion | No false success; status explains manual selection and output remains selectable |

Capture the **tested main commit SHA**, browser/OS, exact fixture, viewport, outcome and screenshot/recording for each case. Run existing JS/Python/Chromium/security checks against the integrated `main`, not historical PR heads. On any failure, open a narrowly scoped regression issue referencing merged PRs #83/#84; do not rewrite or reopen their history. Backend owns subsequent integration decisions.

## B2B evaluation gate — observable value in 60 seconds (15/11/2026)

This is an **acceptance specification for the existing browser preview**, not a new feature contract, UX_READY declaration, test result, or claim that the browser demo is equivalent to the authenticated local web app. It addresses the intermediate B2B presentation requirement without expanding scope before BACKEND_READY.

**Desktop (1280 CSS px) and mobile (375 CSS px) buyer walkthrough:**
1. **0–10 s — Context and trust:** identify the fictional sample, browser-only/offline operation, required CSV columns and file limits without consulting README. The primary sample action must be discoverable without scrolling through technical prose.
2. **10–25 s — Do the work:** activate the synthetic sample once and see an actual processing result; a progress/loading indication is required only if processing is asynchronous or perceptibly delayed. Never fabricate a spinner or completion metric.
3. **25–40 s — Explain the decision:** locate accepted/rejected totals, distinguish valid from rejected rows, and understand that duplicates and invalid fields require manual review. Do not imply the accepted rows are certified safe or imported into a CRM.
4. **40–55 s — Take an output:** locate and copy the accepted/rejected CSV, or select the text manually when clipboard access is blocked. No invented download/export, persistence, or server action.
5. **55–60 s — State the boundary:** identify how the browser preview differs from the Python CLI and authenticated localhost application, and where to find their actual documented workflows.

**Observable acceptance (both viewport sizes):** the sample action is keyboard-operable with visible focus; output counts and CSV text reflect the current sample; rejected records are understandable without relying on color alone; text reflows without clipped actions; blocked clipboard reports failure and leaves selectable output; rerunning after invalid synthetic CSV clears stale status; no network request transmits the sample; no screenshot or copy suggests real customers or an operational hosted SaaS. Record PASS/FAIL/NOT RUN for each step, elapsed time measured with a stopwatch, exact main SHA, OS/browser, and screenshot/video evidence. A 60-second claim is permitted **only after a measured run**.

**Future richer grid/diagnosis/before–after/export experience:** treat as a *candidate* P01 increment, not implemented functionality. Backend must first publish the versioned processing contract, before/after semantics, supported output actions, error states and fixtures with a verifiable BACKEND_READY handoff. Design may then specify the responsive table, filters, side-by-side comparison, action hierarchy, tokens and WCAG checks, and only then declare UX_READY for frontend implementation. Do not relabel current textareas as a data grid or promise downloads that are not present.

## Handoff and release gate
- **Design/UX:** review evidence, classify navigation, focus, microcopy and accessibility defects; propose isolated corrections.
- **Frontend:** implement interface fixes and provide browser/E2E evidence without changing business rules.
- **Backend:** verify integrated `main`, CI and security, then decide any corrective PR merge; only backend executes merges.
- **Blocked:** do not mark PORTFOLIO_READY or COMMERCIALLY_DEMONSTRABLE until actual browser evidence exists and the required upstream contract gate is documented. The merged PRs alone are not evidence of manual accessibility acceptance.

Scope: existing eight-project portfolio only; no public deployment or external service authorized.

## Execution record (fill only after real testing)

Post-merge verification commands from a fresh checkout of `main` (no external deployment): `python3 -m unittest discover -v` from `01-excel-rescue/`; `node --test try-ui.test.cjs` (this CI entrypoint already imports `test_sample_ui.cjs` and `test_sample_one_click.cjs`; listing all three would register the same tests more than once) in the same directory; `python3 check_try_browser.py` after installing the repository-documented Playwright/Chromium prerequisites. Record `git rev-parse HEAD`, command exit codes and browser evidence. These commands are **instructions, not executed tests**. The legacy `scripts/check_excel_rescue_combined_ux.sh` targets historical PR refs and must not be used as proof of post-merge acceptance.

| Commit SHA | Browser / OS | Width / zoom | Scenario | Result | Evidence URL | Defect |
|---|---|---|---|---|---|---|
| Not run | Not run | Not run | Clipboard-denied, hostile text, repeated actions | NOT RUN | None | Unassessed |

This record is a blank evidence template, **not** proof that these scenarios passed. Avoid attaching CSVs with real contact information or screenshots containing personal data.

## Approved visual direction vs. executable browser scope (15/11/2026)

**Visual reference approved by the owner; this is not a shipped SaaS UI or a new BACKEND_READY gate.** The desired Excel Rescue identity is an operational B2B data workspace: navy navigation (`#142746`), ice surfaces (`#F3F7FA`), blue primary actions (`#1769E0`), cyan quality highlights (`#13B8C8`) and amber warnings (`#E69A35`). Prioritize legible tabular review over ornamental charts. Desktop should keep the primary CSV action and result review visible; mobile should reflow without shrinking CSV text below readable size. Design references and fictional screenshots must be labeled **concept**, never evidence of the current UI.

**Current browser contract (verified in `01-excel-rescue/try.html` and `try-ui.js`):** offline CSV selection or one-click synthetic sample, validation with explicit 1 MB / 2,000-row limits, accepted/rejected totals, read-only copyable CSV outputs and clipboard-denial fallback. The existing page is English-language; a future Portuguese UI must not be claimed as shipped. The mockup's historical KPIs, XLSX support, persistent history, editable correction grid, before/after cells, saved settings, subscriptions and file uploads to a server are **not evidenced by this browser contract**. Do not add navigation to dead routes, fake counters, unimplemented filters or nonfunctional export buttons merely to imitate the mockup.

**Visual debt verified in integrated source (15/11/2026):** `01-excel-rescue/demo.css` still defines `:root { color-scheme: dark; --bg: #090f1b; --panel: #121d30; ... }`, and `try.html` loads that stylesheet. Therefore the owner-approved light navy/ice design is **not implemented** in the browser preview. Do not describe the current page as light-mode SaaS, and do not recolor the shared `demo.css` globally: it also styles the existing dark audit walkthrough. Any future visual migration must scope tokens to `body.csv-preview` (or a separate stylesheet), preserving the existing dashboard, focus styles and forced-colors rules. Before marking visual acceptance, compare screenshots at 1280px and 375px, verify 400% zoom and keyboard focus, and confirm no regression in `demo.html`. This is a documented, source-verified discrepancy, not a tested CSS fix or a new feature gate.

**Testable UI acceptance for the existing flow, before visual redesign:**

1. At 1280px desktop and 320/375px mobile, the fictional sample action is immediately discoverable; one activation reveals the real totals and both CSV outputs without navigating away.
2. Keyboard users can reach the sample, local file input, validate, and enabled copy actions in logical order; focus is always visible, and the result heading receives focus on success.
3. No-file, malformed CSV, oversized file and denied clipboard each produce truthful, recoverable text feedback. A subsequent successful sample clears stale error/output states. Never echo hostile filenames or exception paths into the page.
4. At 400% zoom and with forced colors, input boundaries, primary action, disabled actions, result heading and copy fallback remain distinguishable. Capture browser/OS/viewport and screenshots; **NOT RUN** until tested.
5. Any future diagnostic table or before/after view requires a backend-approved record-level contract and real synthetic fixture; every displayed count must be computed from the same output used by the table, not hardcoded from the concept art.

**Handoff:** Design direction approved, **UX_READY not declared** for a new SaaS feature. Backend owns contract and merges; Frontend may improve existing UI only as an independent, non-conflicting regression/accessibility change until the next BACKEND_READY handoff. This section is a specification, not a test result.
