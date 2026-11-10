import unittest
import os
import tempfile
from pathlib import Path
from audit import read_input
from audit import audit, MAX_BYTES

HEADER = "record_id,category,amount,updated_at\n"


class AuditTests(unittest.TestCase):
    def test_bounded_regular_file_read(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.csv"
            payload = (HEADER + "A001,Parts,10.00,2026-11-05\\n").encode()
            path.write_bytes(payload)
            self.assertEqual(read_input(path), payload)
            path.write_bytes(b"x" * (MAX_BYTES + 1))
            with self.assertRaisesRegex(ValueError, "1 MB"):
                read_input(path)

    def test_reject_directory_and_final_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaisesRegex(ValueError, "regular file"):
                read_input(root)
            target = root / "target.csv"
            target.write_bytes(HEADER.encode())
            link = root / "link.csv"
            try:
                link.symlink_to(target)
            except (OSError, NotImplementedError):
                self.skipTest("symlink creation unavailable")
            if hasattr(os, "O_NOFOLLOW"):
                with self.assertRaises(OSError):
                    read_input(link)

    def test_clean_data(self):
        data = HEADER + "A001,Hardware,120.00,2026-11-05\n"
        result = audit(data.encode())
        self.assertEqual(result["rows"], 1)
        self.assertEqual(result["issues"], [])

    def test_duplicate_and_invalid_data(self):
        data = HEADER + (
            "A001,Hardware,12.00,2026-11-05\n"
            "A001,Hardware,INVALID,2026-02-31\n"
            "A003,,3.50,2026-11-05\n")
        codes = [i["code"] for i in audit(data.encode())["issues"]]
        self.assertIn("DUPLICATE_ID", codes)
        self.assertIn("INVALID_AMOUNT", codes)
        self.assertIn("INVALID_DATE", codes)
        self.assertIn("INVALID_CATEGORY", codes)

    def test_high_outlier_is_explainable_heuristic(self):
        rows = [f"R{x},Parts,{v}.00,2026-11-05" for x, v in enumerate([10, 10, 10, 10, 1000])]
        result = audit((HEADER + "\n".join(rows) + "\n").encode())
        self.assertIn("HIGH_AMOUNT_OUTLIER", [i["code"] for i in result["issues"]])

    def test_bad_date_amount_does_not_poison_median(self):
        good = [f"R{i},Parts,10.00,2026-11-05" for i in range(5)]
        bad = "INVALID,Parts,999999.00,2026-02-31"
        result = audit((HEADER + "\n".join(good + [bad]) + "\n").encode())
        codes = [issue["code"] for issue in result["issues"]]
        self.assertIn("INVALID_DATE", codes)
        self.assertNotIn("HIGH_AMOUNT_OUTLIER", codes)

    def test_formula_id_rejected_and_no_raw_value_echoed(self):
        data = HEADER + "=HYPERLINK,Parts,20.00,2026-11-05\n"
        result = audit(data.encode())
        self.assertEqual(result["issues"][0]["code"], "INVALID_ID")
        self.assertNotIn("HYPERLINK", str(result))

    def test_bad_headers_and_invalid_encoding(self):
        with self.assertRaises(ValueError):
            audit(b"record_id,amount\n")
        with self.assertRaises(ValueError):
            audit(b"\xff\xfe")

    def test_size_limit_and_csv_errors(self):
        with self.assertRaisesRegex(ValueError, "1 MB"):
            audit(b"x" * (MAX_BYTES + 1))
        with self.assertRaises(ValueError):
            audit((HEADER + '"unclosed,Parts,12.00,2026-11-05\n').encode())


if __name__ == "__main__":
    unittest.main()
