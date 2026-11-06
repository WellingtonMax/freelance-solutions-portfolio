import csv
import hashlib
from decimal import Decimal
from html import escape
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from report import analyze, render_html, process

SAMPLE = """order_id,date,product,category,quantity,unit_price
1001,2026-11-01,Notebook,Office,2,12.50
1002,2026-11-02,Pencil,Office,10,1.00
1003,2026-10-21,Flask,Home,1,25.00
"""


class ReportTests(unittest.TestCase):
    def rows(self, text=SAMPLE):
        return list(csv.DictReader(io.StringIO(text)))

    def test_correct_kpis(self):
        result = analyze(self.rows())
        self.assertEqual(result["orders"], 3)
        self.assertEqual(result["units_sold"], 13)
        self.assertEqual(result["revenue"], "60.00")
        self.assertEqual(result["average_order_value"], "20.00")
        self.assertEqual(result["category_revenue"]["Office"], "35.00")

    def test_reject_duplicate(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            analyze(self.rows() + self.rows()[:1])

    def test_reject_negative_price(self):
        rows = self.rows()
        rows[0]["unit_price"] = "-10"
        with self.assertRaisesRegex(ValueError, "invalid"):
            analyze(rows)

    def test_html_escapes_untrusted_labels(self):
        result = analyze(self.rows())
        result["category_revenue"] = {"<script>alert(1)</script>": "50.00"}
        page = render_html(result)
        self.assertIn("&lt;script&gt;", page)
        self.assertNotIn("<script>", page)

    def test_reject_extreme_or_overprecise_values(self):
        for field, value in (("quantity", "100001"), ("unit_price", "100000001"),
                             ("unit_price", "1.001"), ("unit_price", "NaN")):
            rows = self.rows()
            rows[0][field] = value
            with self.subTest(field=field, value=value):
                with self.assertRaises(ValueError):
                    analyze(rows)

    def test_reject_oversized_input(self):
        from report import MAX_BYTES
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "source.csv").write_bytes(b"x" * (MAX_BYTES + 1))
            with self.assertRaisesRegex(ValueError, "5 MB"):
                process(root / "source.csv", root / "out.json", root / "out.html")
            self.assertFalse((root / "out.json").exists())

    def test_trusted_checksum_and_reconciliation(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source.csv"
            raw = SAMPLE.encode("utf-8")
            source.write_bytes(raw)
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
                process(source, root / "out.json", root / "out.html",
                        expected_sha256="0" * 64)
            self.assertFalse((root / "out.json").exists())
            with self.assertRaisesRegex(ValueError, "trusted reconciliation"):
                process(source, root / "out.json", root / "out.html",
                        expected_orders=999)
            self.assertFalse((root / "out.json").exists())
            with self.assertRaisesRegex(ValueError, "revenue does not match"):
                process(source, root / "out.json", root / "out.html",
                        expected_revenue="1.00")
            result = process(source, root / "out.json", root / "out.html",
                             expected_sha256=hashlib.sha256(raw).hexdigest(),
                             expected_orders=3, expected_revenue="60.00")
            self.assertEqual(result["input_sha256"], hashlib.sha256(raw).hexdigest())

    def test_reject_existing_report(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "source.csv").write_text(SAMPLE, encoding="utf-8")
            (root / "out.json").write_text("previous", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                process(root / "source.csv", root / "out.json", root / "out.html")
            self.assertEqual((root / "out.json").read_text(), "previous")

    def test_second_export_failure_rolls_back_first(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source.csv"
            output_json = root / "out.json"
            output_html = root / "out.html"
            source.write_text(SAMPLE, encoding="utf-8")
            original_open = Path.open

            def fail_second(path, *args, **kwargs):
                if path == output_html and args and args[0] == "x":
                    raise PermissionError("simulated denied HTML export")
                return original_open(path, *args, **kwargs)

            with patch.object(Path, "open", autospec=True, side_effect=fail_second):
                with self.assertRaisesRegex(PermissionError, "simulated"):
                    process(source, output_json, output_html)
            self.assertFalse(output_json.exists())
            self.assertFalse(output_html.exists())

    def test_failed_export_preserves_unrelated_files(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source.csv"
            source.write_text(SAMPLE, encoding="utf-8")
            keep = root / "keep.txt"
            keep.write_text("do not delete", encoding="utf-8")
            output_html = root / "out.html"
            original_open = Path.open

            def fail_second(path, *args, **kwargs):
                if path == output_html and args and args[0] == "x":
                    raise PermissionError("simulated")
                return original_open(path, *args, **kwargs)

            with patch.object(Path, "open", autospec=True, side_effect=fail_second):
                with self.assertRaises(PermissionError):
                    process(source, root / "out.json", output_html)
            self.assertEqual(keep.read_text(encoding="utf-8"), "do not delete")

    def test_cleanup_failure_preserves_original_error(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source.csv"
            output_json = root / "out.json"
            output_html = root / "out.html"
            source.write_text(SAMPLE, encoding="utf-8")
            original_open = Path.open
            original_unlink = Path.unlink

            def fail_second(path, *args, **kwargs):
                if path == output_html and args and args[0] == "x":
                    raise PermissionError("original HTML failure")
                return original_open(path, *args, **kwargs)

            def fail_cleanup(path, *args, **kwargs):
                if path == output_json:
                    raise PermissionError("cleanup denied")
                return original_unlink(path, *args, **kwargs)

            with (patch.object(Path, "open", autospec=True, side_effect=fail_second),
                  patch.object(Path, "unlink", autospec=True, side_effect=fail_cleanup)):
                with self.assertRaisesRegex(PermissionError, "original HTML failure"):
                    process(source, output_json, output_html)
            # Best-effort rollback cannot guarantee removal if the filesystem denies it.
            self.assertTrue(output_json.exists())

    def test_pipeline(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "source.csv").write_text(SAMPLE, encoding="utf-8")
            result = process(root / "source.csv", root / "out.json", root / "out.html")
            self.assertEqual(result["revenue"], "60.00")
            self.assertTrue((root / "out.html").read_text().startswith("<!doctype html>"))


if __name__ == "__main__":
    unittest.main()
