# 驗收紀錄：rishiri-island-festival（2026-11-28，照多活動祭典頁範本重寫）

- 文章：`content-production/rishiri-island-festival/reader-preview.md`（利尻島祭典有哪些？2027最新利尻島祭典指南）
- SHA-256（換行統一成 LF 後計算）：`b68551158aa3877e5cff9665f955527560ff30ebd7bd5ec21ba498e3d5f15c21`
- 規則：寫作 Skill `references/festival-calendar-page.md`（Darren 2026-11-27 定的方向：平鋪直敘，有哪些、什麼時候、逐個介紹特色、配圖片或 IG）、`core-style.md`、`preference-review.md`（A～O 題）、`sentence-rhythm.md`、`heading-style.md`；驗收 Skill `references/festival-calendar-acceptance.md`；範本 `page-models/festival/rebun-island-festival.md`。Darren 2026-11-28：「重寫這兩篇」。研究、規格與每一輪紀錄在 `content-experiments/festival-multi-study-2026-11-27/rewrite-rishiri-island/`；重寫前的線上版在 `pre-calendar-page/`。
- 研究：1 個研究子代理（Opus 5.5）補研究並寫規格（歷年日期總表、既有事實更正）。
- 寫作：一位作者（Sonnet 5.5），事實只用本封包 `reference-review.md`。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作），實際打開來源，共 5 輪：第 1 輪 57 項裡 11 項沒過；最後 51 項全部 verified。
- 偏好審查：1 個審查子代理（Opus 5.5，不是作者、查核者、驗收者），3 輪：第 1 輪退回 21 處，第 3 輪的 3 處已套用。
- 讀者驗收：1 個讀者驗收子代理（Opus 5.5），八題，2 次：第 1 次開頭、時間表、該挑哪一個三處要改，第 2 次 `acceptable`。
- 名字：1 個子代理照「專有名詞先看台灣網站再決定」查過，對照表 `content-experiments/festival-multi-study-2026-11-27/names-wakkanai-rishiri.md`，新名字已進譯名表。
- 標題檢查：1 個標題檢查子代理（Opus 5.5），`heading-review.json`，改動 0 個標題。
- 協調：人工 session（Claude Code）。Darren 還沒看過這篇重寫稿。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`，沒有問題與審查訊號） |
| 標題 | `acceptable`（`heading_review.py` 改動 0 個） |
| 讀者價值 | `acceptable` |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，51 項全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 1,996 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤；警告是幾個名字第一次出現在開頭時沒附原文，原文附在逐個介紹那一節，不改 |
| 圖片 | 封面、文內照片與嵌入見 `images/` |

**最終結果：`ready_for_user_preview`。**

## 協調者的決定

- 逐個介紹五個：北見富士神社祭（其他三間神社併在這一節）、港口啤酒花園、北海島祭、利尻浮島祭、海膽祭。馬拉松、釣鮭魚大會等要報名的與只有名字的活動不放。
- 線上舊稿的錯照研究更正：鬼脇會場是 7 月最後一個週日、鬼脇的花火只有 2023 年、浮島音頭遊行近三屆沒有、仙法志末班巴士 17:48。
- 花火每年換港：寫成「一年只在其中一個會場放」，住哪裡統一成「住在那一年放花火的那一區」。
- 「迷你海膽碗」原文是ミニうに椀，沒有湯或飯的依據，寫成「小碗裝的海膽」。
- 「辦了半世紀以上」、屆數、主辦名單不寫。

## 待辦

- 海膽祭幾點開始查不到，沒替它算班次；2027 年花火在哪個港還沒公布。
- 四箇散米舞長什麼樣沒有畫面事實，只留半句背景。
- 2027 年各祭典日期與時刻表公布後重查。
