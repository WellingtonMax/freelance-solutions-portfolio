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
        self.scroll_regions = []
        self.region_has_table = []
        self.div_stack = []
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
        if tag == "div":
            is_scroll = "scroll" in attrs.get("class", "").split()
            self.div_stack.append(is_scroll)
            if is_scroll:
                self.scroll_regions.append(attrs)
                self.region_has_table.append(False)
        if tag == "table" and self.div_stack and self.div_stack[-1]:
            self.region_has_table[-1] = True

    def handle_endtag(self, tag):
        if tag == "tbody":
            self.in_audit = False
        if tag == "div" and self.div_stack:
            self.div_stack.pop()


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

    def test_wide_audit_table_can_receive_keyboard_focus(self):
        parser = FilterMarkup()
        markup = (ROOT / "demo.html").read_text(encoding="utf-8")
        parser.feed(markup)
        self.assertEqual(len(parser.scroll_regions), 1)
        region = parser.scroll_regions[0]
        self.assertEqual(region.get("role"), "region")
        self.assertEqual(region.get("tabindex"), "0")
        self.assertTrue(region.get("aria-label", "").strip())
        self.assertTrue(parser.region_has_table[0])
        css = (ROOT / "demo.css").read_text(encoding="utf-8")
        self.assertIn(".scroll:focus-visible{outline:", css)

    def test_mobile_filters_wrap_and_scroll_guidance_is_visible(self):
        """Protect narrow-screen discoverability without claiming browser coverage."""
        markup = (ROOT / "demo.html").read_text(encoding="utf-8")
        css = (ROOT / "demo.css").read_text(encoding="utf-8")
        self.assertIn("On narrow screens, scroll the table sideways", markup)
        self.assertIn("@media(max-width:720px){", css)
        mobile_rules = css.split("@media(max-width:720px){", 1)[1]
        self.assertIn(".controls{flex-wrap:wrap;width:100%}", mobile_rules)
        self.assertIn(".controls button{flex:1 1 110px;min-width:0}", mobile_rules)

    def test_small_mobile_metrics_use_two_columns_without_clipping(self):
        """At narrow widths, three KPI columns compete for legible label space."""
        css = (ROOT / "demo.css").read_text(encoding="utf-8")
        self.assertIn("@media(max-width:420px){", css)
        narrow = css.split("@media(max-width:420px){", 1)[1]
        self.assertIn(".metrics{grid-template-columns:repeat(2,minmax(0,1fr))}", narrow)
        self.assertIn(".bar-card{grid-column:1/-1}", narrow)
        self.assertIn(".metric>span{display:block;overflow-wrap:anywhere}", narrow)

    def test_filter_touch_targets_have_minimum_height(self):
        """Guard the CSS touch-target contract; rendered sizes still need browser review."""
        css = (ROOT / "demo.css").read_text(encoding="utf-8")
        self.assertIn(".controls button{min-height:44px;", css)
        self.assertIn(".controls button{flex:1 1 110px;min-width:0}", css)

    def test_filter_logic_updates_pressed_state_rows_and_announcement(self):
        script = (ROOT / "demo.js").read_text(encoding="utf-8")
        self.assertIn('item.setAttribute("aria-pressed"', script)
        self.assertIn("row.hidden =", script)
        self.assertIn("status.textContent =", script)


if __name__ == "__main__":
    unittest.main()
