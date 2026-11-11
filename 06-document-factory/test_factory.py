import json
import tempfile
import unittest
from pathlib import Path
import os
from factory import parse_document, render, read_document, MAX_BYTES

SAMPLE = {"quote_id": "Q-001", "customer": "Demo & Sons", "date": "2026-11-06",
          "items": [{"description": "Workshop table", "quantity": 2, "unit_price": "125.50"}]}


def load(obj):
    return parse_document(json.dumps(obj).encode())


class DocumentFactoryTests(unittest.TestCase):
    def test_total_is_decimal_and_content_escaped(self):
        doc = load(SAMPLE)
        self.assertEqual(doc["total"], "251.00")
        self.assertIn("Demo &amp; Sons", render(doc))
        self.assertIn("default-src 'none'", render(doc))

    def test_markup_is_not_executed(self):
        altered = dict(SAMPLE, customer="<img src=x onerror=alert(1)>")
        page = render(load(altered))
        self.assertNotIn("<img", page)
        self.assertIn("&lt;img", page)

    def test_invalid_price_and_quantity(self):
        for price in ("-1.00", "NaN", "1e10", "1.234"):
            with self.subTest(price=price):
                invalid = dict(SAMPLE, items=[{"description": "X", "quantity": 1, "unit_price": price}])
                with self.assertRaises(ValueError):
                    load(invalid)
        invalid = dict(SAMPLE, items=[{"description": "X", "quantity": True, "unit_price": "1.00"}])
        with self.assertRaises(ValueError):
            load(invalid)

    def test_invalid_dates_and_unknown_fields(self):
        with self.assertRaises(ValueError):
            load(dict(SAMPLE, date="2026-02-31"))
        with self.assertRaises(ValueError):
            load(dict(SAMPLE, unexpected="value"))

    def test_size_limit_and_malformed_bytes(self):
        with self.assertRaises(ValueError):
            parse_document(b"x" * (MAX_BYTES + 1))
        with self.assertRaises(ValueError):
            parse_document(b"{invalid}")

    def test_duplicate_keys_rejected_at_all_levels(self):
        root = b'{"quote_id":"A","quote_id":"B","customer":"X","date":"2026-11-06","items":[]}'
        item = b'{"quote_id":"A","customer":"X","date":"2026-11-06","items":[{"description":"Item","quantity":1,"quantity":999,"unit_price":"2.00"}]}'
        for raw in (root, item):
            with self.subTest(raw=raw):
                with self.assertRaisesRegex(ValueError, "duplicate JSON key"):
                    parse_document(raw)

    def test_bounded_file_read_rejects_oversize_without_consuming_entire_file(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "oversize.json"
            path.write_bytes(b"x" * (MAX_BYTES + 100))
            with self.assertRaisesRegex(ValueError, "150 KB"):
                read_document(path)

    def test_input_reader_rejects_directory_and_final_symlink(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            with self.assertRaisesRegex(ValueError, "regular file"):
                read_document(root)
            target = root / "sample.json"
            target.write_bytes(json.dumps(SAMPLE).encode())
            self.assertEqual(parse_document(read_document(target))["total"], "251.00")
            if hasattr(os, "O_NOFOLLOW"):
                link = root / "link.json"
                try:
                    link.symlink_to(target)
                except (OSError, NotImplementedError):
                    self.skipTest("symlink unavailable")
                with self.assertRaises(OSError):
                    read_document(link)

    def test_existing_file_never_overwritten(self):
        with tempfile.TemporaryDirectory() as td:
            output = Path(td) / "quote.html"
            output.write_text("existing")
            with self.assertRaises(FileExistsError):
                with output.open("x") as handle:
                    handle.write(render(load(SAMPLE)))
            self.assertEqual(output.read_text(), "existing")


if __name__ == "__main__":
    unittest.main()
