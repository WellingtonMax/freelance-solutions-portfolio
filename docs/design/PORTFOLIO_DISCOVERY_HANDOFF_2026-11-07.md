# Portfolio discovery UX — implementation handoff (2026-11-07)

**Status:** design specification only; no UI changes, deployments, or client validation.  
**Repository:** `WellingtonMax/freelance-solutions-portfolio`  
**Target surface:** root `index.html` (frontend owns implementation).  
**Review needed:** frontend + human before merging.

## Verified starting point

- `main/index.html` currently presents StrataSignal first, followed by three implemented demos, then seven cards marked planned (04–10).
- `main/README.md` likewise lists 09–10 as planned. **Current user-approved scope is eight projects only (01–08)**; 09–10 must not be presented as an active roadmap.
- 04–08 have implementation work in **draft PR #11**, stacked changes in **draft PR #12**; they are **not verified as merged into main**. Do not relabel those cards as implemented until the integrated state is confirmed.
- The Excel Rescue sample audit has a direct interactive entry point; Sales Intelligence and API Bridge link to case studies instead.
- Open PR #17 changes Excel Rescue audit keyboard behavior. Do not modify its scripts or styles concurrently.

## Problem and intended user outcome

A prospective Upwork client scanning the landing page for 30–60 seconds needs to distinguish **what can be inspected today**, **what exists only in unmerged review branches**, and **which problem each project solves**. The present mixture of live examples, pending demos, and out-of-scope 09–10 creates avoidable uncertainty. The goal is truthful discoverability, not increased apparent project count.

## Proposed information architecture

1. **Hero:** one-sentence service promise; one primary action `Explore working demos` linking to the demo section; secondary action `See delivery process`. Keep the AI-assisted / human-reviewed disclosure visible.
2. **Available to inspect:** three cards for 01 Excel Rescue, 02 Sales Intelligence, 03 API Bridge, with identical fields:
   - Client problem (one sentence)
   - Concrete output (one sentence)
   - Status: `Implemented in main — verify CI`
   - Primary action: `Open interactive sample` when one exists; otherwise `Read case study` (never imply a live app)
   - Secondary action: `Source and tests`
3. **In review / not yet on main:** 04 CRM Lead Intelligence, 05 Landing Page Studio, 06 Document Factory, 07 Data Quality Auditor, 08 Site Change Monitor. Show status `Draft PR — not merged`, link to PR #11 (and #12 where relevant), and label the link `Inspect proposed source`. Avoid `Try demo` until a safe, validated demo is actually reachable.
4. **Separate product lab:** StrataSignal stays visible, but distinguish it as an independent product, not one of the eight freelance demos. Mark reports synthetic and link to its own repository.
5. **Delivery and limitations:** short process summary, test evidence links, and clear next steps; avoid invented metrics or testimonials.

## Copy and behavior requirements

- Do not display projects 09/10 or suggest they are authorized.
- Never use `Live`, `Production-ready`, `Deployed`, or `Security certified` without independently verified evidence.
- Prefer user-problem language over technology labels in card headings/subheadings.
- Every card must have a clear, working, distinct link destination. Do not turn a card into a button when its action is only a link.
- On mobile, keep primary actions visible without hover and make long titles wrap without clipping.
- Avoid relying on color alone to distinguish `Implemented` versus `Draft`; status text must be present.
- The `main` page should never claim that unmerged PR work has been shipped.
- Keep synthetic-data and AI-assistance disclosures adjacent to relevant demonstrations, not hidden in a footer.

## Acceptance criteria for frontend

1. Exactly eight freelance projects 01–08 appear; StrataSignal is visibly separated and 09/10 are absent.
2. Projects 01–03 are clearly distinguished from 04–08 by **actual main branch status**, not by aspiration.
3. Each implemented card links to a real case study or demo, with link text matching the destination type.
4. All links resolve locally or to their documented GitHub targets; no misleading dead-end CTA.
5. At 320, 375, 768, and 1280 CSS pixels, headings and CTAs remain legible without horizontal overflow.
6. Keyboard-only navigation reaches each link in logical order with visible focus; text labels convey status independent of color.
7. A quick screen-reader check confirms sensible heading hierarchy, distinct link names, and project/status grouping.
8. No remote scripts, trackers, third-party fonts, new packages, personal data, or backend changes.
9. The current tests/CI are re-run on the frontend implementation PR and results reported **for that head**, not inherited from another branch.
10. Screenshot or short browser walkthrough demonstrates the above, if browser tooling is available; otherwise explicitly record the missing manual validation.

## Suggested implementation split

- **Design/UX:** this handoff, wording and IA review, acceptance checklist. Do not edit `index.html` while frontend work is ongoing.
- **Frontend:** implement semantic HTML/CSS changes to `index.html` on a separate `frontend/` branch, using the existing visual tokens unless a coordinated design-token PR is approved.
- **Backend/security:** no action required; review only if new interactive data handling is proposed.

## Review checklist and evidence

This specification was based on direct GitHub reads of `main/README.md`, `main/index.html`, `main/CLIENT_START_HERE.md`, `main/01-excel-rescue/demo.html`, repository directory listing, and open PR metadata (#10–#17). No browser, contrast tooling, or assistive technology testing was executed in this design-only change. A recently completed GitHub Actions run on another SHA does not establish validation of this branch or a future implementation.

**Risk:** product-status labels may become stale as stacked PRs are integrated. Frontend must re-check the current main branch and PR status immediately before editing or publishing. Rollback: revert this documentation-only commit.
