# 驗收紀錄：sounkyo-festival（2026-11-27，祭典頁樣本）

- 文章：`content-production/sounkyo-festival/reader-preview.md`（層雲峽冰瀑祭2027攻略，當天來回還是住一晚，日期、門票、交通與煙火一次看）
- SHA-256（換行統一成 LF 後計算）：`80c367b7cc22a00e8ec8f74b7f1dad88c7f00895c0fcec48654118b82fcd3015`
- 規則：寫作 Skill `references/festival-page.md`（Darren 2026-11-27 同意）、`core-style.md`、`preference-review.md`（A～M 題）、`sentence-rhythm.md`、`heading-style.md`；驗收 Skill `references/festival-acceptance.md`。研究與樣本的每一輪在 `content-experiments/festival-page-study-2026-11-26/`；改版前的封包在 `pre-festival-page/`。
- 寫作：一位作者（Sonnet 5.5），事實只用本封包 `reference-review.md`（研究者 2026-11-26 重查，暫編號 F700～F731 與地點事實表原有編號）。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作），實際打開來源，共 14 輪加搬進封包後的確認（含每次改句子後的複查）：第 1 輪 57 項裡 12 項沒過，最後 58 項全部 verified，沒有 unreachable。
- 偏好審查：1 個審查子代理（Opus 5.5，不是作者、查核者、驗收者），7 輪（`preference-review.md`）：第 1 輪退回 28 處；第 7 輪用新加的 M 題把每一段掃過，6 處都已套用。
- 讀者驗收：1 個讀者驗收子代理（Opus 5.5），八題驗收 4 次（`acceptance-festival.md`）：第 2 次 `acceptable`；Darren 看過之後大改，第 3 次 `needs_revision`（開頭沒有畫面），第 4 次 `acceptable`。
- 標題檢查：1 個標題檢查子代理（Opus 5.5），`heading-review.json`，改動 0 個標題。
- 協調：人工 session（Claude Code）。Darren 2026-11-27 一節一節看過，每節說「可以，看下一節」，大標題「可以，用 A」；之後他另外挑出五處，都改完並寫成全站規則：回程那段「看不太懂」（照順序一步一步講）、多冷「比較起來沒什麼感覺」（拿寒流比）、祭典的背景（補 1976 年）、「值得專程去嗎」第一段「好無聊」（改成帶讀者走進去，他說「走進冰裡面也可以試看看」）、「不要問我」。**他說可以之後又改過的段落（值得專程去嗎一節、開頭第一段、摘要、多冷第一段、回程段、峽谷火祭）他還沒看過定稿。**

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`；審查訊號兩項：標題樹全是 H2（照「撐不起一項就併」）、門票沒寫含稅未稅（官網沒標）） |
| 標題 | `acceptable`（`heading_review.py` 改動 0 個） |
| 讀者價值 | `acceptable`（第 4 次驗收） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，58 項全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 1,922 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤與警告 |
| 圖片 | 封面與文內照片、影片沿用並照新標題重排位置，見 `images/` |

**最終結果：`ready_for_user_preview`。**

## 協調者的決定

- 看點從規格的三到四個 H3 改成全部併成段落（Darren 講過「撐不起一項就併」）；冰瀑神社只有近兩屆的說明，拿掉。
- 第 52 屆的煙火時間、購票方式、會場圖官方還沒公布：正文與表格只寫「近兩屆（2025、2026年）每晚20:30」，大標題不寫「煙火時間」，第 2 節 H2 寫「近年煙火時間」。
- 「建議待多久」「什麼時候人多」查不到可靠來源，不寫。
- 「回」改成「屆」；費用名稱寫成「入場時付1,000日圓（「協力金」）」。
- 最後一節（峽谷火祭、紅葉谷點燈）是寄放：Darren 已同意火祭之後放進候選頁〈層雲峽夏天〉、點燈歸到紅葉的內容。
- 協調者套用過的最小改法（都由查核者或審查者給字、事後送查核）：「而且會場就在石狩川河岸的戶外」、資料來源換成寒流定義的出處、摘要「近三屆的主冰雕裡都有一條隧道」、兩處原文附註。

## 待辦

- 第 52 屆的煙火、購票方式、會場圖公布後重查（預計 2026-12-15 先看一次、2027-01-10 再看）；道北巴士冬季時刻 12 月再查。
- 暫編事實 F700～F731 補進地點事實表與 D1。
- 大綱、頁面規格、文章清單的標題與查詢詞同步。
