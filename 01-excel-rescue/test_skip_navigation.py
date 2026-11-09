"""Regression contract for the keyboard skip link in the offline audit demo."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent


class AuditMarkup(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip_links = []
        self.audit_targets = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and "skip-link" in attrs.get("class", "").split():
            self.skip_links.append(attrs)
        if attrs.get("id") == "audit-title":
            self.audit_targets.append((tag, attrs))


class SkipNavigationContract(unittest.TestCase):
    def test_skip_link_has_one_focusable_audit_target(self):
        parser = AuditMarkup()
        parser.feed((ROOT / "demo.html").read_text(encoding="utf-8"))
        self.assertEqual(len(parser.skip_links), 1)
        self.assertEqual(parser.skip_links[0].get("href"), "#audit-title")
        self.assertEqual(len(parser.audit_targets), 1)
        tag, attrs = parser.audit_targets[0]
        self.assertEqual(tag, "h2")
        self.assertEqual(attrs.get("tabindex"), "-1")

    def test_skip_link_has_visible_keyboard_focus_styles(self):
        css = (ROOT / "demo.css").read_text(encoding="utf-8")
        self.assertIn(".skip-link:focus{", css)
        self.assertIn("#audit-title:focus{", css)
        self.assertIn("outline:", css)


if __name__ == "__main__":
    unittest.main()
