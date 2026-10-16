---
name: japan-travel-answer-first
description: Research and write one Traditional Chinese article for the Japan travel site from an approved page spec — read Japanese official sources first, extract facts without translating paragraphs, write a babysitter-level guide for Taiwanese readers who do not read Japanese, record discoveries such as festivals or local foods, and hand the finished reader preview to the acceptance skill. Use when the user asks to write, draft, or research an article, place entry, aspect page, topic page, or shared guide for this site. Stops at a reader preview; does not plan topics, pick images, publish, or deploy.
---

# 日本旅遊長尾站文章寫作

為台灣讀者寫一篇讀完就能安排行程的文章。讀者多半不會日文，對小地方的交通、訂房、天氣和當地規矩有很多擔心；文章要把每一個可能卡住的地方講清楚，而且每個事實都能回到日文官方來源。

## 任務與責任

- 接收已核准的頁面規格（`content-planning/<區域>/page-specs.json` 或 `content-automation/article-queue.json` 的一列）：主要查詢、頁型、內容邊界、`mustAnswer`、地點欄位與共用教學頁。不得改題、擴張內容邊界、改網址或改 Hub。研究顯示規格有誤時停止，把問題退回 `$japan-travel-topic-planner`。
- 同一位作者負責研究、文章計畫與全文，一次成稿。不拆成先鎖標題再填段落，也不安排第二位編輯潤飾。
- 終點是 `content-production/<article-id>/reader-preview.md` 與研究記錄，交給 `$japan-travel-acceptance` 驗收。本 Skill 不呼叫 Ahrefs、不選圖、不寫入 Sanity、不發布、不 commit 或 push。
- 開工前完整閱讀 [日文資料](references/japanese-sources.md)、[保母等級寫法](references/nanny-level.md)、[頁型](references/page-types.md) 與 [研究記錄格式](references/research-record.md)。

## 研究

### 先讀日文官方資料

旅館官網、觀光協會、交通公司、市町村公告，最新最完整的版本幾乎都是日文；中文頁常只翻一部分或沒有更新。研究順序：

1. 旅館、店家、交通公司官網
2. 市町村與觀光協會
3. 觀光廳、氣象廳（平年值）、日本政府觀光局、國稅廳、消費者廳
4. 日文新聞：停辦、停駛、改建等變動
5. Hot Pepper Gourmet Web 服務：店家營業資訊，使用時要署名
6. Jalan、樂天 Travel、Tabelog、Google 地圖、Walkerplus：只用來發現與核對，不當正文來源

搜尋用規格裡的 `japaneseNames` 與 `japaneseSearchTerms`。日文漢字和繁中不同，用繁中字搜會漏資料，對照表見 [日文資料](references/japanese-sources.md)。

### 只取事實，不翻譯段落

把日文文章整段翻成中文，在著作權上屬於翻案。研究記錄只保存事實與原文的短摘錄：班次、價格、日期、條件；正文用自己的話重寫。Tabelog 與 Google 評論一律不改寫，評價層只放米其林、Tabelog 百名店、Tabelog Award 等公開榜單事實並附連結。

### 每個事實都留原文證據

研究記錄的事實表，每列要有：主張、日文原文摘錄、來源網址、查閱日期、適用條件。驗收時事實查核 agent 會逐列打開原文核對，缺摘錄的事實視同未查證。

### 看同搜尋意圖的繁中頁

用主要查詢搜尋並實際開啟 3～5 篇現行繁中頁，觀察它們回答了什麼、漏了什麼、H 樹怎麼排。目的是找出讀者還沒被回答的問題，不是模仿結構。

### 記錄發現

研究中遇到規格沒列、但讀者會在意的祭典、花火大會、特色料理、步道、季節現象，記進 `content-planning/<區域>/discoveries.json`，格式見 `$japan-travel-topic-planner` 的發現清單規則。屬於本頁內容邊界的，直接寫進本篇；不屬於的只記錄，不擴寫。

## 文章計畫

在研究記錄最後寫出：核心答案、H 樹、每節要回答的 `mustAnswer`、會連到的共用教學頁、住宿段落的訂房管道、FAQ 候選，以及查到但不寫的內容與原因。

## 寫作

### 開頭直接回答

開頭用一小段讀者辨識得出的具體情境，接到核心答案。例如：「從稚內港搭渡輪到禮文島約兩小時，夏季每天有數班，冬季減班且常因風浪停駛。」保母等級的細節放在後面的段落，不塞在開頭。

### 保母等級

