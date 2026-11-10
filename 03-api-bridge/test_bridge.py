import csv
from io import BytesIO
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from bridge import (MAX_BYTES, export_rows, fetch_json, resolve_public_addresses,
                    safe_csv, validate_url)


class FakeResponse:
    def __init__(self, payload):
        self.buffer = BytesIO(payload)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.buffer.close()

    def read(self, size):
        return self.buffer.read(size)


class BridgeTests(unittest.TestCase):
    def test_only_operator_authorized_public_https(self):
        blocked = (
            "http://api.example.org/items", "https://not-allowed.example/items",
            "https://api.example.org:8080/items",
            "https://admin:secret@api.example.org/items",
            "https://api.example.org/items#fragment",
            "https://api.example.org\n@evil.example/items",
            "https://127.0.0.1/items",
            "https://localhost/items",
        )
        for url in blocked:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    validate_url(url, {"api.example.org"})

    def test_dns_fail_closed_if_any_answer_is_private(self):
        def fake_dns(hostname, port, type):
            return [(None, None, None, None, ("8.8.8.8", port)),
                    (None, None, None, None, ("10.10.1.5", port))]
        with self.assertRaisesRegex(ValueError, "non-public"):
            resolve_public_addresses("api.example.org", fake_dns)

    def test_dns_accept_global_only(self):
        def fake_dns(hostname, port, type):
            return [(None, None, None, None, ("8.8.8.8", port))]
        self.assertEqual(resolve_public_addresses("api.example.org", fake_dns), ["8.8.8.8"])

    def test_fetch_list_without_network(self):
        captured = {}
        def fake_transport(request, timeout):
            captured["url"] = request.full_url
            captured["timeout"] = timeout
            return FakeResponse(b'[{"id":1,"name":"A"}]')
        rows = fetch_json("https://api.example.org/items", {"api.example.org"},
                          transport=fake_transport)
        self.assertEqual(rows, [{"id": 1, "name": "A"}])
        self.assertEqual(captured["timeout"], 10)

    def test_api_token_is_never_sent_to_operator_chosen_host(self):
        headers = {}
        def fake_transport(request, timeout):
            headers.update(dict(request.header_items()))
            return FakeResponse(b"[]")
        with patch.dict(os.environ, {"API_TOKEN": "test_secret_must_not_leave"}):
            self.assertEqual(fetch_json("https://api.example.org/items",
                                        {"api.example.org"}, transport=fake_transport), [])
        self.assertNotIn("Authorization", headers)
        self.assertNotIn("test_secret_must_not_leave", str(headers))

    def test_fetch_data_envelope(self):
        rows = fetch_json("https://api.example.org/items", {"api.example.org"},
                          transport=lambda request, timeout: FakeResponse(b'{"data":[{"id":2}]}'))
        self.assertEqual(rows[0]["id"], 2)

    def test_reject_malformed_shape(self):
        with self.assertRaises(ValueError):
            fetch_json("https://api.example.org/items", {"api.example.org"},
                       transport=lambda request, timeout: FakeResponse(b'{"items":"bad"}'))

    def test_csv_formula_protection(self):
        self.assertEqual(safe_csv("=SUM(1)"), "'=SUM(1)")
        self.assertEqual(safe_csv("@admin"), "'@admin")
        self.assertEqual(safe_csv("\ufeff=SUM(1)"), "'\ufeff=SUM(1)")

    def test_reject_response_over_size_limit(self):
        with self.assertRaisesRegex(ValueError, "exceeds"):
            fetch_json(
                "https://api.example.org/items", {"api.example.org"},
                transport=lambda request, timeout: FakeResponse(b"x" * (MAX_BYTES + 1)),
            )

    def test_validate_host_before_transport(self):
        calls = []
        def fake_transport(request, timeout):
            calls.append(request)
            return FakeResponse(b"[]")
        with self.assertRaisesRegex(ValueError, "allowlist"):
            fetch_json("https://outside.example.net/items", {"api.example.org"},
                       transport=fake_transport)
        self.assertEqual(calls, [])

    def test_invalid_records_do_not_create_partial_export(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            with self.assertRaisesRegex(ValueError, "objects"):
                export_rows([{"id": 1}, None], ["id"], output)
            self.assertFalse(output.exists())
            with self.assertRaisesRegex(ValueError, "invalid records"):
                export_rows("not-a-list", ["id"], output)
            self.assertFalse(output.exists())

    def test_invalid_field_types_do_not_create_export(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            for fields in (None, "id", [None], [123], ["id", []], ["id", "id"]):
                with self.subTest(fields=fields):
                    with self.assertRaisesRegex(ValueError, "safe column"):
                        export_rows([{"id": 1}], fields, output)
                    self.assertFalse(output.exists())

    def test_serialization_failure_leaves_no_partial_csv(self):
        class BrokenValue:
            def __str__(self):
                raise RuntimeError("synthetic serialization failure")

        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            with self.assertRaisesRegex(RuntimeError, "serialization failure"):
                export_rows([{"id": 1}, {"id": BrokenValue()}], ["id"], output)
            self.assertFalse(output.exists())
            self.assertEqual(list(Path(temp).iterdir()), [])

    def test_existing_export_survives_publish_collision(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            output.write_text("original", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                export_rows([{"id": 2}], ["id"], output)
            self.assertEqual(output.read_text(encoding="utf-8"), "original")
            self.assertEqual(list(Path(temp).iterdir()), [output])

    def test_oversized_cell_leaves_no_export_or_staging_file(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            with self.assertRaisesRegex(ValueError, "8192"):
                export_rows([{"name": "x" * 8193}], ["name"], output)
            self.assertEqual(list(Path(temp).iterdir()), [])

    def test_utf8_export_limit_counts_encoded_bytes_and_cleans_up(self):
        from unittest.mock import patch as mock_patch
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            with mock_patch("bridge.MAX_EXPORT_BYTES", 12):
                with self.assertRaisesRegex(ValueError, "10 MB"):
                    export_rows([{"name": "é" * 5}], ["name"], output)
            self.assertEqual(list(Path(temp).iterdir()), [])

    def test_bounded_export_preserves_existing_output(self):
        from unittest.mock import patch as mock_patch
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            output.write_text("original", encoding="utf-8")
            with mock_patch("bridge.MAX_EXPORT_BYTES", 8):
                with self.assertRaisesRegex(ValueError, "10 MB"):
                    export_rows([{"name": "long-value"}], ["name"], output)
            self.assertEqual(output.read_text(encoding="utf-8"), "original")
            self.assertEqual(list(Path(temp).iterdir()), [output])

    def test_block_csv_column_formula_and_overwrite(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out.csv"
            with self.assertRaisesRegex(ValueError, "safe column"):
                export_rows([{"=evil": "x"}], ["=evil"], output)
            self.assertEqual(export_rows([{"id": 1, "name": "Alice"}],
                                         ["id", "name"], output), 1)
            with self.assertRaises(FileExistsError):
                export_rows([{"id": 2}], ["id"], output)
            with output.open(encoding="utf-8", newline="") as stream:
                self.assertEqual(list(csv.DictReader(stream))[0],
                                 {"id": "1", "name": "Alice"})


if __name__ == "__main__":
    unittest.main()
