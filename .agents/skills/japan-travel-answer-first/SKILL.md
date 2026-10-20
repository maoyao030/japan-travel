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
- **寫作時只需要記住 [寫作指南](references/writing-guide.md) 與 [範例](references/examples.md)**，開工前先讀完這兩份。其他參考檔只在用到的步驟讀：研究讀 [日文資料](references/japanese-sources.md) 與 [研究記錄格式](references/research-record.md)；文章計畫讀 [保母等級檢查表](references/nanny-level.md)、[頁型與分工](references/page-types.md)、[嵌入與資料圖](references/embeds-and-data-blocks.md)；寫評論統整或客觀狀況讀 [評論與人氣](references/reviews-and-popularity.md)；標題檢查 agent 讀 [標題與 SEO 規範](references/heading-style.md)。

## 研究

### 依內容找來源

旅館官網、觀光協會、交通公司、市町村公告，最新最完整的版本幾乎都是日文官方資料；中文頁常只翻一部分或沒有更新。能用哪種來源看事實的內容（2026-10-16 Darren 決定），完整對照見 [日文資料](references/japanese-sources.md)：

- **交通與規則**（班次、票價、停駛、步道封閉、入園規定）：只用經營者官方。官方沒寫的不寫，也不用平台或部落格補。
- **店家與旅館資訊**（營業時間、公休、價格、房型、含餐）：店家官網與官方社群，用 Jalan、樂天 Travel、Tabelog、Google 地圖、Hot Pepper 交叉核對。
- **人氣**（榜單、得獎、評分、評論數）：附平台名稱與查核日期。
- **評論常提到的特點**：兩個平台以上、三則以上共同提到才寫，依 [評論與人氣](references/reviews-and-popularity.md)。
- **客觀狀況**（風大、坡陡、人多、班次少）：有官方資料或三個獨立來源一致就直接寫結論與建議，依 [評論與人氣](references/reviews-and-popularity.md)「客觀狀況直接寫」。
- **找候選**：Tabelog、Google 地圖、部落格、新聞、PTT、Dcard 都可以用來找「這裡可能有東西」，寫進正文前要找到上面可用的來源。

搜尋用規格裡的 `japaneseNames` 與 `japaneseSearchTerms`。日文漢字和繁中不同，用繁中字搜會漏資料，對照表見 [日文資料](references/japanese-sources.md)。網頁讀取工具讀不到的來源（PDF 是圖片、要執行 JavaScript）改用瀏覽器讀，做法也在同一份。

### 只取事實，不翻譯段落

把日文文章整段翻成中文，在著作權上屬於翻案。研究記錄只保存事實與原文的短摘錄：班次、價格、日期、條件；正文用自己的話重寫。單則評論一律不改寫、不翻譯、不引用；多則評論的共同特點依 [評論與人氣](references/reviews-and-popularity.md) 用自己的話歸納，好壞都寫並附查核日期。

### 每個事實都留原文證據

研究記錄的事實表，每列要有：主張、日文原文摘錄、來源網址、查閱日期、適用條件。驗收時事實查核 agent 會逐列打開原文核對，缺摘錄的事實視同未查證。

### 事實表要先做完，寫作時不再補

2026-10-16 禮文島試寫第 1 輪，正文有 117 個事實，事實表只有 44 列，被查核擋下的 19 個錯都在表外。因此：

- **清單和數量自己數**：住宿清單、班次、路線這類要數的東西，用 `curl` 抓原始網頁自己數，不用網頁讀取工具的摘要；摘要會漏項。
- **不用常識補細節**：「日本巴士通常有兌幣機」不是這家巴士公司的事實。原文沒寫就不寫。
- **推理不是來源**：依法律或常理推出的結論（例如依総額表示推定含稅），正文不寫成確定；價格照官網寫的數字寫，不另外交代含稅與否。
- **算出來的數字附算式**：一日來回的停留時間、轉乘等待時間這類推算，在事實表寫出算法與用到的編號，例如「F2 − F1，再扣 F12 的報到時間」。正文不寫算出來的分鐘數，改列它依據的時刻表（見寫作指南第 6 條）。
- **比較要有兩邊的來源**：和台灣比較氣溫、價格時，台灣的數字也要有來源（例如中央氣象署平年值）；沒有就不比較。
- **研究代理的推論要回原文核對**：代理報告裡的推論（例如「舊終點已封閉」）要回官方頁找到原文才能進事實表。
- **官方怎麼形容它的樣子也記下來**：景點的顏色、形狀、規模，官方有寫才能進正文的畫面描寫。

