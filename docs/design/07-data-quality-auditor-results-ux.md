# Data Quality Auditor — results review UX handoff

**Status:** design specification only; no browser application or backend API is claimed.  
**Source inspected:** draft PR #11 (`07-data-quality-auditor/audit.py`, `sample.csv`, `README.md`, `test_audit.py`), root `main` README and portfolio index, and open PR context on 2026-11-07. PR #11 is **not merged**.  
**Owners:** Design/UX owns this specification; Frontend owns any future UI; Backend owns validation, data contract changes, security, and provenance semantics.

## One problem to solve

The auditor emits a trustworthy, compact JSON issue list, but a nontechnical buyer cannot quickly answer **what failed, where, and what to do next**. The current `issue_count` counts findings, **not distinct affected records**. The `row` value is a logical record ordinal starting at 2; it is **not guaranteed to match a physical text line** when quoted fields contain newlines. Showing “affected rows” or “CSV line number” without qualification would mislead.

## Proposed one-minute review journey

1. **Context first:** heading “Data quality review” and an always-visible label “Fictional sample · Offline prototype · No upload”. One sentence: “Review validation findings before importing a CSV.” A link to source/test instructions remains available.
2. **Summary:** show “6 records checked”, “4 findings” and “3 records with findings” **only if derived from the exact fixture or result**. For the existing `sample.csv`, inspect actual result before using numbers. Use “Findings” for `issue_count`; calculate unique `row` values in the frontend only when supplied with a validated result. Never imply an accuracy percentage or a pass/fail compliance certification.
3. **Review:** group findings by issue code, each with count and a plain-English explanation. An accessible findings table offers columns “Record position”, “Finding”, “Suggested next check”. Sort by record position, then code. Do not display raw customer data or suggest the issue code is a diagnosis of fraud.
4. **Next action:** a concise “Fix the source CSV and rerun the audit” note, a downloadable **synthetic** sample and a copyable **redacted** JSON output where appropriate. No fabricated “Fix automatically” action.
5. **Provenance:** present a collapsible “Input fingerprint (SHA-256)” with a note: “Helps compare files; does not verify who supplied them.” Do not label the hash “verified”.

## Information architecture / wireframe

```text
[07 / Data Quality Auditor]  [Fictional data] [Offline prototype]
Data quality review
Find errors and unusual values before importing a CSV.

[Records checked]  [Findings]  [Records with findings]
[Review findings] [How to reproduce locally]

Findings by type (counts, plain labels, no color-only meaning)
[Type filter: All findings / Duplicate IDs / Invalid amounts / ...]
[Table: Record position | Finding | Suggested next check]
[No raw row content displayed]

How to act on these findings
[Correct source file] → [Rerun local auditor]
[Input fingerprint: expandable] [Limitations: expandable]
```

On desktop (>=1024px), use a compact 3-column summary and full-width table. At 768px, keep summary readable in two columns. At 320–375px, stack metrics, use full-width filters and either a horizontally scrollable **labeled** table or semantically equivalent stacked finding cards; never truncate the issue code or position. At 200% zoom, avoid page-level horizontal scrolling.

## UI copy contract — grounded in existing codes

| Code | Display label | Suggested next check |
|---|---|---|
| `SCHEMA_COLUMNS` | Column count mismatch | Check missing or extra values in this record |
| `INVALID_ID` | Invalid record ID | Check the permitted ID format |
| `DUPLICATE_ID` | Duplicate record ID | Check whether the record was imported twice |
| `INVALID_CATEGORY` | Invalid category | Provide a nonempty category without control characters |
| `INVALID_AMOUNT` | Invalid amount | Use a nonnegative amount with exactly two decimals |
| `INVALID_DATE` | Invalid date | Use a real date in YYYY-MM-DD format |
| `HIGH_AMOUNT_OUTLIER` | Unusually high amount | Review against the median-based heuristic; **not** proof of fraud |

Unknown future issue codes: display an escaped generic “Unrecognized finding” label and the code as inert text; never render it as HTML. Avoid asserting a particular row is wrong solely because it is flagged by a heuristic.

## States and accessibility

- **Demo-ready:** show the fixed synthetic result with a visible source label and a reproducible command; do not imply live file upload.
- **Zero findings:** “No issues detected by these checks.” Never say “Data is verified” or “100% clean”.
- **Malformed/unsupported result:** “Unable to display this audit result.” Hide metrics and explain that the local auditor must be rerun; do not guess missing fields.
- **Loading (only if asynchronous UI is actually built):** announce “Preparing audit findings” via `role=status`; do not show a decorative spinner with no real operation.
- **Filters:** keyboard-operable, visible focus, explicit selected state and a live count update; provide a “Show all findings” reset. Table headers use `scope=col`, with a caption naming the dataset as fictional.
- **Contrast:** WCAG AA 4.5:1 for normal text and 3:1 for essential graphical UI. Respect reduced motion and browser zoom. Do not rely on red/green alone.

## Data and trust boundaries

The current JSON shape is `{status, input_sha256, rows, issues: [{row, code}], issue_count}`. The UI must validate types, integer bounds and allowed issue-code values before rendering. `issue_count` is the total number of issue objects; unique record positions must be derived separately. The current tool bounds CSV to 1 MB / 10,000 records, accepts an exact four-column schema, and does not transmit data. Avoid echoing raw CSV values, filenames from untrusted input, or arbitrary exception messages. Use `textContent` / DOM text nodes for every dynamic label; do not weaken CSP. **No production ingestion, uploads, authentication or persistence** in this design.

## Acceptance criteria for Frontend

1. A first-time visitor can identify the fictional scope, number of findings, and next corrective action in <=60 seconds without reading source code.
2. Synthetic fixture counts agree with the actual `audit.py` output; test the case where two findings share one record position.
3. Zero findings, unknown code, malformed JSON and missing `issues` are handled without misleading metrics, crashes, or HTML injection.
4. Filters preserve keyboard navigation and announced result counts; 320, 375, 768 and 1280px plus 200% zoom are reviewed.
5. SHA-256 is described only as a fingerprint; high amount outliers are explicitly heuristic.
6. If frontend and backend later negotiate a revised JSON contract, document the version and keep the original CLI behavior unchanged until separately approved.

## Coordination / next step

Frontend: build a standalone **read-only, synthetic-result** viewer in its own `frontend/` branch once PR #11's ownership and integration path are settled. Prefer a checked-in fixture derived by running `python 07-data-quality-auditor/audit.py 07-data-quality-auditor/sample.csv`, not hand-written invented metrics. Backend: confirm whether `row` should be renamed `record_position` in a future version; do not silently reinterpret it. Design: review visual hierarchy, labels and responsive behavior after implementation.

**Verification performed in this design change:** repository source inspection and schema/copy reasoning only. No browser, automated test or CI run is claimed for this document.
