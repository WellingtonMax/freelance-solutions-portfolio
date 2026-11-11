"""Build a portable sales report from fictional CSV exports."""
from __future__ import annotations

import argparse
import csv
import hashlib
import hmac
import io
import re
from collections import defaultdict
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from html import escape
import json
import os
from pathlib import Path

REQUIRED = {"order_id", "date", "product", "category", "quantity", "unit_price"}
CENTS = Decimal("0.01")
MAX_BYTES = 5_000_000
MAX_ROWS = 20_000
MAX_QUANTITY = 100_000
MAX_UNIT_PRICE = Decimal("100000000.00")


def money(value: Decimal) -> str:
    return str(value.quantize(CENTS, rounding=ROUND_HALF_UP))


def analyze(rows):
    revenue = Decimal("0")
    units = 0
    seen = set()
    by_month = defaultdict(lambda: Decimal("0"))
    by_category = defaultdict(lambda: Decimal("0"))
    by_product = defaultdict(lambda: Decimal("0"))
    orders = 0
    for index, row in enumerate(rows, start=2):
        if index > MAX_ROWS + 1:
            raise ValueError("CSV row limit exceeded")
        if None in row:
            raise ValueError(f"CSV line {index}: unexpected extra columns or malformed row")
        try:
            identifier = (row.get("order_id") or "").strip()
            product = (row.get("product") or "").strip()
            category = (row.get("category") or "").strip()
            if not identifier or not product or not category:
                raise ValueError("missing order ID, product or category")
            if identifier in seen:
                raise ValueError("duplicate order ID")
            ordered = date.fromisoformat((row.get("date") or "").strip())
            quantity_text = (row.get("quantity") or "").strip()
            price_text = (row.get("unit_price") or "").strip()
            if len(quantity_text) > 8 or len(price_text) > 24:
                raise ValueError("invalid quantity or price")
            quantity = int(quantity_text)
            price = Decimal(price_text)
            if (not 1 <= quantity <= MAX_QUANTITY or not price.is_finite()
                    or not 0 <= price <= MAX_UNIT_PRICE
                    or price.as_tuple().exponent < -2):
                raise ValueError("invalid quantity or price")
        except (ValueError, InvalidOperation) as exc:
            raise ValueError(f"CSV line {index}: {exc}") from exc
        seen.add(identifier)
        subtotal = price * quantity
        revenue += subtotal
        units += quantity
        orders += 1
        by_month[ordered.strftime("%Y-%m")] += subtotal
        by_category[category] += subtotal
        by_product[product] += subtotal
    return {
        "orders": orders,
        "units_sold": units,
        "revenue": money(revenue),
        "average_order_value": money(revenue / orders) if orders else "0.00",
        "monthly_revenue": {key: money(value) for key, value in sorted(by_month.items())},
        "category_revenue": {key: money(value) for key, value in sorted(by_category.items())},
        "product_revenue": {key: money(value) for key, value in sorted(by_product.items())},
    }


