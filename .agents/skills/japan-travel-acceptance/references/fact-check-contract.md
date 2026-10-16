# 事實查核規則

## 要查哪些事實

從目前正文逐一找出，不只查作者列在研究記錄裡的：

- 日期與期間：祭典日期、花季、營業期間、停駛期間
- 時間：班次、所需時間、營業時間、入住與退房時間、末班車
- 價格：票價、房價、餐費；含稅或未稅、每人或每室
- 狀態：是否營業、是否停駛、是否需要預約、是否只收現金
- 名稱：旅館、店家、港口、車站、祭典的日文原名與繁中譯名
- 訂房管道：官網、Trip.com、Agoda、僅 Jalan
- 指示用的日文句子與按鈕對照表
- 平年值：氣溫、降水量、日照時數
- 選擇理由：推薦某間旅館或某條路線的依據

## 怎麼查

1. 實際打開來源網址。打不開的記 `unreachable`，不能憑研究記錄判定。
2. 在頁面上找到支持這個事實的原文，保存最短的摘錄。
3. 核對適用條件：季節、期間、適用對象、是否含稅。
4. 核對譯名與日文原名一致，並與 `content-planning/glossary.json` 一致。
5. 核對年號換算、「〜頃」是否被寫成確定日期、「要予約」是否被寫成建議。
6. 指示用的日文句子要自然、正確，意思和中文說明一致。
7. 研究記錄的來源和你找到的較新來源不一致時，以較新的官方來源為準，記 `outdated`。

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
