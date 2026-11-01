# asahikawa-transport 驗收紀錄

- 文章：旭川交通（`/places/asahikawa/transport/`，aspect-page，地點 `asahikawa`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`4661fe5a981f452cd1c3194ed9f6fec5b7f7dc06436b0af032b1699a506f58d3`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 4 個標題：第一個 H2 加新千歲機場、三個問句補全形「？」；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 77 項全部 verified） |
| 口吻 | check-voice --final 通過（提醒：「約」每千字 6.1、逗號 41.2） |
| 事實編號 | tags_clear，事實表 59 筆、正文用 51 筆 |
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
| 寫作前補研究 | `ready`；事實 56 筆（新增 F151～F172：12/1 起機場巴士 1,000 日圓、冬期動物園巴士、たいせつライナー、高速あさひかわ號等） |
| 作者 | 初稿 mechanical_clear；帶前綴的事實複製成 F173～F175 |
| 潤稿 | 讀 GLTJP 3 篇、MATCHA 1 篇；五項檢查通過 |
| 編輯挑錯 | 21 條（「……的話」10 次、重講、日文直搬），採納 15 以上 |
| 意義比對 | 不可接受 1（行李「只能」改強）、遺失 0，已修 |
| 事實查核第 1 輪 | 74 項，incorrect 7（C10、C20、C44、C47、C51、C66、C68） |
| 讀者驗收 | 第一階段 revise 必修 7；第二階段最終必修 14 |
| 作者驗收後第 1 輪 | 14 條必修處理，補研究 F176～F178（バスタッチ位置，經營者位置圖 PDF） |
| 事實查核第 2 輪 | 77 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 道北巴士機場直達車的時刻與車資（道北巴士官網整天連不上，只有 2022 年版存檔）。
- JR 新千歲到旭川全程車資、高速巴士來回票販售處、ふらのバス車資（要新研究）。
- 12 月以後的機場巴士時刻表（正文改成告訴讀者去哪裡看）。

## 留給之後的事

- 事實表待同步：F151～F178、F41 與 F48 更正、F49 期限註記；旭山動物園研究發現 F19、F152 的 41、47 號起點是旭川站發。
- 道北巴士官網恢復後重查（下次查核 2026-11-10）。

最終結果：`ready_for_user_preview`
