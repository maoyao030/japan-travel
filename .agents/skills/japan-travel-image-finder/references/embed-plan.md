# 嵌入影片與 Instagram 貼文的封包

2026-10-29 網站做好嵌入區塊（Sanity `mediaEmbed`）後，文章可以嵌入 YouTube 影片與官方 Instagram 貼文。挑選條件見寫作 Skill `references/embeds-and-data-blocks.md`；這份檔案只寫紀錄格式與上傳方式。

嵌入不是本站的圖片：不下載、不寫進 `image-plan.json`，紀錄放在 `content-production/<article-id>/images/embed-plan.json`。

## 結構

```json
{
  "schemaVersion": 1,
  "articleId": "rishiri-island-transport",
  "targetUrl": "/places/rishiri-island/transport/",
  "checkedAt": "2026-10-29",
  "embeds": [
    {
      "embedId": "cycling-road-video",
      "platform": "youtube",
      "url": "https://www.youtube.com/watch?v=F-lz9aR-Xyg",
      "startSeconds": 265,
      "title": "サイクリングinてっぺん宗谷～自転車とバスで利尻サイクルオアシスを巡る旅～",
      "channelName": "北海道公式",
      "channelType": "official",
      "publishedAt": "2025-05",
      "placement": {"heading": "騎自行車繞利尻島一圈", "afterBlocks": 2},
      "captionDraft": "利尻島自行車道的湾内大橋與樹林路段，從 4 分 25 秒開始。",
      "evidence": "說明欄寫明終盤是自行車道與湾内大橋；4:25 起是橋段，4:40～5:40 是樹林裡的自行車道。",
      "checks": {"publicAndEmbeddable": true, "withinTwoYears": true, "contentVerified": true, "notMisleadingAd": true}
    }
  ]
}
```

- `platform`：`youtube` 或 `instagram`。
- `url`：YouTube 用 `https://www.youtube.com/watch?v=<11 碼影片 ID>`；Instagram 用 `https://www.instagram.com/p/<代碼>/` 或 `/reel/<代碼>/`。
- `startSeconds`：只有 YouTube 用，從對題的章節開始播；從頭播填 0。
- `channelType`：`official`（觀光協會、自治體、交通公司、環境省等）或 `individual`。Instagram 只用 `official`。
- `publishedAt`：`YYYY-MM`，要在查核日前兩年內。
- `placement`：同文內照片，`heading` 是那一節 H2 或 H3 全文，`afterBlocks` 從標題往下數。同一節已經有照片時，放在照片之後（`afterBlocks` 加 1）。
- `captionDraft`：一句中文，說畫面是什麼、從哪裡開始看。網站會自動在後面加「影片：頻道名（年份）・實際資訊以本文為準」，不用自己寫。
- `evidence`：怎麼確認內容對得上（說明欄、章節、字幕、Instagram 貼文說明文字）。沒看到畫面，對不上就不用。
- `checks` 四項都要是 `true`。
- 每篇最多 2 個，一節最多 1 個。

## 上傳

```bash
# 在 studio/
npm run publish:article-embeds -- ../content-production/<article-id>          # 預覽
npm run publish:article-embeds -- ../content-production/<article-id> --apply  # 插入
npm run publish:article-embeds -- ../content-production/<article-id> --remove --apply  # 拿掉
```

看到 `embeds-published-and-verified` 才算完成。網站上的嵌入預設只顯示縮圖或按鈕，讀者點了才載入 YouTube 或 Instagram，頁面不會變慢，也不會先載入對方的追蹤程式。
