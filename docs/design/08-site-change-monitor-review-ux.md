# 08 Site Change Monitor — trustworthy comparison review UX

**Design handoff · 2026-11-07 · documentation only · English client-facing copy**

## Source and ownership
Based on `08-site-change-monitor/README.md`, `compare.py`, `test_compare.py`, `before.html` and `after.html` in draft PR #11 (`feat/five-portfolio-demos-20261106`). Project 08 is **not merged to main**; its source and JSON contract belong to the backend. Frontend should build any viewer in isolated new files after coordinating with #11. Do not edit `compare.py`, `index.html`, or shared styles in parallel. No public website monitoring, live fetches or alerts.

## One-minute buyer journey
1. **Understand:** headline “Review changes between two saved page snapshots” and prominent “Offline demo · fictional content · no website requests”.
2. **Compare:** label two local inputs “Earlier snapshot” and “Later snapshot”; optional preloaded fictional Meridian example. Never imply that entering a URL will fetch it.
3. **Decide:** summary “Visible text changed” / “No visible text change detected” (not “Website unchanged”), with source hashes and visible text-block counts in a secondary details section.
4. **Inspect:** change groups in a list with type labels “Replaced”, “Added”, “Removed”; display *Before* and *After* excerpts side-by-side on desktop and stacked on mobile, always with text labels independent of color.
5. **Act:** copy/download a local report only if frontend actually implements it; otherwise provide the documented CLI command, not an inert button.

## Information architecture and truthful semantics
- Primary summary: `changed` reflects normalized extracted visible-text blocks only. `status: offline_comparison` is **not** an HTTP or service-health status.
- Secondary metadata: `visible_blocks_before` and `visible_blocks_after` are parser text-block counts, **not** DOM nodes, words or changed lines.
- Change groups: `first_10_changes` is a list of **up to ten diff groups**, not ten characters or ten changed pages. Show the count as “Groups shown: N”, not “Total changes: N”.
- If `truncated_change_list` is true, show a visible, screen-reader-announced warning: “Showing the first 10 change groups. Additional changes were detected; this report is incomplete.” Do not invent a total count.
- SHA-256 values fingerprint input bytes; they do **not** prove origin or authenticity. Different hashes can coexist with `changed: false` (scripts, attributes, whitespace).
- Links, image differences, accessibility attributes, script-rendered content, CSS, and layout changes are outside detection scope. Avoid “No changes” without the qualifier “visible text”.
- `replace`, `insert`, `delete` map to “Replaced”, “Added”, “Removed”; unknown types must render “Unrecognized change type”, never disappear silently.

## Desktop / mobile wireframe
```text
[Offline demo / fictional data]             [How it works]
Review changes between two saved snapshots
[Earlier snapshot] [Later snapshot] [Compare locally]
[Visible text changed] [3 blocks before] [3 blocks after]
[Changes found: groups shown 1–10] [truncation warning if needed]
[Group 1: Replaced]
[Before excerpt             ] [After excerpt              ]
[Details: source SHA-256 fingerprints / scope / limitations]
```
At 1280px, constrain reading width to ~1100px; two equal columns for excerpts. At 768px, retain readable columns only if no horizontal clipping; otherwise stack. At 320/375px, stack all controls, excerpts and metadata; wrap long hashes with `overflow-wrap:anywhere`. No fixed-width tables requiring horizontal page scrolling. At 200% zoom, preserve document reading order and focus visibility.

## Visual system
Use existing portfolio tokens where possible: dark ink/background, muted secondary text, restrained mint accent; never encode changed/unchanged state through color alone. Base text >=16px, metadata >=14px, line height >=1.45; visible keyboard focus >=2px, target sizes around 44px. Avoid animation as a requirement; respect reduced-motion preference.

## State and microcopy contract
| State | Primary copy | Secondary guidance |
| --- | --- | --- |
| Initial | “Compare two saved HTML snapshots” | “Files stay on your device in this demo.” **Only if implemented fully client-side** |
| Working | “Comparing visible text…” | Use live region without repeated announcements |
| Changed | “Visible text changed” | “Review the extracted text differences below.” |
| Unchanged | “No visible text change detected” | “This does not check links, scripts, attributes, media or layout.” |
| Truncated | “More changes were detected” | “Only the first 10 change groups are included.” |
| Error | “Comparison could not be completed” | Preserve selected files; give actionable error and retry |
| Empty text | “No visible text blocks found” | “Check that the snapshots contain readable static text.” |

## Acceptance checks for frontend
- Use semantic headings, a `main` landmark, explicit input labels, and a result summary with `aria-live=polite`; on failure, focus the error summary and associate it with affected input.
- Display excerpts as **plain text**, never `innerHTML`, and do not render source HTML, execute scripts or load external resources. A strict CSP is desirable; do not relax it for styling.
- Handle malicious HTML strings, markup-looking excerpts, empty excerpts, very long text, unknown change types, malformed JSON, missing fields and out-of-range counters without crashes or code execution.
- Do not silently accept a different JSON schema; validate required fields and types, report incompatible versions, and coordinate changes with backend.
- Verify with synthetic fixtures: the Meridian sample has two altered paragraph texts, but the diff algorithm may group them into **one** `replace` group; do not assert two groups without running it.
- Verify script-only change produces `changed: false` with different SHA-256 hashes. Verify >10 disjoint groups triggers truncation warning.
- Test keyboard-only, screen reader, 320/375/768/1280px, 200% zoom, reduced motion, long hash wrapping, print view and offline behavior.
- Frontend must not claim live monitoring, site crawling, alerts, authenticated capture, accessibility audit, or production readiness.

## Reproducible review and handoff
From the parent PR #11 checkout:
```bash
python 08-site-change-monitor/compare.py 08-site-change-monitor/before.html 08-site-change-monitor/after.html
cd 08-site-change-monitor && python -m unittest discover -v
```
No tests or browser checks were executed for **this documentation-only design change**. Review #11's current CI and conflict status independently before implementing. Coordinate with frontend through this PR; backend owns parser, bounds, security controls and result schema. Human review before merge.
