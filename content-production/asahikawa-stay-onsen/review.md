# 驗收紀錄：asahikawa-stay-onsen（2026-11-18，住宿專門頁）

- 文章：`content-production/asahikawa-stay-onsen/reader-preview.md`（旭川溫泉飯店推薦，5間天然溫泉與7間大浴場飯店比較）
- SHA-256（換行統一成 LF 後計算）：`fe6d7884db21df0b49e26607b5747fd1fbdc9ad717be0641bea87f1618a78091`
- 規則：寫作 Skill `references/stay-topic-page.md`（住宿專門頁十步流程，Darren 2026-11-17 核准格式）、`references/sentence-rhythm.md`（Darren 2026-11-18）；Darren 2026-11-18 說「先上線三頁」。流程紀錄在 `content-experiments/stay-local-test-2026-11-16/onsen2/`。
- 研究：研究子代理（Opus 5.5）查官方來源；讀取工具讀不到的頁面由協調者用瀏覽器讀。
- 作者：作者子代理（Sonnet 5.5）；編輯：編輯子代理（Opus 5.5，沒寫過這篇）。
- 句子節奏：編輯子代理（Opus 5.5，沒寫過這篇），照 `sentence-rhythm.md`。
- 標題檢查：讀者驗收子代理的六題第 6 題；標題是 Darren 2026-11-17 核准的格式，沒有再改，見 `heading-review.json`。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），逐條開官方來源，共 6 輪（含潤稿後逐句複查、用瀏覽器重看住客評論）。
- 讀者驗收者：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），六題驗收，紀錄 `content-experiments/stay-local-test-2026-11-16/onsen2/acceptance2.md`。
- 協調：人工 session（Claude Code）。協調者照查核結果改了正文（見 `reference-review.md` 最後一節），並用瀏覽器逐條打開 Trip.com、Agoda 訂房連結、逐則確認 Instagram 貼文仍公開。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（Darren 核准的格式，沒改） |
| 讀者價值 | `acceptable`（六題都過；退回一次後過關） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，60 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 8778 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 訂房連結 | Trip.com、Agoda 連結由協調者 2026-11-18 用瀏覽器逐條打開，都是正文寫的那一間（紀錄在 `reference-review.md`；沒有列進 `fact-check.json`） |
| 圖片 | 封面是旭川市フォトライブラリー的實拍；嵌入 Instagram 貼文 6 則（住宿專門頁例外），沒有 AI 圖 |

**最終結果：`ready_for_user_preview`。** Darren 2026-11-18 要求上線。

## 經過

| 輪 | 做了什麼 | 結果 |
|---|---|---|
| 寫作 | 十步流程（問法、競品、讀者問題、補研究、規格、動筆前檢查、作者、查核、編輯） | 六題驗收退回一次後過關 |
| 查核 1～2 | 事實查核子代理逐條開官方來源 | 照官方原文改正文，見 `reference-review.md` 最後一節 |
| 潤稿 | 句子節奏（短句接起來） | 查核者逐句複查，沒有改到意思；指出不清楚的句子已改 |
| 住客說法 | 查核者用瀏覽器重看 Trip.com、Google 地圖、4travel | Dormy Inn 冰棒、WBF 浴池種類過關；JR Inn 只留「泡起來很舒服」；OMO7「水溫不夠熱」達不到門檻，拿掉 |
| 最後 | 查核者確認改過的句子 | 60 項全部 verified |

## 留給之後的事

- 事實還沒同步進地點事實表與 D1 的到期重查；下次重查日 2027-11-18。
- 查核提醒但這次沒處理的小事，記在 `reference-review.md` 最後一節。
- 線上〈旭川住宿〉還沒有連到這一頁。

最終結果：`ready_for_user_preview`
