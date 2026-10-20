---
name: japan-travel-topic-planner
description: Plan which pages the Japan travel site should build for a region before any writing starts — find places and topics with Japanese and Chinese Google autocomplete, tourism association lists and model courses, filter Taiwan homonyms and off-topic intent, group places that are visited together into travel groups, list place-by-topic, cross-place and shared-guide pages, assign each fact to one owner page, hand a whole-group outline to Darren through the planning Google Sheet with approval by default, and pick the next adjacent group automatically when the current group has 10 pages left. Use when the user asks to plan a region, pick topics, build the pilot list, or decide whether a topic deserves its own page. Do not write articles, publish, or treat a plan as publication authorization.
---

# 日本旅遊長尾站選題規劃

一次規劃一個區域，決定這個區域要有哪些頁面、每頁回答什麼、哪些問題寫成段落就好。目標是把「OTA 庫存蓋不到、大型日旅品牌不寫」的長尾題目寫完整，不是追大詞，也不是把每個關鍵字組合都開成一頁。

## 啟動前

1. 讀取根目錄 `AGENTS.md`、`PROJECT_STATUS.md`、`content-planning/handoff-2026-10-15.md`、`content-planning/handoff-2026-10-16.md`，以及本區域既有的規劃檔與發現清單（`content-planning/<區域>/`）。
2. 讀取 `src/data/categories.ts`、`content-automation/article-queue.json`，確認目前網站有哪些分類與已核准的頁面，避免重複規劃同一網址。
3. 完整閱讀 [選題流程](references/selection-workflow.md)、[找下一群](references/next-group.md) 與 [關鍵字來源](references/keyword-sources.md)。寫全站地點清單、分工表、地點事實表或群大綱時，讀 [規劃檔格式](references/planning-files.md) 並跑 `node scripts/check-planning.mjs`；要交接頁面規格時，再讀 [頁面規格](references/page-spec.md)；要處理研究帶回的新題目時，讀 [發現清單](references/discovery-log.md)；做地點研究時，讀 [景點比對與體驗研究](references/experience-research.md)。
4. 鎖定本次範圍：一個區域，例如北海道；或區域內的一組地點，例如稚內、利尻島、禮文島。

## 核心原則

- **旅行群**（2026-10-16 Darren 決定）：常一起去的地點算一群（例如稚內、宗谷岬、利尻、禮文），一群最多 6 個地點。規劃、研究、大綱都以群為單位，一群核准一次；2026-10-17 起採默許制，見 [找下一群](references/next-group.md)。
- **靠完整的內容群往外擴**（2026-10-17 Darren 確認）：一群做完整才換下一群，下一群只從相鄰的地點選，季節只決定先後。目前這群剩下的篇數大約夠寫 7 天（7 × 每天上限篇數）時自動找下一群，見 [找下一群](references/next-group.md)。
- **地點 × 主題，預設每個組合都成頁**。每個地點固定對一組主題（交通、住宿、步道與登山、景點、美食、祭典、天氣與季節），只要查得到可用來源就成一頁。但資料太少的組合不單獨成頁，併進地點主頁寫成一節（2026-10-17 Darren 決定，門檻見 [選題流程](references/selection-workflow.md) 第 4 步）。另外有跨地點頁與共用教學頁。
- **分工規則**：一件事只有一頁負責。只牽涉一地寫在該地主題頁；從出入口到該地寫在交通頁；同群兩地以上寫在跨地點頁；各地相同的操作寫在共用教學頁。所以渡輪沒有獨立頁，訂票寫成渡輪訂票教學頁。
- **不用 Ahrefs**。日文 Google 自動完成查地點與分群，中文 Google 自動完成查台灣讀者的主題與用詞，見 [關鍵字來源](references/keyword-sources.md)。
- **0 不等於沒人搜**。自動完成有出現、搜尋量工具顯示 0 的詞照樣列進 `mustAnswer`。搜尋量只用來排先寫哪一篇，不決定要不要寫。
- **一定要看搜尋結果頁**。台灣同名地名（岡山、松山、中山、板橋、豐原、川湯）與無關意圖（利尻昆布染髮劑、余市威士忌）只能靠實際搜尋結果判斷。
- **規劃不是授權**。整群大綱要經過核准（Darren 明確核准，或到自動核准日沒有反對）才能進文章清單。

## 流程摘要

完整步驟見 [選題流程](references/selection-workflow.md)。

1. 地區的第一群由 Darren 選地區；之後照 [找下一群](references/next-group.md) 自動找。
2. 找地點與主題：日文自動完成、觀光協會清單、モデルコース；中文自動完成。排除台灣同名與無關意圖。
3. 建地點關係、分成旅行群。
4. 產生頁面清單：地點 × 主題、跨地點頁、共用教學頁（全站已有就直接連）。
5. 地點研究：每個地點一份共用事實表。
6. 旅行群大綱：分工表、每頁 H1／H2／H3 與事實編號、內連表、缺口、寫作順序；跑大綱檢查程式。
7. 更新規劃總表 Google Sheet、在 Darren 的 Google 日曆提醒；Darren 核准或到自動核准日沒有反對，就寫進文章清單。
8. 上線 90 天後依 Search Console 檢討題目、標題與內連。

## 頁面類型

| 頁型 | 用途 | 例子 |
|---|---|---|
| 地點條目（主頁） | 值不值得去、住幾晚、幾月去，連到各主題頁 | 稚內、利尻島、禮文島 |
| 面向頁 | 地點 × 主題，預設每個組合都成頁 | 禮文島住宿、利尻島登山、稚內景點 |
| 跨地點頁 | 同一群兩地以上一起才講得清楚的事 | 利尻島與禮文島怎麼一起排 |
| 主題頁 | 與單一地點無關的題目 | 日本櫻花季、御朱印 |
| 共用教學頁 | 每個地方都一樣的操作，條目只寫在地差異再連過來 | Heartland Ferry 網路訂票、地方巴士整理券、看日文時刻表 |

網址採地點優先，最多三層（2026-10-16 Darren 確認）：地點條目 `/places/<地點>/`、面向頁 `/places/<地點>/<面向>/`、主題頁 `/seasons/<主題>/` 等。地點之間的關係（所屬地區、鄰近地點、出入口、適合月份）填在規格的 `place` 欄位，網站依這些欄位產生麵包屑與內連，不放進網址。填法見 [頁面規格](references/page-spec.md)。

## 授權邊界

- 本 Skill 不寫文章、不選圖、不寫入 Sanity、不改網站路由、不部署、不 commit 或 push。
- 規劃結果、自動完成紀錄與發現清單都不是發布授權。只有經過核准（明確核准或默許）的整群大綱、寫進 `content-automation/article-queue.json` 的頁面才能生產。例外情況不默許，見 [找下一群](references/next-group.md)。
- 關鍵字證據的 `provider` 記為 `Google autocomplete` 或 `SERP observation`，`ahrefsVerified` 一律 `false`。文章清單驗證程式支援 `Google autocomplete` 之前，進清單的頁面用 `SERP observation`。

## 完成條件

範圍內每個地點都有處理結果（屬於哪一群、併入鄰近條目、候補或排除，並寫明理由）；每個保留頁都有完整頁面規格，包含主要查詢、必答問題（含 0 量的長尾問題）、內容邊界、地點關係欄位與證據來源；沒有重複網址；整群大綱通過大綱檢查，規劃總表已更新、日曆已提醒；全站地點清單已登記。
