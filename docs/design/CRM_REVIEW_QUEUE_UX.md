# CRM Lead Intelligence — review-only queue UX contract

Status: **design handoff, not a deployed or working browser demo**. Source inspected: unmerged PR #11, `04-crm-lead-intelligence/{README.md,triage.py,sample.csv}` (7 Nov 2026). Coordinate with frontend before editing shared components. No backend, authentication, or scoring changes are proposed.

## One-minute fictional demonstration

The first viewport must state: **"Review fictional hiring signals. No outreach, consent verification, or email verification occurs."** A clearly labeled **Load fictional sample** action should show an existing, pre-generated result from the project's sample CSV (not an invented success metric). A second action **Inspect review queue** moves focus to the results heading. No contact/send/approve buttons.

Desktop: header and caveat above a 3-part summary (candidate companies, rejected input rows, companies suppressed when *provably derivable*); review queue as primary wide table; rejection explanations below. Mobile: one-column summary, vertically stacked cards with explicit labels; never force horizontal page scrolling. At 200% zoom, keep actions and explanations available.

## Information architecture and truthful labels

1. **Candidates for human review** — `leads.length`; never "verified leads", "qualified contacts", "ready to contact" or "conversion probability". The score is a bounded heuristic, not machine learning or confidence.
2. **Rejected input rows** — `rejected.length`; not "rejected companies". Multiple rejected rows can describe one company; a company suppressed by a later record may disappear from `leads` without every previous row appearing in `rejected`.
3. **Source & safeguards** — show `status=prototype_no_outreach`, `auto_send=false`, `verification`, and shortened SHA-256 with a way to inspect the complete hash. Do not imply consent or lawful basis is established.
4. **Why a row was excluded** — row index, exact reason, and a safe explanatory label: `opted out` → "Source flags opt-out; do not contact"; `agency excluded` → "Source marks agency"; `company suppressed by another row` → "Company-level suppression"; `duplicate company` → "Duplicate candidate"; other reasons → "Input validation issue". Treat reasons as untrusted display text, not HTML.

**Critical contract limitation:** the JSON has no separate suppressed-company list, no original-row-to-selected-lead mapping, and no guarantee that rejected rows equal suppressed companies. Do not calculate or display a "suppressed companies" KPI without a documented backend contract extension. Do not infer a candidate's consent, verified ownership, or company identity from a syntactically valid email address.

## Result states

- **Initial:** concise explanation and sample action; no fake metrics.
- **Loading:** only if asynchronous; announce "Loading fictional sample" via a polite live region, and disable duplicate activation.
- **Candidates found:** rank by returned order, not by fabricated ranking; show company, role, openings, heuristic score, "Human review required". Email can be masked by default and revealed on deliberate interaction in a local-only demo; never log it or include it in analytics.
- **No candidates:** "No candidates available for review. Check rejected rows and source flags." Never say "All leads are bad".
- **Invalid or unsupported JSON:** clear nontechnical message, safe reset action, no stale previous results. Never render raw exception traces or untrusted HTML.
- **Truncated/unsupported data:** fail closed with a clear limit message; never silently omit records.

## Interaction and accessibility acceptance

- At widths 320, 375, 768 and 1280 px and 200% zoom: no page-level horizontal scroll, no clipped actions, sensible reading order.
- Use one H1, H2 for queue/rejections/source; table headers with scope on desktop or equivalent labeled cards on mobile. Visible focus, keyboard-operable controls, minimum 44×44 px touch targets where practical.
- Announce load/error/result count changes via an accessible live region; after loading, focus the results heading only when the user explicitly requested navigation.
- Respect reduced motion and minimum WCAG AA text contrast. Never encode rejection state by color alone.
- No remote fonts, third-party trackers, network requests, email send, or external CRM actions. Escape all displayed strings with DOM text nodes/textContent; never use innerHTML for CSV/JSON content.
- Only synthetic `.example` contacts in screenshots and fixture output; never collect actual client data.

## Frontend implementation boundary

Implement in a new isolated frontend file/route after checking PR #11 and other active branches; do not edit `triage.py` or tests for its business rules. Accept only the documented JSON keys (`status`, `auto_send`, `verification`, `source_sha256`, `leads[]`, `rejected[]`). Validate arrays, scalar types, count and string-length limits before rendering. Reject any result with `auto_send !== false` or `status !== "prototype_no_outreach"`. Use a static, checked-in JSON fixture generated by the real CLI rather than reimplementing scoring in JavaScript.

If the product later needs a suppressed-company count or a row-to-candidate provenance trail, request a separately reviewed backend contract through an issue. Do not guess these fields.

## Verification checklist (not executed in this design PR)

1. Generate fixture: `cd 04-crm-lead-intelligence && python triage.py sample.csv > sample-result.json` on the PR #11 branch, and compare the UI counts to the JSON.
2. `python -m unittest discover -v` inside the same directory.
3. Browser: keyboard-only, 200% zoom, mobile widths above, no-network mode, malicious JSON strings containing `<img onerror=...>`, oversized arrays, missing keys, unexpected `auto_send=true`.
4. Confirm no contact buttons, no network requests, no PII logging, and that all labels remain explicitly fictional.
5. Verify current PR checks and review branch dependencies before merging.

## Coordination and dependency

Backend source lives in **PR #11** (open/unmerged at inspection). This design document is intentionally added on a separate `design/` branch based on `main` to avoid concurrent changes to frontend files. Frontend should link its implementation PR here and note the exact base branch; do not imply that a PR branch is deployed or merged.
