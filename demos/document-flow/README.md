# Document Flow — Word revisions → PandaDoc-style variable mapping

**Status: working offline demonstration, not a live PandaDoc integration.** All content and businesses are invented; this was not a paid client engagement. Created with AI assistance and human review.

[View the static demonstration source](index.html) · [Open sample template](template.txt) · [Synthetic values](sample_values.json) · [PandaDoc official developer guide](https://developers.pandadoc.com/docs/create-document-from-template)

## Business scenario

A fictional customer has an existing document and a Word file containing updated wording. The deliverable is a consolidated, consistent source template with mapped variables and a reproducible preview, suitable for later configuration and testing in an authorized PandaDoc account.

The change request covers:
- Payment terms: **30 days → 15 days**.
- Progress updates: **upon request → weekly** with handoff summary.
- Deliverables: new explicit written-audit, recommendation and review-meeting language.

The browser page shows these changes side by side. The consolidated text is in [template.txt](template.txt) and has **12** custom PandaDoc-style variables, e.g. `[Client.Company]` and `[Service.PaymentDays]`. Test values are fictional.

## What works locally

- Responsive browser interface for editing twelve sample fields.
- Validated required-key mapping with missing, extra and overlong entries rejected.
- Populated text document preview shown using safe `textContent`.
- Exportable variable mapping CSV and a PandaDoc-style **example** document-creation JSON payload with `tokens`. JSON includes a deliberately invalid `template_uuid`, and is **never submitted**.
- Print-to-PDF via browser.
- A Python generator creates four editable Word samples (before, simulated Word changes, consolidated template, offline-populated result). These Word samples are generated on demand, not checked into source control.
- Unit tests with no JavaScript packages.

**No browser request uploads, sends or stores data. Use fictional examples only.**

## Run & test

```bash
# Run from this folder; ES module scripts may not work directly from file://
python -m http.server 8000
# Then open http://localhost:8000

# Pure JavaScript unit tests (Node 20+)
node --test test_merge.mjs

# Create Word examples — free python-docx package required
python -m pip install python-docx
python make_word_samples.py --out generated
```

The Word generator fails rather than overwriting existing filenames; remove the output directory before regenerating. No user data or credentials are required.

## Acceptance criteria and known limitations

**Locally verified:**
1. All twelve fields are present in the sample data and resolve in the filled text.
2. Payment and progress text reflect the specified fictional updates.
3. Missing/extra/blank/oversized values reject the merge.
4. JSON names use PandaDoc's unbracketed token names, with no credentials.
5. CSV quoting and escaping are tested.

**Not implemented or claimed:**
- No authenticated PandaDoc account, sandbox or production API request has been used.
- No PandaDoc-native template, custom variables, signer role, signature field, document-status polling or CRM integration has been configured.
- Word strings resembling `[Client.Company]` do **not** automatically become native PandaDoc variables; they must be created/recognized in the PandaDoc editor. A visual signature line is **not** an e-signature field.
- A Word-file document upload and a document created **from a PandaDoc template** are distinct API workflows. PandaDoc's template-based route supports `tokens`; file upload does not.
- The example service language is **non-binding, not legal advice**, and not a complete customer contract. No visual parity with PandaDoc's document converter is asserted.

## How to finish a real authorized job

1. Obtain and compare the customer's real existing PandaDoc template and updated Word content; ask for explicit review of changed contractual clauses.
2. Reconcile and apply the approved wording in the PandaDoc editor and visually inspect the result.
3. Create custom variables in editable text blocks matching the field map, and set actual recipient roles and interactive signature fields.
4. Have the customer use a secure PandaDoc sandbox and a scoped credential, never pasted into public code or chat.
5. Create a document **from the template** using the agreed `tokens`; inspect draft status, fields, roles and rendered document.
6. Obtain customer acceptance, document discrepancies and hand off a final field map. Live sending, OAuth/CRM integrations, or advanced workflows are a separate scope.

## Official reference material

- [PandaDoc variable behavior](https://support.pandadoc.com/en/articles/9714599-variables-new-experience)
- [Create a document from a template](https://developers.pandadoc.com/docs/create-document-from-template)
- [Document creation method differences](https://developers.pandadoc.com/docs/document-creation-methods)
- [Create Document API](https://developers.pandadoc.com/reference/create-document)

**Portfolio integrity:** entirely synthetic demonstration, not paid work, not an integration already validated with PandaDoc.
