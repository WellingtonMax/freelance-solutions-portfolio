# Eight-project showcase: honest discovery and status UX

**Design handoff — 2026-11-07.** Scope: the existing eight projects only. Documentation-only proposal; no page implementation or browser validation is claimed. Frontend owns `index.html`; do not edit it concurrently.

## Observed baseline (main, inspected 2026-11-07)

- `index.html` places external StrataSignal ahead of the eight in-scope projects and lists 09 Bug Fix Laboratory and 10 Business Operations API as planned. These are outside the current eight-project scope.
- `README.md` documents 01–03 as implemented and 04–08 as planned. Other feature branches/PRs exist; their content must not be presented as merged or deployed without verifying their integration.
- The showcase offers direct interactive entry for Excel Rescue and Document Flow but only case studies for Sales Intelligence and API Bridge; visitors cannot tell from a card which demonstrations run in-browser versus locally.
- The existing cards use `min-height`, a three-column desktop grid and one-column mobile layout. A card marked `Implemented` may still require local execution; that label alone is ambiguous.
- The repository's `CLIENT_START_HERE.md` explicitly states demonstrations are not commissioned client work.

## One proposed improvement

**Replace the ambiguous portfolio card status and ordering with an eight-project evidence-first discovery model.** This is a single information-architecture/microcopy change; frontend should implement it only after coordinating existing frontend branches. StrataSignal and Document Flow remain accessible through a separate, clearly labeled external/product-lab area if retained; neither should displace the eight numbered projects. Do not remove their existing links without review.

### Proposed card contract (English)

Each numbered card shows, in this order:
1. Number and project name (01–08), matching the repository's current directory names and verified branch content.
2. One sentence describing the client's problem and the demonstrated deliverable, without claiming a paid engagement.
3. **Availability** badge from evidence, not aspiration: `Try in browser (synthetic)`, `Run locally`, `Source / case study`, or `In development`. Multiple truthful labels may coexist.
4. One primary CTA with an explicit destination and expected action (e.g. `Open synthetic CSV audit`, `Read implementation and tests`). Do not use `Try demo` for a file that is only a README.
5. One secondary `Source and limitations` link where a corresponding verified page exists.

Suggested visible disclosure immediately above cards:

> Independent demonstration projects. Samples are fictional. Browser previews, local applications, and work in progress are labeled separately; no client delivery is implied.

**Do not** label 04–08 as fully implemented merely because a draft PR contains code. Check each target branch, PR merge state and CI before changing status. Do not claim CI success from the presence of workflow YAML.

### Status inventory to verify before implementation

| ID | Main README baseline | Required verification before upgrading card |
| --- | --- | --- |
| 01 Excel Rescue | Local app and sample audit | Direct preview URL and browser behavior; local-app setup and test status |
| 02 Sales Intelligence | Offline report | Whether a browser explorer has actually merged; generated report is not a hosted dashboard |
| 03 API Bridge | Local JSON-to-CSV exporter | Whether offline mapper and CSP fix are both integrated |
| 04 CRM Lead Intelligence | Planned on main | Branch/PR integration and executable demo |
| 05 Landing Page Studio | Planned on main | Branch/PR integration and form behavior |
| 06 Document Factory | Planned on main | Distinguish this from separate Document Flow demo |
| 07 Data Quality Auditor | Planned on main | Findings viewer branch and original auditor integration |
| 08 Site Change Monitor | Planned on main | Viewer branch and comparator integration; text-only comparison limitation |

## Acceptance criteria

1. The primary eight cards appear in numeric order 01–08 at desktop (>=1024px), tablet (~768px) and mobile (~375px); tab and reading order match visual order.
2. Every primary CTA resolves to an existing target **on the branch being reviewed**; no dead link or unsupported live-demo claim.
3. Status badges distinguish local execution, static report, interactive browser sample and unfinished work. A draft PR never counts as deployed.
4. No new projects 09/10 appear in the eight-project primary grid. Existing product-lab and Document Flow links are preserved in a secondary section if desired.
5. Every browser preview explicitly labels synthetic data, states whether it processes input, and links to limitations.
6. Keyboard navigation shows visible focus, headings follow a logical hierarchy, and status is readable without color alone. At 200% zoom no CTA or status is clipped.
7. External links use descriptive text and are not presented as on-site executable demos. No remote telemetry, credentials, or real client data are introduced.
8. Test plan: check all eight links, inspect desktop/mobile layouts and 200% zoom, navigate via Tab/Shift+Tab, verify screen-reader reading order, and compare labels against merged files and CI evidence. Record browser/version and screenshots when actually tested.

## Coordination and risks

- **Frontend:** owns actual card markup, routing and responsive behavior. This document intentionally does not edit `index.html` to avoid collisions with `frontend/portfolio-discovery-20261107`.
- **Backend:** no schema, authentication or API changes requested.
- **Design:** review card microcopy, status evidence and contrast after implementation.
- **Risks:** main README may lag active feature branches; status must be verified at implementation time. Direct GitHub HTML blob links do not constitute a running web demo. Do not publish a new hosting target or claim deployment.

## Reproducible review (not executed)

```bash
git fetch origin
git show origin/main:index.html
git show origin/main:README.md
git branch -r
# Inspect relevant open PRs, their base branches and checks in GitHub before updating status.
```

**Handoff:** propose one focused frontend PR updating only showcase navigation/cards after reviewing `frontend/portfolio-discovery-20261107` and coordinating ownership. Keep this design PR separate until that dependency is resolved.
