# Sales Intelligence — readable KPI report UX contract

Status: design handoff, not implemented. Scope: **02 Sales Intelligence** only. Source of truth: `02-sales-intelligence/report.py` (`analyze`, `render_html`), `README.md`, `CASE_STUDY.md`, `test_report.py` on main (reviewed 2026-11-07).

## Observed issue and one proposed improvement

The portable HTML report has four KPI cards, a revenue-by-category visual bar, and a monthly table. Its category chart is implemented as a fixed three-column CSS grid (`130px 1fr 95px`) and collapses to one column below 500px. A long category label can crowd or overflow its allotted column; a visual bar alone is insufficient for understanding relative values without a clear textual relationship. The report also lacks a concise, immediately visible explanation of what its figures include/exclude.

**Improve the generated report's category-revenue section as an accessible, label-resilient comparison** while preserving all existing numeric results and offline portability. Frontend owns implementation of HTML/CSS in `render_html`; design does not edit that file to avoid overlapping the frontend agent.

## Proposed structure (desktop and mobile)

1. Header: “Sales Intelligence” and immediately below “Fictional CSV sample · generated offline · not live sales data.” Avoid any implication of client results.
2. KPI grid: Total revenue, Orders, Units sold, Average order value. Each value retains the exact source amount and explicit `$` currency marker already used; do **not** infer USD from the dollar symbol unless the sample contract establishes it.
3. Category comparison: one category per row. A full-width **wrapping** category label precedes the bar; the exact revenue amount is adjacent in text and must remain visible without hovering. The bar is supplementary, not the only encoding. Categories are not ranked unless sorting is explicitly implemented and tested; the source dictionary currently preserves input encounter order.
4. Monthly revenue: preserve semantic table and existing ascending month order; on narrow screens allow wrapping or contained horizontal scrolling with an accessible table caption, never clip values.
5. Footer note: “Each CSV row is treated as one unique completed sale. Returns, discounts, shipping, taxes and currency conversion are not included.” Avoid claiming data provenance was authenticated. The SHA-256 in JSON records input bytes; it does not prove authenticity.

### Suggested layout tokens (design targets, not new dependencies)

- Report content max-width: 56rem; page padding: clamp(1rem, 3vw, 2rem).
- Body: system font, at least 16px, line height 1.5. Secondary text contrast target WCAG AA (4.5:1 for normal text).
- Category row: label/value header with wrapping, then a bar on its own line. Minimum 8px visual bar height; do not encode amount exclusively by color or bar length.
- At 320px width and 200% browser zoom: no horizontal page overflow caused by category labels, no clipped amounts. Break long unspaced strings via `overflow-wrap:anywhere` on **text labels only**.
- Keep native HTML headings, table markup, and keyboard-friendly reading order. Respect print layout: exact numbers and labels remain visible in grayscale.

## Empty and hostile input states

- Zero categories: show “No sales records in this report.” Do not render a misleading empty scale.
- Zero monthly rows: show a meaningful empty table state or paragraph; retain the table headings if a table remains.
- HTML-escape category names, product names and all user-controlled labels as the current renderer does. Never use unescaped dynamic HTML or external fonts/scripts.
- Extremely long labels, Unicode text, HTML-like strings (e.g. `<script>`), right-to-left text, and punctuation must remain **text**, never markup, and must not obscure totals.
- No network calls, tracking, upload prompts, new backend, or client data.

## Acceptance criteria for frontend

- [ ] Existing `python -m unittest test_report.py -v` passes without changing KPI semantics.
- [ ] A new regression checks a category label of 200+ characters and HTML metacharacters: escaped in HTML, readable and wrapping in browser.
- [ ] At 320, 375, 768 and 1280 CSS pixels, plus 200% zoom, labels and values remain readable; browser screenshot or manual review notes attached to frontend PR.
- [ ] Revenue amounts are visible as text even when CSS or color perception fails.
- [ ] Report opens locally from `file://`, with no network requirement.
- [ ] A no-records fixture displays a meaningful state without divide-by-zero or fake trends.
- [ ] A screen reader can navigate headings, KPI labels and monthly table in meaningful order.
- [ ] No claims of live data, paid clients, verified order provenance, conversion uplift or financial reconciliation.

## Reproduction and coordination

```sh
cd 02-sales-intelligence
python -m unittest test_report.py -v
python report.py sample_sales.csv --json report.json --html dashboard.html
# Open dashboard.html locally, review at widths/zoom above.
```

The generated outputs must use **new filenames** on repeated runs: the current CLI intentionally refuses to overwrite existing files. For the six-row fictional sample, the existing case study expects 6 orders, 19 units, $209.50 revenue, and $34.92 average order value; confirm against generated JSON before any showcase claim.

Frontend: implement only the generated report markup/styles and tests on a dedicated `frontend/` branch; link this design PR and avoid editing shared showcase or Python computation logic. Backend: no requested change. Integration requires human review; do not merge automatically.

## Verification status

Design source review only. No Python, Node, browser, accessibility tooling, or GitHub CI run was executed in this design round. This is a proposed UX contract, not a shipped interface.
