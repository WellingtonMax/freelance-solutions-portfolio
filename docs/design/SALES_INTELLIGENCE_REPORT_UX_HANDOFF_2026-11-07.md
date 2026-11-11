# Sales Intelligence — Offline report UX handoff

Status: **design specification only**, not an implemented interface. Prepared from `02-sales-intelligence/report.py`, its README and case study on `main`. Scope: project 02 only; no new product or live dashboard.

## Observed experience and constraints

The Python generator currently emits one standalone HTML page containing four KPI cards (revenue, orders, units, average order), category bars, and a monthly revenue table. The sample scenario describes six fictional orders, 19 units, $209.50 revenue and $34.92 average order. The output is static and offline; the JSON contains the input SHA-256, but the HTML does not currently expose it. No filters, live refresh, export buttons or product table are implemented in the HTML. The source assumes each CSV row represents a unique completed sale, with no refunds, discounts, shipping, taxes or FX.

Current report layout uses a 130px/1fr/95px category bar grid, collapsing to a single column at 500px. Category labels are escaped in the generator. The page uses a light theme and no external assets. Preserve the self-contained, no-network approach.

## Recommended first-screen hierarchy

1. **Identity and trust:** heading “Sales Intelligence · Sample sales report”, visible “Fictional data · Generated offline” caption, and a short scope note: “Completed sales only; excludes refunds, tax, shipping and discounts.” Do not imply live data or verified commercial performance.
2. **Four KPI cards:** Revenue, Orders, Units sold, Average order value. Add explicit units and concise definitions. Currency symbol must be marked as *sample USD*, not an inferred currency from arbitrary client CSV input.
3. **Category breakdown:** use bar length *and* exact numeric value. Sort descending by revenue for quick scanning (requires generator change; do not silently claim implemented). Provide a compact accessible table of category/value alongside or as a replacement for bars.
4. **Monthly trend:** keep the real monthly table, right-align numeric values, and use `<th scope="col">` and `<th scope="row">` for clear reading. No invented month-over-month percentage or trend arrow.
5. **Provenance and limits:** place an expandable-looking section only if it genuinely works; otherwise a plain details section with input digest when available, record count, generated-offline disclosure, and scope limitations. SHA-256 is an integrity fingerprint, **not** proof of source authenticity.

## Responsive specification

- At 1280px: max-width 1100px content, 4 KPI cards in one row if each remains readable; categories and monthly table may sit in two columns if the narrower side remains legible.
- At 768px: two KPI columns, single-column data sections; maintain readable long category labels without clipping.
- At 375px and 320px: one or two KPI columns depending on measured width, no horizontal page scroll, no fixed 130px category-label column, bars and exact values readable with long untrusted labels. Long strings wrap or truncate with a separate full-text accessible alternative; never hide the only category identifier.
- At 200% browser zoom: content reflows; data table may scroll **inside its own labelled region**, not the entire page.
- Print: white background, no clipped data, clear report heading, fictional-data label and readable tables. No decorative graphics needed for comprehension.

## States and microcopy

| Real state | Suggested copy | Behaviour |
| --- | --- | --- |
| Normal synthetic sample | “Illustrative data · Offline report · Not client results” | Always visible near heading |
| Zero valid records | “No sales records to summarize.” | Show zero KPI values and an explanatory empty state, not an empty unlabeled chart |
| No category revenue | “No category revenue available.” | Avoid dividing by zero or rendering misleading full-width bars |
| Many categories | “Category revenue (N categories)” | Show every value in an accessible table; do not arbitrarily hide categories |
| Missing/untrusted provenance | “Input source not independently verified.” | Do not describe a hash as authentication |
| Generation error | Handled by CLI, not the HTML | Never design a fake in-page retry control for a static generated report |

## Accessibility and integrity acceptance criteria

- Heading order h1 → h2; landmark `main`; a descriptive `<title>`; no information conveyed by color alone.
- Cards use real labels and values, not color-coded status alone; screen-reader reading order matches visual order.
- Numeric table cells use `<td>` and appropriate headers; use tabular numerals, consistent decimal formatting and right alignment without changing calculation logic.
- Bar chart has a textual equivalent for every category and remains understandable with CSS disabled.
- Long category/product labels are inserted via the generator's HTML escaping, never via raw HTML or inline JavaScript. Avoid remote fonts, analytics, CDNs and scripts.
- Validate 320/375/768/1280px, 200% zoom, keyboard navigation, screen-reader table headers, and print preview; record actual results and screenshots rather than assuming success.
- Keep sample USD and fictional provenance explicit; do not promise real-time data, savings, customer revenue, authentication or production readiness.

## Handoff and coordination

**Frontend owner:** implement the presentation of generated HTML while preserving its standalone/offline contract. Since `render_html` currently lives in `02-sales-intelligence/report.py`, coordinate any generator-template edit with **backend** first; prefer an agreed ownership window or isolated PR, not concurrent edits to the same Python file. Do not change CSV parsing, arithmetic, reconciliation, authentication, database or output creation semantics. Add a generated HTML fixture from synthetic input and regression assertions for headings, escaped labels, table semantics, zero rows and long labels. Confirm existing Python unit tests still pass.

**Design owner:** review actual screenshots and iterate tokens/spacing only after the functional HTML change is safely staged. Do not modify `report.py` or shared CSS in this design PR.

**Rollback:** revert the future presentation-only PR without changing source CSV or generated JSON contract. This handoff adds documentation only and can be reverted independently.

**Current verification:** source review only. No browser, assistive-technology or runtime test was performed for this design document.
