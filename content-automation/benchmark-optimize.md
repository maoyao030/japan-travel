# 標竿優化：把已上線文章改到東川的水準（2026-11-05）

Darren 2026-11-05：東川這篇可以當標竿，要做成流程；一次改不到位，要分輪。

東川是這樣改出來的，流程照同樣的順序拆開：Darren 先改語氣 → 名字改成漢字與官方中文名 → 表格補官網與地圖 → 原文括號的頻率 → 照 WHOOPS 規則修標題結構與 H1 → Darren 看過才上傳。每一輪只做一件事、由不同的助手做，做完跑檢查才進下一輪；最後 Darren 一節一節看。

標竿檔案：`content-automation/benchmark/higashikawa-before.md`（優化前，2026-11-03 線上版）、`higashikawa-after.md`（優化後）。每一輪的助手都要先讀這兩份對照，再讀寫作 Skill `references/examples.md` 第6節。

## 口令

- 「標竿優化一篇」：照第 0 步挑一篇，跑第 1～5 輪，到第 6 輪停下來給 Darren 看。
- 「標竿優化 <文章>」：指定文章。
- Darren 看過說「上傳」：第 7 步。

## 第 0 步：挑文章、以線上版當底稿

1. 沒指定時用 `npm run optimize:today` 挑（住宿頁最前）。同一時間只做一篇。
2. 後台有草稿或還沒同步的手動修改，先照 `chat-optimize.md` 第 1 步抓回。
3. `node scripts/sync-from-live.mjs --article=<文章> --apply`：把網站上的現行正文抓回 `reader-preview.md`（Git 稿件和線上不一致的文章很多，一律以線上為準），底稿存在 `benchmark/live-<日期>.md`。
4. 在 `.agents/working/claude-code.md` 寫下這篇。

## 第 1～5 輪：每輪一個助手、只做一件事

每一輪：助手讀標竿對照與該輪的規則，只改該輪負責的地方，在 `content-production/<文章>/benchmark/notes.md` 加一節「第 N 輪」列出改了哪裡、為什麼；改完協調者跑

```
node scripts/check-benchmark.mjs --before=content-production/<文章>/benchmark/live-<日期>.md --after=content-production/<文章>/reader-preview.md --place=<地名>
node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs content-production/<文章>/reader-preview.md
```

有錯誤就交回同一個助手修，通過才進下一輪。數字不見了一律算錯，除非 notes 寫明是故意刪掉並說明理由。

| 輪 | 負責 | 依據 | 不做 |
|---|---|---|---|
| 1 標題結構 | H1 涵蓋整頁、不用宣傳語；每個 H3 接在 H2 後面唸得通（不屬於就升成 H2 或換位置）；讀者真的會搜尋的問題寫成問句、下一句就是答案；H2 帶地名 | `heading-style.md`（WHOOPS）、寫作指南第1條 | 不改正文內容 |
| 2 名字 | 名字照漢字與台灣慣用譯名的順序；先查 HOKKAIDO LOVE 與當地 DMO 繁中頁的官方名稱（DMO 是機器翻譯，翻錯的不用）；原文括號第一次＋專門那一節各一次 | `japanese-sources.md`「譯名表」、寫作指南第15條、`glossary.json` | 不改句子；新名字寫進 `glossary.json` |
| 3 連結 | 景點資訊欄「連結」列、住宿表「連結」欄，官網要打得開；正文提到的站內頁有連結句 | 寫作指南第12條、`scripts/table-links.mjs` | 不改文字 |
| 4 語氣 | 照 Darren 的語氣一節一節改：事實之間寫出關係、會卡住的事實後面直接提醒、推薦一節最多一句、口語一點 | 寫作指南第17條、`examples.md` 第6節、標竿對照 | 不加沒有事實撐的話；數字、時間、條件一個都不動 |
| 5 核對 | 另一個沒參與改寫的助手逐句比對底稿與新稿：新加的提醒和推論都有事實撐、條件沒跑掉、沒有新錯字 | 潤稿 Skill `agents/meaning-drift.md` 的做法 | 只列問題，交回該輪修 |

第 4 輪最容易一次寫太多：先改第一個 H2，協調者看過符合標竿再改其他節。

## 第 6 步：Darren 看

照 `chat-optimize.md` 第 2～4 步：一節一節貼給 Darren，附「這節改了什麼」（從 notes.md 摘），Darren 的文字為準。Darren 改過的地方記下來，第 8 步用。

## 第 7 步：上傳

1. `heading-review.json` 同步新標題（`heading_review.py` 要是 `headings_applied`）。
2. 在 `studio/` 跑 `replace-article-body.mjs --manual`（Darren 看過才上傳，算一次優化，標題可以改）：先預覽確認 `notCarried` 是空的，再 `--apply`。
3. commit，照 Git 規則推 `main`，等網站重建後打開確認。

## 第 8 步：讓流程越改越好

- Darren 在第 6 步改過的地方，能重複用的寫進對應那一輪的規則檔（語氣進寫作指南第17條與 `examples.md` 第6節，標題進 `heading-style.md`「Darren 增訂規則」，名字進 `japanese-sources.md`）。
- 自動檢查能抓的就加進 `scripts/check-benchmark.mjs`。
- 有比東川更好的成品時，換掉或加進 `content-automation/benchmark/` 的標竿。