### 看同搜尋意圖的繁中頁

用主要查詢搜尋並實際開啟 3～5 篇現行繁中頁，觀察它們回答了什麼、漏了什麼、H 樹怎麼排。目的是找出讀者還沒被回答的問題，不是模仿結構。

### 記錄發現

研究中遇到規格沒列、但讀者會在意的祭典、花火大會、特色料理、步道、季節現象，記進 `content-planning/<區域>/discoveries.json`，格式見 `$japan-travel-topic-planner` 的發現清單規則。屬於本頁內容邊界的，直接寫進本篇；不屬於的只記錄，不擴寫。

## 文章計畫

在研究記錄最後寫出：核心答案、H 樹、每節要回答的 `mustAnswer`、會連到的共用教學頁、住宿段落的訂房管道、FAQ 候選、每個景點的基本資訊欄要放哪些格子、頁尾延伸資料要列的官方頁，以及查到但不寫的內容與原因。保母等級的擔心清單逐項想過，不適用的寫原因，清單見 [保母等級檢查表](references/nanny-level.md)。

計畫也要列出圖片需求：哪一節、哪一種需求（認現場、決定去不去、吃什麼、季節對照、路線時間軸），以及讀者看圖要確認什麼。需求種類與「不放圖」的情況依 `.agents/skills/japan-travel-image-finder/references/image-needs.md`。路線與時間軸要畫成示意圖時，把節點的事實 `claimId` 一併列出，交給選圖 Skill 做資料檔。

「認現場」的位置很可能找不到可商用的照片，本站也不預期去現場拍。所以這類段落一律先寫成不看照片也認得出來：寫出現場招牌上的日文原文（例如「乗車券売場」）、位置描述（出了閘口右手邊、紅色屋頂那棟）與附近的地標，能找到官方照片頁、構內圖（構内図）或 Google 地圖街景時附上連結。之後找到照片是加分，不是補洞。

## 寫作

照 [寫作指南](references/writing-guide.md) 的三步寫：先用指南與範例自然寫完一稿，再跑自動檢查，最後只改檢查與驗收指出的地方。下面只放指南沒展開的交接細節。

### 住宿段落

列出旅館時，每間寫清楚：房型或住宿型態、是否含餐、接駁、訂房管道（官網、Trip.com、Agoda、僅 Jalan）。只有官網或 Jalan 能訂的旅館放官網連結。住宿頁標示查核日期。

### 來源與連結

正文、表格與括號不放外部來源連結；讀者會自己查的官方頁放在 `## 延伸資料`，緊接在最後的 `## 資料來源` 之前；本文依據的來源在 `## 資料來源` 列日文原標題與連結（格式見範例第 4 節）。站內連結只加在已上線且網址確定的頁面，不猜網址。大綱內連表要求的連結句照樣寫進正文；目標頁還沒上線時，句子照寫、先不加連結，在研究記錄的「待補內連」列出這句話與目標頁 ID，等目標頁上線後只把這句加上連結，字不改。旅館官網與訂房連結屬於讀者要用的連結，可以放在住宿段落，不算來源連結；分潤連結要符合關於頁的揭露原則。

### 常見問題

長篇文章從 `mustAnswer` 與搜尋結果頁的相關問題中，找出正文還沒直接回答的問題，放在資料來源前的 `## 常見問題`，每題一個 H3，下一段直接回答。不能把正文換成問句再重述一次。沒有合格問題時不設 FAQ，並在研究記錄寫明原因。

### WHOOPS 標題結構規則

