# asahidake-ropeway 驗收紀錄

- 文章：旭岳纜車與姿見の池（`/places/asahidake/ropeway/`，景點頁，aspect-page，地點 `asahidake`，旭川・大雪群）
- 日期：2026-10-26（人工 session，Darren 要求今天持續寫作；旭川・大雪群大綱 Darren 同意做好就寫，景點升格列在大綱例外）
- 稿件 SHA-256（LF）：`0a72e593498b00269a48dec68a0ebd74423ff0f68289e38874f8290fd2a310f4`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 3 個 H2；heading_review.py `headings_applied`；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 104 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 77 筆、正文用 69 筆 |
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
| 協調者 | 人工 session 主代理（Opus 5.5）；要求作者拿掉來自網頁註解舊月曆的 1～6 月營業時間；大綱補連到旭岳溫泉住宿的內連句；收斂時照查核建議把「它」改成「東川町的山頂カメラ」 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；事實 74 筆（新增 F179～F198）；纜車官網原始碼裡被註解掉的舊文字（不能刷卡、舊月曆）不採用 |
| 作者 | 初稿 mechanical_clear；協調者要求拿掉 1～6 月與散策路關閉後的繞圈例子 |
| 潤稿 | 讀 GLTJP 2 篇、MATCHA 3 篇；五項檢查通過 |
| 編輯挑錯 | 24 條（日文直搬、重講、「下行末班」11 次） |
| 意義比對 | 第一輪 0；第二輪不可接受 2、遺失 1，已修 |
| 事實查核第 1 輪 | 97 項，incorrect 2（C31 漏 9/12、9/13；C36 攝影機連結） |
| 讀者驗收 | 第一階段 revise 必修 3；第二階段最終必修 6 |
| 作者驗收後第 1 輪 | 6 條必修處理，新增 F199～F201，更正 F180、F188、F18 |
| 事實查核第 2、3 輪 | 104 項全部 verified |
| 讀者最終 | acceptable，剩餘必修 0 |

## 查不到所以正文沒寫的

- 纜車 2027 年與 1～6 月的營業時間（官網月曆只排到 2026 年 12 月）。
- 錯過末班巴士時的計程車公司（正文改成改搭 14:55 或住旭岳溫泉）。
- 紅葉季實際排隊多久、冬季穿著建議。

## 留給之後的事

- 事實表待同步：F179～F201、F21、F54、F56、F58、F60、F62、F80 更正。
- 纜車官網公布 2027 年月曆後補營業時間。

最終結果：`ready_for_user_preview`
