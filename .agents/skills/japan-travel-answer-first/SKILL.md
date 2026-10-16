---
name: japan-travel-answer-first
description: Research and write one Traditional Chinese article for the Japan travel site from an approved page spec and travel-group outline — pick sources by content tier (operator-official for transport and rules, official sites cross-checked with platforms for shops, dated ratings for popularity), extract facts without translating paragraphs, summarize only patterns shared across multiple reviews, write a babysitter-level guide for Taiwanese readers who do not read Japanese, record discoveries such as festivals or local foods, and hand the finished reader preview to the acceptance skill. Use when the user asks to write, draft, or research an article, place entry, aspect page, topic page, or shared guide for this site. Stops at a reader preview; does not plan topics, pick images, publish, or deploy.
---

# 日本旅遊長尾站文章寫作

為台灣讀者寫一篇讀完就能安排行程的文章。讀者多半不會日文，對小地方的交通、訂房、天氣和當地規矩有很多擔心；文章要把每一個可能卡住的地方講清楚，而且每個事實都能回到日文官方來源。

## 任務與責任

- 接收已核准的頁面規格（`content-planning/<區域>/page-specs.json` 或 `content-automation/article-queue.json` 的一列）：主要查詢、頁型、內容邊界、`mustAnswer`、地點欄位與共用教學頁。不得改題、擴張內容邊界、改網址或改 Hub。研究顯示規格有誤時停止，把問題退回 `$japan-travel-topic-planner`。
- 有核准的旅行群大綱（`content-planning/<區域>/<群>-outline.json` 或同內容的 MD）時，照大綱寫：H1／H2／H3 用大綱的版本（標題檢查仍可改措辭，不增刪標題、不改層級）；分工表裡本頁負責的事寫細節，只摘要的事一兩句帶過並連到負責頁；內連表裡從本頁出發的連結句都要寫進正文。研究發現大綱有誤或缺事實時停止，退回大綱，不自己改分工。
- 同一位作者負責研究、文章計畫與全文，一次成稿。不拆成先鎖標題再填段落，也不安排第二位編輯潤飾。
- 終點是 `content-production/<article-id>/reader-preview.md` 與研究記錄，交給 `$japan-travel-acceptance` 驗收。本 Skill 不做選題、不選圖、不寫入 Sanity、不發布、不 commit 或 push。
- 開工前完整閱讀 [日文資料](references/japanese-sources.md)、[標題語氣與結構規範](references/heading-style.md)、[保母等級寫法](references/nanny-level.md)、[語氣、SEO 與小知識](references/voice-and-seo.md)、[頁型](references/page-types.md)、[評論與人氣](references/reviews-and-popularity.md) 與 [研究記錄格式](references/research-record.md)。

## 研究

### 依內容找來源

旅館官網、觀光協會、交通公司、市町村公告，最新最完整的版本幾乎都是日文官方資料；中文頁常只翻一部分或沒有更新。能用哪種來源看事實的內容（2026-10-16 Darren 決定），完整對照見 [日文資料](references/japanese-sources.md)：

- **交通與規則**（班次、票價、停駛、步道封閉、入園規定）：只用經營者官方。官方沒寫就寫「官方沒寫」。
- **店家與旅館資訊**（營業時間、公休、價格、房型、含餐）：店家官網與官方社群，用 Jalan、樂天 Travel、Tabelog、Google 地圖、Hot Pepper 交叉核對。
- **人氣**（榜單、得獎、評分、評論數）：附平台名稱與查核日期。
- **評論常提到的特點**：兩個平台以上、三則以上共同提到才寫，依 [評論與人氣](references/reviews-and-popularity.md)。
- **找候選**：Tabelog、Google 地圖、部落格、新聞、PTT、Dcard 都可以用來找「這裡可能有東西」，寫進正文前要找到上面可用的來源。

搜尋用規格裡的 `japaneseNames` 與 `japaneseSearchTerms`。日文漢字和繁中不同，用繁中字搜會漏資料，對照表見 [日文資料](references/japanese-sources.md)。

### 只取事實，不翻譯段落

把日文文章整段翻成中文，在著作權上屬於翻案。研究記錄只保存事實與原文的短摘錄：班次、價格、日期、條件；正文用自己的話重寫。單則評論一律不改寫、不翻譯、不引用；多則評論的共同特點依 [評論與人氣](references/reviews-and-popularity.md) 用自己的話歸納，好壞都寫並附查核日期。

### 每個事實都留原文證據

