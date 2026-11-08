# PawLedger — Veterinary Membership & Loyalty (concept demo)

[Interactive browser demo](index.html) · [Reward engine](engine.mjs) · [Automated tests](test_engine.mjs)

**An independent, original, fictional portfolio demonstration. Not commissioned by, affiliated with, or built from My Vet Perks software. No customer or hospital data. Not a paid client project.** Built with AI assistance; requires human review before commercial deployment.

## What this demo proves

- Responsive clinic/admin UI for two fictional veterinary hospitals.
- Clinic switcher; searchable member directory; enrollment; membership status changes.
- Configurable percentage earnings (0–20%) and buy-X-get-one tracking.
- Integer-cent rewards ledger, purchases, redemptions, free-visit vouchers.
- Per-clinic boundary checks and idempotent transaction IDs in domain logic.
- Export of synthetic transaction rows to CSV, with spreadsheet-formula protection.
- Node's built-in test runner covers rewards arithmetic, multi-clinic isolation, idempotency, invalid input and promotions.

**Demo scope:** state lives only in the browser memory and resets on reload. There is no login, database, billing, webhooks, persistent audit storage or real Stripe API connection. Buttons labeled "Demo" simulate business operations; do not enter real personal data. This page is not suitable for real veterinary operations or cardholders.

## Run locally

Serve the directory so ES modules load correctly, for example:

~~~bash
cd demos/vet-loyalty
python -m http.server 8000
# open http://localhost:8000
node --test test_engine.mjs
~~~

Node 20+ recommended for tests. No npm dependencies, secrets, Stripe account or database required.

## Production rebuild recommendations (not implemented here)

1. **Discovery:** inspect the authorized walkthrough, legacy source, actual export formats, contract rights, clinic workflows and current Stripe ownership. Define acceptance criteria before estimating migration.
2. **App:** Next.js + TypeScript, accessible responsive layouts, server-side authorization, CSRF protection and rate limiting.
3. **Data:** managed PostgreSQL with foreign keys for clinic scoping, append-only rewards ledger, unique idempotency keys, transactional balance checks and backup/restore drills.
4. **Membership:** Stripe Billing Customer/Subscription linkage, verified webhook signatures, replay-safe handlers, reconciliation of subscription states, and no raw payment-card storage.
5. **Access:** identity provider / Supabase Auth; admin vs clinic roles; explicit tenant isolation at API and database policy layers; audit logs for financially consequential actions.
6. **Migration:** dry-run imports with checksums, field-level mapping, duplicate handling, balance reconciliation and a signed-off cutover/rollback plan.
7. **Handover:** company-owned GitHub, hosting, Stripe and database; documented environment variables and least-privilege access revocation.

The current client brief is **not** evidence of completed commercial work or of access to original source systems.

## Acceptance checks for this demo

- Verify members/points change only within the selected clinic.
- Add a fictional member, record a purchase, redeem available credit, award/redeem a promotion.
- Prevent duplicate transaction IDs from crediting twice.
- Run the unit tests; check CI status for this commit.
- View at desktop and mobile widths; reset page to restore fixtures.

## Security limitations

This static showcase intentionally provides **no real authentication**. Client-side checks cannot protect real customer data. The ledger design is illustrative only; production balance changes must be atomic and enforced server-side with database transactions. There is no payment functionality. Do not use this demo for personal information, active customers or financial processing.
