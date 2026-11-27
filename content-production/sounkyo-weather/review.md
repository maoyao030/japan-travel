# 驗收紀錄：sounkyo-weather（2026-11-27，照天氣頁寫法重寫）

- 文章：`content-production/sounkyo-weather/reader-preview.md`（層雲峽天氣攻略，8月早晚就像台北2月，四季穿法、楓葉與初雪封路一次看）
- SHA-256（換行統一成 LF 後計算）：`b5cae468db2a78407f2b6c461359aa740d9ee443fefababfe83f9e75192a1d69`
- 起因：Darren 2026-11-27 看 Search Console（近 28 天全站曝光最多的一頁，436 次曝光、平均排名 7.7）後說「先改層雲峽天氣」。舊版（線上原文）備份在 `pre-weather-page/`。
- 規則：寫作 Skill `references/weather-page.md`、`core-style.md`、`preference-review.md`；流程 `content-automation/weather-writer.md`；驗收 Skill `references/weather-acceptance.md`。規格 `spec.md`。
- 研究：1 位研究者（Opus 5.5），補台北對照 F548～F550、三年紅葉與初雪對照、纜車與封路 F551～F569，平年值與來源全部重開（`reference-review.md`、`research-notes.md`）。
- 寫作：1 位作者（Sonnet 5.5），事實只用本封包 `reference-review.md`；退回 3 次（`revisions-round1.md`～`revisions-round3.md`）。
- 事實查核：1 位查核者（Opus 5.5，沒參與寫作），實際打開來源，共 6 輪：第 1 輪 75 項裡 17 項沒過（正文 5 項、資料來源標題 12 項），第 2 輪 4 項、第 3 輪 1 項、第 5 輪 1 項，最後 51 項全部 verified；沒有打不開的來源。
- 偏好審查：1 位審查者（Opus 5.5，不是作者、查核者、驗收者），3 輪加驗收後複看 1 次（`preference-review.md`）：第 1 輪退回 22 處加大標題，第 2 輪 9 處，第 3 輪 `pass`。
- 讀者驗收：1 位驗收者（Opus 5.5，沒寫過、沒查核過、沒審查過），八題驗收 2 次（`acceptance-weather.md`）：第 1 次 5 條一定要改，第 2 次 `acceptable`。
- 標題檢查：1 位標題檢查者（Opus 5.5），`heading-review.json`，沒有要改的標題。
- 協調：人工 session（Claude Code）。Darren 還沒有逐節看過這一版。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`） |
| 標題 | `acceptable`（`heading_review.py` 改動 0 個） |
| 讀者價值 | `acceptable`（第 2 次驗收） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，51 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 1,329 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 沿用線上的封面、黑岳紅葉照片與兩則嵌入，位置照新稿重排；銀泉台照片拿掉（一節最多一張） |

**最終結果：`ready_for_user_preview`。**

## 協調者的決定

- 結構：這個地方的主角是楓葉，「楓葉什麼時候去」排在「幾月開始下雪，冬天會不會封路」前面（`weather-page.md` 的規則）。
- 氣溫用鎮上（上川觀測點）的平年值，不推算溫泉街氣溫，正文只講一次「照表上的溫度再多帶一層」。
- 四季總表拿掉「看得到什麼」一欄，改四欄：五列裡三列寫不出每年都成立的東西（偏好審查第 2 輪）。
- 字數 1,329：作者一度為了補到 1,300 加了降雪量一段，偏好審查判定硬湊後拿掉；讀者驗收說沒少東西。
- 驗收者與查核者對「6 月、9 月早晚比寒流還冷」意見不同（9.4℃、8.9℃ 只略低於 10℃）：退回作者照兩邊的數字重寫成「差不多是寒流的程度」，10 月才寫更冷。
- 巴士冬天的狀況沒有官方資料（道北巴士官網打不開），這頁不寫，交給交通頁；國道封路沒有次數統計，不寫頻率。
- 纜車停駛檢修只查到 2025、2026 兩年且時間不同，不寫「每年」、不寫季節，只寫排行程前先看官網。
- 連回主頁的句子不另寫，開頭第一個「層雲峽」直接連回主頁。
- 協調者套用過的最小改法（都由查核者或審查者給字、事後送查核）：「溫泉街看楓葉有名的地方是紅葉谷入口一帶」、銀泉台那句拆成兩句並分段、最後一節纜車那句拆成兩句並拿掉「每年」、10 月下旬到 11 月的穿法「已經接近冬天的穿法，早晚尤其要加」。
- 舊稿的積雪表、逐日紅葉紀錄、2026 年的管制日期與纜車停駛日期這次不寫（`spec.md`「舊稿寫了、這次不寫的」）。

## 待辦

- 大綱（`hokkaido-asahikawa-outline.json`）的 H1、headings 與連結句要同步成新版。
- 新事實 F548～F569 還沒登記 D1。
- `gaps.md`：「峠」的台灣寫法譯名表沒有；石北峠、三國峠封路次數沒有統計；纜車強風停駛的風速條件官網沒寫；巴士冬天的資料。
- 平年值 2031 年改版時重查；紅葉與初雪每年秋天看遊客中心紀錄更新三年對照。
