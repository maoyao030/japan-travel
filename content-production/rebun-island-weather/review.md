# 驗收紀錄：rebun-island-weather（2026-11-26，天氣頁樣本）

- 文章：`content-production/rebun-island-weather/reader-preview.md`（禮文島天氣攻略，8月只像台北3月，四季穿法、雲海與渡輪停航一次看）
- SHA-256（換行統一成 LF 後計算）：`1a51b79eaaf9b06110a96b0dc18a799c05c4dfbeaa891c717b424e111c082c2c`
- 規則：寫作 Skill `references/weather-page.md`（Darren 2026-11-26 同意）、`preference-review.md`、`sentence-rhythm.md`、`heading-style.md`；驗收 Skill `references/weather-acceptance.md`。研究與兩版樣本在 `content-experiments/weather-page-study-2026-11-24/`。舊寫法的草稿在 `pre-weather-page/`。
- 寫作：一位作者（Sonnet 5.5），事實只用本封包 `reference-review.md`（禮文島地點事實表 F609～F643、主頁搬來的事實、台北對照 F677～F679、環境省 F680）。同一份規格另有 Opus 4.6 寫的一版（`sample-rebun-island/a/`），只當模型比較，沒有採用。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作），實際打開來源，共 15 輪（含每次改句子後的複查）：第 1 輪 84 筆裡 21 筆沒過（8 incorrect、9 unsupported、4 unreachable），最後 61 筆全部 verified。
- 偏好審查：1 個審查子代理（Opus 5.5，不是作者、查核者、驗收者），拿 Darren 在住宿頁、地點主頁講過的話逐句審，6 次（`preference-review.md`）：第 1 次退回 23 處，最後通過。
- 讀者驗收：1 個讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），八題驗收 7 次（`acceptance-weather.md`）：第 1 次 13 條要改，第 5 次 `acceptable`；照 Darren 的意見改開頭與語氣後再驗，第 7 次 `acceptable`。
- 標題檢查：1 個標題檢查子代理（Opus 5.5），`heading-review.json`，沒有要改的標題。
- 協調：人工 session（Claude Code）。Darren 2026-11-26 一節一節看過：開頭「開頭可以」、大標題「用第 3 個」、第二節「可以」、第三節「可以，多留一天補回來」、整篇「可以，寫成規則並準備上線」。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`） |
| 標題 | `acceptable`（`heading_review.py` 改動 0 個；`planning:check` 通過） |
| 讀者價值 | `acceptable`（第 7 次驗收） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，61 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 1,396 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 封面與文內照片照選圖 Skill 另選，見 `images/` |

**最終結果：`ready_for_user_preview`。**

## 協調者的決定

- 四季總表拿掉「看得到什麼」一欄，改四欄：禮文島秋冬寫不出看得到的東西，五列空兩列。
- 正文字數下限從 1,500 改成 1,300：三張表已承載大半資訊。
- 模型用 Sonnet 5.5 寫、Opus 5.5 審：Darren 看了兩版後說「我覺得你可以參考一下我前兩個範例我對他要求的偏好」，協調者照住宿頁、地點主頁的組合定，他沒有反對。
- 雲海只留環境省資料撐得住的部分：禮文島觀光協會網站 2026-11-26 回 503、網頁存檔從雲端讀不到，三個觀看地點與標高、風弱與氣溫上升前的條件、前一天怎麼看預報都拿掉，記在 `gaps.md`。
- 觀光案內所的開放期間（F115，來源同一個網站）不寫。
- 次要查詢：大綱改成標題帶得到的「禮文島各月氣溫」「禮文島雲海」；「禮文島氣溫」「禮文島9月」「禮文島冬天」由兩張表帶，記在 `tableQueries`。
- 協調者套用過的最小改法（都由查核者或審查者給字、事後送查核）：「4月要比台北寒流時穿得更厚，5月跟寒流時一樣厚」、序言第二段從花接到天氣那一句、「5月下旬是最接近兩樣都有的時候」、第三節補回「多留一天」、雲海段兩句、「有機會」。其餘都退回作者。
- 連回主頁的句子不另寫，改成開頭第一個「禮文島」直接連回主頁（偏好審查的建議，對應 Darren 2026-11-17 開頭不寫指路句）。

## 待辦

- 禮文島觀光協會網站恢復後，重查雲海頁，補回三個觀看地點與條件。
- 利尻島天氣頁還沒有各月停航天數表（同一條航線），之後照天氣頁寫法重寫時補。
- 禮文島主頁還留著「各月氣溫與穿著」一節，要等〈禮文島祭典〉也上線，才換成純六節的版本（`content-production/rebun-island/phase2-six-sections/`，對照 `removed-to-subpages.md`）。
- 新事實 F677～F680 還沒登記 D1。
