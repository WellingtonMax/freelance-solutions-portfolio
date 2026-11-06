# API Bridge — Authorized JSON API to CSV

**Client problem:** manual copying of data from an existing JSON API into spreadsheets.

**Deliverable:** reusable command-line exporter with hostname allowlist, HTTPS-only policy, timeout, bounded retries, response-size cap, configurable fields and CSV formula escaping. No third-party packages.

## Run tests (offline, without credentials)

```bash
cd 03-api-bridge
python -m unittest test_bridge.py -v
```

## Example with a public, authorized API

```bash
python bridge.py --url https://jsonplaceholder.typicode.com/users \
  --host jsonplaceholder.typicode.com --field id --field name --field email \
  --output users.csv
```

The example contacts originate from a public test service, not real client data. Network access is needed for the example only; tests use a fake HTTP transport.

**Credential policy:** this standalone demo **never reads or sends `API_TOKEN`**, even when it exists in the environment. Automatic forwarding to a caller-chosen hostname was removed. Authenticated enterprise integrations require a **separate** implementation with administrator-owned endpoint policy and credentials scoped to each approved service. Never commit tokens, .env files or exported client data to Git.

**Additional red-team checks:** Unicode format/control characters and whitespace before spreadsheet formula markers are handled conservatively; invalid DNS hostnames with empty labels are rejected before any network access.

**Security and scope:** the operator supplies an exact allowlist (never take it from an untrusted end user); HTTPS and public-IP DNS validation are required, the connection is **pinned to a checked public IP** with TLS verification of the original hostname, and redirects/proxies are not followed. Responses are bounded to 2 MB / 20,000 records; exports cannot overwrite existing files; CSV column names are restricted. The tool deliberately supports only *public unauthenticated* endpoints. Do **not** expose the CLI as a service accepting arbitrary user-supplied URLs or allowlists; service-side authorization, egress firewalls, limits and project-specific threat modeling are required. Use only endpoints and data you are authorized to access. Pagination, rate-limit contracts, schema mapping, production monitoring and OAuth require project-specific engineering.
