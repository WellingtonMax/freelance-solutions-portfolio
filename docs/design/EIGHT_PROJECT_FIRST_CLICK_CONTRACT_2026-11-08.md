# Eight-project showcase — first-click UX and evidence gates

**Design handoff — 2026-11-08.** Owner: Design/UX. This is a documentation-only improvement to the existing design PR #39; it does not modify `index.html`, frontend components, authentication, backend code, or deployment. Coordinate implementation with frontend PR #19 and its stacked regression-test PR #40.

## Observed problem (verified against current main and open PRs)

On `main`, the homepage mixes the eight numbered freelance projects with independent product demos and planned projects 09/10. Sales Intelligence and API Bridge are represented by case-study links only; 04–08 are labeled planned. The unmerged frontend PR #19 corrects ordering and status honesty, but its eight-project grid still offers no consistent first-click expectation across browser previews, local CLI tools and draft proposals. The main README also lists 09/10 as future expansion, so public copy can contradict the scoped eight-project navigation. PR #19 is currently a draft and reports `mergeable=false`; PR #40 targets PR #19, not main.

## One concrete improvement: a consistent first-click contract

A visitor should know **what opens**, **what they can actually do**, and **whether the result is synthetic** before following a card link. Standardize each numbered project card with:

1. **Problem statement** in one sentence (avoid vague technology claims).
2. **Evidence/status line** using plain text: `Browser sample · fictional data`, `Run locally · source and tests`, `Case study · source evidence`, or `Draft PR · not integrated`. Multiple lines are allowed where both modes exist.
3. **Primary CTA** named for its destination: `Explore sample audit`, `Read analytics case study`, `Inspect exporter and tests`, or `Review proposed implementation`. Never label a GitHub blob/README as a live demo.
4. **Secondary CTA** for limitations, tests, or setup when a verified destination exists.
5. **Trust disclosure** above the grid: “Independent, AI-assisted demonstrations with fictional data. Browser samples, local programs and unmerged proposals are labeled separately. No client work or production deployment is claimed.”

Do not promote a draft browser prototype until its dependency chain is merged and the target exists on main. Do not link to a draft-relative URL as if it were available on the published site. Never solicit real customer data in browser samples.

## Project-by-project handoff (as of 2026-11-08)

| ID | Verified on main | First-click destination today | Potential upgrade after merge and validation |
| --- | --- | --- | --- |
| 01 Excel Rescue | `01-excel-rescue/demo.html` fixed fictional audit | “Explore fictional sample audit” | `try.html` browser-local CSV preview proposed by PR #38; verify privacy and parity first |
| 02 Sales Intelligence | `CASE_STUDY.md`, Python report generator | “Read analytics case study” | `sample-explorer.html` proposed by PR #27; test exact figures and keyboard category filter |
| 03 API Bridge | `CASE_STUDY.md`, Python exporter | “Inspect API exporter and tests” | `mapper.html` proposed by PR #29; PR #31 fixes CSP styling and depends on #29 |
| 04 CRM Lead Intelligence | Not integrated | “Review draft implementation” (PR #11) | `review.html` proposed by stacked PR #42; review-only, never outreach |
| 05 Landing Page Studio | Not integrated | “Review draft implementation” (PR #11) | `index.html` proposed by stacked frontend PR #46; browser-local validation only |
| 06 Document Factory | Not integrated | “Review draft implementation” (PR #11) | Local JSON-to-HTML quotation; do not confuse with separate Document Flow |
| 07 Data Quality Auditor | Not integrated | “Review draft implementation” (PR #11) | `findings.html` proposed by stacked PR #33; fixed synthetic result, not an uploader |
| 08 Site Change Monitor | Not integrated | “Review draft implementation” (PR #11) | `review.html` proposed by stacked PR #35; offline text-only comparison |

**Dependency reminder:** PRs #33, #35 and #42 target the #11 feature branch; PR #46 targets a different feature branch. Confirm their base/head SHAs before any integration. Frontend PR #40 is stacked on #19. Merge ordering is owned exclusively by Backend, after CI and conflict resolution.

## Acceptance tests for frontend implementation

- At 1440 px, 768 px, 375 px and 200% zoom, eight numbered cards remain in 01–08 reading order, without clipped status text or CTAs.
- Keyboard Tab and Shift+Tab reach every actionable link; `:focus-visible` is obvious; labels communicate status without relying on color.
- For each card, inspect actual href on the target branch. Relative paths exist, and external links clearly identify GitHub source or draft PR. No dead URLs or unsafe schemes.
- Each available browser sample announces “fictional/synthetic” and offline/local behavior before any input. Empty, invalid and oversized input states have readable recovery guidance; no credential or real-customer-data request.
- For draft cards, assert no “live”, “deployed”, “try now”, “completed client work” or “production-ready” claim.
- Re-run `node --test tests/showcase.test.cjs` **only after** PR #40 is integrated with #19, and record its actual outcome. Its existence in a draft PR is not a test pass on main.
- Review the existing Python regression workflow and CodeQL on the **final integrated head SHA**, not only on the individual source branches.

## Review notes / next handoff

Design PR #39 is safe to review independently as documentation, but its handoff is **not** evidence that frontend PR #19 or its stacked PR #40 is ready to merge. Backend should reconcile the main README's 09/10 roadmap copy with the agreed eight-project scope in a separate coordinated change; do not silently discard existing product-lab links. Frontend owns the actual homepage and CTA implementation. Keep PR #39 draft until this specification is reviewed and reconciled with the current implementation.
