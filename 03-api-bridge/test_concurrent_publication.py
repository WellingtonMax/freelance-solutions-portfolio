"""Concurrent publication regression for the offline API Bridge demo.

Fictional demonstration / AI-assisted development / human review required.
Runs only against a local temporary directory; no network or real customer data.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import threading
import unittest

from bridge import export_rows


class ConcurrentPublicationTests(unittest.TestCase):
    def test_two_writers_cannot_overwrite_one_another(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            destination = root / "export.csv"
            gate = threading.Barrier(2, timeout=5)

            def publish(value):
                gate.wait()
                try:
                    export_rows([{"id": value}], ["id"], destination)
                except FileExistsError:
                    return "collision"
                return "published"

            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(publish, ("first", "second")))

            self.assertCountEqual(results, ["published", "collision"])
            self.assertIn(destination.read_text(encoding="utf-8"),
                          ("id\nfirst\n", "id\nsecond\n", "id\r\nfirst\r\n", "id\r\nsecond\r\n"))
            self.assertEqual(list(root.iterdir()), [destination])


if __name__ == "__main__":
    unittest.main()
