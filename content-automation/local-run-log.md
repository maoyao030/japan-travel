# 本機自動寫作執行紀錄

流程見 `content-automation/local-writer.md`。每輪結束時更新：「最新一輪」整段覆寫，「停放」更新或新增列，「紀錄」第一列插入本輪。

## 最新一輪

- 台北時間：2026-10-20 21:54 開始，22:39 結束（排定工作第一次自動執行）
- 文章：`cape-soya-transport`（宗谷岬交通）
- 結果：**完成**（`ready_for_user_preview`，`local-article-gates.mjs` 印出 `gates_clear`）
- 事實查核：3 輪，最終 91 項 claim 全部 verified
- 讀者驗收：第二階段必修 12 條，最終剩 1 條，第 2 輪解決，判 acceptable
- 用量：5 小時額度 4% → 14%；每週額度 11% → 13%
- commit：本輪 `feat(content): cape-soya-transport 本機寫作完成`（短碼見 git log）
- 注意：事實查核第 1 輪用瀏覽器開時刻表 PDF 時，網站直接回傳下載檔，Darren 的電腦跳出過一次存檔對話框（沒有點下載，改用 curl）
- 下一輪預期文章：`wakkanai-stay`

## 停放

| 文章 ID | 日期 | 原因 | 狀態 |
|---|---|---|---|

## 紀錄

| 台北時間 | 文章 ID | 結果 | 事實查核輪數 | 5 小時額度變化 | 待同步的事實 |
|---|---|---|---|---|---|
| 2026-10-20 22:39（自動） | cape-soya-transport | 完成 | 3 | 4% → 14% | 宗谷岬 F54、F88、F104 更正；F98～F107 新增 |
| 2026-10-20 17:35（人工） | wakkanai-transport | 完成 | 3 | 24% → 40% | 稚內 F61、F64、F68、F79 更正；F188～F197 新增 |
| 2026-10-20（人工） | rishiri-island-transport | 完成 | 4 | 未量 | 利尻島 F23、F33、F37 已更正，待同步 D1 |
| 2026-10-18（人工） | wakkanai-ferry | 完成 | 3 | 未量 | 無 |
