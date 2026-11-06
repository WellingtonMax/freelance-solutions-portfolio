import unittest
from compare import compare, blocks, MAX_BYTES


class OfflineMonitorTests(unittest.TestCase):
    def test_meaningful_visible_change(self):
        a = b"<html><body><h1>Open positions</h1><p>Two openings</p></body></html>"
        b = b"<html><body><h1>Open positions</h1><p>Three openings</p></body></html>"
        result = compare(a, b)
        self.assertTrue(result["changed"])
        self.assertEqual(result["first_10_changes"][0]["type"], "replace")

    def test_script_changes_are_not_visible(self):
        a = b"<p>Hi</p><script>alert(1)</script>"
        b = b"<p>Hi</p><script>malicious()</script>"
        result = compare(a, b)
        self.assertFalse(result["changed"])
        self.assertNotEqual(result["before_sha256"], result["after_sha256"])

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

    def test_no_network_or_html_execution(self):
        result = compare(b"<a href='https://example.com'>Read more</a>", b"<a href='https://evil.example'>Read more</a>")
        self.assertFalse(result["changed"])  # Only the rendered text is compared.
        self.assertEqual(result["first_10_changes"], [])


if __name__ == "__main__":
    unittest.main()
