# Landing Page Studio — actionable enquiry validation UX

**Status:** Design handoff only · 2026-11-07 · fictional offline demo · no live enquiries.

## Evidence and scope

Reviewed the current `main` README and portfolio page, open PRs, and the actual Landing Page Studio source in **unmerged PR #11** (`05-landing-page-studio/index.html`, `style.css`, `site.js`, `test_site.cjs`, README). `AGENTS.md` is absent on `main`. The demo currently presents one generic status paragraph below the submit button, and `validateEnquiry()` returns only the **first** string error. The fields do not have dedicated descriptions, `aria-invalid` or `aria-describedby` relationships to errors. A keyboard or screen-reader user may have to hunt for the failing field after submitting. This handoff deliberately does **not** edit the unmerged source files.

## One focused improvement: make validation recoverable at the field

**Goal:** A prospective client can test the fictional enquiry form in under a minute, understand exactly what to fix, and see clearly that nothing was transmitted. Preserve the existing offline-only CSP, safe `textContent` rendering and input bounds.

### Interaction contract

1. **Initial:** All three fields have visible labels and concise helper text: Name (1–80 characters), Email (valid format, up to 254 characters), Project summary (10–1000 characters). Add an explicit `Demo only — use fictional details; nothing is submitted or stored` note immediately above the submit button. No red errors or `aria-invalid` before validation.
2. **Invalid submit:** Keep the user-entered values. Show a short error summary **before** the first field: `Please correct the highlighted fields. Nothing was sent.` Provide one specific error message **directly beneath each invalid field**, not only at the bottom of the form. Associate each message using a stable `aria-describedby` ID and mark invalid controls `aria-invalid="true"`. Focus the first invalid control (do not jump the viewport unpredictably). Do not rely on color alone.
3. **Correction:** When a field changes after invalid submit, recompute **that field's** error and remove its invalid state once corrected. Other errors remain visible until corrected. Avoid announcing an entire summary on every keystroke; reserve the live region for submit results.
4. **Valid submit:** Clear all errors and invalid flags. Preserve values for the demonstration. Show `Validation passed. This is a local preview; no enquiry was sent or saved.` in a `role="status"` live region. Never imply a real lead was created.
5. **Error tone:** Concrete and respectful: `Enter a name (1–80 characters).`, `Enter an email in the format name@example.com.`, `Enter a project summary of 10–1000 characters.`, `Remove control characters.`. Do not echo raw user input in error markup.

### Visual layout and states

- **Desktop (>= 1024px):** Preserve the current two-column contact section. Keep error summary, field, helper and error visually grouped within the form card; maintain clear spacing and visible focus.
- **Tablet (768px):** Ensure the contact copy and form have enough room; if cramped, switch to one column before either reaches its minimum usable width.
- **Mobile (320px / 375px):** Single-column form, no page-level horizontal scrolling. Inputs and submit button at least 44 CSS px tall; 16px or larger input text to avoid mobile auto-zoom. Long messages wrap rather than overflow.
- **Contrast and semantics:** Test normal text at 4.5:1, large text at 3:1, focus indicators distinguishable without color. Use existing palette where feasible; avoid global token changes until design/frontend ownership is agreed.
- **Motion:** No animation is necessary for validation. Honor reduced-motion if later added.

### Suggested accessible DOM relationships (illustrative, not implementation)

```html
<label for="email">Email</label>
<p id="email-help">Fictional address only.</p>
<input id="email" name="email" type="email"
       aria-describedby="email-help email-error" aria-invalid="true">
<p id="email-error">Enter an email in the format name@example.com.</p>
```

Keep the error node empty or hidden when valid; avoid `innerHTML` for all user-derived content. Ensure `aria-describedby` does not point to missing IDs.

### Acceptance checks for frontend

- [ ] With three invalid fields, all three actionable errors appear after one submit; first invalid input receives focus.
- [ ] Fixing one field clears only that field's error; no values disappear.
- [ ] Valid fictional data produces **local-only** success copy and no request, storage, tracking or external asset load.
- [ ] Submit remains safe for hostile strings (HTML-like input, control characters, very long text); text insertion uses `textContent`.
- [ ] Keyboard: skip link, labels, error navigation and focus all usable without a pointer.
- [ ] Screen reader: error messages are associated with fields, and final status is announced once, not on every keystroke.
- [ ] 320/375/768/1280 CSS px and 200% zoom: no horizontal page overflow; controls readable and reachable.
- [ ] Test empty fields, invalid email, short summary, over-limit values and successful fictional entry; preserve existing Node tests and add DOM-state tests.
- [ ] Verify `form-action 'none'` and `connect-src 'none'` remain in CSP. No server submission or customer-data collection is introduced.

## Coordination / dependencies

**Frontend:** Implement this contract after confirming PR #11's latest head and coordinating ownership of `05-landing-page-studio/index.html`, `style.css`, `site.js` with the owner of PR #11. The present branch changes only this design document; do not cherry-pick an outdated version of PR #11. Ideally, expose a pure per-field validation result so DOM behavior can be tested independently. **Backend/security:** No backend changes requested; production enquiries, consent, retention, spam prevention, rate limits and server validation are explicitly out of scope. **Design:** Revisit field spacing/contrast after browser screenshots are available.

## Verification and limitations

This is a source-informed specification, not a functioning UI change. No browser, assistive-technology, build or automated tests were executed for this documentation-only change. Do not claim WCAG certification or an operating enquiry service. Human review is required before merge.
