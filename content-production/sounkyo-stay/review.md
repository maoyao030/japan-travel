# 驗收紀錄：sounkyo-stay（2026-11-01，重寫稿換上網站）

- 文章：`content-production/sounkyo-stay/reader-preview.md`
- SHA-256（換行統一成 LF 後計算）：`8d123c17494c593dd22ad4e54637065134c52e9a4bf6520391a4000dcbd7b8a1`
- 規則：讀競品後重排（`competitor-notes.md`、`order-notes.md`）、潤稿先刪再調（`polish-notes.md`）、意義比對（`meaning-drift.md`）；試跑過程見 `content-experiments/competitor-read-2026-10-30/sounkyo-stay/`
- 作者：作者子代理（Opus 5.5，讀競品後重寫）；驗收後修改由另一個修稿子代理處理（`revisions-round1.md`）
- 潤稿者：潤稿子代理（Opus 5.5，先刪再調）；意義比對 1 個子代理
- 標題檢查：標題、SEO Title 與 2026-10-27 版相同，沿用 `heading-review.json`
- 事實查核：1 個子代理（Opus 5.5，沒參與寫作、潤稿與修改），共 2 輪
- 讀者驗收：1 個子代理（沒寫過、潤過或查核過），第一階段只看大綱、文章與規則，第二階段才看研究記錄與事實查核
- 協調：人工 session（Claude Code，Darren 2026-11-01 要求把三篇試跑稿換上網站）

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`） |
| 標題 | `acceptable`（標題沒改；讀者最終判定可接受） |
| 讀者價值 | `acceptable`（讀者最終判定，第二階段必修 12 條都已解決） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，103 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過 |
| 事實編號 | `tags_clear`（研究記錄 63 筆，正文用到 51 筆） |
| 分潤連結 | 正文沒有單一旅館的 Trip.com 或 Agoda 連結，不需揭露句 |
| 圖片 | 線上沒有文內照片；沒有 AI 圖或自製示意圖 |

**最終結果：`ready_for_user_preview`。** Darren 2026-11-01 要求換上網站。

## 經過

| 輪 | 做了什麼 | 結果 |
|---|---|---|
| 寫作 | 讀競品後重寫、先刪再調潤稿、意義比對（5 處已修） | 四項檢查通過 |
| 1 | 事實查核第 1 輪（98 項） | 1 incorrect（愛山溪「夏秋營業」排除了 5 月）、2 unsupported（小旅館「都」在纜車附近、接駁「搭車3天前」） |
| 2 | 讀者驗收第一、二階段 | 必修 12 條：上面 3 項，加朝陽度假飯店回程上車時間、層雲閣號與觀光飯店接駁怎麼訂、愛山溪接送、冬季休業、位置欄空格、巴士總站名稱、Trip.com 常售罄、報告查資料過程的句子 |
| 3 | 修稿子代理照必修修改，新增 F312（層雲閣）、F313（觀光飯店接駁），更正 F280；拿掉位置欄 | 三項檢查通過 |
| 4 | 事實查核第 2 輪（103 項）；讀者最終判定 | 全部 verified；讀者價值與標題可接受、無剩餘必修 |

## 留給之後的事

- 層雲閣號的出發地點與時刻：官網查不到，正文寫成電話預約時確認。
- 觀光飯店接駁的上車處：交通頁寫 Tabist 旭川ステーションホテル、常見問題頁寫旭川スマイルホテル前，地址相同，可能是改名；找到官方說明後再統一寫法。
- 研究記錄的新增 F312、F313 與更正 F280 要同步回地點事實表與 D1；譯名 Yukara（ユーカラ）、Ajina（あじ菜）待補進 glossary。
- 讀者最終判定加分 4 條（ANSHINDO 距離、住宿稅句的「北海道那一份」屬大綱連結句、上川站三間那段、開頭接駁句可拆）不影響結果。
