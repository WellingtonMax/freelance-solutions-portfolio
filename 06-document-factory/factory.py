"""Generate a safe, print-friendly HTML quotation from bounded synthetic JSON."""
import argparse
import html
import json
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path

MAX_BYTES = 150_000
MAX_ITEMS = 100
MONEY = re.compile(r"(?:0|[1-9][0-9]{0,7})\.[0-9]{2}\Z")
DATE = re.compile(r"20[0-9]{2}-[01][0-9]-[0-3][0-9]\Z")


def field(value, limit):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError("text field missing, wrong type or oversized")
    if any(ord(c) < 32 for c in value):
        raise ValueError("control characters not accepted")
    return value.strip()


def unique_object_pairs(pairs):
    """Reject duplicate JSON keys, including in nested item objects."""
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result


def parse_document(raw):
    if len(raw) > MAX_BYTES:
        raise ValueError("JSON exceeds 150 KB")
    try:
        obj = json.loads(raw.decode("utf-8"), object_pairs_hook=unique_object_pairs)
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError("invalid UTF-8 JSON") from exc
    if not isinstance(obj, dict) or set(obj) != {"quote_id", "customer", "date", "items"}:
        raise ValueError("unexpected document schema")
    quote_id = field(obj["quote_id"], 40)
    customer = field(obj["customer"], 120)
    date = field(obj["date"], 10)
    if not DATE.fullmatch(date):
        raise ValueError("date must be ISO-like yyyy-mm-dd")
    from datetime import date as Date
    try:
        Date.fromisoformat(date)
    except ValueError as exc:
        raise ValueError("impossible date") from exc
    items = obj["items"]
    if not isinstance(items, list) or not 1 <= len(items) <= MAX_ITEMS:
        raise ValueError("items must contain 1–100 entries")
    parsed = []
    total = Decimal("0.00")
    for item in items:
        if not isinstance(item, dict) or set(item) != {"description", "quantity", "unit_price"}:
            raise ValueError("unexpected item schema")
        description = field(item["description"], 160)
        quantity = item["quantity"]
        if isinstance(quantity, bool) or not isinstance(quantity, int) or not 1 <= quantity <= 1000:
            raise ValueError("invalid quantity")
        price = item["unit_price"]
        if not isinstance(price, str) or not MONEY.fullmatch(price):
            raise ValueError("price must be a decimal string with two places")
        try:
            subtotal = Decimal(price) * quantity
        except InvalidOperation as exc:
            raise ValueError("invalid price") from exc
        total += subtotal
        parsed.append((description, quantity, price, f"{subtotal:.2f}"))
    return {"quote_id": quote_id, "customer": customer, "date": date,
            "items": parsed, "total": f"{total:.2f}"}


def render(doc):
    esc = lambda value: html.escape(str(value), quote=True)
    rows = "".join(
        f"<tr><th scope='row'>{esc(name)}</th><td>{qty}</td><td>{price}</td><td>{subtotal}</td></tr>"
        for name, qty, price, subtotal in doc["items"]
    )
    return ("<!doctype html><html lang='en'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width, initial-scale=1'>"
            "<meta http-equiv='Content-Security-Policy' content=\"default-src 'none'; base-uri 'none'; form-action 'none'\">"
            "<title>Fictional quotation</title></head><body><main>"
            "<h1>Quotation (fictional demonstration)</h1>"
            f"<p><strong>ID:</strong> {esc(doc['quote_id'])}</p>"
            f"<p><strong>Customer:</strong> {esc(doc['customer'])}</p>"
            f"<p><strong>Date:</strong> {esc(doc['date'])}</p>"
            "<table><caption>Quoted items — sample values only</caption><thead><tr>"
            "<th scope='col'>Item</th><th scope='col'>Qty</th><th scope='col'>Unit</th><th scope='col'>Subtotal</th>"
            f"</tr></thead><tbody>{rows}</tbody></table><p><strong>Total:</strong> {esc(doc['total'])}</p>"
            "<footer>Fictional demonstration / AI-assisted development / human review required."
            " Not an invoice or payment request.</footer></main></body></html>\n")


def main():
    parser = argparse.ArgumentParser(description="Offline document generation (HTML only)")
    parser.add_argument("input_json", type=Path)
    parser.add_argument("output_html", type=Path)
    args = parser.parse_args()
    if args.input_json.stat().st_size > MAX_BYTES:
        parser.error("JSON exceeds 150 KB")
    doc = parse_document(args.input_json.read_bytes())
    # Exclusive create; refuses overwrites and existing symlinks.
    with args.output_html.open("x", encoding="utf-8") as handle:
        handle.write(render(doc))


if __name__ == "__main__":
    main()
