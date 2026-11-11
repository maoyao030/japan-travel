# biei-transport 驗收紀錄

## SHA-256（LF）

249812d829edddacdc5f389bb3d616eed0bfc1325807dbe3b9d868c84b7984e4

## 最終結果

**parked**

原因：事實查核 3 輪後仍有 9 項 unreachable（47/56 verified、0 incorrect、9 unreachable）。unreachable 的來源：道北巴士官網拒絕連線（C16, C37, C38）、美瑛觀光協會活動子頁重導向首頁（C27, C28, C29, C30, C34）、JR 北海道站頁不可達（C26）。文章內容本身沒有錯誤（0 incorrect），讀者驗收 pass，但 unreachable 在 gates 裡算 blocking。

## 結果表

| 項目 | 結果 |
|---|---|
| 格式 | mechanical_clear |
| 標題 | acceptable（2 處修改已套用） |
| 讀者價值 | acceptable → pass |
| 事實與條件 | 47/56 verified、9 unreachable |
| 口吻 | 通過 |
| 事實編號 | tags_clear（42 筆，用 38 筆） |
| 防抄襲 | check-polish 通過 |
| 圖片 | 這次沒有選圖 |

## 身分

- 作者：Opus 4.6（fork）
- 潤稿者：Opus 4.6（fork）
- 標題檢查：Opus 5.5
- 事實查核：Opus 5.5（3 輪）
- 讀者驗收：Opus 5.5
- 意義比對：Opus 4.6（fork）
- 協調者：Opus 4.6（排定工作）

## 經過

1. 寫作前補研究：ready（42 筆事實）
2. 作者初稿：四項檢查通過
3. 潤稿：四項檢查通過，刪 2 個規格
4. 意義比對：0 處不可接受、0 處遺失
5. 驗收（3 個子代理同時）：標題 2 處修改、事實查核 40/56 verified + 3 incorrect + 13 unreachable、讀者 acceptable + 1 必修 + 6 加分
6. 讀者第二階段：5 必修（含事實查核 3 incorrect + 標題 2 處）
7. 作者修改：5 必修全部處理、三項檢查通過
8. 事實查核複查：43/56 verified、0 incorrect、13 unreachable
9. 讀者最終：pass
10. 事實查核第 3 輪（瀏覽器）：47/56 verified、0 incorrect、9 unreachable
11. 停放：unreachable 在 gates 裡算 blocking，來源站點本身掛了無法解決

## 留給之後的事

- 道北巴士官網（dohokubus.com）恢復後重查 C16（感應付款）、C37（票價 800/900 圓）、C38（1 日券）
- 美瑛觀光協會活動子頁恢復後重查 C27（Car Share）、C28-C29（BIEI HILLS）、C30（騎車時間）、C34（美遊巴士）
- JR 北海道站頁恢復後重查 C26（綠色窗口時間）
- C15 第 4 班時刻差異（正文 14:55 vs Jorudan 14:40）：可能是 2026-10-01 改正差異，道北巴士官網恢復後核對
