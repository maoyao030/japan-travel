# 頁型範本

Darren 2026-11-11 決定：每種頁型先有整篇的範本再寫。原因是原本的範例（`../examples.md`）都是一兩段的片段，教得了句子，教不了整篇的輕重、長度與每節寫到多細；每次不滿意就加一條規則，規則越來越多，文章還是不到位。

## 範本是什麼

- 一篇**已經上線、Darren 親自改到滿意**的文章，整篇照線上版存一份在這裡。AI 批次優化、Darren 只看過的不算。
- 一種頁型最多 2 篇，盡量挑結構不一樣的兩篇。有更滿意的就換掉舊的。
- 登記在 [`index.json`](index.json)：每種頁型的範本、Darren 哪天認可、這篇該學什麼（`learn`）。`candidates` 是 Darren 動手改過、但還沒說可以當範本的文章。

頁型照文章清單的欄位分（`scripts/page-models.mjs` 的 `kindOf`）：地點主頁、交通、住宿、景點總覽（網址結尾 `sights`）、單一景點（其他主題是景點的頁）、美食、天氣、祭典、步道與登山、跨地點。

## 作者怎麼用

寫作前跑 `node scripts/page-models.mjs --for=<articleId>`，把列出的範本整篇讀完，也讀 `learn`。

學這些：

- 整篇的輕重：哪些事講細、哪些一兩句帶過，各節大概多長。
- 開頭兩段怎麼直接回答。
- 每一節寫到多細：表格放哪些欄、時刻表列到什麼程度、景點一個寫幾句。
- 提醒與推薦放在哪、多久出現一次。
- Darren 的語氣（寫作指南第17條）在整篇裡實際的樣子。

不學這些：

- **標題與節的順序**：照自己那頁的大綱，一字不改。範本的標題是那個地方的，不是這種頁型的固定骨架。
- **事實**：只用自己的 `reference-review.md`。範本裡的班次、價格、店名都不能搬。
- **句子**：不照抄、不換地名套用。寫完跑 `node .agents/skills/japan-travel-polish/scripts/check-copy.mjs <reader-preview.md> <範本檔> --min=16`，列出來的相同片段改成自己的寫法（地名、站名、路線名這類專有名詞造成的不算）。
- 兩篇範本寫法不同的地方，照自己這頁的主題選比較合適的，不要每頁都套同一篇（寫作指南第14條「不要寫成量產頁」）。

這種頁型還沒有範本時（`ready: false`），自動寫作不寫這篇，見 `content-automation/local-writer.md` 第 1 步。

## 怎麼新增或更換範本

只有人工 session 可以做，而且要 Darren 親口說「這篇當範本」。流程在 `content-automation/chat-optimize.md`「做範本」：

1. 口述優化或對話優化那一篇，改到 Darren 滿意並上傳。
2. `node scripts/sync-from-live.mjs --article=<文章>` 確認 `gitSameAsLive: true`。
3. `node scripts/page-models.mjs --add=<文章> --approved-at=<日期> --how="…" --learn="…"`（已有 2 篇時加 `--replace=<舊文章>`）。
4. `node scripts/page-models.mjs --check` 與 `npm test`。

範本檔不手動改字。線上那篇之後又改了，重跑第 2、3 步更新。
