# 驗收紀錄：rishiri-island-stay（2026-11-01，已上線文章重寫一輪）

- 文章：`content-production/rishiri-island-stay/reader-preview.md`
- SHA-256（換行統一成 LF 後計算）：`e520329dfff91cee709d153fcbdf553906f1dc13dd42a30b5503b6a7e1755fcf`
- 規則：`content-automation/rewrite-live.md`（重查、讀競品後重寫、先刪再調、意義比對、完整驗收）；重寫前的版本在 `pre-rewrite/`
- 研究者：研究子代理（Opus 5.5，重查 38 筆會變資料，更正 F74（利尻飯店接送範圍）、F84（Umineko 2026 年已結束），新增 F192～F199；讀競品 4 篇）
- 作者：作者子代理（Opus 5.5，讀競品後重寫；連結句照寫作指南第10條改寫 1 句，見 `link-sentences.json`；照住宿頁不寫價格刪掉房價與露營場費用）；驗收後修改也由作者處理（`revisions-round1.md`）
- 潤稿者：潤稿子代理（Opus 5.5，先刪再調，沒寫過這篇）；意義比對 1 個子代理
- 標題檢查：標題、SEO Title 沿用網站版本，沒改，沿用 `heading-review.json`
- 事實查核：1 個子代理（Opus 5.5，沒參與寫作、潤稿與修改），共 2 輪
- 讀者驗收：1 個子代理（沒寫過、潤過或查核過），第一階段只看大綱、文章與規則，第二階段才看研究記錄與事實查核
- 協調：人工 session（Claude Code，Darren 2026-11-01 要求把剩下的文章全部重寫一輪）

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`） |
| 標題 | `acceptable`（標題沒改；讀者最終判定可接受） |
| 讀者價值 | `acceptable`（讀者最終判定，第二階段必修 3 條都已解決） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，83 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 3,079 字） |
| 事實編號 | `tags_clear`（研究記錄 68 筆，正文用到 62 筆） |
| 分潤連結 | 沒有單一旅館的分潤連結，不需揭露句 |
| 圖片 | 線上沒有文內照片，沒有 AI 圖或自製示意圖 |

**最終結果：`ready_for_user_preview`。** Darren 2026-11-01 要求重寫後換上網站。

## 經過

| 輪 | 做了什麼 | 結果 |
|---|---|---|
| 研究 | 重查 38 筆、讀競品 4 篇 | 更正 F74、F84；新增 F192～F199 |
| 寫作 | 讀競品後重排（選區與冬季休館結論放前面）；先刪再調潤稿（刪 F104 與 F3、F67 的一部分）；意義比對後修正 Rera Moshiri 一句 | 四項檢查通過 |
| 1 | 事實查核第 1 輪（81 項） | 全部 verified |
| 2 | 讀者驗收第一、二階段 | 必修 3 條：Rera Moshiri 移到全年營業、冬天住沓形怎麼過去、開頭用主要查詢詞 |
| 3 | 作者照必修修改 | 三項檢查通過 |
| 4 | 事實查核第 2 輪（83 項）；讀者最終判定 | 全部 verified；讀者價值與標題可接受、無剩餘必修 |

## 查不到所以正文沒寫的

- 小旅館與民宿能不能刷卡、雲丹御殿飯店屬於哪一區

## 留給之後的事

- F74、F84 更正與新增 F192～F199 要同步回地點事實表與 D1。
- RISHIRI PLUS 和住宿官網有三處說法不同，下次查核時再對。
