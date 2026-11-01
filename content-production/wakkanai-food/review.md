# 驗收紀錄：wakkanai-food（2026-11-01，重寫稿換上網站）

- 文章：`content-production/wakkanai-food/reader-preview.md`
- SHA-256（換行統一成 LF 後計算）：`643f62cbd70eb264f21eb94a2a8757770cdc2eb9f6e8e5307c4b2bb81ba66e16`
- 規則：讀競品後重排（`competitor-notes.md`、`order-notes.md`）、潤稿先刪再調（`polish-notes.md`）、意義比對（`meaning-drift.md`）；試跑過程見 `content-experiments/competitor-read-2026-10-30/wakkanai-food/`
- 作者：作者子代理（Opus 5.5，讀競品後重寫）；驗收後修改由另一個修稿子代理處理（`revisions-round1.md` 2026-11-01 一輪）
- 潤稿者：潤稿子代理（Opus 5.5，先刪再調）；意義比對 1 個子代理
- 標題檢查：標題、SEO Title 與 2026-10-22 版相同，沿用 `heading-review.json`
- 事實查核：1 個子代理（Opus 5.5，沒參與寫作、潤稿與修改），共 2 輪
- 讀者驗收：1 個子代理（沒寫過、潤過或查核過），第一階段只看大綱、文章與規則，第二階段才看研究記錄與事實查核
- 協調：人工 session（Claude Code，Darren 2026-11-01 要求把三篇試跑稿換上網站）

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`） |
| 標題 | `acceptable`（標題沒改；讀者最終判定可接受） |
| 讀者價值 | `acceptable`（讀者最終判定，第二階段必修 8 條都已解決） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，113 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過 |
| 事實編號 | `tags_clear`（研究記錄 47 筆，正文用到 37 筆） |
| 圖片 | 沿用線上的文內照片 2 張（扇貝與海鮮丼、生海膽丼），沒有 AI 圖或自製示意圖 |

**最終結果：`ready_for_user_preview`。** Darren 2026-11-01 要求換上網站。

## 經過

| 輪 | 做了什麼 | 結果 |
|---|---|---|
| 寫作 | 讀競品後重寫、先刪再調潤稿、意義比對（2 處已修） | 四項檢查通過 |
| 1 | 事實查核第 1 輪（104 項） | 9 outdated、2 incorrect：Uroko亭、Hiiragi軒、Nagomi 的營業時間與公休已和店家官網不同（研究記錄用觀光協會 2022～2023 年特輯）；生海膽丼最早 4 月起 |
| 2 | 讀者驗收第一、二階段 | 必修 8 條：午休備案、Nagomi 兩段營業、晚上 9 點後能點餐的店、Uroko亭與 Hiiragi軒時間公休、生海膽丼月份、稚內拉麵正面回答、週日備案 |
| 3 | 修稿子代理照必修修改，更正 F135、F137、F204、F208 | 三項檢查通過 |
| 4 | 事實查核第 2 輪（113 項）；讀者最終判定 | 全部 verified；讀者價值與標題可接受、無剩餘必修 |

## 留給之後的事

- 樺太食堂官網已變停放網域，只能依觀光協會 2022 年資料，下次重查時另找官方社群。
- 研究記錄的更正（F135、F137、F204、F208）要同步回地點事實表與 D1。
- 讀者最終判定的加分 5 條（Uroko亭表格補生海膽丼、平日 16～17 點空檔、野寒布岬內連、H3 層級、樺太食堂段精簡）不影響結果。
