#!/usr/bin/env python3
"""Check that every factual sentence in a tagged draft cites a fact-table row, then emit the reader preview.

用法：python3 fact_tags.py content-production/<article-id> [--json]
讀 draft-tagged.md 與 reference-review.md，檢查後寫出 reader-preview.md（去掉 [F12] 標記）。
有問題時不寫出 reader-preview.md，結束碼為 1。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

TAG = re.compile(r"\s?\[(F\d+(?:\s*,\s*F\d+)*)\]")
FACT_ROW = re.compile(r"^\|\s*(F\d+)\s*\|")
HEADING = re.compile(r"^#{1,6}\s")
# 需要事實編號的訊號：數字（含全形）、日文假名的設施或標示名稱以外的時間、價格、距離等。
NEEDS_TAG = re.compile(
    r"[0-9０-９]|只收|不找零|免費|需要預約|要預約|預約制|封閉|停駛|停航|休館|不能|禁止|可以刷|收現金|含稅|未稅"
)
SKIP_SECTIONS = {"資料來源", "參考資料"}


def split_units(line: str) -> list[str]:
    """表格每格、清單每項、段落每句各自檢查。"""
    body = line.strip()
    if body.startswith("|"):
        if re.fullmatch(r"\|[\s:|-]+\|?", body):
            return []
        return [cell.strip() for cell in body.strip("|").split("|") if cell.strip()]
    body = re.sub(r"^(?:[-*]|\d+\.)\s+", "", body)
    return [part for part in re.split(r"(?<=[。？！])", body) if part.strip()]


def check(directory: Path) -> dict:
    draft = (directory / "draft-tagged.md").read_text(encoding="utf-8")
    record = (directory / "reference-review.md").read_text(encoding="utf-8")
    known = {match.group(1) for line in record.splitlines() if (match := FACT_ROW.match(line))}
    issues: list[dict] = []
    used: set[str] = set()
    section = ""
    header_row_pending = False

    for number, line in enumerate(draft.splitlines(), 1):
        if HEADING.match(line):
            section = re.sub(r"^#+\s*", "", line).strip()
            header_row_pending = False
            continue
        if section in SKIP_SECTIONS or not line.strip():
            continue
        stripped = line.strip()
        if stripped.startswith("|") and not header_row_pending and not re.fullmatch(r"\|[\s:|-]+\|?", stripped):
            # 表格第一列是欄名，不需要編號。
            previous = draft.splitlines()[number - 2].strip() if number >= 2 else ""
            if not previous.startswith("|"):
                header_row_pending = True
                continue
        if not stripped.startswith("|"):
            header_row_pending = False
        for unit in split_units(line):
            tags = [tag.strip() for group in TAG.findall(unit) for tag in group.split(",")]
            for tag in tags:
                used.add(tag)
                if tag not in known:
                    issues.append({"line": number, "code": "UNKNOWN_FACT", "message": f"研究記錄的事實表沒有 {tag}", "excerpt": unit[:80]})
            plain = TAG.sub("", unit)
            if NEEDS_TAG.search(plain) and not tags:
                issues.append({"line": number, "code": "UNTAGGED_CLAIM", "message": "這句有數字或條件，但沒有事實編號", "excerpt": plain[:80]})

    preview = TAG.sub("", draft)
    return {
        "status": "tags_clear" if not issues else "tags_failed",
        "factsInTable": len(known),
        "factsUsed": sorted(used, key=lambda tag: int(tag[1:])),
        "issues": issues,
        "preview": preview,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("directory")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    directory = Path(args.directory)
    result = check(directory)
    preview = result.pop("preview")
    if result["status"] == "tags_clear":
        (directory / "reader-preview.md").write_text(preview, encoding="utf-8")
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"{result['status']}：事實表 {result['factsInTable']} 筆，正文用到 {len(result['factsUsed'])} 筆")
        for issue in result["issues"]:
            print(f"- 第 {issue['line']} 行 {issue['code']}：{issue['message']}｜{issue['excerpt']}")
    return 0 if result["status"] == "tags_clear" else 1


if __name__ == "__main__":
    sys.exit(main())
