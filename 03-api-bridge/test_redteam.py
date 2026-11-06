"""Adversarial CSV output tests for API exporter; synthetic inputs only."""
import unittest
from bridge import safe_csv, validate_url


class RedTeamAPITests(unittest.TestCase):
    def test_escaping_cannot_be_bypassed_by_hidden_format_and_whitespace(self):
        payloads = ("\ufeff =SUM(1)", "\u200b\t=HYPERLINK(1)",
                    "\u2060\n@cmd", "\ufeff\u200b +123")
        for payload in payloads:
            with self.subTest(payload=repr(payload)):
                self.assertTrue(
                    safe_csv(payload).startswith("'"),
                    "Potential spreadsheet formula was not prefixed with apostrophe",
                )

    def test_reject_hostname_with_empty_dns_label(self):
        with self.assertRaises(ValueError):
            validate_url("https://api..example.org/data", {"api..example.org"})


if __name__ == "__main__":
    unittest.main()
