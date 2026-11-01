# sounkyo-weather 驗收紀錄

- 文章：層雲峽天氣與楓葉（`/places/sounkyo/weather/`，aspect-page，地點 `sounkyo`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`aba9e48f556379fb1a8337f4a51430609f08992bf63720d5a3b51e8167284fd6`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`
- 備註：作者驗收後第 1 輪回報的雜湊是 `bf8c2215…`；協調者之後把大綱指定的內連句「1 月下旬」改成「1月下旬」（大綱與正文同步，只刪一個半形空格），事實查核第 2 輪與讀者最終判定都是對 `aba9e48f…` 這一版做的。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 1 個標題；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 89 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 50 筆、正文用 43 筆 |
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
| 協調者 | 人工 session 主代理（Opus 5.5）；同步標題；大綱內連句與正文刪掉一個半形空格，沒有改其他正文 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；新增 F260～F279（上川各月最高最低、真冬日、降雪、層雲峽各月降水與降雪、遊客中心 2024～2026 紅葉紀錄、紅葉期管制） |
| 作者 | 初稿 mechanical_clear |
| 潤稿 | 讀 GLTJP 2 篇、MATCHA 3 篇；五項檢查通過 |
| 編輯挑錯 | 紅葉兩段日文直譯詞密集等 |
| 意義比對 | 不可接受 2（路面積雪程度變弱、跌倒提醒變成通則），已修 |
| 事實查核第 1 輪 | 非 verified 7（C4 平年值範圍、C11 7 月降水例外、C67 見頃、C69 連假日期、C75「常」、C79 包車用詞、C84 積雪日期） |
| 讀者驗收 | 第一階段 revise；第二階段最終必修 10 |
| 作者驗收後第 1 輪 | 10 條必修處理（第 5 條內連句保留大綱原句），紅葉 H3 改依年份排 |
| 事實查核第 2 輪 | 89 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 層雲峽溫泉街本身的氣溫平年值（層雲峽アメダス不量氣溫，正文用上川並說明溫泉街較高）。
- 2025、2026 年的山路冬季封路日（正文用 2024 年為例並標年份）。
- 合目的位置與纜車到哪一站（歸纜車頁）。

## 留給之後的事

- 事實表待同步：F260～F279；F62、F117、F274 條件更正。
- 2027-08-01 前重查遊客中心紅葉紀錄；紅葉期管制 2027 年公告後更新。

最終結果：`ready_for_user_preview`