def render_html(report):
    categories = report["category_revenue"]
    max_value = max((Decimal(value) for value in categories.values()), default=Decimal("0"))
    bars = "".join(
        f'<div class="bar-row"><div class="bar-heading"><strong>{escape(name)}</strong>'
        f'<span>$ {escape(value)}</span></div>'
        f'<div class="track" aria-hidden="true"><div class="fill" style="width:'
        f'{(Decimal(value) / max_value * 100) if max_value else 0:.1f}%"></div></div>'
        f'</div>'
        for name, value in categories.items()
    )
    rows = "".join(
        f'<tr><td>{escape(month)}</td><td>$ {escape(value)}</td></tr>'
        for month, value in report["monthly_revenue"].items()
    )
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sales Intelligence — Demo Report</title>
<style>
body{{font:16px/1.5 system-ui,sans-serif;background:#f3f6fb;color:#18243a;margin:0;padding:clamp(1rem,3vw,2rem);overflow-wrap:break-word}}
main{{max-width:56rem;margin:auto;min-width:0}}.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:1rem}}
.card,section{{background:white;border-radius:14px;padding:1.3rem;margin:1rem 0;box-shadow:0 3px 15px #19315a0a}}
 .card b{{font-size:1.45rem;display:block}}.bar-row{{margin:1rem 0;min-width:0}}.bar-heading{{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.25rem 1rem;margin-bottom:.4rem}}.bar-heading strong{{min-width:0;overflow-wrap:anywhere}}.bar-heading span{{white-space:nowrap;font-variant-numeric:tabular-nums}}
.track{{background:#e4eaf6;border-radius:20px;overflow:hidden;height:16px}}.fill{{background:#476ef0;height:100%}}
table{{border-collapse:collapse;width:100%;overflow-wrap:anywhere}}td,th{{text-align:left;padding:12px;border-bottom:1px solid #e5e7eb}}
small{{color:#526078}}.note{{font-size:.9rem;color:#526078}}@media print{{body{{background:white}}.card,section{{box-shadow:none;border:1px solid #ccc}}.track{{border:1px solid #777}}.fill{{background:#555}}}}
</style></head><body><main><h1>Sales Intelligence</h1>
<p class="note">Fictional CSV sample · generated offline · not live sales data.</p>
<div class="cards">
<div class="card">Total revenue<b>$ {escape(report["revenue"])}</b></div>
<div class="card">Orders<b>{report["orders"]}</b></div>
<div class="card">Units sold<b>{report["units_sold"]}</b></div>
<div class="card">Average order<b>$ {escape(report["average_order_value"])}</b></div>
</div><section><h2>Revenue by category</h2>{bars or "<p>No sales records in this report.</p>"}</section>
<section><h2>Monthly revenue</h2><table><caption>Revenue by month</caption><thead><tr><th>Month</th><th>Revenue</th></tr></thead>
<tbody>{rows or '<tr><td colspan="2">No sales records in this report.</td></tr>'}</tbody></table></section><p class="note">Each CSV row is treated as one unique completed sale. Returns, discounts, shipping, taxes and currency conversion are not included.</p></main></body></html>"""


def process(source: Path, report_path: Path, html_path: Path,
            expected_sha256: str | None = None,
            expected_orders: int | None = None,
            expected_revenue: str | None = None):
    """Use trusted independent checksums/totals to detect upstream tampering.

    None of these values authenticate a source if supplied by the same
    untrusted party who supplies the CSV.
    """
    paths = [source.resolve(), report_path.resolve(), html_path.resolve()]
    if len(set(paths)) != 3:
        raise ValueError("input and output paths must be different")
    if (report_path.exists() or report_path.is_symlink()
            or html_path.exists() or html_path.is_symlink()):
        raise FileExistsError("report output already exists; choose new output paths")
    with source.open("rb") as stream:
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("CSV input exceeds 5 MB limit")
    digest = hashlib.sha256(raw).hexdigest()
    if expected_sha256 is not None:
        if not re.fullmatch(r"[a-fA-F0-9]{64}", expected_sha256):
            raise ValueError("expected SHA-256 must be 64 hex characters")
        if not hmac.compare_digest(digest, expected_sha256.lower()):
            raise ValueError("sales input SHA-256 mismatch")
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
    if not reader.fieldnames:
        raise ValueError("CSV header is required")
    if len(reader.fieldnames) != len(set(reader.fieldnames)):
        raise ValueError("duplicate CSV header fields are not allowed")
    if set(reader.fieldnames) != REQUIRED:
        raise ValueError(f"CSV header must contain exactly: {', '.join(sorted(REQUIRED))}")
    result = analyze(reader)
    if expected_orders is not None and result["orders"] != expected_orders:
        raise ValueError("sales order count does not match trusted reconciliation")
    if expected_revenue is not None:
        try:
            agreed = Decimal(expected_revenue)
            if not agreed.is_finite() or agreed < 0 or money(agreed) != result["revenue"]:
                raise ValueError("sales revenue does not match trusted reconciliation")
        except InvalidOperation as exc:
            raise ValueError("invalid trusted revenue amount") from exc
    result["input_sha256"] = digest
    report_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation prevents clobbering prior reports or following symlinks.
    # Prepare both payloads before creating either output. A failed second
    # write must not leave a misleading half-published report pair.
    json_payload = json.dumps(result, indent=2, ensure_ascii=False)
    html_payload = render_html(result)
    created = []
    try:
        with report_path.open("x", encoding="utf-8") as stream:
            created.append((report_path, os.fstat(stream.fileno())))
            stream.write(json_payload)
        with html_path.open("x", encoding="utf-8") as stream:
            created.append((html_path, os.fstat(stream.fileno())))
            stream.write(html_payload)
    except OSError:
        # Preserve the original I/O failure if cleanup itself fails.
        # Check inode identity before cleanup: a concurrent replacement must
        # not be mistaken for our output. This remains best-effort because a
        # hostile writer could race between stat and unlink; use trusted dirs.
        for path, original in reversed(created):
            try:
                current = path.lstat()
                if (current.st_dev, current.st_ino) == (original.st_dev, original.st_ino):
                    path.unlink()
            except FileNotFoundError:
                pass
            except OSError:
                pass  # Preserve the original failure; manual cleanup may be needed.
        raise
    return result


def main():
    parser = argparse.ArgumentParser(description="Offline sales dashboard generator")
    parser.add_argument("source", type=Path)
    parser.add_argument("--json", type=Path, default=Path("report.json"))
    parser.add_argument("--html", type=Path, default=Path("dashboard.html"))
    parser.add_argument("--expected-sha256", help="Input hash from an independent trusted channel")
    parser.add_argument("--expected-orders", type=int, help="Order count from an independent source")
    parser.add_argument("--expected-revenue", help="Revenue from an independent source")
    args = parser.parse_args()
    report = process(args.source, args.json, args.html,
                     args.expected_sha256, args.expected_orders, args.expected_revenue)
    print(f"Orders: {report['orders']} | Revenue: $ {report['revenue']}")


if __name__ == "__main__":
    main()
