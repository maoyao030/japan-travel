# asahidake-hiking 驗收紀錄

- 文章：旭岳登山（`/places/asahidake/hiking/`，aspect-page，地點 `asahidake`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`e95ceb0fc0d7a3bacaf5b17b81f9bee5711c5ad1d691366c10f99df41f82da6c`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`
- 備註：第一位潤稿者的工作脈絡找不到，編輯挑錯後的修改與意義比對後的修正由另一位沒寫過這篇的潤稿者接手。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 1 個 H3；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 116 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 66 筆、正文用 62 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 3 篇、MATCHA 2 篇） |
| 圖片 | 這次沒有選圖 |

## 身分

| 角色 | 身分 |
|---|---|
| 研究者 | 子代理（Opus 5.5），寫作前補研究，判定 `ready` |
| 作者 | 另一個子代理（Opus 5.5），寫初稿與驗收後第 1 輪 |
| 潤稿者 | 另一個子代理（Opus 5.5），沒寫過這篇；第 4-2 步之後由第二位潤稿者接手 |
| 編輯挑錯 | 另一個子代理（Opus 5.5） |
| 意義比對 | 另一個子代理（Opus 5.5） |
| 標題檢查 | 另一個子代理（Opus 5.5） |
| 事實查核 | 另一個子代理（Opus 5.5），唯讀 |
| 讀者驗收 | 另一個子代理（Opus 5.5），唯讀 |
| 協調者 | 人工 session 主代理（Opus 5.5）；大綱內連句改成「在東川町停車與逛街，見東川町。」（原句讀不懂），同步標題，沒有改正文 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；事實 64 筆 |
| 作者 | 初稿 mechanical_clear |
| 潤稿 | 讀 GLTJP 3 篇、MATCHA 2 篇；五項檢查通過 |
| 編輯挑錯 | 34 條（日文詞照搬、條件詞重複、一段塞七件事） |
| 意義比對 | 不可接受 2（裝備不足「特別容易」加強、攜帶式廁所回收箱條件掛錯），已修 |
| 事實查核第 1 輪 | 112 項，非 verified 5（C54 ココヘリ求救條件、C62／C105 扭傷、C63 9 合目單日觀察、C93 資料來源機構名） |
| 讀者驗收 | 第一階段 revise 必修 6；第二階段最終必修 10 |
| 作者驗收後第 1 輪 | 10 條必修處理，新增 F242、F243，F22 更正；防熊噴霧與輕冰爪要自己準備、6 月末班往回推、全道統計刪掉 |
| 事實查核第 2 輪 | 116 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 山頂經間宮岳、中岳溫泉到裾合平那段的時間（正文改成走一圈排一整天、出發前到遊客中心問）。
- 6 月的纜車末班（官網月曆只到 7～12 月，正文教讀者查月曆往回推）。
- 遇到熊怎麼做、山上天氣去哪查、協力金金額、トランジット東川是什麼店。

## 留給之後的事

- 事實表待同步：寫作前補研究新增的事實、F242、F243、F22 更正；F232 研究記錄「雲已散開」與原文相反，要更正。
- 資料來源還列著北海道警察 r08.pdf，正文已不用，下次修改時拿掉。
- 2027 年纜車月曆公布後補 6 月末班。

最終結果：`ready_for_user_preview`
