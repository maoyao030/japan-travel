# asahikawa-stay 驗收紀錄

- 文章：旭川住宿（`/places/asahikawa/stay/`，aspect-page，地點 `asahikawa`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`e4e5e79cb159c5ba87a68784f3ffab4b7cb9a36cd9f6bebb3683f611c3e9c588`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`；住宿頁不寫價格（Darren 2026-10-26）

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 3 個標題；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 57 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 33 筆、正文用 31 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 2 篇、MATCHA 3 篇） |
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
| 協調者 | 人工 session 主代理（Opus 5.5）；大綱 H3「旭川站北口前的飯店」改成「旭川站前的飯店」，同步標題，沒有改正文 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；12 家住宿的區域、離車站分鐘、營業期間、訂房管道都有事實；新增 F401～F417；不查價格 |
| 作者 | 初稿 mechanical_clear；新增 F418（Trip.com 台灣站館名） |
| 潤稿 | 讀 GLTJP 2 篇、MATCHA 3 篇；五項檢查通過 |
| 編輯挑錯 | 17 條（巴士從站前發車講三次、段首條件句型、語意不通） |
| 意義比對 | 不可接受 3、遺失 0，已修；另修正「12 月或 1 月都訂得到」超出 F413 |
| 事實查核第 1 輪 | 55 項，incorrect 1（C17 日文名搜不到）、unsupported 1（C45 前身館名） |
| 讀者驗收 | 第一階段 revise 必修 4；第二階段最終必修 8 |
| 作者驗收後第 1 輪 | 8 條必修處理，新增 F419～F422（完整館名、おもてなし券販售飯店、證明文件、ドーミーイン巴士站） |
| 事實查核第 2 輪 | 57 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 各家價格（住宿頁不寫價格）。
- ドーミーイン門口巴士站的站名。
- 住宿稅能不能刷卡、各官網有沒有中英文版、12 家是否都有大浴場。

## 留給之後的事

- 事實表待同步：F401～F422、F412 前身館名不採用。
- おもてなし券「入園後不限停留時間」只有旭川觀光コンベンション協會存檔一個來源，2026-11-25 重查。

最終結果：`ready_for_user_preview`
