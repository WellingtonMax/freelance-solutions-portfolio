# Excel Rescue — browser preview: first-minute UX handoff

Status: **design specification only**. Target: `01-excel-rescue/try.html` and its existing UI scripts/styles. No changes to Python cleaner, local authenticated web app, storage, authentication or security policy.

## Source-grounded finding

The current browser-only preview starts with a file chooser and a **Process locally** button. It requires a four-column UTF-8 CSV and warns against real customer records. It provides two read-only CSV textareas after processing. A first-time buyer cannot demonstrate the transformation immediately without finding or preparing a CSV, and cannot readily distinguish the *fixed sample audit*, the *independent browser preview*, and the *authenticated local Python workspace*. The reference Python CLI has different size limits and is **not behaviorally certified equivalent** to the JavaScript preview.

This is a discoverability and task-completion issue, not evidence of a broken parser or failed test.

## One proposed improvement: guided synthetic sample path

Keep the existing file-processing path and strict offline CSP. Add a clearly labeled **Try fictional sample** action as the primary first-visit path, with a secondary **Choose my local CSV** action. The synthetic sample should be bundled locally and match the versioned `sample.csv` fixture, not downloaded from a remote origin. Do not silently load or submit a user-selected file.

### Desktop layout (>= 900px)

1. Header: `Excel Rescue / Browser-only CSV preview`; short promise: `See accepted and rejected records in under a minute.`
2. Visible trust strip: `Runs in this tab · No upload · Synthetic sample available · Not a production CRM connector`.
3. Two-step task card: **1. Select source** (fictional sample or local CSV) and **2. Review results**. Display exact header contract `name,email,signup_date,city`, 1 MB / 2,000 row limit, and link to Python implementation.
4. Results region: summary counts and **Accepted / Rejected** labeled panels, each with a visible `Copy CSV` action and accessible status feedback. Do not describe rejected rows as deleted.
5. Persistent distinction: `This browser preview is independently implemented; verify results using the Python CLI before importing business data.`

### Mobile (320–899px)

Stack source actions and output panels vertically; preserve a visible, keyboard-operable primary action, minimum 44px target height where feasible, wrap long labels, and avoid horizontal page scrolling. CSV textareas may scroll internally with a visible label. Do not hide rejection reasons or limitations behind hover.

## Interaction and state contract

| State | Visible behavior | Accessibility |
| --- | --- | --- |
| Initial | Sample CTA and file chooser; no results implied | Heading and controls in logical tab order |
| Sample selected | `Fictional sample.csv selected` with explicit Run action | Status announcement; no automatic processing |
| Local file selected | Filename and limits shown; no upload claim beyond browser-only scope | Label tied to input |
| Processing | Disable only conflicting actions; `Processing locally…` | `role=status`, no repeated live-region spam |
| Success | Accepted/rejected counts, two labeled CSV outputs, copy confirmation | Result heading receives focus only when user initiated run |
| Validation failure | Plain-language reason, retain selected source where safe, no stale outputs | Error associated with source and announced once |
| Empty accepted or rejected output | Explain `No accepted records` or `No rejected records` instead of empty unexplained textarea | No color-only meaning |
| Copy unavailable/fails | Selectable text remains as fallback; no false success | Announce failure without hiding output |

**Important:** if the fixture cannot be loaded under the existing offline CSP or local `file://` browser restrictions, bundle the fixture into a static JS module or document a local server requirement; never weaken `connect-src 'none'` merely to fetch a sample. Avoid interpolating CSV content with `innerHTML`. Preserve formula-risk safeguards and do not expose private filenames to telemetry.

## Exact microcopy (English)

- Primary: **Try fictional sample**
- Secondary: **Choose local CSV**
- Process: **Validate CSV in this browser**
- Success: **Review the records before using either output**
- Rejected: **Needs manual review — not automatically corrected**
- Privacy: **Your file stays in this browser tab. Use fictional or non-sensitive data for this demonstration.**
- Limitation: **Browser preview and Python cleaner are separate implementations; their results may differ.**

## Acceptance checklist for FRONTEND

- [ ] First-time visitor can run the bundled fictional sample without manually creating a file.
- [ ] Sample output matches the existing fixture's expected 1 accepted / 3 rejected rows; duplicates remain rejected together.
- [ ] Selecting a local file is explicit, and stale results disappear when the source changes or validation fails.
- [ ] Keyboard-only journey works; focus, error messages, copy feedback and labels are announced correctly.
- [ ] 320, 375, 768, 1280px widths and 200% zoom do not cause page-level horizontal overflow or clipped controls.
- [ ] CSP remains restrictive; no external network, analytics, new permissions or unsafe HTML insertion.
- [ ] Tests cover sample selection, invalid headers, malformed CSV, oversized file, zero-result panels, and copy failure.
- [ ] Documentation differentiates the static sample audit (`demo.html`), browser preview (`try.html`), and local authenticated Python app (`WEBAPP.md`).

