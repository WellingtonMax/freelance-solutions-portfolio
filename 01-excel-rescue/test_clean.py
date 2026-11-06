import csv
import hashlib
from pathlib import Path
import tempfile
import unittest

from clean import MAX_BYTES, MAX_ROWS, clean_rows, normalize, process, safe_cell


class CleanerTests(unittest.TestCase):
    def test_normalize(self):
        record = normalize({"name": " Alice   Smith ", "email": " ALICE@Example.COM ",
                            "signup_date": "05/11/2026", "city": " Brasilia "})
        self.assertEqual(record["email"], "alice@example.com")
        self.assertEqual(record["signup_date"], "2026-11-05")
        self.assertEqual(record["name"], "Alice Smith")

    def test_rejects_all_duplicates_so_untrusted_first_row_cannot_win(self):
        rows = [
            {"name": "Impostor", "email": "a@test.com", "signup_date": "", "city": ""},
            {"name": "Actual", "email": "A@TEST.COM", "signup_date": "", "city": ""},
            {"name": "B", "email": "invalid", "signup_date": "", "city": ""},
            {"name": "Valid", "email": "valid@test.com", "signup_date": "", "city": ""},
        ]
        good, bad = clean_rows(rows)
        self.assertEqual([x["email"] for x in good], ["valid@test.com"])
        self.assertEqual(len(bad), 3)
        self.assertEqual([x["line"] for x in bad], [2, 3, 4])

    def test_formula_injection(self):
        self.assertEqual(safe_cell(" =HYPERLINK(1)"), "'=HYPERLINK(1)")
        self.assertEqual(safe_cell("-SUM(1)"), "'-SUM(1)")
        self.assertEqual(safe_cell("\ufeff=SUM(1)"), "'\ufeff=SUM(1)")

    def test_rejects_formula_leading_email(self):
        for email in ("=HYPERLINK(1)@example.com", "+malicious@example.com"):
            with self.subTest(email=email):
                with self.assertRaisesRegex(ValueError, "unsafe email prefix"):
                    normalize({"name": "Test", "email": email})

    def test_rejects_output_path_collision(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            source = base / "input.csv"
            source.write_text("name,email,signup_date,city\nA,a@example.com,,City\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "must differ"):
                process(source, base / "same.csv", base / "same.csv")

    def test_rejects_oversized_input_before_any_output(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            source = base / "big.csv"
            source.write_bytes(b"x" * (MAX_BYTES + 1))
            with self.assertRaisesRegex(ValueError, "5 MB"):
                process(source, base / "out.csv", base / "bad.csv")
            self.assertFalse((base / "out.csv").exists())

    def test_rejects_too_many_rows(self):
        row = {"name": "A", "email": "a@example.com", "signup_date": "", "city": ""}
        with self.assertRaisesRegex(ValueError, "row limit"):
            clean_rows(row for _ in range(MAX_ROWS + 1))

    def test_sha256_mismatch_does_not_create_output(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            source = base / "input.csv"
            raw = b"name,email,signup_date,city\nA,a@example.com,,City\n"
            source.write_bytes(raw)
            with self.assertRaisesRegex(ValueError, "mismatch"):
                process(source, base / "out.csv", base / "bad.csv", "0" * 64)
            self.assertFalse((base / "out.csv").exists())
            good, bad = process(source, base / "out.csv", base / "bad.csv",
                                hashlib.sha256(raw).hexdigest())
            self.assertEqual((good, bad), (1, 0))

    def test_reject_existing_outputs(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            source = base / "input.csv"
            source.write_text("name,email,signup_date,city\nA,a@example.com,,City\n", encoding="utf-8")
            (base / "out.csv").write_text("untouched", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                process(source, base / "out.csv", base / "bad.csv")
            self.assertEqual((base / "out.csv").read_text(), "untouched")

    def test_missing_name_and_invalid_date(self):
        with self.assertRaisesRegex(ValueError, "missing name"):
            normalize({"name": "", "email": "a@test.com"})
        with self.assertRaisesRegex(ValueError, "invalid date"):
            normalize({"name": "A", "email": "a@test.com", "signup_date": "12/31/2026"})

    def test_sample_file_pipeline(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            source = base / "input.csv"
            source.write_text("name,email,signup_date,city\nA,a@test.com,2026-11-05,City\n",
                              encoding="utf-8")
            accepted, rejected = process(source, base / "out.csv", base / "bad.csv")
            self.assertEqual((accepted, rejected), (1, 0))
            with (base / "out.csv").open(newline="", encoding="utf-8") as stream:
                self.assertEqual(list(csv.DictReader(stream))[0]["email"], "a@test.com")


if __name__ == "__main__":
    unittest.main()
