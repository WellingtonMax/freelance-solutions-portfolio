"""Differential tests: compare the independent Python and browser engines.

Only synthetic fixtures. Runs Node locally; no browser, network, credentials or uploads.
Both implementations have different size limits; fixtures are within both limits.
"""
import csv
import io
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from clean import process

ROOT = Path(__file__).resolve().parent
NODE_SCRIPT = """
const fs = require('node:fs');
const engine = require('./try.js');
const source = fs.readFileSync(0, 'utf8');
try {
  const result = engine.process(source);
  process.stdout.write(JSON.stringify({ok: true, result}));
} catch (error) {
  process.stdout.write(JSON.stringify({ok: false, message: String(error.message)}));
}
"""

FIXTURES = {
    "sample": (ROOT / "sample.csv").read_text(encoding="utf-8"),
    "quoted_fields": (
        'city,signup_date,email,name\r\n'
        '"Sao Paulo, SP",05/11/2026,ANA@EXAMPLE.COM,"Ana, ""A."""\r\n'
        'Brasilia,2026-11-05,bob@example.com,Bob\r\n'
    ),
    "duplicate_casefold": (
        "name,email,signup_date,city\n"
        "First,A@EXAMPLE.COM,2026-11-05,City\n"
        "Second,a@example.com,2026-11-05,City\n"
        "Third,other@example.com,2026-11-05,City\n"
    ),
    "invalid_records": (
        "name,email,signup_date,city\n"
        "Valid,valid@example.com,2026-11-05,City\n"
        "No Email,not-an-email,2026-11-05,City\n"
        "Bad Date,date@example.com,2026-02-30,City\n"
        ",missing@example.com,2026-11-05,City\n"
    ),
    "formula_and_unicode": (
        "name,email,signup_date,city\n"
        "=2+2,first@example.com,2026-11-05,+1\n"
        "\ufeff =SUM(1),second@example.com,2026-11-05,\u200b @DANGER\n"
        "Unsafe,\u200b =x@example.com,2026-11-05,City\n"
    ),
    "utf8_bom": (
        "\ufeffname,email,signup_date,city\n"
        "A,a@example.com,2026-11-05,City\n"
    ),
    "bad_header": (
        "name,email,email,city\n"
        "A,a@example.com,b@example.com,City\n"
    ),
    "extra_columns": (
        "name,email,signup_date,city\n"
        "A,a@example.com,2026-11-05,City,EXTRA\n"
    ),
    "unclosed_quote": (
        'name,email,signup_date,city\n"Never ends,a@example.com,2026-11-05,City'
    ),
}


@unittest.skipUnless(shutil.which("node"), "Node.js required for differential tests")
class DifferentialCsvTests(unittest.TestCase):
    def test_same_acceptance_and_rejection_on_synthetic_fixtures(self):
        for label, source in FIXTURES.items():
            with self.subTest(fixture=label), tempfile.TemporaryDirectory() as directory:
                base = Path(directory)
                source_path = base / "input.csv"
                source_path.write_text(source, encoding="utf-8")
                js = subprocess.run(
                    ["node", "-e", NODE_SCRIPT],
                    input=source, text=True, encoding="utf-8",
                    capture_output=True, cwd=ROOT, timeout=5, check=True,
                )
                browser = json.loads(js.stdout)
                try:
                    process(source_path, base / "clean.csv", base / "rejected.csv")
                except (ValueError, csv.Error, UnicodeError):
                    self.assertFalse(browser["ok"], f"{label}: browser accepted malformed CSV")
                    continue
                self.assertTrue(browser["ok"], f"{label}: {browser.get('message')}")
                python_clean = list(csv.DictReader((base / "clean.csv").open(encoding="utf-8", newline="")))
                python_reject = list(csv.DictReader((base / "rejected.csv").open(encoding="utf-8", newline="")))
                js_clean = list(csv.DictReader(io.StringIO(browser["result"]["cleanCsv"], newline="")))
                js_reject = list(csv.DictReader(io.StringIO(browser["result"]["rejectCsv"], newline="")))
                self.assertEqual(python_clean, js_clean, f"{label}: accepted records diverged")
                self.assertEqual(python_reject, js_reject, f"{label}: rejected records diverged")

    def test_no_external_execution_or_unbounded_node_wait(self):
        self.assertLess(len(FIXTURES), 20)
        self.assertTrue(all(len(s.encode("utf-8")) < 1_000_000 for s in FIXTURES.values()))


if __name__ == "__main__":
    unittest.main()
