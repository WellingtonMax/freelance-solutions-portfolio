"""Adversarial regression tests for data provenance and strict CSV schemas."""
from pathlib import Path
import tempfile
import unittest

from report import process


class RedTeamSalesTests(unittest.TestCase):
    def test_duplicate_header_cannot_silently_select_attacker_value(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            source = base / "sales.csv"
            source.write_text(
                "order_id,date,product,product,category,quantity,unit_price\n"
                "1001,2026-11-01,Real,Altered,Office,2,10.00\n",
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "duplicate"):
                process(source, base / "report.json", base / "dashboard.html")

    def test_surplus_csv_row_cells_cannot_pass_unnoticed(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            source = base / "sales.csv"
            source.write_text(
                "order_id,date,product,category,quantity,unit_price\n"
                "1001,2026-11-01,Paper,Office,2,10.00,unexpected\n",
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "unexpected|extra|malformed"):
                process(source, base / "report.json", base / "dashboard.html")

    def test_report_output_not_created_after_rejected_input(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            source = base / "sales.csv"
            source.write_text(
                "order_id,date,product,category,quantity,unit_price\n"
                "1001,2026-11-01,Paper,Office,2,10.00,unexpected\n",
                encoding="utf-8",
            )
            try:
                process(source, base / "report.json", base / "dashboard.html")
            except ValueError:
                pass
            self.assertFalse((base / "report.json").exists())
            self.assertFalse((base / "dashboard.html").exists())


if __name__ == "__main__":
    unittest.main()
