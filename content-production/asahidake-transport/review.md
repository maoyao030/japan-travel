# asahidake-transport 驗收紀錄

- 文章：旭岳交通（`/places/asahidake/transport/`，aspect-page，地點 `asahidake`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`46105c3c268483e62d87cb19e2f92e1ef5c20dd76d1b4f7edb1e624a954049b7`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 2 個 H2；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 74 項全部 verified） |
| 口吻 | check-voice --final 通過（只有長句提醒） |
| 事實編號 | tags_clear，事實表 52 筆、正文用 46 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 3 篇、MATCHA 1 篇） |
| 圖片 | 這次沒有選圖 |

## 身分

| 角色 | 身分 |
|---|---|
| 研究者 | 子代理（Opus 5.5），寫作前補研究，判定 `ready` |
| 作者 | 另一個子代理（Opus 5.5），寫初稿與驗收後第 1 輪 |
| 潤稿者 | 另一個子代理（Opus 5.5），沒寫過這篇 |
| 編輯挑錯 | 另一個子代理（Opus 5.5） |
| 意義比對 | 另一個子代理（Opus 5.5） |
| 標題檢查 | 另一個子代理（Opus 5.5） |
| 事實查核 | 另一個子代理（Opus 5.5），唯讀 |
| 讀者驗收 | 另一個子代理（Opus 5.5），唯讀 |
| 協調者 | 人工 session 主代理（Opus 5.5），同步大綱標題，沒有改正文 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；事實 48 筆（新增 F163～F169：全國交通 IC 卡不能用、無現金售票機、12/1 運賃調整不影響旭岳線、道道 1160 號不在冬季封路名單） |
| 作者 | 初稿 mechanical_clear；帶前綴事實複製成 F170～F178；協調者要求刪掉沒有事實的「層雲峽沒有直通巴士」 |
| 潤稿 | 讀 GLTJP 3 篇、MATCHA 1 篇；五項檢查通過 |
| 編輯挑錯 | 22 句（末班 16:55 出現 5 次、重講、日文直搬），採納大部分 |
| 意義比對 | 不可接受 0、遺失 0 |
| 事實查核第 1 輪 | 70 項，incorrect 2（C33 特急與快速、C35 高速巴士冬季時間）、unsupported 1（C61「檢修」） |
| 讀者驗收 | 第一階段 revise 必修 8；第二階段最終必修 9 |
| 作者驗收後第 1 輪 | 9 條必修處理；纜車營業時間只寫頁面看得到的 2026 年 7～12 月（官網原始碼裡被註解掉的舊月曆不當來源）；新增 F179～F182 |
| 事實查核第 2 輪 | 74 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 纜車 2027 年與 1～6 月的營業時間（正文請讀者看官網月曆）。
- 錯過末班的計程車公司名稱（只寫成本站建議：請遊客中心、纜車站或旅館櫃台協助叫車）。
- 看到棕熊怎麼辦、雪天延誤提醒（要新研究）。

## 留給之後的事

- 事實表待同步：F163～F182、F58 刪 6 月、F63 不採用；旭川事實表 asahikawa:F36「特急、快速」更正。
- 纜車官網公布 2027 年月曆後，刪掉「官網月曆目前只排到12月」半句並補營業時間。

最終結果：`ready_for_user_preview`
