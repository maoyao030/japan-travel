# asahikawa-weather 驗收紀錄

- 文章：旭川天氣（`/places/asahikawa/weather/`，aspect-page，地點 `asahikawa`，旭川・大雪群）
- 日期：2026-10-26～27（人工 session，Darren 要求今天持續寫作，10/27 要求把做一半的都做完；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`6aadc41ca7785b16f70998f965a486cae1b18b6c6f2f26074f95e6730728fd93`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`
- 備註：作者驗收後修改因額度上限中斷，10/27 接續完成。讀者回報的 `d8326860…` 是沒統一換行前的雜湊，換成 LF 後與 `6aadc41c…` 相同。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 1 個 H3，作者修改時再改一次；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 81 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 38 筆、正文用 36 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 2 篇、MATCHA 3 篇） |
| 圖片 | 這次沒有選圖 |

## 身分

| 角色 | 身分 |
|---|---|
| 研究者 | 子代理（Opus 5.5），寫作前補研究 |
| 作者 | 另一個子代理（Opus 5.5），寫初稿與驗收後第 1 輪 |
| 潤稿者 | 另一個子代理（Opus 5.5），沒寫過這篇 |
| 編輯挑錯 | 另一個子代理（Opus 5.5） |
| 意義比對 | 另一個子代理（Opus 5.5） |
| 標題檢查 | 另一個子代理（Opus 5.5） |
| 事實查核 | 另一個子代理（Opus 5.5），唯讀 |
| 讀者驗收 | 另一個子代理（Opus 5.5），唯讀 |
| 協調者 | 人工 session 主代理（Opus 5.5）；大綱內連句刪掉半形空格、補一條連到旭川交通的內連句、同步標題，沒有改正文 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | 新增 F470～F485（真冬日與冬日日數、各月平年值等） |
| 作者 | 初稿 mechanical_clear |
| 潤稿 | 讀 GLTJP 2 篇、MATCHA 3 篇；五項檢查通過 |
| 意義比對 | 不可接受 1、遺失 0，已修 |
| 事實查核第 1 輪 | 76 項，非 verified 2（C39 動物園冬期寫成連續區間、C47 輻射冷卻因果過頭） |
| 讀者驗收 | 第一階段 revise 必修 3；第二階段最終必修 4（冬天怎麼穿、暴風雪時交通、動物園日期、輻射冷卻） |
| 作者驗收後第 1 輪 | 4 條必修與 10 條加分處理，新增 F486～F489（JR 列車運行狀態繁中頁、動物園冬期兩段、全年平均、30°C 以上日數），更正 F141、F128 |
| 事實查核第 2 輪 | 81 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 穿著的商品名與民間清單（正文只用平年值推出穿著層次）。

## 留給之後的事

- 事實表待同步：F470～F489；F141、F128 更正。
- 讀者驗收加分沒做：春秋那節初雪講兩次；「1月有25.8天整天都在冰點以下」出現兩次；內連句「冬季動物園只開到15:30」在 2 月特別開園日不成立（細節歸旭山動物園頁）。
- 旭山動物園 2027～2028 冬期日期公布後重查。

最終結果：`ready_for_user_preview`
