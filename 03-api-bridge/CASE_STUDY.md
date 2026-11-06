# Case Study 03 — API Bridge

> **Fictional client scenario.** Original demonstration using a public example API.

## The brief

An operations team periodically copies items from an authorized JSON endpoint into spreadsheets. They need a repeatable export that handles common network failures, produces safe CSV, and does not hardcode credentials.

## Solution

An API-to-CSV command-line export with:

- explicit HTTPS endpoint and hostname allowlist;
- nonstandard ports and redirects rejected;
- timeout, finite retries and a maximum response body;
- selected output fields and CSV escaping;
- optional bearer token from an environment variable (never committed);
- offline tests with a simulated HTTP transport.

## Demonstration command

```bash
cd 03-api-bridge
python bridge.py \
  --url https://jsonplaceholder.typicode.com/users \
  --host jsonplaceholder.typicode.com \
  --field id --field name --field email \
  --output users.csv
python -m unittest test_bridge.py -v
```

The public test endpoint supplies illustrative entries; it is not a real client system. The network example depends on access and availability of the public endpoint. Offline tests do not make external HTTP requests.

## Deliverables

- [Source exporter](bridge.py)
- [Mocked network tests](test_bridge.py)
- [Operational README](README.md)

**Security caveats:** DNS rebinding, proxy configurations, OAuth, pagination, API-specific throttling and operational monitoring require dedicated assessment. This is **not** a complete SSRF defense or a security certification.

**Status:** implemented. Independent runtime/CI verification still needs confirmation.
