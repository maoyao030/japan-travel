# 驗收紀錄：rebun-island-stay（2026-11-19，舊住宿頁重跑一輪）

- 文章：`content-production/rebun-island-stay/reader-preview.md`（禮文島住宿推薦，住香深還是船泊？）
- SHA-256（換行統一成 LF 後計算）：`2c3d9632dd7d074db0a3cc5b63f36c95c70ce096012f74e441da6e8f93a64e79`
- 規則：`content-experiments/stay-rerun-2026-11-18/RUNBOOK.md`、寫作 Skill `references/stay-page.md`、`sentence-rhythm.md`、`stay-topic-page.md`「自動化」「廢話要在流程裡擋掉」「份量檢查」。舊版封包在 `pre-rerun-2026-11-18/`。
- 研究：`content-experiments/stay-rerun-2026-11-18/rebun-island/` 的 `queries.md`、`facts.md`、`facts-extra.md`、`facts-reviews.md`、`booking-links.md`。住客評論由查核角色的子代理（Opus 5.5）2026-11-19 用瀏覽器讀（Trip.com、4travel、Google 地圖，沒登入）。
- 寫作：規格助手（Opus 5.5）→ 五段各一位作者（Sonnet 5.5）→ 四位分段編輯（Opus 5.5）→ 一位接縫編輯兼句子節奏與份量檢查（Opus 5.5，`seam-notes.md`，細寫六間都判剛好）。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），3 輪：第 1 輪 132 筆裡 4 筆 unsupported；第 2 輪 3 筆 incorrect（民宿須古頓岬其實只收電話，研究紀錄 K56 寫錯，已更正）；第 3 輪 130 筆全部 verified。
- 讀者驗收：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），`acceptance1.md` 七題都過；照查核與驗收的建議改完後 `acceptance2.md` 再確認一次。
- 協調：人工 session（Claude Code），照岔路的預設，沒有問 Darren。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（七題第 6 題過） |
| 讀者價值 | `acceptable`（七題都過，含第 7 題份量） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，130 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 3,970 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 沿用線上的封面與文內照片；細寫的旅館各找 1 則 Instagram 貼文（找得到合格的才放） |

**最終結果：`ready_for_user_preview`。** 換掉線上的舊版。

## 協調者的決定

- H1 從「禮文島住宿，香深或船泊怎麼選、花季多早訂」改成「禮文島住宿推薦，住香深還是船泊？」，仍包含主要查詢「禮文島住宿」。
- 咲涼第一次出現寫「以前叫三井觀光飯店」，讓搜舊名的人認得出來；咲涼在 Agoda 查不到任何可訂的日子，訂房行不放 Agoda。
- 冬天確定能住的只寫民宿海膽與民宿Hana心；禮文飯店只寫官網日曆 2027 年 5 月 20 日起才有房，不寫成休館；花禮文、禮文莊冬天開不開沒有官方資料，寫「出發前先向旅館確認」。
- 禮文島觀光協會網站打不開：「民宿海膽館內沒有溫泉」「禮文莊離香深港開車約 30 分鐘」這兩件不太變的事用網頁存檔，資料來源列存檔連結；存檔裡會變的（禮文飯店只收現金、入湯稅）不寫。
- 桃岩莊寫「評價比較兩極」，負面只寫到「不習慣團體行動的人可能覺得受拘束」；熄燈、禁酒只在 2019 年以前的評論裡，不寫。
- 禮文莊的住客說法只有一個平台有近年的評論，拿掉。
- 星觀莊不升格成細寫（住客說法只有一個平台）；沒有官網的幾間不列。

## 留給之後的事

- 民宿須古頓岬 2027 年的營業日期公布後更新；2027 年渡輪時刻公布後重查花季與冬天兩節。
- 「2027 年的房已經開賣」這類句子明年秋天要改寫。
- 地圖連結的落點（桃岩莊、民宿須古頓岬）還沒用瀏覽器確認。
