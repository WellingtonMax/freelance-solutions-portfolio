import unittest
import tempfile
from pathlib import Path
from compare import compare, blocks, MAX_BYTES, read_snapshot


class OfflineMonitorTests(unittest.TestCase):
    def test_meaningful_visible_change(self):
        a = b"<html><body><h1>Open positions</h1><p>Two openings</p></body></html>"
        b = b"<html><body><h1>Open positions</h1><p>Three openings</p></body></html>"
        result = compare(a, b)
        self.assertTrue(result["changed"])
        self.assertEqual(result["first_10_changes"][0]["type"], "replace")

    def test_title_and_svg_metadata_not_counted_as_visible_body(self):
        before = b"<html><head><title>Old</title></head><body><p>Same</p><svg><text>old</text></svg></body></html>"
        after = b"<html><head><title>New</title></head><body><p>Same</p><svg><text>new</text></svg></body></html>"
        self.assertFalse(compare(before, after)["changed"])

    def test_script_changes_are_not_visible(self):
        a = b"<p>Hi</p><script>alert(1)</script>"
        b = b"<p>Hi</p><script>malicious()</script>"
        result = compare(a, b)
        self.assertFalse(result["changed"])
        self.assertNotEqual(result["before_sha256"], result["after_sha256"])

    def test_mismatched_hidden_closing_tag_does_not_expose_script(self):
        before = b"<p>Safe</p><script>secret</style>hidden</script><p>Visible</p>"
        after = b"<p>Safe</p><script>other</style>hidden</script><p>Visible</p>"
        self.assertFalse(compare(before, after)["changed"])

    def test_whitespace_normalization(self):
        self.assertFalse(compare(b"<p>Hello  world</p>", b"<p>Hello world</p>")["changed"])

    def test_oversize_and_invalid_encoding(self):
        with self.assertRaisesRegex(ValueError, "256 KB"):
            blocks(b"x" * (MAX_BYTES + 1))
        with self.assertRaises(ValueError):
            blocks(b"\xff\xfe")

    def test_blocks_limit_prevents_unbounded_diff(self):
        with self.assertRaisesRegex(ValueError, "complexity"):
            blocks(b"<p>x</p>" * 501)

    def test_change_list_truncation_counts_changes_not_equal_blocks(self):
        a = "".join(f"<p>old{i}</p><p>stable{i}</p>" for i in range(12)).encode()
        b = "".join(f"<p>new{i}</p><p>stable{i}</p>" for i in range(12)).encode()
        result = compare(a, b)
        self.assertEqual(len(result["first_10_changes"]), 10)
        self.assertTrue(result["truncated_change_list"])

    def test_fewer_changes_not_reported_truncated(self):
        a = "".join(f"<p>old{i}</p><p>stable{i}</p>" for i in range(8)).encode()
        b = "".join(f"<p>new{i}</p><p>stable{i}</p>" for i in range(8)).encode()
        self.assertFalse(compare(a, b)["truncated_change_list"])

    def test_file_read_limit_applies_even_without_stat_precheck(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "oversized.html"
            path.write_bytes(b"x" * (MAX_BYTES + 1))
            with self.assertRaisesRegex(ValueError, "256 KB"):
                read_snapshot(path)
            path.write_bytes(b"<p>ok</p>")
            self.assertEqual(read_snapshot(path), b"<p>ok</p>")

    def test_rejects_directory_and_symlink_snapshots(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises((OSError, ValueError)):
                read_snapshot(root)
            target = root / "target.html"
            target.write_bytes(b"<p>ok</p>")
            link = root / "link.html"
            try:
                link.symlink_to(target)
            except (OSError, NotImplementedError):
                self.skipTest("symlinks unavailable")
            if hasattr(__import__("os"), "O_NOFOLLOW"):
                with self.assertRaises((OSError, ValueError)):
                    read_snapshot(link)

    def test_fifo_is_rejected_without_blocking(self):
        import os
        import subprocess
        import sys
        if not hasattr(os, "mkfifo") or not hasattr(os, "O_NONBLOCK"):
            self.skipTest("nonblocking FIFOs unavailable")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fifo = root / "snapshot.fifo"
            os.mkfifo(fifo)
            valid = root / "valid.html"
            valid.write_bytes(b"<p>ok</p>")
            result = subprocess.run(
                [sys.executable, str(Path(__file__).with_name("compare.py")), str(fifo), str(valid)],
                capture_output=True, text=True, timeout=5, check=False,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("regular file", result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertEqual(result.stdout, "")

    def test_cli_invalid_snapshot_returns_controlled_error(self):
        import subprocess
        import sys
        with tempfile.TemporaryDirectory() as directory:
            before = Path(directory) / "before.html"
            after = Path(directory) / "after.html"
            before.write_bytes(b"<p>valid</p>")
            after.write_bytes(bytes([255]))
            result = subprocess.run(
                [sys.executable, str(Path(__file__).with_name("compare.py")), str(before), str(after)],
                capture_output=True, text=True, timeout=5, check=False,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("snapshot must be UTF-8", result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertEqual(result.stdout, "")

    def test_cli_excessive_visible_blocks_returns_controlled_error(self):
        import subprocess
        import sys
        with tempfile.TemporaryDirectory() as directory:
            before = Path(directory) / "before.html"
            after = Path(directory) / "after.html"
            before.write_bytes(b"<p>valid</p>")
            after.write_bytes(b"<p>x</p>" * 501)
            result = subprocess.run(
                [sys.executable, str(Path(__file__).with_name("compare.py")), str(before), str(after)],
                capture_output=True, text=True, timeout=5, check=False,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("complexity limit", result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertEqual(result.stdout, "")

    def test_no_network_or_html_execution(self):
        result = compare(b"<a href='https://example.com'>Read more</a>", b"<a href='https://evil.example'>Read more</a>")
        self.assertFalse(result["changed"])  # Only the rendered text is compared.
        self.assertEqual(result["first_10_changes"], [])


if __name__ == "__main__":
    unittest.main()
