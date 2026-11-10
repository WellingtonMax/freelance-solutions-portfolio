"""Optional real-browser acceptance for the offline Excel Rescue audit.

Run from the repository root after installing Playwright and Chromium:
    python -m pip install playwright
    python -m playwright install chromium
    python 01-excel-rescue/check_demo_browser.py

This is an opt-in browser check, not a screen-reader certification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

PAGE = Path(__file__).resolve().parent / "demo.html"


def check(browser, width):
    page = browser.new_page(viewport={"width": width, "height": 800})
    try:
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(PAGE.as_uri())
        page.keyboard.press("Tab")
        skip = page.locator(".skip-link")
        assert skip.evaluate("(el) => el === document.activeElement"), "Skip link is not first focus target"
        assert skip.evaluate("(el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0; }"), "Skip link not visibly revealed"
        page.keyboard.press("Enter")
        assert page.locator("#audit-title").evaluate("(el) => el === document.activeElement"), "Skip destination not focused"
        buttons = page.locator("button[data-view]")
        assert buttons.count() == 3
        for index, count, key in [(1, 1, "Enter"), (2, 3, "Space"), (0, 4, "Enter")]:
            button = buttons.nth(index)
            button.focus()
            page.keyboard.press(key)
            assert button.get_attribute("aria-pressed") == "true"
            assert page.locator("#audit tr:visible").count() == count
            assert page.locator("#audit tr[hidden]").count() == 4 - count
            assert buttons.locator('[aria-pressed="true"]').count() == 1
            assert str(count) in page.locator("#filter-status").inner_text()
            assert button.evaluate("(el) => el.getBoundingClientRect().height") >= 44
        region = page.locator(".scroll")
        region.focus()
        assert region.evaluate("(el) => el === document.activeElement")
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), "Unexpected page-level horizontal overflow"
        assert region.evaluate("(el) => el.scrollWidth > el.clientWidth"), "Audit table should scroll inside its labeled region on narrow screens"
        region.evaluate("(el) => { el.scrollLeft = 0; }")
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(150)
        assert region.evaluate("(el) => el.scrollLeft > 0"), "Focused audit table cannot be scrolled with ArrowRight"
        assert not errors, f"JavaScript errors: {errors}"
        print(f"PASS viewport={width}px; keyboard skip, filters, touch targets, scroll focus")
    finally:
        page.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            for width in (320, 375):
                check(browser, width)
        finally:
            browser.close()
