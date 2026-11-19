# 驗收紀錄：rishiri-island-stay（2026-11-19，舊住宿頁重跑一輪）

- 文章：`content-production/rishiri-island-stay/reader-preview.md`（利尻島住宿推薦，住鴛泊還是沓形？）
- SHA-256（換行統一成 LF 後計算）：`54a9fa7c4abf889b613b7d13d7fc1ddab096dc1af4ae8235883909ad05753406`
- 規則：`content-experiments/stay-rerun-2026-11-18/RUNBOOK.md`、寫作 Skill `references/stay-page.md`、`sentence-rhythm.md`、`stay-topic-page.md`「自動化」「廢話要在流程裡擋掉」「份量檢查」。舊版封包在 `pre-rerun-2026-11-18/`。
- 研究：`content-experiments/stay-rerun-2026-11-18/rishiri-island/` 的 `queries.md`、`facts.md`、`facts-extra.md`、`facts-reviews.md`、`booking-links.md`。住客評論由查核角色的子代理（Opus 5.5）2026-11-19 用瀏覽器讀（Trip.com、4travel、Google 地圖，沒登入）。
- 寫作：規格助手（Opus 5.5）→ 五段各一位作者（Sonnet 5.5）→ 四位分段編輯（Opus 5.5）→ 一位接縫編輯兼句子節奏與份量檢查（Opus 5.5，`seam-notes.md`，細寫六間都判剛好）。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），3 輪：第 1 輪 151 筆裡 2 筆 incorrect、2 筆 unsupported、1 筆 unreachable；第 2 輪剩 1 筆；第 3 輪 147 筆全部 verified。
- 讀者驗收：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），七題驗收 2 次（`acceptance1.md` 第 3、4、5 題不過；`acceptance2.md` 七題都過）。第 2 次之後只照查核改了利尻飯店冷氣一句，由事實查核第 3 輪確認。
- 協調：人工 session（Claude Code），照岔路的預設，沒有問 Darren。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（七題第 6 題過） |
| 讀者價值 | `acceptable`（七題都過，含第 7 題份量；退回一次後過關） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，147 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 4,750 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 沿用線上的封面與文內照片；細寫的旅館各找 1 則 Instagram 貼文（找得到合格的才放） |

**最終結果：`ready_for_user_preview`。** 換掉線上的舊版。

## 協調者的決定

- H1 從「利尻島住宿，怎麼選區與冬季休館」改成「利尻島住宿推薦，住鴛泊還是沓形？」，仍包含主要查詢「利尻島住宿」。
- 冬天只寫「確定訂得到」的四間（Rera Moshiri 2027 年 1 月 6 日起、雪國、Nari田、中原旅館）；觀光協會標全年營業但查不到訂房的不寫成能住。
- 雪國的溫泉照官網寫（溫泉浴池只開到 10 月底），住客說冬天也泡得到和官網衝突，不寫。
- 利尻富士觀光飯店官網打不開、官方事實不夠，不開小節，用一句好壞都有的住客說法帶過並附訂房連結。
- Island Inn利尻 2027 年 5 月 22 日才開始營業、換過經營者，只寫短段，不用換經營者前的評論與米其林紀錄。
- 北國大飯店不寫：它的舊網域已被別人拿去做賭博網站，全頁沒有那個網址。
- 新版不再寫露營場；〈利尻山登山〉裡提到「露營場整理在利尻島住宿」的那一句要另外改。

## 留給之後的事

- Island Inn利尻 2026-12-01 開放訂房後重查並補接送；利尻飯店 2027 年 3 月重新營業日公布後更新。
- 2027 年夏天各平台的可訂狀況，3 到 4 月開賣後重查。
- 利尻富士觀光飯店官網恢復後補成小節。

## 2026-11-19 補「住客怎麼說」小段

- Darren 看了達門檻卻沒寫進去的住客說法後說「這些都是很棒的資訊啊，可以都放啊」，取消一間一句的上限；每間細寫的旅館多一個「住客怎麼說」小段，官方事實與住客說法分開。紀錄在研究資料夾的 `guest/notes.md`。
- 事實查核（同一位查核子代理，Opus 5.5）逐點對評論紀錄：擋 4 句（靠 2021 年以前舊評論才達門檻的兩句拿掉、「最常被提起」「大家最愛」改掉）；小段用條列；最後 154 項全部 verified。
- 讀者驗收沒有重做：只加了住客說法小段，標題、結構、官方事實沒有變。
- 上一版 SHA：`12b81f80547bbb59d60fcd8ea4483438108192f72a82bfa319444a6dfcf33f03`。
