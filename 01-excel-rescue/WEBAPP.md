# Excel Rescue — authenticated local workspace

**Executable local-first prototype**, not public multi-tenant SaaS or a production security certification. The existing offline CLI and static case study remain available independently.

## Requirements
- Python 3.11+, no external Python packages.
- Local computer with a browser.
- UTF-8 CSV with exactly the columns: name, email, signup_date, city.

## Setup

From the repository's 01-excel-rescue directory:

~~~sh
cd 01-excel-rescue
python webapp.py create-user --username admin
python webapp.py serve
~~~

The first command prompts twice for a password of 12–128 characters; it is never included in the command line or Git. Use a unique passphrase. Open http://127.0.0.1:8765 on the **same computer**, sign in, select a CSV and click **Validate & clean CSV**. Download the accepted records and rejected-record audit from the history.

Windows: if the python command is unavailable, use py -3 instead. Use the included fictional sample.csv file for your first test. Expected: 1 accepted, 3 rejected (only for that sample).

To choose the port and storage directory:

~~~sh
python webapp.py create-user --username teammate --data-dir "/private/excel-rescue"
python webapp.py serve --port 8766 --data-dir "/private/excel-rescue"
~~~

Both commands must use the same data directory. The default is ~/.excel-rescue (outside Git); EXCEL_RESCUE_DATA_DIR also changes the default. Keep the entire directory private; NEVER commit it.

## Implemented
- Administrator-created accounts; salted scrypt password hashes, no self-registration.
- Random opaque HttpOnly, SameSite=Strict session cookies; eight-hour server-side expiry, SHA-256 token digests in SQLite; sign-out revokes the server session.
- CSRF tokens and Origin/Host validation for writes; login throttling after five failures per username/IP or twenty failures across usernames from one IP within fifteen minutes (in memory).
- SQLite users, sessions and jobs; ownership checks for each download and deletion.
- Uploaded source CSV used only in a private temporary folder, then removed. Accepted and rejected outputs, counts and source-file SHA-256 are stored in SQLite until deleted.
- File limit 5,000,000 bytes, row limit 20,000, at most 100 stored jobs per user.
- Responsive desktop web UI and no trackers, CDNs or external scripts.

## Tests

~~~sh
cd 01-excel-rescue
python -m unittest discover -v
~~~

Includes original cleaner regressions plus web login, CSRF, account isolation, processing, deletion and download tests. CI runs after commits.

## Critical security boundaries

1. **Local access only.** Server binds exclusively to 127.0.0.1 and uses ordinary HTTP intended for loopback on one computer. Never expose this service directly via a public internet interface, port forwarding, tunnels, corporate network or public reverse proxy. Secure cookies and TLS are needed for a redesigned remote deployment.
2. **Output data are not encrypted at rest.** SQLite stores job CSV content as BLOBs. File access control and local disk encryption are deployment responsibilities. POSIX folder/database modes are restricted; Windows folder ACLs require explicit review.
3. Login throttling is process-memory-only and shared by all accounts using the same loopback IP; twenty failed guesses across different usernames temporarily block even valid logins. It is not a durable/distributed anti-abuse mechanism. MFA, account recovery, managed identity, granular roles and administrative audit logs are absent.
4. Logical deletion of a job does not guarantee erasure of SQLite WAL pages, backups, snapshots or physical storage. Define and enforce a retention/deletion policy.
5. Local SHA-256 records the bytes processed; it does not prove provenance or authenticity. Rejected duplicates require manual reconciliation with independently trusted data.
6. This is not a hosted service, enterprise multi-tenancy, native XLSX parser, CRM integration, background queue, managed backup facility or audit-certified software.
7. Names, emails and cities may be personal data. Do not import real customer/clinical datasets without authorization, endpoint controls, legal and privacy review and suitable security assessment.

## Production road map
Choose target deployment and threat model; implement managed TLS with secure cookies, trusted domain/origin policy, SSO/MFA and RBAC, durable rate limiting, migrations, encryption-at-rest, backup and restore drills, retention policies, audit trails, operational monitoring, dependency scans and independent security testing. Address applicable LGPD obligations before deployment.

**Original AI-assisted prototype with automated checks. Human verification is required for live operation; do not claim production certification.**
