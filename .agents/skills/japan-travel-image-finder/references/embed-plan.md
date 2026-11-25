# 嵌入影片與 Instagram 貼文的封包

2026-10-29 網站做好嵌入區塊（Sanity `mediaEmbed`）後，文章可以嵌入 YouTube 影片與官方 Instagram 貼文。挑選條件見寫作 Skill `references/embeds-and-data-blocks.md`；這份檔案只寫紀錄格式與上傳方式。網站上 YouTube 是點了才載入播放器，Instagram 貼文直接顯示（2026-11-17 改）。

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
- `channelType`：`official`（觀光協會、自治體、交通公司、環境省等）或 `individual`。Instagram 只用 `official`（住宿專門頁例外，見下）。
- `publishedAt`：`YYYY-MM`，要在查核日前兩年內。
- `placement`：同文內照片，`heading` 是那一節 H2 或 H3 全文，`afterBlocks` 從標題往下數。同一節已經有照片時，放在照片之後（`afterBlocks` 加 1）。
- `captionDraft`：一句中文，說畫面是什麼。`startSeconds` 大於 0 才在句尾寫從哪裡開始（「從 4 分 25 秒開始」，不滿 1 分寫「從 34 秒開始」）；從頭播就不提播放位置，不寫「從頭播放」「從頭開始看」這類話，讀者按下去本來就是從頭播（Darren 2026-11-11）。網站會自動在後面加「影片：頻道名（年份）・實際資訊以本文為準」，不用自己寫。
- `evidence`：怎麼確認內容對得上（說明欄、章節、字幕、Instagram 貼文說明文字）。沒看到畫面，對不上就不用。
- `checks` 四項都要是 `true`。
- 每篇最多 2 個，一節最多 1 個。
- 例外（Darren 2026-11-17）：住宿專門頁每間有細寫的飯店可以各放 1 則 Instagram 貼文，住客的公開貼文（`channelType: individual`）也可以用，不限兩年內。找法、條件與版面見寫作 Skill `references/stay-topic-page.md`「照片與嵌入」。封包最上層要寫 `"pageType": "stay-topic"`，檢查程式才會放行（最多 12 則、一節仍只能 1 則）。
- 例外（Darren 2026-11-24：「沒有圖片不是要你去找 IG 貼文嗎」）：地點主頁的看點找不到合格的實拍（景點不是本尊、料理不是當地或那家店的）時，不放替代照片，改放一則 Instagram 貼文。先找官方帳號（店家、設施、觀光協會、自治體），沒有才用遊客的公開貼文（`channelType: individual`），不限兩年內；用 Google `site:instagram.com` 找，不登入，貼文內容要親自打開確認就是那個看點。封包最上層寫 `"pageType": "place-entry"`（最多 12 則、一節仍只能 1 則）。同一個看點不同時放照片和貼文。
- 找貼文的搜尋字（Darren 2026-11-25：「為什麼找不到？你有用日文去找嗎」）：用日文，而且每個看點至少試這幾種組合再說找不到：地名＋東西（`礼文島 ウニ丼`）、店名或設施名＋東西（`炉ばたちどり うに`）、東西的各種寫法（うに／ウニ／生うに丼）、景點名單獨與加地標（`久種湖`、`久種湖畔キャンプ場`）。Google 的 `site:instagram.com` 結果不穩定，同一組字隔天再搜可能從 0 則變 9 則；第一次 0 則要換一天或換工具再試一次。回報「找不到」時要附用過的搜尋字。
- 搜尋放慢、可以分次做（Darren 2026-11-25：「你的頻率搜尋可以慢一點，不一定要在一個裡面做完」）：Google 搜尋每次之間隔 30 秒以上，一個看點搜完再搜下一個；一出現機器人檢查就停（不繞過），把還沒試的搜尋字記在封包的 `embed-plan.json` 備註或回報裡，隔一段時間或下一輪再接著搜，不因此判定找不到。

## 上傳

```bash
# 在 studio/
npm run publish:article-embeds -- ../content-production/<article-id>          # 預覽
npm run publish:article-embeds -- ../content-production/<article-id> --apply  # 插入
npm run publish:article-embeds -- ../content-production/<article-id> --remove --apply  # 拿掉
```

看到 `embeds-published-and-verified` 才算完成。網站上的嵌入預設只顯示縮圖或按鈕，讀者點了才載入 YouTube 或 Instagram，頁面不會變慢，也不會先載入對方的追蹤程式。
