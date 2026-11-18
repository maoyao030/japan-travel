# 驗收紀錄：asahidake-stay（2026-11-19，舊住宿頁重跑一輪）

- 文章：`content-production/asahidake-stay/reader-preview.md`（旭岳溫泉住宿推薦，住纜車旁還是天人峽？）
- SHA-256（換行統一成 LF 後計算）：`73bce6ed1b248e5d40277de3f8331277a81b166d7987e222a88105ce0430f346`
- 規則：`content-experiments/stay-rerun-2026-11-18/RUNBOOK.md`、寫作 Skill `references/stay-page.md`、`sentence-rhythm.md`、`stay-topic-page.md`「自動化」「廢話要在流程裡擋掉」「份量檢查」。舊版封包在 `pre-rerun-2026-11-18/`。
- 研究：`content-experiments/stay-rerun-2026-11-18/asahidake/` 的 `queries.md`、`facts.md`、`facts-extra.md`、`facts-reviews.md`、`booking-links.md`。住客評論由查核角色的子代理（Opus 5.5）2026-11-18 用瀏覽器讀（Trip.com、4travel、Google 地圖，沒登入）。
- 寫作：規格助手（Opus 5.5）→ 五段各一位作者（Sonnet 5.5）→ 四位分段編輯（Opus 5.5）→ 一位接縫編輯兼句子節奏與份量檢查（Opus 5.5，`seam-notes.md`，六個旅館小節都判剛好）。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），3 輪：第 1 輪 127 筆裡 4 筆 unsupported、2 筆 not-stated；改完第 2、3 輪 130 筆裡 129 筆 verified、1 筆 not-stated（大雪山山莊「沒有自己的官網」是否定句，協會清單只有它沒有官網按鈕，驗證程式不擋）。
- 讀者驗收：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），七題驗收 2 次（`acceptance1.md` 第 4 題不過：五間沒點名、敷島莊人數、湧駒莊晚餐名稱對不上；`acceptance2.md` 七題都過）。第 2 次之後只照驗收與查核的字句意見改了八處，由事實查核第 3 輪確認。
- 協調：人工 session（Claude Code），照岔路的預設，沒有問 Darren。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（七題第 6 題過） |
| 讀者價值 | `acceptable`（七題都過，含第 7 題份量；退回一次後過關） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，130 項） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 3,620 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 沿用線上的封面與文內照片；細寫的旅館各找 1 則 Instagram 貼文（瀏覽器空出來後補） |

**最終結果：`ready_for_user_preview`。** 換掉線上的舊版。

## 協調者的決定

- H1 從「旭岳溫泉住宿，各旅館位置、接送與訂房管道」改成「旭岳溫泉住宿推薦，住纜車旁還是天人峽？」，仍包含主要查詢「旭岳溫泉住宿」。
- Hotel Deer Valley 停業中，訂房網站仍列著，第一個 H2 用半句提醒不要訂。
- 大雪山白樺莊今年秋冬有沒有營業沒有官方來源：只在分組開頭一句與比較表出現，寫「冬天要先跟旅館確認有沒有營業」，比較表冬天欄「—」。
- 不比哪間離纜車最近；走路時間只寫官方有的 3 分、7 分、15 分。
- 天人峽沒開車照觀光協會寫「請旅館接送或叫計程車」。
- 大雪山山莊與杜季合成一個小節，訂房行只留杜季官網（山莊沒有官網）。

## 留給之後的事

- La Vista 冬季接送是 2026 到 2027 年這一季的資料，雪季結束後更新。
- 湧駒莊有沒有和室、湧駒莊與 K's House 走到纜車幾分鐘，官方沒有寫。
