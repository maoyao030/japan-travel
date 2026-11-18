# 驗收紀錄：asahikawa-stay（2026-11-18，舊住宿頁重跑一輪）

- 文章：`content-production/asahikawa-stay/reader-preview.md`（旭川住宿推薦，住站前還是市中心？）
- SHA-256（換行統一成 LF 後計算）：`b2a7e02e13d6d2b75adc53c0c9d5f75742f7fd955a309118a274b103211869ae`
- 規則：`content-experiments/stay-rerun-2026-11-18/RUNBOOK.md`（Darren 2026-11-18：排定工作打開前，舊的住宿文章先重跑一輪）、寫作 Skill `references/stay-page.md`、`sentence-rhythm.md`、`stay-topic-page.md`「自動化」與「廢話要在流程裡擋掉」。舊版封包在 `pre-rerun-2026-11-18/`。
- 底稿：2026-11-16 照新寫法改的主頁稿（作者 Sonnet 5.5、查核與編輯 Opus 5.5）。
- 住客評論：事實查核者角色的子代理（Opus 5.5）2026-11-18 用瀏覽器重看（Trip.com、4travel、Google 地圖，沒登入）。
- 編輯：編輯子代理（Opus 5.5）對齊今天查核過的三頁專門頁，對事實改 24 處；再由五位編輯子代理（Opus 5.5）各自只管幾段刪廢話（正文約 5,970 → 3,400 字）；最後一位只看接縫。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），共 2 輪。
- 讀者驗收者：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），七題驗收 4 次（`acceptance.md` 第 4、5 題不過；`acceptance2.md` 七題都過；補回賣點後 `acceptance3.md` 第 5 題不過；`acceptance4.md` 七題都過）。補回賣點後另有份量檢查（`portion-check.md`，退回一輪小修）與事實查核第 3～5 輪（118 筆 verified）。
- 協調：人工 session（Claude Code），照岔路的預設，沒有問 Darren。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（七題第 6 題過） |
| 讀者價值 | `acceptable`（七題都過，含第 7 題廢話；退回一次後過關） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，86 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 3,590 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 沿用線上的封面與文內照片 |

**最終結果：`ready_for_user_preview`。** 換掉線上的舊版。

## 協調者的決定

- 主頁不重複三頁專門頁的細節（停車費、早餐菜色、泡湯時間、刺青規定），只在會影響選擇時半句帶過，並各用一句連到專門頁。
- 住客說法：露櫻Grand「電梯很擠」只有一個平台，換成達門檻的「房間偏小」；OMO7 三溫暖那句第二個平台只有間接說法，拿掉。
- Art Hotel「一間最多住 6 人」查核判錯（6 人是兩間相通的雙床房），照官網改。OMO7 冷水池官網沒有，刪。
- Tabist 的位置官方資料沒有，不寫。
- H1 從「旭川住宿，車站周邊與市中心的飯店、訂房管道與住宿稅」改成「旭川住宿推薦，住站前還是市中心？」，仍包含主要查詢「旭川住宿」。

## 留給之後的事

- OMO7 滑雪接駁車是 2026 到 2027 年這一季的事，雪季結束後拿掉或更新。
- Super Hotel 同床那句寫「寫信問飯店」，官網是請旅客打電話問。
- 東橫INN 兩間沒有放 Trip.com、Agoda 連結（還沒確認上架頁）。

最終結果：`ready_for_user_preview`
