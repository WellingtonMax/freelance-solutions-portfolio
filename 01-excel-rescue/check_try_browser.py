"""Browser regression for the existing offline CSV preview (P01-F01 / E01).

Run: python 01-excel-rescue/check_try_browser.py
Requires Playwright and Chromium; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
for an installed browser. Synthetic fixtures only. Not a screen-reader audit.
"""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

PAGE = Path(__file__).resolve().parent / "try.html"


def exercise(browser, width):
    page = browser.new_page(viewport={"width": width, "height": 800})
    errors = []
    external = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: external.append(request.url)
            if not request.url.startswith("file:") else None)
    try:
        page.goto(PAGE.as_uri())
        assert page.get_by_text("Fictional demonstration").count() >= 1
        assert not page.locator("#result").is_visible()
        # The skip link is integrated in main; fail closed if it regresses.
        skip = page.get_by_role("link", name="Skip to CSV preview")
        assert skip.count() == 1, "Integrated preview must expose exactly one skip link"
        page.keyboard.press("Tab")
        assert skip.evaluate("(e) => e === document.activeElement"), "Skip link must be first Tab stop"
        page.keyboard.press("Enter")
        heading = page.locator("#preview-heading")
        assert heading.evaluate("(e) => e === document.activeElement"), "Skip link must move focus"
        assert heading.evaluate("(e) => parseFloat(getComputedStyle(e).outlineWidth) >= 3"), "Focused heading needs visible outline"
        page.keyboard.press("Tab")
        assert page.locator("#sample").evaluate("(e) => e === document.activeElement"), "Tab after skip must focus the fictional sample button"
        page.locator("#run").click()
        assert "Choose a CSV file" in page.locator("#feedback").inner_text()
        assert page.locator("#source").evaluate("(e) => e === document.activeElement")

        # Exercise the primary one-click demo using keyboard activation, not a mouse.
        page.locator("#sample").focus()
        assert page.locator("#sample").evaluate("(e) => e === document.activeElement")
        page.keyboard.press("Enter")
        page.locator("#result").wait_for(state="visible")
        assert "Preview complete" in page.locator("#feedback").inner_text()
        assert "1 accepted" in page.locator("#totals").inner_text()
        assert "3 rejected" in page.locator("#totals").inner_text()
        assert page.locator("#result-heading").evaluate("(e) => e === document.activeElement")
        assert not page.locator("#copy-clean").is_disabled()
        assert not page.locator("#copy-reject").is_disabled()

        # Clipboard APIs can be absent on file:// and restricted browsers.
        # Verify both buttons offer a truthful, selectable manual fallback.
        page.evaluate("Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })")
        for button_id, textarea_id, label in (
            ("copy-clean", "clean", "Accepted"),
            ("copy-reject", "reject", "Rejected"),
        ):
            page.locator("#" + button_id).click()
            assert "Clipboard access is unavailable" in page.locator("#copy-feedback").inner_text()
            assert label in page.locator("#copy-feedback").inner_text()
            assert page.locator("#" + textarea_id).evaluate(
                "(e) => e === document.activeElement && e.selectionStart === 0 && e.selectionEnd === e.value.length"
            ), "Manual CSV fallback must focus and select the entire output"
            assert not page.locator("#" + button_id).is_disabled()

        hostile = (
            "name,email,signup_date,city\\n"
            "<img src=https://example.invalid/x>,bad@example.com,2026-01-01,Test\\n"
        ).replace("\\n", "\n")
        page.locator("#source").set_input_files({
            "name": "hostile.csv", "mimeType": "text/csv",
            "buffer": hostile.encode("utf-8"),
        })
        assert not page.locator("#result").is_visible(), "Old output must clear on selection"
        assert page.locator("#copy-clean").is_disabled()
        page.locator("#run").click()
        page.locator("#result").wait_for(state="visible")
        assert page.locator("img").count() == 0, "CSV data must not become HTML"
        assert "<img" in page.locator("#clean").input_value()
        # Oversized files must be rejected locally, clearing previous outputs.
        page.locator("#source").set_input_files({
            "name": "oversized.csv", "mimeType": "text/csv",
            "buffer": b"x" * (1024 * 1024 + 1),
        })
        assert not page.locator("#result").is_visible()
        page.locator("#run").click()
        assert "exceeds the 1 MB" in page.locator("#feedback").inner_text()
        assert not page.locator("#result").is_visible()
        assert page.locator("#copy-clean").is_disabled()
        assert page.locator("#copy-reject").is_disabled()
        assert not page.locator("#run").is_disabled()
        assert page.locator("#feedback").get_attribute("aria-busy") == "false"
        # Recovery: a rejected large file must not poison the next valid run.
        page.locator("#sample").click()
        page.locator("#result").wait_for(state="visible")
        assert "Preview complete" in page.locator("#feedback").inner_text()
        assert "1 accepted" in page.locator("#totals").inner_text()
        assert "3 rejected" in page.locator("#totals").inner_text()
        assert not page.locator("#copy-clean").is_disabled()
        assert not page.locator("#copy-reject").is_disabled()
        assert page.locator("#feedback").get_attribute("aria-busy") == "false"
        assert not errors, f"JavaScript errors: {errors}"
        assert not external, f"Unexpected network requests: {external}"
        assert page.evaluate(
            "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
        ), f"Page overflow at {width}px"
        print(f"PASS offline CSV preview at {width}px")
    finally:
        page.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        executable = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH")
        if executable and not Path(executable).is_file():
            raise FileNotFoundError(executable)
        browser = playwright.chromium.launch(
            headless=True, **({"executable_path": executable} if executable else {})
        )
        try:
            for width in (320, 375, 768, 1280):
                exercise(browser, width)
        finally:
            browser.close()