本站沿用好材誌的標題規則，參考 [WHOOPS 標題標籤指南](https://seo.whoops.com.tw/heading-tags-for-seo-by-google/) 並加上本站增訂。寫作時照大綱的標題寫，不用自己背規則；完整規則、SEO 規範與例子都在 [標題與 SEO 規範](references/heading-style.md)，由標題檢查 agent 逐一判斷。

## 標編號寫作

正文先寫成 `content-production/<article-id>/draft-tagged.md`：每個含數字、時間、價格、期間、距離或條件（只收現金、要預約、封閉、禁止）的句子、表格格子、清單項目，句尾附事實編號，例如「直航約1小時55分 [F5]」。

- 一句用到多筆事實就列多個：`[F1, F12]`。
- 評論統整的句子標評論編號，例如「評論常提到中午前就賣完 [R1]」；`R` 編號記在研究記錄的「評論統整」表。
- 對不到編號的句子，代表寫作時在補內容：回去研究補進事實表，或刪掉。
- 建議與判斷要從事實推出來，同樣附它依據的編號；沒有事實撐的建議不寫。
- 標題、資料來源段落不標編號。

## 一次成稿與交接

1. 動筆前解決資料與架構問題，一次寫成 `draft-tagged.md`。
2. 執行 `python3 <本 Skill 絕對路徑>/scripts/fact_tags.py content-production/<article-id>`。它檢查每個需要編號的句子都有編號、每個編號都在事實表，通過後才寫出去掉編號的 `reader-preview.md`。
3. 執行 `node <本 Skill 絕對路徑>/scripts/check-voice.mjs content-production/<article-id>`。它量正文的標點、句長與幾個禁用字（「官方沒寫」「來這裡」），門檻寫在程式開頭。依訊息修 `draft-tagged.md`，拆句、併句時重新核對每個時間與條件屬於哪個主詞，改完重跑第 2 步。
4. **分段檢查**：每個 H2 派一個沒寫過這篇的 subagent，平行執行。每個 subagent 只拿到該段的 `draft-tagged.md` 內容、該段用到的事實表列與來源網址，逐句核對：
   - 句子和事實表的原文摘錄是否一致，條件（季節、艙等、大人或小孩、含稅）有沒有漏。
   - 需要時打開來源網址核對。
   - 推算是否正確。
   - 有沒有事實表撐不起的延伸說法。
   結果寫到 `content-production/<article-id>/section-checks/<序號>.json`：`{section, checker, items: [{excerpt, factIds, verdict: ok|fix, reason}]}`。作者依結果修改後重跑第 2、3 步；同一段最多改三輪。
5. 執行 `python3 <本 Skill 絕對路徑>/scripts/audit_answer_first.py content-production/<article-id>/reader-preview.md --json`，處理它回報的格式錯誤。它只檢查格式，不判斷文章品質；語意提醒不是自動判退理由。
6. **標題檢查**：派一個沒寫過這篇的 subagent，只給它頁面規格（主要與次要查詢）、`reader-preview.md` 與 [標題與 SEO 規範](references/heading-style.md)。它逐一判斷 H1、SEO Title、每個 H2／H3，寫 `content-production/<article-id>/heading-review.json`：`{checker, items: [{level, before, after, reason}], seoTitle: {before, after, reason}, structureNotes: []}`。沒問題的標題 `after` 等於 `before`、`reason` 留空；只改文字，不增刪標題、不改層級。作者照 `after` 改 `draft-tagged.md` 的標題，重跑第 2、5 步，再執行 `python3 <本 Skill 絕對路徑>/scripts/heading_review.py content-production/<article-id>` 確認標題已套用。`structureNotes` 有內容時作者處理後再交驗收。不需要逐篇等 Darren 確認；Darren 事後對標題的偏好寫進規範的增訂規則。
7. 交給 `$japan-travel-acceptance`。驗收判退時保留失敗樣本與原因，不修改後宣稱首次成功；修改後的版本是新的一輪，從第 2 步重跑。是否重寫依使用者或排程規則。

## 完成條件

`draft-tagged.md`、`reader-preview.md` 與 `reference-review.md` 都已存在；`fact_tags.py` 為 `tags_clear`；`check-voice.mjs` 通過；每個 H2 都有分段檢查紀錄且沒有未處理的 `fix`；每個 `mustAnswer` 都有回答，查不到的在研究記錄寫明查過哪些來源與正文的替代寫法；每個事實在研究記錄有日文原文摘錄與網址；專有名詞附日文原名並已更新譯名表；新發現已記進發現清單；圖片需求、基本資訊欄與延伸資料已列在文章計畫；格式檢查為 `mechanical_clear`；`heading_review.py` 通過；已交給驗收 Skill。
