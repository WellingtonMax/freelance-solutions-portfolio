# Case Study 02 — Sales Intelligence

> **Fictional sales scenario.** Original demonstration; not a paid engagement.

## The brief

A small retailer has daily transaction records but cannot quickly answer: How much did we sell? Which category drives revenue? How is revenue distributed by month? The owner wants a browser-viewable report, without adopting a paid BI platform.

## Solution

A Python program reads structured CSV transactions, validates required fields and produces:

- revenue, order count, units sold and average order value;
- category/product/month breakdowns;
- a machine-readable JSON report;
- a standalone HTML report that opens locally without hosting.

Money uses decimal arithmetic; labels from the CSV are HTML-escaped.

## Demonstration data and expected outputs

From [sample_sales.csv](sample_sales.csv): **6 fictional orders**, **19 units**, **$209.50 revenue**, **$34.92 average order value**. These values are calculable from the synthetic sample only; they do not represent savings, revenue growth, or customer results.

## Verify it

```bash
cd 02-sales-intelligence
python report.py sample_sales.csv --json report.json --html dashboard.html
python -m unittest test_report.py -v
```

Open `dashboard.html` in your browser. Review `report.json` for exact underlying values.

## Deliverables

- [Python report generator](report.py)
- [Synthetic sales dataset](sample_sales.csv)
- [Unit tests](test_report.py)
- [Operational README](README.md)

**Scope limits:** each row is one unique order; refunds, taxes, shipping, exchange rates and discounts are outside this demonstration. It is an offline report, not a deployed live dashboard.

**Status:** implemented. Independent runtime/CI verification still needs confirmation.