## Coordination and verification

Frontend owns `try.html`, `try-ui.js`, `try.js` and `demo.css`; coordinate before editing shared CSS. Backend owns `webapp.py` and Python security contracts. Avoid editing the shared `index.html` while PR #19 is open and conflicted. This design document intentionally avoids concurrent source edits.

Reviewed: main README, project README, `try.html`, `demo.html`, `WEBAPP.md`, initial `webapp.py` sections, portfolio CI workflow and open PR/issue listings on 2026-11-07. `AGENTS.md` was not found on main. **No browser, Node, Python or CI tests were executed for this documentation-only change.** Run `node --test 01-excel-rescue/test_try.cjs` and `python -m unittest discover -v` in `01-excel-rescue` after implementation. Human review required; no merge or deployment authorized.


## 2026-11-08 design audit — results are visible but not actionable

Evidence: frontend PR #38 at head `81989849f7aa038ad780029df8c837a911385ccb` provides a bundled sample, a run button, totals and two read-only CSV textareas. The sample path and result-heading focus are implemented in source. **Do not reimplement them.** However, `try.html` has no explicit copy/download control, and `try-ui.js` has no copy-feedback state. Users must discover how to select text in two long fields. The earlier design contract proposed copy controls, but the implementation has not yet met that acceptance criterion. No browser execution is implied by this source review.

### One prioritized frontend handoff: copy a result with truthful feedback

- Place an explicit **Copy accepted CSV** control adjacent to the accepted output, and **Copy rejected CSV** adjacent to the rejected output. Keep read-only, selectable text as the fallback. Do not introduce a remote service, download dependency or clipboard permission request on load.
- On click, copy **exactly** the current corresponding textarea value, without changing CSV quoting, escaping, ordering or formulas. Never copy from the opposite output. Do not construct HTML from CSV values.
- If the output is empty, disable its copy control or clearly explain **No accepted records to copy** / **No rejected records to copy**. An empty textarea must not be presented as a successful export.
- On confirmed success, announce **Accepted CSV copied** or **Rejected CSV copied** in a persistent `role="status"` region. On clipboard API denial/unavailability (including some `file://` contexts), announce **Copy unavailable. Select the CSV text to copy manually.** Never report success before the write resolves.
- Preserve visible focus and keyboard operation; avoid shifting focus to the result heading when copying. Keep both actions and labels accessible at 320/375/768/1280px and 200% zoom, with no page-level horizontal overflow.
- Tests: success on both outputs; denied/rejected clipboard write; missing clipboard API; empty output; hostile CSV text with quotes, newlines and formula prefixes; no network or `innerHTML`. Manual browser checks remain required for permissions and assistive technology.

**Ownership:** FRONTEND implements in its existing #38 branch or a clearly dependent frontend PR after checking concurrent edits. DESIGN owns only this specification. BACKEND retains integration authority. Current #36 and #38 are open drafts against `main`; do not infer CI approval or merge readiness. No change to Python, auth, storage, or security boundaries is requested.


## 2026-11-08 follow-up — blocker: fictional sample never reaches results

**Static source evidence:** In frontend PR #38, `try-ui.js` sets `const file = sampleSelected ? null : selectedFile()` when the fictional sample is chosen. After processing the bundled sample, it unconditionally checks `if (selectedFile() !== file) return;`. A cleared file input normally yields `selectedFile() === undefined`, whereas `file === null`; the guard therefore returns before assigning CSV outputs, showing totals, enabling copy controls, or focusing the result heading. This breaks the primary first-minute demo journey. This is a source-level finding, not a claim of browser execution.

**One required frontend fix:** Preserve the stale-selection protection for local files, but apply file-identity comparison only to the local-file path; the sample path must instead validate its selection/version and remain explicitly selected. Do not bypass the `selectionVersion` guard or weaken CSP. Keep output hidden if the user switches sources while a file read is pending.

**Acceptance:** (1) Click **Try fictional sample**, then **Validate CSV in this browser**: visible totals are 4 input, 1 accepted, 3 rejected; both output panels appear and their copy controls reflect nonempty content. (2) Switch to a local file and back: no stale result survives. (3) Select a different local file during an asynchronous read: old output never appears. (4) Empty, malformed, oversized and hostile CSV input remains safely handled; no untrusted HTML insertion. (5) Add a DOM-level or browser test that exercises the sample click and checks actual visible results; static regex assertions alone cannot catch this regression.

**Status reconciliation:** The copy controls requested above are now present in PR #38 (HTML and `try-ui.js`), so do not reimplement them. Their browser behavior and permission fallbacks remain unverified. This regression is higher priority than further visual polish. DESIGN does not edit frontend-owned files; FRONTEND owns the repair, and BACKEND owns merge sequencing. PR #11 remains a separate prerequisite/conflict risk. No merge is recommended until positive runtime and CI evidence exists.
