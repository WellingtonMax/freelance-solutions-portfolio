"""Accessible filtering contract for the offline, fictional audit table."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent


class FilterMarkup(HTMLParser):
    def __init__(self):
        super().__init__()
        self.buttons = []
        self.statuses = []
        self.rows = []
        self.in_audit = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "tbody" and attrs.get("id") == "audit":
            self.in_audit = True
        if tag == "button" and "data-view" in attrs:
            self.buttons.append(attrs)
        if tag == "span" and attrs.get("id") == "filter-status":
            self.statuses.append(attrs)
        if tag == "tr" and self.in_audit:
            self.rows.append(attrs)

    def handle_endtag(self, tag):
        if tag == "tbody":
            self.in_audit = False


class AccessibleAuditFilterContract(unittest.TestCase):
    def test_filter_buttons_expose_single_initial_selection(self):
        parser = FilterMarkup()
        parser.feed((ROOT / "demo.html").read_text(encoding="utf-8"))
        self.assertEqual([b.get("data-view") for b in parser.buttons],
                         ["all", "accepted", "rejected"])
        self.assertEqual([b.get("aria-pressed") for b in parser.buttons],
                         ["true", "false", "false"])
        self.assertEqual([r.get("data-status") for r in parser.rows].count("accepted"), 1)
        self.assertEqual([r.get("data-status") for r in parser.rows].count("rejected"), 3)

    def test_filter_status_is_announced_without_stealing_focus(self):
        parser = FilterMarkup()
        parser.feed((ROOT / "demo.html").read_text(encoding="utf-8"))
        self.assertEqual(len(parser.statuses), 1)
        self.assertEqual(parser.statuses[0].get("role"), "status")
        self.assertEqual(parser.statuses[0].get("aria-live"), "polite")

    def test_filter_logic_updates_pressed_state_rows_and_announcement(self):
        script = (ROOT / "demo.js").read_text(encoding="utf-8")
        self.assertIn('item.setAttribute("aria-pressed"', script)
        self.assertIn("row.hidden =", script)
        self.assertIn("status.textContent =", script)


if __name__ == "__main__":
    unittest.main()
