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
            # A rejecting clipboard API is different from an absent API: the UI
            # must not announce a successful copy after a permission failure.
            denied = browser.new_page(viewport={"width": 375, "height": 800})
            denied.add_init_script("""
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    value: {writeText: () => Promise.reject(new DOMException(
                        'NotAllowedError', 'NotAllowedError'))}
                });
            """)
            denied.goto(URL, wait_until="load")
            denied.get_by_role("button", name="Try fictional sample").click()
            denied.locator("#result").wait_for(state="visible")
            denied.locator("#copy-reject").click()
            feedback = denied.locator("#copy-feedback")
            assert "permission denied" in feedback.inner_text().lower()
            assert "copied to clipboard" not in feedback.inner_text().lower()
            assert denied.locator("#reject").evaluate(
                "el => el.selectionStart === 0 && el.selectionEnd === el.value.length"
            ), "Rejected CSV must remain manually selectable"
            assert denied.locator("#copy-reject").is_enabled()
            print("PASS: rejected clipboard promise never claims success")

            # Hostile fictional CSV: spreadsheet formulas must be escaped and
            # suspicious email prefixes rejected, without rendering markup.
            hostile = browser.new_page(viewport={"width": 375, "height": 800})
            hostile.goto(URL, wait_until="load")
            hostile_csv = (
                "name,email,signup_date,city\n"
                "=2+2,fictional@example.test,2026-01-02,=HYPERLINK(1)\n"
                "Unsafe,=cmd@example.test,2026-01-02,Test\n"
            )
            hostile.locator("#source").set_input_files({
                "name": "synthetic-hostile.csv",
                "mimeType": "text/csv",
                "buffer": hostile_csv.encode("utf-8"),
            })
            hostile.locator("#run").click()
            hostile.locator("#result").wait_for(state="visible")
            accepted = hostile.locator("#clean").input_value()
            rejected = hostile.locator("#reject").input_value()
            assert "'=2+2" in accepted and "'=HYPERLINK(1)" in accepted
            assert "unsafe email prefix" in rejected
            assert "1 accepted" in hostile.locator("#totals").inner_text()
            assert "1 rejected" in hostile.locator("#totals").inner_text()
            # Assert hostile markup is displayed as inert CSV text, not inserted into DOM.
            # A script-only selector is insufficient: event-handler HTML is also dangerous.
            assert hostile.locator("#result img, #result iframe, #result svg, #result script").count() == 0
            assert hostile.locator("#clean").evaluate(
                "el => el.tagName === 'TEXTAREA' && !el.isContentEditable"
            )
            print("PASS: hostile synthetic CSV is escaped/rejected in browser output")

            # 320px viewport approximates reflow at 400% of 1280px, not actual browser zoom.
            print("NOTE: real 400% zoom and screen-reader acceptance remain manual")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
