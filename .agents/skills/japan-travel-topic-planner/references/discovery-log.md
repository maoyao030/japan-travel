# 發現清單

研究或寫作時，從日文官方資料發現的祭典、花火大會、特色料理、步道、景點，記進該區域的發現清單：`content-planning/<區域>/discoveries.json`。選題規劃每次都要讀它，把有價值的項目接進地點條目或列為候選。

## 格式

```json
{
  "region": "hokkaido",
  "items": [
    {
      "discoveryId": "rebun-flower-season",
      "nameZh": "禮文島花季",
      "nameJa": "礼文島 花の見頃",
      "type": "season",
      "placeId": "rebun-island",
      "timing": {"months": [6, 7, 8], "note": "依官方花況，每年不同"},
      "sourceUrl": "https://example.invalid/official-page",
      "sourceTitle": "官方頁面的日文原標題",
      "checkedAt": "2026-10-16",
      "foundDuring": "rebun-island 研究",
      "initialDecision": "section",
      "reason": "條目的季節段落要回答；是否單獨成頁等 Search Console。"
    }
  ]
}
```

範例網址只示範結構。

## 欄位規則

- `type`：`festival`（祭典）、`fireworks`（花火大會）、`food`（特色料理）、`trail`（步道與登山）、`sight`（景點）、`season`（花季、流冰、雪等季節現象）、`event`（其他活動）。
- `sourceUrl` 必須是實際開啟過的官方或公部門頁面；日文商業網站只能用來發現，事實要回到官方查證後才記。
- `timing.months` 填 1～12 的月份。有月份的項目，之後會自動進入月份頁。
- `initialDecision`：`section`（寫進所屬地點條目）、`candidate`（列為獨立頁候選，下一輪選題時依流程第 6 步判斷）、`skip`（不寫，要寫原因）。
- 預設是 `section`。只有大型祭典或明顯有獨立搜尋需求的項目才直接列 `candidate`。
- 已停辦、停駛或改期的項目也要記，寫成「目前沒有」也是在回答讀者，例如稚內到庫頁島的航線。

## 判斷要不要寫

不靠 Ahrefs 也能判斷：

1. 台灣旅客會不會為它安排行程或改日期？
2. 有沒有官方資料可以查證日期、地點與條件？
3. 它在所屬地點的條目裡，能不能回答一個讀者會問的問題？

三題都是「否」才標 `skip`。
