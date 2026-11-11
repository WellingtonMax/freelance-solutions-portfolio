# 06 — Document Factory

**Fictional brief:** An operations team wants repeatable quotes from structured input rather than copying prices and names into documents manually.

**Deliverable:** an offline, printable HTML quotation using strict JSON input, decimal arithmetic, HTML escaping, and exclusive output creation. No external templates, JavaScript, browser requests, invoices, PDFs or emails are generated automatically.

## Reproduce

```bash
cd 06-document-factory
python factory.py sample.json quotation.html
python -m unittest discover -v
```

Open `quotation.html` locally in a browser and use *Print → Save as PDF* manually if desired. This project does not create a PDF directly.

## Acceptance criteria
- Reject oversized or invalid UTF-8/JSON, unexpected fields, invalid dates and amounts.
- Compute total from decimal-string line prices with exactly two decimal places.
- Escape all user-provided text in the HTML report.
- Never overwrite an existing output file.

## Threat model / limits
The trust boundary is local untrusted JSON to a local HTML document. Limits are 150 KB, 100 lines, 1,000 units each. Input reading is bounded to 150 KB plus one byte and requires a regular file; final symlinks are rejected where `O_NOFOLLOW` is available. Existing file overwrite is rejected. A malicious operator-selected output directory, filesystem races, symlinks in parent directories, invoicing rules, local printer permissions, and customer data handling are not addressed. Not a hosted multi-tenant service. No authentication, credentials or network requests.

**Status:** prototype, synthetic tests included; human review and environment checks required. **Fictional demonstration / AI-assisted development / human review required.**

### Hardening notes
The parser now rejects duplicate JSON keys at the root and within nested line items. This avoids key-shadowing ambiguity in prices and quantities. Output remains offline HTML (not an automatically generated PDF) and a human must confirm financial accuracy.
