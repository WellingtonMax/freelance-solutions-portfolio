"""Optional local Chromium acceptance checks for the fictional, offline enquiry demo.

Requires: pip install playwright && python -m playwright install chromium
Run: python check_browser.py
This is not part of the dependency-free CI suite.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

PAGE = (Path(__file__).resolve().parent / "index.html").as_uri()

def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            for width in (320, 375, 768, 1280):
                page = browser.new_page(viewport={"width": width, "height": 800})
                requests = []
                script_errors = []
                page.on("pageerror", lambda error: script_errors.append(str(error)))
                page.on("request", lambda request: requests.append(request.url)
                        if not request.url.startswith("file:") else None)
                page.goto(PAGE)
                # Keyboard-only submission must move focus to the first invalid field.
                page.locator("#enquiry button").focus()
                page.keyboard.press("Enter")
                # All three empty fields must be identified, not just the first one.
                for field in ("#full-name", "#email", "#message"):
                    assert page.locator(field).get_attribute("aria-invalid") == "true", (width, field)
                assert page.locator("#full-name").evaluate("(el) => document.activeElement === el")
                assert "Nothing was sent" in page.locator("#feedback").inner_text()
                # Correcting one field must not silently erase other field errors.
                page.locator("#full-name").fill("Fictional Person")
                assert page.locator("#full-name").get_attribute("aria-invalid") is None
                for field in ("#email", "#message"):
                    assert page.locator(field).get_attribute("aria-invalid") == "true", (width, field)
                page.locator("#email").fill("fictional@example.com")
                page.locator("#message").fill("A fictional project request\nWith a second paragraph.")
                page.locator("#enquiry button").click()
                assert "Fields look valid" in page.locator("#feedback").inner_text()
                assert page.locator("#full-name").get_attribute("aria-invalid") is None
                assert page.locator("#email").get_attribute("aria-invalid") is None
                assert page.locator("#message").get_attribute("aria-invalid") is None
                page.locator("#email").fill("bad@example..com")
                page.locator("#enquiry button").click()
                assert page.locator("#email").get_attribute("aria-invalid") == "true"
                assert page.locator("#email").evaluate("(el) => document.activeElement === el")
                page.locator("#email").fill("corrected@example.com")
                assert page.locator("#email").get_attribute("aria-invalid") is None
                assert "resolved" in page.locator("#feedback").inner_text()
                page.locator("#enquiry button").click()
                assert "Fields look valid" in page.locator("#feedback").inner_text()
                # Hostile-looking text must never become executable markup or a network request.
                payload = "<img src=https://invalid.example.test/pixel onerror=alert(1)>"
                page.locator("#full-name").fill(payload)
                page.locator("#enquiry button").click()
                assert "Fields look valid" in page.locator("#feedback").inner_text()
                # Inspect the entire document: unsafe rendering could occur outside the form.
                assert page.locator("img[src*='invalid.example.test']").count() == 0, "User text became an image element"
                assert page.locator("#full-name").input_value() == payload
                assert not requests, f"Unexpected network requests: {requests}"
                assert not script_errors, f"Browser JavaScript errors at {width}px: {script_errors}"
                overflow = page.evaluate("""() => ({
                    viewport: innerWidth,
                    document: document.documentElement.scrollWidth,
                    offenders: [...document.querySelectorAll('body *')]
                        .map(el => ({tag: el.tagName.toLowerCase(), id: el.id,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: (el.textContent || '').trim().slice(0, 60),
                            left: Math.round(el.getBoundingClientRect().left),
                            right: Math.round(el.getBoundingClientRect().right),
                            scrollWidth: el.scrollWidth}))
                        .filter(el => el.right > innerWidth + 1 || el.left < -1)
                        .slice(0, 20)
                })""")
                assert overflow["document"] <= overflow["viewport"], f"Overflow at {width}px: {overflow}"
                page.close()
            page = browser.new_page(viewport={"width": 640, "height": 800})
            page.goto(PAGE)
            page.evaluate("document.body.style.zoom = '200%'")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Overflow at 200% zoom"
            page.close()
        finally:
            browser.close()
    print("Browser smoke checks passed at 320/375/768/1280px and simulated CSS zoom (not native browser zoom).")

if __name__ == "__main__":
    main()
