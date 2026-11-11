"""P01-F01 E02: executable contract regression using fictional CSV data only.

These tests cover deterministic outputs, malformed inputs, and no partial writes.
No network, external credentials, or real customer information are involved.
"""
import csv
from pathlib import Path
import tempfile
import unittest

from clean import process


class CsvContractTests(unittest.TestCase):
    def test_documented_fictional_example_exact_outputs(self):
        source_csv = (
            "name,email,signup_date,city\n"
            "Ada Example,ADA@EXAMPLE.COM,05/11/2026,Brasilia\n"
            "Duplicate One,dup@example.com,,Rio\n"
            "Duplicate Two,DUP@example.com,,Rio\n"
            "Unsafe,=HYPERLINK(1)@example.com,,Rio\n"
        )
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "input.csv"
            cleaned = root / "cleaned.csv"
            rejected = root / "rejected.csv"
            source.write_text(source_csv, encoding="utf-8")
            self.assertEqual(process(source, cleaned, rejected), (1, 3))
            with cleaned.open(encoding="utf-8", newline="") as stream:
                self.assertEqual(list(csv.DictReader(stream)), [{
                    "name": "Ada Example", "email": "ada@example.com",
                    "signup_date": "2026-11-05", "city": "Brasilia",
                }])
            with rejected.open(encoding="utf-8", newline="") as stream:
                self.assertEqual(list(csv.DictReader(stream)), [
                    {"line": "3", "reason": "duplicate email (all occurrences rejected)"},
                    {"line": "4", "reason": "duplicate email (all occurrences rejected)"},
                    {"line": "5", "reason": "unsafe email prefix for spreadsheet export"},
                ])

    def test_invalid_utf8_fails_without_outputs(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "invalid.csv"
            source.write_bytes(b"name,email,signup_date,city\n\xff")
            with self.assertRaises(UnicodeDecodeError):
                process(source, root / "cleaned.csv", root / "rejected.csv")
            self.assertFalse((root / "cleaned.csv").exists())
            self.assertFalse((root / "rejected.csv").exists())

    def test_duplicate_headers_fail_without_outputs(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "duplicate-header.csv"
            source.write_text("name,email,email,city\nA,a@example.com,x,Test\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate CSV header"):
                process(source, root / "cleaned.csv", root / "rejected.csv")
            self.assertFalse((root / "cleaned.csv").exists())
            self.assertFalse((root / "rejected.csv").exists())


if __name__ == "__main__":
    unittest.main()
