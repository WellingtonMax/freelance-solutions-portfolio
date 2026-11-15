"""Regression checks for accessible CSV preview markup (P01-F01).

Static semantics only: does not replace keyboard or screen-reader acceptance.
"""
from html.parser import HTMLParser
from pathlib import Path
import unittest


class Elements(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.ids = {}
        self.button_text = {}
        self.active_button = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if tag == "button":
            self.active_button = attrs.get("id")
            if self.active_button:
                self.button_text[self.active_button] = ""
        if "id" in attrs:
            self.ids.setdefault(attrs["id"], []).append((tag, attrs))

    def handle_data(self, data):
        if self.active_button is not None:
            self.button_text[self.active_button] += data

    def handle_endtag(self, tag):
        if tag == "button":
            self.active_button = None

    def one(self, element_id):
        matches = self.ids.get(element_id, [])
        if len(matches) != 1:
            raise AssertionError(f"{element_id}: expected one element, found {len(matches)}")
        return matches[0]


class PreviewAccessibilityMarkupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = Elements()
        cls.page.feed(Path(__file__).with_name("try.html").read_text(encoding="utf-8"))
        cls.page.close()

    def test_all_ids_are_unique(self):
        for element_id, matches in self.page.ids.items():
            with self.subTest(element_id=element_id):
                self.assertEqual(len(matches), 1)

    def test_describedby_targets_exist(self):
        for tag, attrs in self.page.elements:
            if "aria-describedby" in attrs:
                with self.subTest(tag=tag, element_id=attrs.get("id")):
                    for target in attrs["aria-describedby"].split():
                        self.page.one(target)

    def test_csv_outputs_are_labelled_readonly_and_have_fallback_help(self):
        for element_id in ("clean", "reject"):
            with self.subTest(output=element_id):
                tag, attrs = self.page.one(element_id)
                self.assertEqual(tag, "textarea")
                self.assertIn("readonly", attrs)
                self.assertIn("copy-feedback", attrs.get("aria-describedby", "").split())
                labels = [a for t, a in self.page.elements if t == "label" and a.get("for") == element_id]
                self.assertEqual(len(labels), 1)

    def test_feedback_is_announced_and_controls_have_names(self):
        for element_id in ("feedback", "copy-feedback"):
            with self.subTest(status=element_id):
                _, attrs = self.page.one(element_id)
                self.assertEqual(attrs.get("role"), "status")
                self.assertEqual(attrs.get("aria-live"), "polite")
        for element_id in ("sample", "run", "copy-clean", "copy-reject"):
            with self.subTest(control=element_id):
                tag, attrs = self.page.one(element_id)
                self.assertEqual(tag, "button")
                self.assertEqual(attrs.get("type"), "button")
                # A present button element is not necessarily an accessible named control.
                # Reject accidental empty labels, even when markup/IDs remain valid.
                self.assertTrue(
                    self.page.button_text.get(element_id, "").strip() or attrs.get("aria-label", "").strip(),
                    f"{element_id}: button has no accessible name",
                )


if __name__ == "__main__":
    unittest.main()