依 [保母等級寫法](references/nanny-level.md) 處理讀者的每一個擔心：看不懂的日文網站要有按鈕與欄位對照、現場要看的標示要附日文、可以指給對方看的日文句子、末班車與停駛的備案、付款方式、時間軸。查不到的事情直接說查不到與替代做法，不寫成確定。

### 共用教學頁不重寫

整理券、看日文時刻表、在日文官網訂房、溫泉禮儀這類各地相同的操作，連到共用教學頁，本篇只寫在地差異。例如「利尻島的巴士也用整理券，車資只收現金」，再連過去。共用教學頁尚未上線時，本篇用一兩句說明最關鍵的步驟，並在研究記錄標記未來內連。

### 專有名詞附日文原名

旅館、店家、車站、港口、祭典、步道第一次出現時寫成「繁中譯名（日文原名）」。同一名詞全站譯法一致，以 `content-planning/glossary.json` 為準；新名詞加進去。

### 住宿段落

列出旅館時，每間寫清楚：房型或住宿型態、是否含餐、接駁、訂房管道（官網、Trip.com、Agoda、僅 Jalan）。只有官網或 Jalan 能訂的旅館放官網連結。住宿頁標示查核日期。

### 數字與條件

- 價格寫明含稅（税込）或未稅（税別）、每人或每室、季節差。
- 時間寫明季節與班次表的適用期間。「〜頃」是大約，不能寫成確定日期。
- 年號換算成西元，例如令和 8 年是 2026 年。
- 天氣與氣候用氣象廳三十年平年值，寫明不是預報。

### WHOOPS 標題結構規則

本站沿用好材誌的標題規則，參考 [WHOOPS 標題標籤指南](https://seo.whoops.com.tw/heading-tags-for-seo-by-google/) 並加上本站增訂：

- **H1 與 SEO Title**：一頁一個 H1，自然保留主要查詢的核心主題詞。SEO Title 與 H1 回答同一主題與搜尋意圖，可相同也可各自表達。計畫中並列兩者；未另擬時明記「SEO Title 暫沿用 H1」。兩者都不用冒號切開主題與說明。
- **層級**：H1、H2、H3 向下展開，不跳級、不重複。H2 是主要分章，H3 是該分章下的地點、步驟、情境或子問題。不要把所有段落平鋪成同級 H2。
- **主題辨識**：只讀 H 樹也能辨識本頁主題。「交通方式」「注意事項」這類泛稱要補上地名或對象，例如「從稚內到禮文島的渡輪」。
- **問句緊接回答**：讀者真的會問的問題可以作 H2／H3，寫成完整問句並以「？」收尾，下一段立即回答。
- **標題與正文分工**：標題命名本節對象或問題，判斷與提醒交給正文。「先訂船票再訂旅館」這類正文提醒不升成小標；步驟名與真實問句可以。
- **不用制式摘要標籤**：先看結論、重點整理、懶人包、TL;DR。

### 來源與連結

正文、表格與括號不放外部來源連結；外部來源集中在最後的 `## 資料來源`，列日文原標題與連結。站內連結只用已上線且網址確定的頁面，不猜網址。旅館官網與訂房連結屬於讀者要用的連結，可以放在住宿段落，不算來源連結；分潤連結要符合關於頁的揭露原則。

### 常見問題

長篇文章從 `mustAnswer` 與搜尋結果頁的相關問題中，找出正文還沒直接回答的問題，放在資料來源前的 `## 常見問題`，每題一個 H3，下一段直接回答。不能把正文換成問句再重述一次。沒有合格問題時不設 FAQ，並在研究記錄寫明原因。

## 一次成稿與交接

1. 動筆前解決資料與架構問題，一次寫成 `reader-preview.md`。
2. 執行 `python3 <本 Skill 絕對路徑>/scripts/audit_answer_first.py content-production/<article-id>/reader-preview.md --json`，處理它回報的格式錯誤。它只檢查格式，不判斷文章品質；語意提醒不是自動判退理由。
3. 交給 `$japan-travel-acceptance`。驗收判退時保留失敗樣本與原因，不修改後宣稱首次成功；是否重寫依使用者或排程規則。

## 完成條件

`reader-preview.md` 與 `reference-review.md` 都已存在；每個 `mustAnswer` 都有回答或寫明查不到的原因；每個事實在研究記錄有日文原文摘錄與網址；專有名詞附日文原名並已更新譯名表；新發現已記進發現清單；格式檢查為 `mechanical_clear`；已交給驗收 Skill。
