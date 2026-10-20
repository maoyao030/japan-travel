#!/usr/bin/env python3
"""Check Japan travel article mechanics; never certify evidence or editorial quality."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*#*\s*$")
URL = re.compile(r"https?://[^\s)>\]\"']+")
SOURCE_TITLES = {"資料來源", "參考資料"}
# 延伸資料：緊接在資料來源之前的一節，只列官方頁，可以放外部連結（2026-10-18 Darren 決定）
FURTHER_TITLES = {"延伸資料"}
PACKAGED = re.compile(r"先看結論|重點先看|重點整理|懶人包|TL;DR", re.I)
REVIEW_SIGNALS = (
    ("SOURCE_NARRATION", re.compile(r"(?:官網|網站|平台|來源).{0,6}(?:指出|表示|寫道)|目前查到|根據.{0,8}資料顯示"),
     "判斷整段的讀者用途與來源呈現，不只替換詞語。"),
    ("VAGUE_ADVICE", re.compile(r"建議提早規劃|請自行(?:安排|確認)|注意安全|以現場為準"),
     "保母等級寫法要給具體步驟或備案；判斷這句是否只是泛用提醒。"),
)
KANA = re.compile(r"[\u3040-\u30ff]")
YEN = re.compile(r"\d[\d,]*\s*(?:円|日圓|日幣)")
TAX = re.compile(r"税込|税別|含稅|未稅|稅前|稅後|免稅")


def normalize(title: str) -> str:
    return re.sub(r"[\W_]+", "", title, flags=re.UNICODE).casefold()


def visible_lines(markdown: str) -> list[tuple[int, str]]:
    """Ignore fenced examples without changing source line numbers."""
    output = []
    fence_char = None
    fence_length = 0
    for number, line in enumerate(markdown.splitlines(), 1):
        fence = re.match(r"^\s{0,3}(`{3,}|~{3,})", line)
        if fence:
            marker = fence.group(1)
            if fence_char is None:
                fence_char, fence_length = marker[0], len(marker)
                continue
            if marker[0] == fence_char and len(marker) >= fence_length:
                fence_char = None
                continue
        if fence_char is None:
            output.append((number, line))
    return output


def audit(markdown: str, article_type: str = "place-entry", reference_review: str | None = None,
          require_reference_review: bool = False) -> dict:
    # Legacy arguments remain accepted, but reference counts and page types are
    # context for human review, never proxies for article completeness.
    rows = visible_lines(markdown)
    headings = [(number, len(m.group(1)), m.group(2))
                for number, line in rows if (m := HEADING.match(line))]
    sources = [(number, title) for number, level, title in headings
               if level == 2 and title in SOURCE_TITLES]
    source_start = sources[0][0] if len(sources) == 1 else len(markdown.splitlines()) + 1
    further = [(number, title) for number, level, title in headings
               if level == 2 and title in FURTHER_TITLES]
    further_start = further[0][0] if len(further) == 1 and further[0][0] < source_start else source_start
    issues, signals = [], []
    content_headings = [heading for heading in headings if heading[0] < source_start]
    content_h2s = [heading for heading in content_headings if heading[1] == 2]
    content_h3s = [heading for heading in content_headings if heading[1] == 3]
    faq_headings = [heading for heading in content_headings
                    if heading[1] == 2 and re.search(r"常見(?:問題|問答)|FAQ", heading[2], re.I)]

    def fail(code: str, line: int, message: str) -> None:
        issues.append({"code": code, "line": line, "message": message})

    h1s = [h for h in headings if h[1] == 1]
    if len(h1s) != 1:
        fail("H1_COUNT", 1, "文章必須有且只有一個 H1。")
    if headings and headings[0][1] != 1:
        fail("HEADING_START", headings[0][0], "第一個標題須為 H1。")
    seen = set()
    previous_level = 0
    for number, level, title in headings:
        if previous_level and level > previous_level + 1:
            fail("HEADING_LEVEL_SKIP", number, "標題層級跳級。")
        previous_level = level
        key = normalize(title)
        if key in seen:
            fail("DUPLICATE_HEADING", number, "重複標題。")
        seen.add(key)
        if level == 1 and re.search(r"[：:]", title):
            fail("H1_COLON", number, "H1 使用冒號切開主題與說明。")
        if PACKAGED.search(title):
            fail("PACKAGED_HEADING", number, "標題使用專案停用的制式摘要標籤。")

    if len(content_h2s) >= 5 and not content_h3s:
        signals.append({"code": "FLAT_HEADING_TREE", "line": content_h2s[0][0],
                        "message": "長文 H 樹全部平鋪為 H2；請判斷是否有應歸入同一父題的 H3。"})
    if not faq_headings:
        signals.append({"code": "FAQ_MISSING", "line": 1,
                        "message": "沒有常見問題區；請核對研究中是否仍有正文未直接回答的真實問題。"})

    if not sources:
        fail("SOURCE_SECTION_MISSING", 1, "缺少文末資料來源。")
    elif len(sources) > 1:
        fail("SOURCE_SECTION_COUNT", sources[1][0], "資料來源區塊不只一個。")
    elif any(number > source_start and level <= 2 for number, level, _ in headings):
        fail("SOURCE_SECTION_POSITION", source_start, "資料來源須為最後一節。")
    if len(further) > 1:
        fail("FURTHER_READING_COUNT", further[1][0], "延伸資料區塊不只一個。")
    elif further and further[0][0] > source_start:
        fail("FURTHER_READING_POSITION", further[0][0], "延伸資料要放在資料來源之前。")
    elif further and any(further_start < number < source_start and level <= 2 for number, level, _ in headings):
        fail("FURTHER_READING_POSITION", further_start, "延伸資料要緊接在資料來源之前，中間不能有其他章節。")

    definitions = {}
    for number, line in rows:
        match = re.match(r"^\s*\[([^\]]+)\]:\s*<?(https?://[^\s>]+)", line)
        if match:
            definitions[match.group(1).strip().casefold()] = match.group(2)
    inline_links, source_links, further_links = 0, 0, 0
    for number, line in rows:
        urls = URL.findall(line)
        if number >= source_start:
            source_links += len(urls)
            continue
        if number >= further_start:
            further_links += len(urls)
            continue
        inline_links += len(urls)
        references = re.findall(r"\[([^\]]+)\](?:\[([^\]]*)\])?", line)
        linked_references = [label for label, target in references
                             if (target or label).strip().casefold() in definitions]
        if urls or linked_references:
            if not urls:
                inline_links += len(linked_references)
            fail("INLINE_SOURCE_LINK", number, "外部來源連結須集中在文末，包含參照式連結。")
        for code, pattern, message in REVIEW_SIGNALS:
            if pattern.search(line):
                signals.append({"code": code, "line": number, "message": message,
                                "excerpt": line[:200]})
        if not line.lstrip().startswith("|") and len(KANA.findall(line)) >= 25:
            signals.append({"code": "LONG_JAPANESE_RUN", "line": number,
                            "message": "這行有大段日文；確認是必要的指示句或標示，不是整段翻譯或照抄。",
                            "excerpt": line[:200]})
        if YEN.search(line) and not TAX.search(line):
            signals.append({"code": "PRICE_TAX_UNCLEAR", "line": number,
                            "message": "日圓價格沒有寫明含稅或未稅；官網有標示就在正文寫出，沒有標示就照官網的數字寫。",
                            "excerpt": line[:200]})
    if len(sources) == 1 and not source_links:
        fail("SOURCE_LINK_MISSING", source_start, "資料來源沒有外部連結。")

    return {
        "status": "mechanical_failed" if issues else "mechanical_clear",
        "scope": "mechanical_only",
        "articleDecision": "not_evaluated",
        "evidenceDecision": "not_evaluated",
        "articleType": article_type,
        "inputSha256": hashlib.sha256(markdown.encode("utf-8")).hexdigest(),
        "metrics": {"h1Count": len(h1s), "headingCount": len(headings),
                    "h2Count": len(content_h2s), "h3Count": len(content_h3s),
                    "faqSectionCount": len(faq_headings),
                    "inlineSourceLinks": inline_links, "sourceLinks": source_links,
                    "furtherReadingLinks": further_links},
        "issues": issues,
        "reviewSignals": signals,
        "referenceReviewProvided": bool(reference_review),
        "notice": "格式結果與退出碼不能核准文章。仍須另做讀者價值與事實查核。",
    }


def self_test() -> int:
    clear = "# 禮文島交通\n\n單程船票以官網公告為準。\n\n## 資料來源\n\n- [案例](https://example.com/case)\n"
    headings = "# 測試：說明\n\n### 重點整理\n\n### 重點整理\n"
    linked = clear.replace("單程船票以官網公告為準。", "[案例](https://example.com/case)的基本費用。")
    # A weak article and a legitimate referral both remain editorial decisions.
    weak = clear.replace("單程船票以官網公告為準。", "建議提早規劃，請自行安排交通。")
    necessary = clear.replace("單程船票以官網公告為準。", "單程船票 2,780 円，請注意安全。")
    further_ok = clear.replace("## 資料來源", "## 延伸資料\n\n- [宗谷巴士時刻表](https://example.com/bus)：班次與票價。\n\n## 資料來源")
    further_misplaced = further_ok.replace("## 資料來源", "## 其他\n\n內容。\n\n## 資料來源")
    report = {"passingCase": audit(clear), "headingFailingCase": audit(headings),
              "inlineLinkFailingCase": audit(linked), "semanticWeakCase": audit(weak),
              "necessaryConditionCase": audit(necessary), "furtherReadingCase": audit(further_ok),
              "furtherReadingMisplacedCase": audit(further_misplaced)}
    expected = {"H1_COLON", "HEADING_LEVEL_SKIP", "DUPLICATE_HEADING", "PACKAGED_HEADING"}
    ok = (report["passingCase"]["status"] == "mechanical_clear"
          and expected <= {i["code"] for i in report["headingFailingCase"]["issues"]}
          and any(i["code"] == "INLINE_SOURCE_LINK" for i in report["inlineLinkFailingCase"]["issues"])
          and report["semanticWeakCase"]["articleDecision"] == "not_evaluated"
          and report["necessaryConditionCase"]["status"] == "mechanical_clear"
          and any(i["code"] == "PRICE_TAX_UNCLEAR" for i in report["necessaryConditionCase"]["reviewSignals"])
          and any(i["code"] == "VAGUE_ADVICE" for i in report["semanticWeakCase"]["reviewSignals"])
          and report["furtherReadingCase"]["status"] == "mechanical_clear"
          and report["furtherReadingCase"]["metrics"]["furtherReadingLinks"] == 1
          and any(i["code"] == "FURTHER_READING_POSITION" for i in report["furtherReadingMisplacedCase"]["issues"]))
    print(json.dumps({"status": "passed" if ok else "failed", **report}, ensure_ascii=False, indent=2))
    return 0 if ok else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("article", nargs="?", help="Markdown path, or - for stdin")
    parser.add_argument("--article-type", choices=("place-entry", "aspect-page", "topic-page", "shared-guide"), default="place-entry")
    parser.add_argument("--reference-review", help="Optional research record; existence is not evidence validation")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if not args.article:
        parser.error("article is required unless --self-test is used")
    try:
        markdown = sys.stdin.read() if args.article == "-" else Path(args.article).read_text(encoding="utf-8-sig")
        reference_review = Path(args.reference_review).read_text(encoding="utf-8-sig") if args.reference_review else None
    except OSError as error:
        parser.error(str(error))
    report = audit(markdown, args.article_type, reference_review)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(report["status"])
        print(report["notice"])
        for item in report["issues"]:
            print(f"{item['line']}: {item['code']}: {item['message']}")
        for item in report["reviewSignals"]:
            print(f"待判讀 {item['line']}: {item['message']}")
    return 1 if report["issues"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
