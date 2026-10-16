# 缺圖清單

現場辨識的照片最難找，維基共享資源與圖庫通常不會有「稚內港售票口」，本站也不預期有人去現場拍。找不到合格照片時，不用 AI 圖充數，也不讓缺圖擋住發布：文章先用文字讓讀者認得出現場，缺口記進全站共用的缺圖清單 `content-planning/missing-images.json`，之後再看要不要向觀光協會申請素材。

## 找不到照片時的三個做法

依序考慮，第 2 項每次都要做：

1. **向觀光協會或交通公司申請素材**：北海道不少觀光協會有照片素材庫，填申請表就能用。選圖 Skill 只整理「向誰申請、申請哪幾張、利用規約在哪」，寄不寄由 Darren 決定，本 Skill 不寄信、不填申請表。
2. **用文字讓讀者認得出來**：寫出現場招牌上的日文原文（例如「フェリーターミナル」「乗車券売場」），加上位置描述（出了閘口右手邊、紅色屋頂那棟）與附近的地標。這段由寫作 Skill 寫進正文；選圖 Skill 在封包的 `textFallback` 記錄正文用了哪些字。
3. **連到官方的照片**：連到交通公司、旅館官網上有照片的頁面或官方構內圖（構内図），以及 Google 地圖街景。只放連結，不把照片下載或轉貼過來。

## 格式

```json
{
  "items": [
    {
      "gapId": "wakkanai-ferry-ticket-counter",
      "articleId": "wakkanai",
      "slotId": "ferry-counter",
      "placeId": "wakkanai",
      "need": "site-identification",
      "subject": "稚內港渡輪站的售票口",
      "mustShow": ["售票口上方的日文標示", "排隊的位置"],
      "searchedAt": "2026-10-16",
      "searchedSources": ["Wikimedia Commons", "Unsplash", "Pexels", "Pixabay", "稚内観光協会 写真素材"],
      "status": "text-fallback",
      "request": {
        "organization": "稚内観光協会",
        "requestUrl": "https://example.com/photo-library/apply",
        "termsUrl": "https://example.com/photo-library/terms",
        "commercialUseStated": "unknown",
        "sentAt": null,
        "decidedAt": null
      },
      "notes": ""
    }
  ]
}
```

## 規則

- `status`：
  - `text-fallback`：改用文字。加入清單時的預設狀態，文章已有日文招牌與位置描述。
  - `requested`：Darren 已寄出素材申請，`request.sentAt` 填日期。
  - `resolved`：取得可商用的素材並以 `official-material` 補進該篇的圖片封包，`notes` 寫補進哪一版。
  - `dropped`：不需要了，`notes` 寫原因，例如設施改建、段落已刪。
- 沒有可申請的素材庫時，`request` 填 `null`。`commercialUseStated` 用 `yes`、`no`、`unknown`；`no` 的素材庫不必申請。
- 同一個觀光協會的項目放在一起，方便一次申請。
- 圖片封包裡該位置寫 `missingImageId`（對應 `gapId`）與 `textFallback`，候選保持空白。
- 封面不能進缺圖清單，一定要選定一張。
