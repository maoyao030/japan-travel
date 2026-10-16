# 頁面規格

每個保留頁寫成一筆規格，存在 `content-planning/<區域>/page-specs.json` 的 `items` 陣列。文件頂層 `status` 在規劃完成時設為 `planning-complete`。Darren 核准後，主要 task 依 `scripts/article-automation-policy.mjs` 的規則把核准的頁面寫進 `content-automation/article-queue.json`；清單的主要查詢、網址、內容邊界、標題與讀者任務必須和規格逐欄一致。

## 欄位

```json
{
  "articleId": "rebun-island",
  "decision": "keep",
  "pageType": "place-entry",
  "planningTitle": "禮文島交通、住宿與花季，從稚內搭渡輪上島的完整安排",
  "primaryQuery": "禮文島",
  "secondaryQueries": ["禮文島住宿", "禮文島交通", "禮文島船票"],
  "targetPath": "/places/rebun-island/",
  "routeDecision": "resolved",
  "routeMode": "hub-landing",
  "aspect": "other",
  "primaryHubId": "hub-places-rebun-island",
  "contentBoundary": "只寫禮文島本島與從稚內往返的交通；利尻島另有條目，只在跳島安排時簡述。",
  "place": {
    "nameZh": "禮文島",
    "japaneseNames": ["礼文島"],
    "japaneseSearchTerms": ["礼文島 フェリー 時刻表", "礼文島 宿泊", "礼文島 花"],
    "region": "hokkaido",
    "nearbyPlaceIds": ["rishiri-island", "wakkanai"],
    "gatewayPlaceIds": ["wakkanai"],
    "bestMonths": [6, 7, 8]
  },
  "readerTaskContract": {
    "primaryTask": "讓不會日文的台灣旅客決定要不要去禮文島，並排出交通與住宿。",
    "primaryReaderOutcome": "讀完能訂到船票與住宿，知道哪個月去、島上怎麼移動。",
    "mustAnswer": [
      "從稚內怎麼搭渡輪到禮文島，一天幾班、要多久",
      "禮文島船票怎麼買，日文訂票頁怎麼操作",
      "島上住宿有哪些，能從哪裡訂",
      "花季是幾月，哪條步道適合",
      "冬天能不能去，船會不會停駛"
    ],
    "excludedDepth": [
      {"topic": "利尻島島內安排", "ownerArticleId": "rishiri-island", "reason": "另有條目"}
    ],
    "sharedGuides": ["japanese-timetable", "local-bus-seiriken"]
  },
  "bookingChannels": "research-required",
  "keywordEvidence": [
    {
      "provider": "Ahrefs MCP",
      "ahrefsVerified": true,
      "country": "TW",
      "checkedAt": "2026-10-16",
      "query": "禮文島",
      "volume": 400,
      "trafficPotential": 100,
      "serpIntentConfirmed": true,
      "serpNotes": "前十名為維基百科、旅行團行程與少數個人攻略，與利尻島共用三個網址。"
    }
  ],
  "competition": "前五名沒有自己上島的完整繁中攻略。",
  "discoveries": [],
  "internalLinkFields": "由 place 欄位自動產生；正文情境連結在寫作時從已上線清單挑選。"
}
```

## 規則

- `decision` 使用 `keep`、`merge`、`defer`、`remove`。`merge` 要寫明併入哪一頁；`defer` 要寫明等待什麼條件。
- `pageType` 使用 `place-entry`（地點條目）、`aspect-page`（面向頁）、`topic-page`（主題頁）、`shared-guide`（共用教學頁）。
- `planningTitle` 不用冒號，也不用「懶人包」「重點整理」等制式標籤。H1 與 SEO Title 由寫作 Skill 在研究後定稿。
- `mustAnswer` 收錄 0 量與 10 量的長尾問題。這是條目接住長尾的方式，不能因為沒有搜尋量就刪掉。
- 住宿相關頁的 `bookingChannels` 在規劃時填 `research-required`；寫作研究完成後，文章清單要寫成實際管道陣列（`official`、`trip.com`、`agoda`、`jalan-only`），並附 `factCheck` 查核日期與一年後重查日。
- `keywordEvidence.provider` 只能是 `Ahrefs MCP`、`Ahrefs browser UI` 或 `SERP observation`。只有前兩者可以把 `ahrefsVerified` 設為 `true`。
- `serpIntentConfirmed` 必須是實際看過搜尋結果頁後才填 `true`。
- `targetPath` 依頁型填寫，網址最多三層，`routeDecision` 填 `resolved`：
  - 地點條目：`/places/<地點>/`，`routeMode` 為 `hub-landing`，文章 slug 與地點 Hub 相同。地區（北海道）也是 `/places/<地區>/`，地點不放進地區底下，上下關係只填 `place.region`。
  - 面向頁：`/places/<地點>/<面向>/`，例如 `/places/hakodate/stay/`，`routeMode` 為 `parent-direct-article`。同一地點同一面向要再分時，用連字號代稱，例如 `/places/hakodate/stay-onsen/`。
  - 主題頁與共用教學頁：`/seasons/<主題>/`、`/shrines/<主題>/`、`/guides/<教學>/`，通常是 `hub-landing`。
  - 不開第四層。地點裡的地點（例如利尻島的沓形）有獨立搜尋需求時升格成 `/places/kutsugata/` 並填 `region`，否則寫成條目裡的一節。
- `aspect` 使用 `stay`、`food`、`transport`、`weather`、`hiking`、`festival`、`sight`、`other`。同一面向滿 5 篇、同一月份滿 5 個項目、同一地區滿 3 個地點時，網站自動建立目錄頁、月份頁與地區的地點清單；不需要規劃這些列表頁。
- 只有確定要改分類或新開分類時才填 `routeDecision: pending`，這種規格不能進入文章清單。
- `sharedGuides` 列出本頁會連到的共用教學頁 ID；教學頁本身也要有規格。
