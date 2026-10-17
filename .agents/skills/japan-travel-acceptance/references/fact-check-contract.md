# 事實查核規則

## 要查哪些事實

從目前正文逐一找出，不只查作者列在研究記錄裡的：

- 日期與期間：祭典日期、花季、營業期間、停駛期間
- 時間：班次、所需時間、營業時間、入住與退房時間、末班車
- 價格：票價、房價、餐費；含稅或未稅、每人或每室
- 狀態：是否營業、是否停駛、是否需要預約、是否只收現金
- 名稱：旅館、店家、港口、車站、祭典的日文原名與繁中譯名
- 訂房管道：官網、Trip.com、Agoda、僅 Jalan
- 按鈕對照表、現場招牌與站名的日文
- 平年值：氣溫、降水量、日照時數
- 選擇理由：推薦某間旅館或某條路線的依據
- 人氣數字：評分、評論數、榜單，含平台名稱與查核日期
- 評論統整：每一句「評論常提到…」（研究記錄的 `R` 編號）
- 自製示意圖資料檔（`images/diagrams/*.json`）裡的每一筆 `factId`：圖上的時間、地名與航線也是正文事實的一部分

## 怎麼查

1. 實際打開來源網址。打不開的記 `unreachable`，不能憑研究記錄判定。
2. 在頁面上找到支持這個事實的原文，保存最短的摘錄。
3. 核對適用條件：季節、期間、適用對象、是否含稅。
4. 核對譯名與日文原名一致，並與 `content-planning/glossary.json` 一致。
5. 核對年號換算、「〜頃」是否被寫成確定日期、「要予約」是否被寫成建議。
6. 按鈕、招牌與站名的日文要和原頁一致。
7. 研究記錄的來源和你找到的較新來源不一致時，以較新的官方來源為準，記 `outdated`。
8. 核對來源層級（`.agents/skills/japan-travel-answer-first/references/japanese-sources.md` 的內容分級）：交通與規則的事實，來源不是經營者官方（例如只有部落格、平台或評論）時記 `unsupported`，即使內容看起來正確。店家資訊只有平台、沒有官網或官方社群時，正文必須寫明資料來自哪個平台與查核日期，否則記 `unsupported`。
9. 評分與評論數：打開平台頁面，數字可以和正文略有差距（查核日期不同），但正文必須寫平台名稱與查核日期；沒有日期記 `unsupported`。
10. 評論統整：依研究記錄的「評論統整」表，打開同一批評論（同一平台、同樣的讀過範圍），確認兩個平台以上、三則以上真的提到這個特點，反面說法也有寫。達不到門檻，或正文像在改寫某一則評論，記 `unsupported`。`sourceQuote` 寫自己的確認摘要（例如「Google 地圖最新 30 則中 4 則提到份量多」），不貼評論原文。

## fact-check.json

```json
{
  "schemaVersion": 1,
  "articleId": "rebun-island",
  "articleSha256": "reader-preview.md 的 SHA-256",
  "checker": "事實查核 agent 的身分描述",
  "checkedAt": "2026-10-16",
  "claims": [
    {
      "claimId": "C1",
      "articleExcerpt": "正文中這個事實的原句",
      "sourceUrl": "https://example.invalid/timetable",
      "sourceTitle": "來源頁的日文原標題",
      "sourceQuote": "支持這個事實的日文原文摘錄",
      "verdict": "verified",
      "notes": ""
    }
  ],
  "summary": {
    "verified": 1,
    "incorrect": 0,
    "unsupported": 0,
    "outdated": 0,
    "unreachable": 0,
    "not-stated": 0
  }
}
```

範例網址只示範結構。

## verdict 的意思

| verdict | 意思 |
|---|---|
| `verified` | 原文支持，條件一致 |
| `incorrect` | 原文和正文不一致 |
| `unsupported` | 找不到支持這個事實的原文 |
| `outdated` | 有更新的官方資訊和正文不一致 |
| `unreachable` | 來源打不開，無法查證 |
| `not-stated` | 正文寫「官方沒有寫明」，查核者也確認官方頁沒有這項資訊 |

只要有 `incorrect`、`unsupported` 或 `outdated`，事實與條件就是 `reject`。`unreachable` 要另找官方來源；找不到就是 `not_checked`，不能放行。

`verified` 必須同時有 `sourceUrl` 與 `sourceQuote`；`not-stated` 必須有 `sourceUrl` 與寫明查過哪些頁面的 `notes`。驗證程式會檢查這些欄位，以及 `summary` 是否和 `claims` 的實際數量一致。

## 客觀狀況與嵌入（2026-10-18）

- 直接寫成肯定句的客觀狀況（風大、坡陡、人多、班次少），要有事實編號，或 `R` 編號對應三個以上彼此獨立的來源；只有一兩個來源時判 `revise`，改成有條件的說法或刪除。
- 對特定店家、旅館的評價寫成肯定句（例如「這家很好吃」），判 `revise`，要改成「評論常提到」的寫法。
- 嵌入的影片或貼文：確認研究記錄有網址、頻道、年份與對題依據，正文不依賴嵌入也看得懂。嵌入區塊還沒做好前，正文出現嵌入判 `revise`。
