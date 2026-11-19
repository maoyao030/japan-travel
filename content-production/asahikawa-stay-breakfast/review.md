# 驗收紀錄：asahikawa-stay-breakfast（2026-11-18，住宿專門頁）

- 文章：`content-production/asahikawa-stay-breakfast/reader-preview.md`（旭川飯店早餐推薦，13間飯店的早餐時間與菜色比較）
- SHA-256（換行統一成 LF 後計算）：`235125642e2b3d508c7cb1906b61cc0e71f4dbd683f8c354e49d98ac6093e673`
- 規則：寫作 Skill `references/stay-topic-page.md`（住宿專門頁十步流程，Darren 2026-11-17 核准格式）、`references/sentence-rhythm.md`（Darren 2026-11-18）；Darren 2026-11-18 說「先上線三頁」。流程紀錄在 `content-experiments/stay-local-test-2026-11-16/breakfast/`。
- 研究：研究子代理（Opus 5.5）查官方來源；讀取工具讀不到的頁面由協調者用瀏覽器讀。
- 作者：作者子代理（Sonnet 5.5）；編輯：編輯子代理（Opus 5.5，沒寫過這篇）。
- 句子節奏：編輯子代理（Opus 5.5，沒寫過這篇），照 `sentence-rhythm.md`。
- 標題檢查：讀者驗收子代理的六題第 6 題；標題是 Darren 2026-11-17 核准的格式，沒有再改，見 `heading-review.json`。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），逐條開官方來源，共 6 輪（含潤稿後逐句複查、用瀏覽器重看住客評論）。
- 讀者驗收者：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），六題驗收，紀錄 `content-experiments/stay-local-test-2026-11-16/breakfast/acceptance4.md`。
- 協調：人工 session（Claude Code）。協調者照查核結果改了正文（見 `reference-review.md` 最後一節），並用瀏覽器逐條打開 Trip.com、Agoda 訂房連結、逐則確認 Instagram 貼文仍公開。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（Darren 核准的格式，沒改） |
| 讀者價值 | `acceptable`（六題都過；退回一次後過關） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，68 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 9079 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 訂房連結 | Trip.com、Agoda 連結由協調者 2026-11-18 用瀏覽器逐條打開，都是正文寫的那一間（紀錄在 `reference-review.md`；沒有列進 `fact-check.json`） |
| 圖片 | 封面是旭川市フォトライブラリー的實拍；嵌入 Instagram 貼文 10 則（住宿專門頁例外），沒有 AI 圖 |

**最終結果：`ready_for_user_preview`。** Darren 2026-11-18 要求上線。

## 經過

| 輪 | 做了什麼 | 結果 |
|---|---|---|
| 寫作 | 十步流程（問法、競品、讀者問題、補研究、規格、動筆前檢查、作者、查核、編輯） | 六題驗收退回一次後過關 |
| 查核 1～2 | 事實查核子代理逐條開官方來源 | 照官方原文改正文，見 `reference-review.md` 最後一節 |
| 潤稿 | 句子節奏（短句接起來） | 查核者逐句複查，沒有改到意思；指出不清楚的句子已改 |
| 住客說法 | 查核者用瀏覽器重看 Trip.com、Google 地圖、4travel | AMANEK 過關；WBF 改寫（拿掉「種類多」）；OMO7「早餐區很擠」、JR Inn「早餐普通」達不到門檻，拿掉 |
| 最後 | 查核者確認改過的句子 | 68 項全部 verified |

## 留給之後的事

- 事實還沒同步進地點事實表與 D1 的到期重查；下次重查日 2027-11-18。
- 查核提醒但這次沒處理的小事，記在 `reference-review.md` 最後一節。
- 線上〈旭川住宿〉還沒有連到這一頁。

最終結果：`ready_for_user_preview`

## 2026-11-19 補「住客怎麼說」小段

- Darren 看了達門檻卻沒寫進去的住客說法後說「這些都是很棒的資訊啊，可以都放啊」，取消一間一句的上限；每間細寫的旅館多一個「住客怎麼說」小段，官方事實與住客說法分開。紀錄在研究資料夾的 `guest/notes.md`。
- 事實查核（同一位查核子代理，Opus 5.5）逐點對評論紀錄：針對早餐重讀評論（一個點記一筆）後擋 2 條（細節超出紀錄、和官網衝突），改完全過；條列且不寫「有人說」；最後 81 項全部 verified。
- 讀者驗收沒有重做：只加了住客說法小段，標題、結構、官方事實沒有變。
- 上一版 SHA：`9c4aa77623b50af2006312c0cfda564bd52d55bf69f66122e57f9898cdedbb3d`。
