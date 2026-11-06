# 08 — Site Change Monitor (offline snapshot comparison)

**Fictional brief:** A small operations team wants an explainable report of what changed between two authorized web-page captures, without building a crawler.

**Solution:** a local-only HTML snapshot comparator. It extracts visible text, ignores scripts/styles/templates, normalizes whitespace, computes SHA-256 and lists up to ten changed text groups. The tool **does not access websites, follow links, scrape, send alerts, or run JavaScript**.

## Run and test

```bash
cd 08-site-change-monitor
python compare.py before.html after.html
python -m unittest discover -v
```

## Acceptance criteria
- Report whether visible text changed, counts of text blocks and before/after source hashes.
- Reject oversized/invalid encoding and excessive visible blocks.
- Ignore script contents and markup attributes rather than executing them.
- Accept only authorized local files and generate JSON output; no HTTP/SSRF surface.

## Security and limitations
Trust boundary: untrusted local HTML to bounded text extraction. Snapshots max 256 KB, 500 text blocks, 300 chars per block. This is not a complete browser renderer, so text rendered dynamically by JavaScript, attributes, accessibility changes, and media aren't detected. HTML snippets can include sensitive input data; do not pass real private snapshots without appropriate controls. A real monitor would require host allowlists, DNS/IP checks, egress protections, rate limits, robots/terms review, retained history, safe notification channels and authentication. SHA-256 does not authenticate origin.

**Status:** offline prototype with synthetic tests. **Fictional demonstration / AI-assisted development / human review required; not production-ready.**
