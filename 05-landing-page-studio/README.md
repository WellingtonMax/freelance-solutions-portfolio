# 05 — Landing Page Studio

**Fictional client brief:** A small workspace design company wants a responsive, accessible landing page with clear services and an enquiry-form preview.

**Solution:** standalone HTML/CSS/JavaScript, responsive layouts, keyboard skip link, semantic landmarks, explicit field labels, an accessible status region, and safe text rendering. No frameworks, trackers, CDNs, cookies, credentials, or backend.

## Preview and test

Open `index.html` in a browser (offline) and try the validation form with **fictional** information. With Node.js 20+:

```bash
cd 05-landing-page-studio
node --test test_site.cjs
```

## Acceptance criteria
- Responsive at narrow widths; keyboard accessible labels and focus indicators.
- Valid form values show a local-only confirmation; invalid values show useful errors.
- No network traffic, storage, submission, HTML insertion or third-party dependency.
- HTML CSP restricts external requests and prevents form submissions.

## Security & limitations
Untrusted user input is only checked locally and displayed through `textContent`. A real backend would independently validate, authorize, rate-limit, protect personal data and retain consent before accepting enquiries. No server, authentication or multitenancy exists here. Browser compatibility, WCAG conformance, and production deployment have **not** been certified. Local form data is ephemeral, not collected.

**Status:** prototype; synthetic tests included, manual accessibility review pending. **Fictional demonstration / AI-assisted development / human review required.**
