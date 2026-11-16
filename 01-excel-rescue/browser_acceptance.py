"""Optional real-Chromium acceptance for Excel Rescue's local browser preview.

From repository root, serve: python -m http.server 8000 --bind 127.0.0.1
Install free Playwright + Chromium, then: python 01-excel-rescue/browser_acceptance.py

Localhost only, bundled fictional sample only. No customer data or external services.
"""
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8000/01-excel-rescue/try.html"


def exercise(page, width):
    page.set_viewport_size({"width": width, "height": 800})
    response = page.goto(URL, wait_until="load")
    assert response and response.ok, f"Preview not served at {URL}"
    button = page.get_by_role("button", name="Try fictional sample")
    button.focus()
    button.press("Enter")
    result = page.locator("#result")
    result.wait_for(state="visible")
    assert page.locator("#clean").input_value()
    assert page.locator("#reject").input_value()
    assert page.locator("#copy-clean").is_enabled()
    assert page.locator("#copy-reject").is_enabled()
    assert page.evaluate("document.activeElement.id === 'result-heading'"), "Result focus not announced"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"Overflow at {width}px"
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true,value:undefined})")
    page.locator("#copy-clean").click()
    assert "unavailable" in page.locator("#copy-feedback").inner_text().lower()
    assert page.locator("#clean").evaluate("el => el.selectionStart === 0 && el.selectionEnd === el.value.length")
    page.locator("#source").set_input_files([])
    page.locator("#source").dispatch_event("change")
    assert result.is_hidden()
    assert page.locator("#copy-clean").is_disabled()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page(permissions=[])
            for width in (320, 375, 1280):
                exercise(page, width)
                print(f"PASS: {width}px keyboard, sample, focus, overflow, copy fallback, reset")
            forced = browser.new_page(forced_colors="active", viewport={"width": 320, "height": 800})
            exercise(forced, 320)
            print("PASS: forced-colors functional flow")
            # 320px viewport approximates reflow at 400% of 1280px, not actual browser zoom.
            print("NOTE: real 400% zoom and screen-reader acceptance remain manual")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