研究記錄的事實表，每列要有：主張、日文原文摘錄、來源網址、查閱日期、適用條件。驗收時事實查核 agent 會逐列打開原文核對，缺摘錄的事實視同未查證。

### 事實表要先做完，寫作時不再補

2026-10-16 禮文島試寫第 1 輪，正文有 117 個事實，事實表只有 44 列，被查核擋下的 19 個錯都在表外。因此：

- **清單和數量自己數**：住宿清單、班次、路線這類要數的東西，用 `curl` 抓原始網頁自己數，不用網頁讀取工具的摘要；摘要會漏項。
- **不用常識補細節**：「日本巴士通常有兌幣機」不是這家巴士公司的事實。原文沒寫就寫「官方沒寫」。
- **推理不是來源**：依法律或常理推出的結論（例如依総額表示推定含稅），正文不寫成確定，寫成「官網沒有標示含稅或未稅」。
- **算出來的數字附算式**：一日來回的停留時間、轉乘等待時間這類推算，在事實表寫出算法與用到的編號，例如「F2 − F1，再扣 F12 的報到時間」。
- **比較要有兩邊的來源**：和台灣比較氣溫、價格時，台灣的數字也要有來源（例如中央氣象署平年值）；沒有就不比較。
- **研究代理的推論要回原文核對**：代理報告裡的推論（例如「舊終點已封閉」）要回官方頁找到原文才能進事實表。

### 看同搜尋意圖的繁中頁

用主要查詢搜尋並實際開啟 3～5 篇現行繁中頁，觀察它們回答了什麼、漏了什麼、H 樹怎麼排。目的是找出讀者還沒被回答的問題，不是模仿結構。

### 記錄發現

研究中遇到規格沒列、但讀者會在意的祭典、花火大會、特色料理、步道、季節現象，記進 `content-planning/<區域>/discoveries.json`，格式見 `$japan-travel-topic-planner` 的發現清單規則。屬於本頁內容邊界的，直接寫進本篇；不屬於的只記錄，不擴寫。

## 文章計畫

在研究記錄最後寫出：核心答案、H 樹、每節要回答的 `mustAnswer`、會連到的共用教學頁、住宿段落的訂房管道、FAQ 候選，以及查到但不寫的內容與原因。

計畫也要列出圖片需求：哪一節、哪一種需求（認現場、決定去不去、吃什麼、季節對照、路線時間軸），以及讀者看圖要確認什麼。需求種類與「不放圖」的情況依 `.agents/skills/japan-travel-image-finder/references/image-needs.md`；每個 H2 都放一張裝飾照不算需求。路線與時間軸要畫成示意圖時，把節點的事實 `claimId` 一併列出，交給選圖 Skill 做資料檔。

「認現場」的位置很可能找不到可商用的照片，本站也不預期去現場拍。所以這類段落一律先寫成不看照片也認得出來：寫出現場招牌上的日文原文（例如「乗車券売場」）、位置描述（出了閘口右手邊、紅色屋頂那棟）與附近的地標，能找到官方照片頁、構內圖（構内図）或 Google 地圖街景時附上連結。之後找到照片是加分，不是補洞。

## 寫作

### 語氣、SEO 與小知識

依 [語氣、SEO 與小知識](references/voice-and-seo.md)：調性是寫給未來自己的旅行手札（筆記口吻、省略主語、提醒寫給自己）、地名先中文、段落短；SEO 規範沿用好材誌（主要查詢完整出現在開頭兩段、H2 帶地名、次要查詢進 H2／H3、真實問題才設 FAQ）；和讀者會經過的地方有關的小故事，有來源才寫，一頁 0～3 則。

### 開頭直接回答

開頭用一小段讀者辨識得出的具體情境，接到核心答案。例如：「從稚內港搭渡輪到禮文島約兩小時，夏季每天有數班，冬季減班且常因風浪停駛。」保母等級的細節放在後面的段落，不塞在開頭。

### 保母等級

依 [保母等級寫法](references/nanny-level.md) 處理讀者的每一個擔心：看不懂的日文網站要有按鈕與欄位對照、現場要看的標示要附日文（不寫日文會話教學）、末班車與停駛的備案、付款方式、時間軸。查不到的事情直接說查不到與替代做法，不寫成確定。

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

