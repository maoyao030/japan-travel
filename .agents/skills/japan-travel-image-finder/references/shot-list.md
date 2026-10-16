# 待拍清單

現場辨識的照片最難找，維基共享資源與圖庫通常不會有「稚內港售票口」。找不到時不用 AI 圖充數，記進全站共用的待拍清單：`content-planning/shot-list.json`。Darren 去日本時照著清單拍，拍完以 `own-photo` 補進該篇的圖片封包。

## 格式

```json
{
  "items": [
    {
      "shotId": "wakkanai-ferry-ticket-counter",
      "articleId": "wakkanai",
      "slotId": "ferry-counter",
      "placeId": "wakkanai",
      "subject": "稚內港渡輪站的售票口",
      "angle": "從入口往售票口拍，能看見上方的日文標示",
      "mustShow": ["售票口上方的日文標示", "排隊的位置"],
      "avoid": ["可辨識的人臉", "個人證件或票券上的姓名"],
      "addedAt": "2026-10-16",
      "status": "wanted",
      "fulfilledAt": null
    }
  ]
}
```

## 規則

- `status`：`wanted`（待拍）、`fulfilled`（已拍並補進封包）、`dropped`（不需要了，`notes` 寫原因）。
- 同一個地點的項目放在一起，方便 Darren 一次拍完。
- 圖片封包裡該位置寫 `shotListId`，候選保持空白；文章在那一節用文字描述位置。
- 拍攝時避開可辨識的人臉；招牌與標示可以拍，那正是讀者要認的東西。
