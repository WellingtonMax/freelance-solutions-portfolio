"""Offline, authorized HTML snapshot comparison. No URLs, fetching or scraping."""
import argparse
import difflib
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path

MAX_BYTES = 256_000
MAX_BLOCKS = 500
MAX_BLOCK_LENGTH = 300


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocked = []
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "template", "head", "svg"}:
            self.blocked.append(tag)

    def handle_endtag(self, tag):
        if self.blocked and tag == self.blocked[-1]:
            self.blocked.pop()

    def handle_data(self, data):
        if self.blocked:
            return
        data = re.sub(r"\s+", " ", data).strip()
        if data:
            if len(data) > MAX_BLOCK_LENGTH or len(self.blocks) >= MAX_BLOCKS:
                raise ValueError("visible content complexity limit exceeded")
            self.blocks.append(data)


def blocks(data):
    if len(data) > MAX_BYTES:
        raise ValueError("HTML snapshot exceeds 256 KB")
    try:
        decoded = data.decode("utf-8-sig")
    except UnicodeError as exc:
        raise ValueError("snapshot must be UTF-8") from exc
    parser = VisibleText()
    try:
        parser.feed(decoded)
        parser.close()
    except (AssertionError, IndexError) as exc:
        raise ValueError("malformed HTML") from exc
    return parser.blocks


def compare(before, after):
    first = blocks(before)
    second = blocks(after)
    matcher = difflib.SequenceMatcher(None, first, second, autojunk=True)
    changes = []
    total_changes = 0
    for tag, a0, a1, b0, b1 in matcher.get_opcodes():
        if tag == "equal":
            continue
        total_changes += 1
        if len(changes) < 10:
            changes.append({"type": tag, "before_blocks": a1 - a0, "after_blocks": b1 - b0,
                            "before_excerpt": " | ".join(first[a0:a1])[:160],
                            "after_excerpt": " | ".join(second[b0:b1])[:160]})
    return {"status": "offline_comparison", "changed": first != second,
            "before_sha256": hashlib.sha256(before).hexdigest(),
            "after_sha256": hashlib.sha256(after).hexdigest(),
            "visible_blocks_before": len(first),
            "visible_blocks_after": len(second),
            "first_10_changes": changes,
            "truncated_change_list": total_changes > 10}


def read_snapshot(path):
    """Read at most the accepted input size plus one byte (including on file growth)."""
    with path.open("rb") as stream:
        data = stream.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("HTML snapshot exceeds 256 KB")
    return data


def main():
    parser = argparse.ArgumentParser(description="Compare two authorized local HTML snapshots")
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    args = parser.parse_args()
    try:
        before = read_snapshot(args.before)
        after = read_snapshot(args.after)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(compare(before, after), indent=2))


if __name__ == "__main__":
    main()