正文、表格與括號不放外部來源連結；外部來源集中在最後的 `## 資料來源`，列日文原標題與連結。站內連結只加在已上線且網址確定的頁面，不猜網址。大綱內連表要求的連結句照樣寫進正文；目標頁還沒上線時，句子照寫、先不加連結，在研究記錄的「待補內連」列出這句話與目標頁 ID，等目標頁上線後只把這句加上連結，字不改。旅館官網與訂房連結屬於讀者要用的連結，可以放在住宿段落，不算來源連結；分潤連結要符合關於頁的揭露原則。

### 常見問題

長篇文章從 `mustAnswer` 與搜尋結果頁的相關問題中，找出正文還沒直接回答的問題，放在資料來源前的 `## 常見問題`，每題一個 H3，下一段直接回答。不能把正文換成問句再重述一次。沒有合格問題時不設 FAQ，並在研究記錄寫明原因。

## 標編號寫作

正文先寫成 `content-production/<article-id>/draft-tagged.md`：每個含數字、時間、價格、期間、距離或條件（只收現金、要預約、封閉、禁止）的句子、表格格子、清單項目，句尾附事實編號，例如「直航約 1 小時 55 分 [F5]」。

- 一句用到多筆事實就列多個：`[F1, F12]`。
- 評論統整的句子標評論編號，例如「評論常提到中午前就賣完 [R1]」；`R` 編號記在研究記錄的「評論統整」表。
- 對不到編號的句子，代表寫作時在補內容：回去研究補進事實表，或刪掉，或改寫成「官方沒寫」。
- 建議與判斷要從事實推出來，同樣附它依據的編號；沒有事實撐的建議不寫。
- 標題、資料來源段落不標編號。

## 一次成稿與交接

1. 動筆前解決資料與架構問題，一次寫成 `draft-tagged.md`。
2. 執行 `python3 <本 Skill 絕對路徑>/scripts/fact_tags.py content-production/<article-id>`。它檢查每個需要編號的句子都有編號、每個編號都在事實表，通過後才寫出去掉編號的 `reader-preview.md`。
3. **分段檢查**：每個 H2 派一個沒寫過這篇的 subagent，平行執行。每個 subagent 只拿到該段的 `draft-tagged.md` 內容、該段用到的事實表列與來源網址，逐句核對：
   - 句子和事實表的原文摘錄是否一致，條件（季節、艙等、大人或小孩、含稅）有沒有漏。
   - 需要時打開來源網址核對。
   - 推算是否正確。
   - 有沒有事實表撐不起的延伸說法。
   結果寫到 `content-production/<article-id>/section-checks/<序號>.json`：`{section, checker, items: [{excerpt, factIds, verdict: ok|fix, reason}]}`。作者依結果修改後重跑第 2 步；同一段最多改三輪。
4. 執行 `python3 <本 Skill 絕對路徑>/scripts/audit_answer_first.py content-production/<article-id>/reader-preview.md --json`，處理它回報的格式錯誤。它只檢查格式，不判斷文章品質；語意提醒不是自動判退理由。
5. **標題檢查**：派一個沒寫過這篇的 subagent，只給它頁面規格（主要與次要查詢）、`reader-preview.md` 與 [標題語氣與結構規範](references/heading-style.md)。它逐一判斷 H1、SEO Title、每個 H2／H3，寫 `content-production/<article-id>/heading-review.json`：`{checker, items: [{level, before, after, reason}], seoTitle: {before, after, reason}, structureNotes: []}`。沒問題的標題 `after` 等於 `before`、`reason` 留空；只改文字，不增刪標題、不改層級。作者照 `after` 改 `draft-tagged.md` 的標題，重跑第 2、4 步，再執行 `python3 <本 Skill 絕對路徑>/scripts/heading_review.py content-production/<article-id>` 確認標題已套用。`structureNotes` 有內容時作者處理後再交驗收。不需要逐篇等 Darren 確認；Darren 事後對標題的偏好寫進規範的增訂規則。
6. 交給 `$japan-travel-acceptance`。驗收判退時保留失敗樣本與原因，不修改後宣稱首次成功；修改後的版本是新的一輪，從第 2 步重跑。是否重寫依使用者或排程規則。

## 完成條件

`draft-tagged.md`、`reader-preview.md` 與 `reference-review.md` 都已存在；`fact_tags.py` 為 `tags_clear`；每個 H2 都有分段檢查紀錄且沒有未處理的 `fix`；每個 `mustAnswer` 都有回答或寫明查不到的原因；每個事實在研究記錄有日文原文摘錄與網址；專有名詞附日文原名並已更新譯名表；新發現已記進發現清單；圖片需求已列在文章計畫；格式檢查為 `mechanical_clear`；`heading_review.py` 通過；已交給驗收 Skill。
