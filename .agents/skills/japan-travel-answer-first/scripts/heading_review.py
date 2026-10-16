#!/usr/bin/env python3
"""檢查標題檢查紀錄 heading-review.json 已套用到 reader-preview.md。

只檢查紀錄完整與套用一致，不判斷標題好壞：
- 每個改動都有理由；
- reader-preview.md 的標題順序與層級，等於紀錄的 after；
- 標題數量與層級沒有被增刪或改動；
- H1 與 SEO Title 不含冒號，問句以全形「？」結尾；
- 固定分章名稱（常見問題、資料來源）沒有被改。

用法：python3 heading_review.py <文章資料夾> [--json]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

FIXED = {"常見問題", "資料來源"}
HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$")


def headings(markdown: str) -> list[tuple[int, str]]:
    found, fenced = [], False
    for line in markdown.splitlines():
        if line.strip().startswith("```"):
            fenced = not fenced
            continue
        match = None if fenced else HEADING.match(line)
        if match:
            found.append((len(match.group(1)), match.group(2)))
    return found


def check(record: dict, preview: str) -> list[str]:
    issues: list[str] = []
    if not str(record.get("checker", "")).strip():
        issues.append("checker 不得為空")
    items = record.get("items")
    if not isinstance(items, list) or not items:
        return issues + ["items 至少要有一筆標題"]

    for index, item in enumerate(items):
        before, after = str(item.get("before", "")), str(item.get("after", ""))
        if not after:
            issues.append(f"items[{index}].after 不得為空")
        if before != after and not str(item.get("reason", "")).strip():
            issues.append(f"items[{index}] 改了標題但沒寫理由：{before} → {after}")
        if before in FIXED and after != before:
            issues.append(f"items[{index}] 改了固定分章名稱「{before}」")
        if after.endswith("?"):
            issues.append(f"items[{index}] 問句要用全形「？」：{after}")

    expected = [(int(item.get("level", 0)), str(item.get("after", ""))) for item in items]
    actual = headings(preview)
    if [level for level, _ in expected] != [level for level, _ in actual]:
        issues.append("reader-preview.md 的標題數量或層級和紀錄不同；標題檢查不得增刪標題或改層級")
    else:
        for (level, want), (_, got) in zip(expected, actual):
            if want != got:
                issues.append(f"H{level} 尚未套用：紀錄是「{want}」，文章是「{got}」")

    h1 = [text for level, text in actual if level == 1]
    if len(h1) != 1:
        issues.append(f"H1 應該剛好一個，目前 {len(h1)} 個")
    seo = record.get("seoTitle") or {}
    seo_after = str(seo.get("after", "")).strip()
    if not seo_after:
        issues.append("seoTitle.after 不得為空（沿用 H1 時填 H1）")
    if seo.get("before") != seo.get("after") and not str(seo.get("reason", "")).strip():
        issues.append("seoTitle 改了但沒寫理由")
    for label, text in [("H1", h1[0] if h1 else ""), ("SEO Title", seo_after)]:
        if ":" in text or "：" in text:
            issues.append(f"{label} 不得用冒號：{text}")

    notes = record.get("structureNotes", [])
    if not isinstance(notes, list):
        issues.append("structureNotes 必須是陣列")
    return issues


def main() -> int:
    args = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    as_json = "--json" in sys.argv
    if not args:
        print("用法：python3 heading_review.py <文章資料夾> [--json]", file=sys.stderr)
        return 2
    folder = Path(args[0])
    record_path, preview_path = folder / "heading-review.json", folder / "reader-preview.md"
    if not record_path.exists() or not preview_path.exists():
        print("文章資料夾缺少 heading-review.json 或 reader-preview.md", file=sys.stderr)
        return 2
    record = json.loads(record_path.read_text(encoding="utf-8"))
    issues = check(record, preview_path.read_text(encoding="utf-8"))
    changed = sum(1 for item in record.get("items", []) if item.get("before") != item.get("after"))
    status = "headings_applied" if not issues else "headings_failed"
    if as_json:
        print(json.dumps({"status": status, "changed": changed, "issues": issues}, ensure_ascii=False, indent=2))
    else:
        print(f"{status}：改動 {changed} 個標題")
        for issue in issues:
            print(f"- {issue}")
    return 0 if not issues else 1


if __name__ == "__main__":
    sys.exit(main())
