# P01-F01 — Excel Rescue CSV processing contract (E02 draft)

**Stage:** BACKLOG / backend contract draft, **not BACKEND_READY**. Version: `0.1-draft`. Fictional demonstration; AI-assisted development; human review required. Source of truth: `clean.py` on `main`. This document specifies the existing CLI behavior and the next acceptance gate, not a deployed API.

## Business problem and persona
A small-business operations analyst receives inconsistent CRM CSV exports and needs to identify invalid records without silently selecting one of several conflicting contacts. They run a local, offline tool, review rejected rows, and export a clean CSV. This does **not** establish consent or authenticity.

## Entities and state
| Entity | Fields | Invariant |
| --- | --- | --- |
| InputBatch | source path, optional trusted SHA-256, bytes | UTF-8 with optional BOM, <= 5,000,000 bytes, <= 20,000 data rows |
| Contact | name, email, signup_date, city | Exactly these four headers; email required and syntactically valid; name required; date ISO or DD/MM/YYYY |
| Rejection | source line, reason | Every rejected row is traceable by original CSV line |
| OutputPair | cleaned.csv, rejected.csv | Distinct from input and from each other; neither preexists |

`REQUESTED → VALIDATING → TRANSFORMING → WRITING → COMPLETED` or `FAILED`. Output files are created exclusively; a failed write attempts to remove files created by the invocation. Two-file output is **not atomic** and readers can temporarily observe one file.

## Rules and constraints
1. Decode UTF-8/UTF-8-BOM; reject missing, extra or duplicate headers. Input may contain arbitrary untrusted content; do not execute it.
2. Normalize whitespace and lowercase email. Slash dates are **day/month/year**; ISO dates remain ISO. Reject invalid dates, invalid emails, missing names and oversized fields (> 2,048 characters).
3. Reject **all valid occurrences** of a duplicate normalized email, rather than choosing a winner. Invalid records have their own rejection reason.
4. Prevent spreadsheet formula-leading values in exported free text using conservative apostrophe prefixing; reject unsafe formula-leading email. This is a mitigation, **not** a universal guarantee for every spreadsheet.
5. Optional `--expected-sha256` is meaningful only when the digest comes from a trusted independent channel. Hashing alone does not authenticate a source.
6. Never overwrite pre-existing output paths. Never log or commit actual customer records; synthetic fixtures only. CLI is offline: no HTTP calls, login, tenants or external credentials.
7. Errors must fail closed without claiming completion. Existing limitations: no XLSX support, no interactive preview/confirmation in this CLI, no transaction across both output files, and no guarantee of safe concurrent access to the same output paths.

## Executable CLI contract (current implementation)
```sh
cd 01-excel-rescue
python clean.py input.csv --output cleaned.csv --rejects rejected.csv --expected-sha256 <trusted-64-hex-digest>
python -m unittest discover -v
```
The hash flag is optional. On success, the command prints `Accepted: N; rejected: M`. Cleaned output has `name,email,signup_date,city`; rejects have `line,reason`. On invalid input or output collisions, the command raises an error and exits nonzero; the exact exception text is not a stable machine-readable API.

### Synthetic example
Input:
```csv
name,email,signup_date,city
Ada Example,ADA@EXAMPLE.COM,05/11/2026,Brasilia
Duplicate One,dup@example.com,,Rio
Duplicate Two,DUP@example.com,,Rio
Unsafe,=HYPERLINK(1)@example.com,,Rio
```
Expected cleaned row: `Ada Example,ada@example.com,2026-11-05,Brasilia`. Expected rejections: source lines 3 and 4 (duplicate), and line 5 (unsafe email prefix). Example is illustrative until an end-to-end test is attached.

## Permission matrix
| Actor | Read local input | Write outputs | Read other users' data | External network |
| --- | --- | --- | --- | --- |
| Local CLI operator (OS permissions) | Yes | Only selected writable paths | Not controlled by this CLI; OS enforces permissions | Not needed |
| Anonymous remote user | No CLI endpoint | No | No | No |

## Threat model / acceptance gate
Relevant OWASP ASVS 5.0 themes: input validation, output encoding, file handling, error handling. Threats: malicious CSV formulas, malformed encoding, duplicate poisoning, oversized input, path collisions, symlink/race replacement and partial output visibility. Controls in `clean.py` are bounded reads, explicit validation, duplicate rejection, exclusive output creation, optional trusted digest, best-effort rollback. Residual risks include concurrent file replacement, filesystem permissions and spreadsheet-specific formula interpretation. OWASP Agentic Applications guidance is not applicable to this non-agent CLI.

**E02 acceptance (not yet certified):** independently execute valid/hostile fixtures, assert exact cleaned and rejected outputs, verify limits and no overwrite, verify rollback under a simulated write failure, inspect CI logs for the exact commit, and reconcile this contract with any separate local webapp routes before a UX handoff. Next owner: Backend. No `BACKEND_READY` declaration until these checks pass.
