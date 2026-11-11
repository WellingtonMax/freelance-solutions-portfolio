"""Regression tests for the offline Sales Intelligence report presentation."""
import unittest
from decimal import Decimal
from html.parser import HTMLParser

from report import render_html


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []

    def handle_data(self, data):
        self.text.append(data)


class CategoryReportUXTests(unittest.TestCase):
    def test_long_hostile_category_is_escaped_and_remains_text(self):
        category = "<script>alert(1)</script>" + "VeryLongCategory" * 20
        html = render_html({
            "category_revenue": {category: "25.50"},
            "monthly_revenue": {"2026-11": "25.50"},
            "revenue": "25.50", "orders": 1, "units_sold": 1,
            "average_order_value": "25.50",
        })
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)
        self.assertIn("overflow-wrap:anywhere", html)
        self.assertIn("aria-hidden=\"true\"", html)
        self.assertIn("$ 25.50", html)
        parsed = VisibleText()
        parsed.feed(html)
        self.assertIn(category, "".join(parsed.text))
        self.assertIn("Revenue by month", html)

    def test_empty_report_explains_absence_of_sales(self):
        html = render_html({
            "category_revenue": {}, "monthly_revenue": {},
            "revenue": "0.00", "orders": 0, "units_sold": 0,
            "average_order_value": "0.00",
        })
        self.assertEqual(html.count("No sales records in this report."), 2)
        self.assertIn("not live sales data", html)
        self.assertIn("Returns, discounts, shipping, taxes", html)
        self.assertNotIn("nan%", html.lower())

    def test_category_amounts_are_text_not_only_bar_width(self):
        html = render_html({
            "category_revenue": {"Small": "1.00", "Large": "10.00"},
            "monthly_revenue": {}, "revenue": "11.00",
            "orders": 2, "units_sold": 2, "average_order_value": "5.50",
        })
        self.assertIn("<span>$ 1.00</span>", html)
        self.assertIn("<span>$ 10.00</span>", html)
        self.assertIn("width:10.0%", html)
        self.assertIn("width:100.0%", html)


if __name__ == "__main__":
    unittest.main()
