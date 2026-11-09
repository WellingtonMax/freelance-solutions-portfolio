"""Adversarial filesystem tests for atomic API Bridge publication.

Fictional demonstration / AI-assisted development / human review.
These tests use only local temporary files and do not make network requests.
"""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from bridge import export_rows


class AtomicPublicationFailureTests(unittest.TestCase):
    def test_hardlink_failure_removes_staging_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "export.csv"
            with patch("bridge.os.link", side_effect=OSError("synthetic filesystem failure")):
                with self.assertRaisesRegex(OSError, "synthetic filesystem failure"):
                    export_rows([{"id": 1}], ["id"], target)
            self.assertFalse(target.exists())
            self.assertEqual(list(Path(directory).iterdir()), [])

    def test_fsync_failure_removes_staging_file(self):
        # A write may succeed but durability synchronization may fail.
        # The unpublished staging file must not survive that failure.
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "export.csv"
            with patch("bridge.os.fsync", side_effect=OSError("synthetic sync failure")):
                with self.assertRaisesRegex(OSError, "synthetic sync failure"):
                    export_rows([{"id": 1}], ["id"], target)
            self.assertFalse(target.exists())
            self.assertEqual(list(root.iterdir()), [])

    def test_existing_symlink_is_not_replaced(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            protected = root / "protected.txt"
            protected.write_text("do not overwrite", encoding="utf-8")
            target = root / "export.csv"
            try:
                target.symlink_to(protected)
            except (OSError, NotImplementedError):
                self.skipTest("Symlinks unavailable in this test environment")
            with self.assertRaises(FileExistsError):
                export_rows([{"id": 1}], ["id"], target)
            self.assertTrue(target.is_symlink())
            self.assertEqual(protected.read_text(encoding="utf-8"), "do not overwrite")
            self.assertEqual(set(root.iterdir()), {protected, target})


if __name__ == "__main__":
    unittest.main()
