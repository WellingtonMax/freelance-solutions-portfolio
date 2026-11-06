"""Adversarial regression tests: only synthetic data; never external systems."""
import csv
from pathlib import Path
import tempfile
import unittest

from clean import process, safe_cell


class RedTeamCSVTests(unittest.TestCase):
    def test_unicode_format_character_followed_by_whitespace_cannot_bypass_formula_escape(self):
        # A format character before whitespace was not detected by the older lstrip logic.
        samples = ("\ufeff =SUM(1)", "\u200b\t=HYPERLINK(1)",
                   "\u2060\n@cmd", "\ufeff\u200b +123")
        for sample in samples:
            with self.subTest(value=repr(sample)):
                escaped = safe_cell(sample)
                self.assertTrue(
                    escaped.startswith("'"), "Formula-like input escaped without leading apostrophe"
                )

    def test_duplicate_csv_headers_are_rejected_instead_of_silently_overwriting(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source.csv"
            source.write_text(
                "name,email,email,signup_date,city\n"
                "Alice,real@example.com,poison@example.net,2026-11-05,Brasilia\n",
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "duplicate"):
                process(source, root / "clean.csv", root / "rejected.csv")

    def test_extra_fields_in_row_are_not_accepted(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source.csv"
            source.write_text(
                "name,email,signup_date,city\n"
                "Alice,a@example.com,2026-11-05,Brasilia,unexpected\n",
                encoding="utf-8",
            )
            good, bad = process(source, root / "clean.csv", root / "rejected.csv")
            self.assertEqual((good, bad), (0, 1))


if __name__ == "__main__":
    unittest.main()
