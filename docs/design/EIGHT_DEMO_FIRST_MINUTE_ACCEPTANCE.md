# Eight-demo first-minute UX acceptance protocol

Status: **design QA specification, not evidence of passing browser tests**. Applies only to projects 01–08. This is an offline evaluation protocol for synthetic demos; it does not claim deployment or client outcomes.

## Purpose
A prospective Upwork client should understand the business problem, identify whether a demonstration is interactive or source-only, perform one truthful action, and see a meaningful result within 60 seconds. This protocol complements issue #49 and the existing design/front-end PRs; it does not replace their implementation or integration requirements.

## 60-second journey (desktop and mobile)
- **0–10 seconds — orient:** each card states the problem and honest state: integrated browser demo, offline/local-only prototype, or source/case study. Draft PR work is never marked shipped.
- **10–20 seconds — decide:** one primary action has a destination-specific label (e.g., “Open fictional audit preview” or “Read local setup instructions”), with keyboard-visible focus.
- **20–45 seconds — inspect:** when interactive, provide preloaded synthetic input and one unambiguous action; when noninteractive, show sample input/output and exact local verification steps. Never require credentials or a network service.
- **45–60 seconds — trust:** show output and its meaning, a limitation statement, and a path to source/tests. Empty, loading, invalid-input and stale-result states must be distinguishable.

## Project-specific first action and proof
| Project | First useful action | Evidence required before claiming interactive |
| --- | --- | --- |
| 01 Excel Rescue | Inspect synthetic CSV audit | Preview and reject counts correspond to bundled fixture; no private data |
| 02 Sales Intelligence | Explore a fictional KPI report | Numbers trace to bundled sales fixture and are labeled synthetic |
| 03 API Bridge | Inspect local JSON→CSV mapping | No live API claim; sample export and malformed-input recovery verified |
| 04 CRM Lead Intelligence | Review fictional lead triage | No actual outreach; suppression and decision explanations visible |
| 05 Landing Page Studio | Trigger invalid form input and correct it | Field-specific error, focus, recovery and offline submission caveat |
| 06 Document Factory | Preview a fictional document | Escaped user text and output/limitations clearly visible |
| 07 Data Quality Auditor | Review synthetic anomaly finding | Explain flagged rows, counts and remediation without false certainty |
| 08 Site Change Monitor | Restore fictional sample after a custom report | Output is reset/recomputed, never stale; no live scraping claim |

## Acceptance checklist
1. Inspect current `main` and each target PR head/base; only test an integrated artifact as integrated. Record exact commit SHA and URL.
2. At 320, 375, 768 and 1280 CSS pixels, plus 200% zoom, confirm no horizontal overflow, clipped action or hidden result. Record screenshots if a browser is available.
3. Keyboard-only: Tab/Shift+Tab order follows DOM, focus remains visible, Enter/Space activates expected controls, error focus is announced. Verify screen-reader names where tooling is available.
4. Change inputs, submit invalid JSON/CSV, restore fictional sample and re-run; stale output must not remain visually authoritative. Ensure hostile strings display as text rather than HTML.
5. Validate every CTA destination and its state claim against current main, README, and relevant PR. Broken links, misleading statuses or unlabeled external navigation fail release.
6. Capture test command, exit status, CI URL/SHA and any manual browser observations. A test file present in a branch is **not** a passing test.
7. Mark each project **Not ready / Portfolio ready / Commercially viable** only when supporting evidence exists. Do not treat this document as proof of any of these states.

## Coordination and release gate
Frontend owns UI changes and browser tests; Backend owns security, integration order and merges; Design/UX owns this acceptance protocol and UX sign-off. Issue #49 remains the canonical showcase blocker. PR #11 is an ancestral dependency for 04–08; PR #19 and its stacked PR #40 govern the showcase. Recheck these live before acting. Do not duplicate their implementation or open another generic tracking issue.

**Current outcome:** specification only; browser execution and full eight-project validation remain pending.
