"""Fault-injection and adversarial regression tests for Excel Rescue exports."""
from pathlib import Path
from unittest.mock import patch
import tempfile
import unittest

from clean import normalize, process


SAMPLE = "name,email,signup_date,city\nAlice,alice@example.com,2026-11-05,Brasilia\n"


class ExportRecoveryTests(unittest.TestCase):
    def test_second_output_open_failure_rolls_back_first(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source, output, rejects = (root / name for name in ("source.csv", "clean.csv", "rejected.csv"))
            source.write_text(SAMPLE, encoding="utf-8")
            original_open = Path.open

            def failing_open(path, *args, **kwargs):
                if path == rejects and args and args[0] == "x":
                    raise PermissionError("synthetic failure")
                return original_open(path, *args, **kwargs)

            with patch.object(Path, "open", autospec=True, side_effect=failing_open):
                with self.assertRaisesRegex(PermissionError, "synthetic failure"):
                    process(source, output, rejects)
            self.assertFalse(output.exists(), "first output should be rolled back")
            self.assertFalse(rejects.exists())

    def test_preexisting_reject_file_is_not_removed(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source, output, rejects = (root / name for name in ("source.csv", "clean.csv", "rejected.csv"))
            source.write_text(SAMPLE, encoding="utf-8")
            rejects.write_text("keep", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                process(source, output, rejects)
            self.assertEqual(rejects.read_text(encoding="utf-8"), "keep")
            self.assertFalse(output.exists())

    def test_unicode_obfuscated_formula_email_rejected(self):
        for email in ("\ufeff =SUM(1)@example.org", "\u200b\t+abc@example.org"):
            with self.subTest(email=repr(email)):
                with self.assertRaisesRegex(ValueError, "unsafe email prefix"):
                    normalize({"name": "Alice", "email": email})


if __name__ == "__main__":
    unittest.main()
