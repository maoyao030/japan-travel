# 驗收紀錄：nakafurano-farm-tomita（2026-11-10，新文章首次驗收）

- 文章：`content-production/nakafurano-farm-tomita/reader-preview.md`
- SHA-256（換行統一成 LF 後計算）：`a2c483c91c5ebced6a0b41215810725d82f4dd7f0ec653a860cbbcc6417b8d94`
- 規則：`content-automation/local-writer.md`（研究→寫作→潤稿→意義比對→驗收→定稿）
- 研究者：研究子代理（前輪 session 完成，見 `reference-review.md`）
- 作者：作者子代理（Opus 4.6）；驗收後修改也由作者處理（`revisions-round1.md`）
- 潤稿者：潤稿子代理（Opus 4.6，沒寫過這篇）；意義比對 1 個子代理
- 標題檢查：1 個子代理，建議改「必買」被 check-benchmark 擋回，改由作者移除「香水」
- 事實查核：1 個子代理（沒參與寫作、潤稿與修改），共 2 輪
- 讀者驗收：1 個子代理（沒寫過、潤過或查核過），第一階段與最終判定
- 協調：本機自動寫作排定工作 `japan-travel-daily-writer`

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`） |
| 標題 | `acceptable`（改動 1 個 H3，移除無事實支撐的「香水」） |
| 讀者價值 | `acceptable`（讀者最終判定，必修 3 條全部解決） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，67 項 claim：66 verified、1 not-stated） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 2,299 字） |
| 事實編號 | `tags_clear`（研究記錄 50 筆事實，正文用到 46 筆） |
| 圖片 | 這次沒有選圖 |

**最終結果：`ready_for_user_preview`。**

## 經過

| 輪 | 做了什麼 | 結果 |
|---|---|---|
| 研究 | 前輪 session 完成，67 筆事實 | 見 `reference-review.md` |
| 寫作 | 前輪 session 完成 | 四項檢查通過 |
| 潤稿 | 6 個銜接調整，無刪除 | 意義比對：5 acceptable、0 unacceptable、0 missing |
| 1 | 標題檢查、事實查核第 1 輪、讀者驗收第一階段（3 個平行子代理） | 標題 1 建議（被擋）、1 結構備註（已處理）；事實 63 verified、3 incorrect（營業時間表）、1 not-stated；讀者 3 必修、5 加分 |
| 2 | 作者修改 5 處（營業時間表 3 列、付款備註、東區計程車、H3 香水、彩色花田段落順序） | 三項檢查通過 |
| 3 | 事實查核第 2 輪、讀者最終判定 | 66 verified、1 not-stated；讀者價值與標題 acceptable、無剩餘必修 |

## 查不到所以正文沒寫的

- 園內各商店是否接受信用卡或電子支付（改寫成「帶夠現金比較放心」）
- 逛完整座農場大概需要多少時間
- 從旭川市區開車到富田農場的時間

## 留給之後的事

- 選圖：重點景點照片（彩色花田、薰衣草田、霜淇淋）待選圖流程處理。
- not-stated 的 1 筆（F60 推論付款方式）：如果之後查到官方說法，更新正文。
