# sounkyo-transport 驗收紀錄

- 文章：層雲峽交通（`/places/sounkyo/transport/`，aspect-page，地點 `sounkyo`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`4f47a9804b3138dfe38402b58224ad30a44bde2269e15fb836bd9aede7586931`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 3 個標題；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 3 輪 93 項全部 verified） |
| 口吻 | check-voice --final 通過（只有長句提醒） |
| 事實編號 | tags_clear，事實表 67 筆、正文用 59 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 4 篇、MATCHA 1 篇） |
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
| 協調者 | 人工 session 主代理（Opus 5.5）；讀者最終判定後照查核建議直接改兩句（林道關閘主詞、瀧見台去掉沒有來源的「銀河、流星瀑布一帶」）；定稿檢查擋下整句日文按鈕文字，改成只引「受付用チケット」，請查核者複查 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；事實 57 筆（新增 F196～F207）；道北巴士官網連不上，用 Internet Archive 2026-10-08 存檔、層雲峽觀光協會轉貼的時刻表圖、道北巴士官方販售網站三方核對 |
| 作者 | 初稿 mechanical_clear；帶前綴事實複製成 F208～F210 |
| 潤稿 | 讀 GLTJP 4 篇、MATCHA 1 篇；五項檢查通過；第一輪把「上川站沒有鐵路往層雲峽」改成錯的「終點」，第二輪改回 |
| 編輯挑錯 | 20 條（「……的話」9 次、規則排成句子、末班重講），採納 14 |
| 意義比對 | 不可接受 3、遺失 0，已修 |
| 事實查核第 1 輪 | 85 項，incorrect 1（C42 機場巴士主詞）、unsupported 1（C53 隔年 6 月開放） |
| 讀者驗收 | 第一階段 revise 必修 6；第二階段最終必修 10 |
| 作者驗收後第 1 輪 | 10 條必修處理，補研究 F211～F220（層雲峽端下車處、サンライズ號只能下車、紅葉期林道管制、網路票按鈕對照、計程車公司） |
| 事實查核第 2～4 輪 | 93 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 2026 年冬季時刻（正文照 2026.7.1 版寫，附旭川站前營業所電話）。
- 道北巴士能不能用 IC 卡、上川往北見網走的 JR 組合、サンライズ號訂票網站語言。
- 瀧見台站與銀河、流星瀑布的位置關係（沒有官方寫明）。

## 留給之後的事

- 事實表待同步：F196～F220、F18 由 F200～F202 取代、F176 下次查核 2026-11-25、F17 的 15:08 是特別快速きたみ。
- 道北巴士官網恢復後重查時刻表與 PDF 連結；冬季時刻公布後更新。

最終結果：`ready_for_user_preview`
