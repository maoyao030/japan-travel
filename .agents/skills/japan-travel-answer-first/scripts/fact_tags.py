#!/usr/bin/env python3
"""Check that every factual sentence in a tagged draft cites a fact-table row, then emit the reader preview.

用法：python3 fact_tags.py content-production/<article-id> [--json]
讀 draft-tagged.md 與 reference-review.md，檢查後寫出 reader-preview.md（去掉 [F12] 標記）。
事實用 F 編號；評論統整用 R 編號，記在研究記錄的「評論統整」表。
有問題時不寫出 reader-preview.md，結束碼為 1。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

TAG = re.compile(r"\s?\[([FR]\d+(?:\s*,\s*[FR]\d+)*)\]")
FACT_ROW = re.compile(r"^\|\s*([FR]\d+)\s*\|")
HEADING = re.compile(r"^#{1,6}\s")
# 需要事實編號的訊號：數字（含全形）、日文假名的設施或標示名稱以外的時間、價格、距離等。
NEEDS_TAG = re.compile(
    r"[0-9０-９]|只收|不找零|免費|需要預約|要預約|預約制|封閉|停駛|停航|休館|不能|禁止|可以刷|收現金|含稅|未稅|評論常提到|評論多半|評分"
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
    if body.startswith("「"):
        return [body]  # 日文句子連同中文說明當成一個單位
    return [part for part in re.split(r"(?<=[。？！])\s*", body) if part.strip()]


def check(directory: Path) -> dict:
    draft = (directory / "draft-tagged.md").read_text(encoding="utf-8")
    record = (directory / "reference-review.md").read_text(encoding="utf-8")
    known = {match.group(1) for line in record.splitlines() if (match := FACT_ROW.match(line))}
    issues: list[dict] = []
    used: set[str] = set()
    section = ""
    in_fence = False
    lines = draft.splitlines()

    def note(number: int, code: str, message: str, excerpt: str) -> None:
        issues.append({"line": number, "code": code, "message": message, "excerpt": excerpt[:80]})

    for number, line in enumerate(lines, 1):
        stripped = line.strip()
        if re.match(r"^(`{3,}|~{3,})", stripped):
            in_fence = not in_fence
            continue
        if in_fence:
            continue  # 範例（例如訂房信件格式）不是事實主張
        if HEADING.match(line):
            section = re.sub(r"^#+\s*", "", line).strip()
            continue
        if section in SKIP_SECTIONS or not stripped:
            continue

        tags = [tag.strip() for group in TAG.findall(line) for tag in group.split(",")]
        for tag in tags:
            used.add(tag)
            if tag not in known:
                note(number, "UNKNOWN_FACT", f"研究記錄的事實表或評論統整表沒有 {tag}", stripped)

        if stripped.startswith("|"):
            # 表格以整列為單位：欄名列、分隔列不檢查；有數字或條件的資料列至少要有一個編號。
            if re.fullmatch(r"\|[\s:|-]+\|?", stripped):
                continue
            previous = lines[number - 2].strip() if number >= 2 else ""
            if not previous.startswith("|"):
                continue
            if NEEDS_TAG.search(TAG.sub("", stripped)) and not tags:
                note(number, "UNTAGGED_CLAIM", "這一列有數字或條件，但沒有事實編號", stripped)
            continue

        for unit in split_units(line):
            plain = TAG.sub("", unit).strip()
            if plain.startswith("「"):
                continue  # 指給對方看的日文句子，由事實查核核對是否自然
            if re.fullmatch(r"\*\*[^*]+\*\*[：:]?", plain):
                continue  # 清單的粗體小標
            unit_tags = TAG.findall(unit)
            if NEEDS_TAG.search(plain) and not unit_tags:
                note(number, "UNTAGGED_CLAIM", "這句有數字或條件，但沒有事實編號", plain)

    preview = TAG.sub("", draft)
    return {
        "status": "tags_clear" if not issues else "tags_failed",
        "factsInTable": len(known),
        "factsUsed": sorted(used, key=lambda tag: (tag[0], int(tag[1:]))),
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
