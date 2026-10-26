# sounkyo-festival 驗收紀錄

- 文章：層雲峽冰瀑祭（`/places/sounkyo/festival/`，aspect-page，地點 `sounkyo`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`04cdd9b28d82073e1dbedb16db3977cb66ced2680354378fa37b170635c33d28`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`
- 備註：作者驗收後第 1 輪回報的雜湊是 `8ef4c993…`，作者因額度上限中斷、接續後在 08:42 又改過一次；事實查核第 2 輪與讀者最終判定都是對 `04cdd9…` 這一版做的，以這一版定稿。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 4 個標題；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 69 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 57 筆、正文用 43 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 3 篇、MATCHA 2 篇） |
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
| 寫作前補研究 | `ready`；事實 56 筆（新增 F240～F251）；冰瀑祭官網大量內容在網頁註解裡，改用會場圖頁與主辦新聞稿；看完 20:30 煙火當天回不了旭川 |
| 作者 | 初稿 mechanical_clear |
| 潤稿 | 讀 GLTJP 3 篇、MATCHA 2 篇；五項檢查通過 |
| 編輯挑錯 | 20 句（「2026年」二十多次、同一結論講四次、日文直搬） |
| 意義比對 | 不可接受 1（煙火時間漏掉年份），已修 |
| 事實查核第 1 輪 | 69 項，unsupported 1（C20 2025 年煙火時間只有新聞來源） |
| 讀者驗收 | 第一階段 revise 必修 2；第二階段最終必修 5 |
| 作者驗收後第 1 輪 | 5 條必修處理，新增 F257（2026 年官網電子票橫幅）；週末點燈改成有條件的選擇 |
| 事實查核第 2 輪 | 69 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 2027 年的開放時間、協力金、煙火時間（正文用 2026 年資料並寫明年份）。
- 現場能不能付協力金、付現或刷卡；冬季巴士時刻；點燈開始時間與 2 月日落時間。

## 留給之後的事

- 事實表待同步：F240～F257、F76、F77、F81、F82、F157、F179 更正，F151 不採用。
- 2026-11-15 先看一次冰瀑祭官網，2026-12-15 重查 2027 年細節。

最終結果：`ready_for_user_preview`
