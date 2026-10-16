---
name: japan-travel-topic-planner
description: Plan which pages the Japan travel site should build for a region before any writing starts — list places, filter Taiwan homonyms and off-topic intent, collect place-by-aspect keyword combinations from Ahrefs, Google autocomplete and the discovery log, decide which combinations become standalone pages and which become must-answer sections inside a place entry, then hand page specs to Darren for approval. Use when the user asks to plan a region, pick topics, build the pilot list, or decide whether a topic deserves its own page. Do not write articles, publish, or treat a plan as publication authorization.
---

# 日本旅遊長尾站選題規劃

一次規劃一個區域，決定這個區域要有哪些頁面、每頁回答什麼、哪些問題寫成段落就好。目標是把「OTA 庫存蓋不到、大型日旅品牌不寫」的長尾題目寫完整，不是追大詞，也不是把每個關鍵字組合都開成一頁。

## 啟動前

1. 讀取根目錄 `AGENTS.md`、`PROJECT_STATUS.md`、`content-planning/handoff-2026-10-15.md`，以及本區域既有的規劃檔與發現清單（`content-planning/<區域>/`）。
2. 讀取 `src/data/categories.ts`、`content-automation/article-queue.json`，確認目前網站有哪些分類與已核准的頁面，避免重複規劃同一網址。
3. 完整閱讀 [選題流程](references/selection-workflow.md) 與 [關鍵字來源](references/keyword-sources.md)。要交接頁面規格時，再讀 [頁面規格](references/page-spec.md)；要處理研究帶回的新題目時，讀 [發現清單](references/discovery-log.md)。
4. 鎖定本次範圍：一個區域，例如北海道；或區域內的一組地點，例如稚內、利尻島、禮文島。

## 核心原則

- **地點 × 主題，預設每個組合都成頁**（2026-10-16 Darren 決定）。每個地點固定對一組主題（交通、住宿、步道與登山、景點、美食、祭典、天氣與季節），只要有官方查得到的事實就成一頁，小地方寫短也是一頁。地點條目是主頁，只寫值不值得去、住幾晚、幾月去，再連到各主題頁；跨地點共用的題目（例如三島渡輪）寫一頁讓各地點連過去。
- **0 不等於沒人搜**。Ahrefs 對繁中小詞覆蓋不完整，顯示 0 或 10 的組合照樣當有流量、照樣成頁。搜尋量只用來排先寫哪一篇。
- **不依賴 Ahrefs 發現題目**。Ahrefs 只做兩件事：確認地名本身有沒有量與陷阱，以及排優先順序。題目主要來自觀光協會、日文官方資料、Google 自動完成、相關問題與研究時的發現清單。
- **一定要看搜尋結果頁**。台灣同名地名（岡山、松山、中山、板橋、豐原、川湯）與無關意圖（利尻昆布染髮劑、余市威士忌）只能靠實際搜尋結果判斷。
- **規劃不是授權**。每頁都要 Darren 核准才能進文章清單。

## 流程摘要

完整步驟與門檻見 [選題流程](references/selection-workflow.md)。

1. 挑區域：選四到六個月後是旺季的區域。
2. 列地點：觀光協會清單、地圖、日文官方資料。
3. 篩地點：地名沒有量的，若是路線上的一站就寫進鄰近條目，否則記進候補。
4. 篩意圖：排除台灣同名地名與無關意圖。
5. 收集組合詞：Ahrefs 的實際組合、固定面向清單、Google 自動完成與相關問題、發現清單。
6. 展開組合：每個地點 × 固定主題各一頁；完全查不到官方資料的組合才不做，並寫明原因。
7. 排優先順序：搜尋量、季節提前量、前五名有沒有繁中好答案。
8. 寫頁面規格，交給 Darren 核准。
9. 上線 90 天後依 Search Console 檢討題目、標題與內連。

## 頁面類型

| 頁型 | 用途 | 例子 |
|---|---|---|
| 地點條目（主頁） | 值不值得去、住幾晚、幾月去，連到各主題頁 | 稚內、利尻島、禮文島 |
| 面向頁 | 地點 × 主題，預設每個組合都成頁 | 禮文島住宿、利尻島登山、稚內景點、三島渡輪 |
| 主題頁 | 與單一地點無關的題目 | 日本櫻花季、御朱印 |
| 共用教學頁 | 每個地方都一樣的操作，條目只寫在地差異再連過來 | 地方巴士整理券、看日文時刻表、在日文官網訂房 |

網址採地點優先，最多三層（2026-10-16 Darren 確認）：地點條目 `/places/<地點>/`、面向頁 `/places/<地點>/<面向>/`、主題頁 `/seasons/<主題>/` 等。地點之間的關係（所屬地區、鄰近地點、出入口、適合月份）填在規格的 `place` 欄位，網站依這些欄位產生麵包屑與內連，不放進網址。填法見 [頁面規格](references/page-spec.md)。

## 授權邊界

- 本 Skill 不寫文章、不選圖、不寫入 Sanity、不改網站路由、不部署、不 commit 或 push。
- 規劃結果、Ahrefs 數據與發現清單都不是發布授權。只有 Darren 明確核准、寫進 `content-automation/article-queue.json` 的頁面才能生產。
- Ahrefs 未連接時只能做搜尋結果觀察，`provider` 記為 `SERP observation`，不得標成 Ahrefs 已驗證。

## 完成條件

範圍內每個地點都有處理結果（條目、併入鄰近條目、候補或排除，並寫明理由）；每個保留頁都有完整頁面規格，包含主要查詢、必答問題（含 0 量的長尾問題）、內容邊界、地點關係欄位與證據來源；沒有重複網址；已列出需要 Darren 核准的清單。
