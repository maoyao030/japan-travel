# asahiyama-zoo 驗收紀錄

- 文章：旭山動物園（`/places/asahikawa/asahiyama-zoo/`，景點頁，aspect-page，地點 `asahikawa`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫，景點升格列在大綱例外）
- 稿件 SHA-256（LF）：`1b22d5736947e58beb3e637009f8dbb761d831dacf9ba31fb4abd005b1171319`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（標題檢查 0 改動；讀者驗收第二階段要求 H2「從旭川站搭公車去旭山動物園」改成「旭川旭山動物園怎麼去」，協調者同步 heading-review.json 與大綱；heading_review.py `headings_applied`） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 4 輪 90 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 58 筆、正文用 55 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 2 篇、MATCHA 2 篇） |
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
| 協調者 | 人工 session 主代理（Opus 5.5）；決定「逛多久」不用旅遊網站說法（F211）；收斂時照查核建議直接加「平常」兩字 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；事實 54 筆（新增 F201～F214）；更正 41、47 號是旭川站發 |
| 作者 | 初稿 mechanical_clear；協調者要求拿掉「1、2 月比較穩」「旅遊網站抓半天」 |
| 潤稿 | 讀 GLTJP 2 篇、MATCHA 2 篇；五項檢查通過 |
| 編輯挑錯 | 24 句（「只在」8 次、42 號急行重講、日文直搬） |
| 意義比對 | 不可接受 3、遺失 1（夏季 8:40 的 41 號被誤刪），已修 |
| 事實查核第 1 輪 | 88 項，incorrect 7、unsupported 1（閉園後末班車在旭山公園入口上車沒寫等） |
| 讀者驗收 | 第一階段 revise 必修 8；第二階段最終必修 12 |
| 作者驗收後第 1 輪 | 12 條必修處理，新增 F215～F217（42 號乘車處、雪あかり期間公車延長與出入口） |
| 事實查核第 2～4 輪 | 90 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 2026～27 季企鵝散步的時刻（正文請讀者看官網當日行程）。
- 旭山公園入口站離正門多遠、入園窗口能不能刷卡、紙本地圖去哪拿。
- 夜の動物園期間公車加開的時刻。

## 留給之後的事

- 事實表待同步：F201～F217、F19、F20、F29、F152 更正。
- 2026-12-10 重查企鵝散步開始日；2027 年雪あかり的實施概要公布後更新。

最終結果：`ready_for_user_preview`
