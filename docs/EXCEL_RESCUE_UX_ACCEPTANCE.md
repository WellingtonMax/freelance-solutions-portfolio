# Excel Rescue — UX acceptance protocol (P0, issue #67)

Status: **verification checklist, not executed evidence**. Applies to `01-excel-rescue/try.html` and the pending one-click sample behavior in PR #84. No backend contract or feature gate is inferred from this document.

## One-minute visitor journey
1. Open the browser preview. Verify the fictional/offline scope, required CSV headers and 1 MB / 2,000-row limits are visible without opening documentation.
2. Activate **Try fictional sample**. On the integrated PR #84 version, expect validation and visible accepted/rejected outputs without a second click. On current `main`, record the existing two-click behavior instead of treating it as a failure of a merged feature.
3. Read accepted/rejected totals and the explicit manual-review warning. Copy either CSV or use the documented manual selection fallback.
4. Return to the documentation and distinguish the browser-only preview from the Python reference tool.

## Reproducible manual checks — capture result and screenshot
| Check | Steps | Acceptance |
|---|---|---|
| Narrow mobile | Set viewport to 320 and 375 CSS px; repeat at 768 and 1280 | No clipped controls, overlapping text or horizontal scrolling caused by layout |
| Keyboard | Starting at page top, use Tab/Shift+Tab and Enter/Space through sample, file, validate and copy actions | Visible focus, logical order, no keyboard trap; skip link reaches preview |
| Zoom and reflow | At a 1280 CSS-px desktop viewport, set browser zoom to 200% and 400%; at 400%, repeat the sample, file, validate and copy flow using keyboard only | At an effective 320 CSS-px layout width, page content and controls reflow without two-dimensional page scrolling, clipping or loss of function; horizontal scrolling within CSV output textareas is permitted where essential to preserve CSV text |
| Screen reader | Navigate headings, form labels and status updates with a screen reader | Inputs and outputs have understandable names; errors and completion announced once; focus movement is understandable |
| Empty state | Load page with no file chosen; activate Validate | Helpful feedback, no stale success or invented output |
| Invalid input | Use a *synthetic* CSV with missing required header; then an oversized local synthetic file | Clear rejection, bounded processing, no accepted-data claim |
| Recovery | After invalid input, run fictional sample again | Feedback clears or updates correctly; outputs reflect the latest run |
| Copy permission denied | Deny clipboard permission or open where clipboard APIs are unavailable; click both copy actions | No false “copied” success; manual text-selection fallback remains available |
| Hostile CSV displayed as text | Supply only a synthetic CSV containing `<img src=x onerror=alert(1)>` in a text field and a formula-leading field such as `=1+1` | No script execution or HTML interpretation; warnings/rejections follow documented browser rules, without claiming universal spreadsheet safety |
| Repeated actions | Start validation and promptly choose a different synthetic file or rerun the sample | Final totals and outputs correspond to the latest selection; no stale success announcement |
| Data disclosure | Inspect page copy and browser network activity | Fictional data identified; no claim of server-side processing or production readiness |

Record browser/version, operating system, viewport, commit SHA, result (PASS/FAIL/NOT RUN), screenshots or recording, and issue/PR for every defect. Do not record personal data. No pass is implied by this checklist.

## Handoff and release gate
- **Design/UX:** review evidence, classify navigation, focus, microcopy and accessibility defects; propose isolated corrections.
- **Frontend:** implement interface fixes and provide browser/E2E evidence without changing business rules.
- **Backend:** verify dependencies, CI and security, then decide merge; only backend executes merges.
- **Blocked:** do not mark UX_READY, PORTFOLIO_READY or COMMERCIALLY_DEMONSTRABLE until actual browser evidence exists and the required upstream contract gate is documented.

Scope: existing eight-project portfolio only; no public deployment or external service authorized.

## Execution record (fill only after real testing)

| Commit SHA | Browser / OS | Width / zoom | Scenario | Result | Evidence URL | Defect |
|---|---|---|---|---|---|---|
| Not run | Not run | Not run | Clipboard-denied, hostile text, repeated actions | NOT RUN | None | Unassessed |

This record is a blank evidence template, **not** proof that these scenarios passed. Avoid attaching CSVs with real contact information or screenshots containing personal data.
