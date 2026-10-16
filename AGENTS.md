# japan-travel｜Claude Code 協作規則

本 repo 是好材誌（`maoyao030/building-materials-tw`）流程的第二個站。規則以好材誌 `AGENTS.md` 為底，依本站性質調整；兩個 repo 互不引用、互不連結，只有程式模板是從好材誌抽出來的。

## 使用者體驗原則

- 使用者 Darren 沒有開發經驗。使用繁體中文與白話說明，第一次出現技術名詞時解釋它的用途。
- 不要求使用者管理聊天上下文、撰寫交接提示或記住檔案清單。
- 開始工作前，主動讀取本檔案、`content-planning/handoff-2026-10-15.md` 與 `PROJECT_STATUS.md`，自行恢復專案狀態。需要參考好材誌的程式或 Skill 時，用 `add_repo` 以唯讀方式掛上 `maoyao030/building-materials-tw`，不得改它。
- 不重做已完成且已驗收的工作。一次只帶使用者完成一個可理解、可驗收的成果。

## 使用者口令

- 「接下來我該做什麼？」：自行檢查狀態，只推薦一個最合理的下一步，說明目的、需要決定什麼、完成標準；不需使用者先做事就直接開始安全且在範圍內的工作。
- 「告一段落」：停止擴張範圍，完成安全收尾，更新 `PROJECT_STATUS.md`（已完成、已決定、尚未完成、阻礙、唯一下一步），記錄測試與 Git 狀態，告知是否可安全結束。
- 「繼續」：讀專案狀態，從記錄的唯一下一步繼續。

## Git 與協作

- 每個任務在自己的分支做，小步 commit、常 push。合併回 `main` 前先 `git fetch`、把 `origin/main` 併進分支、跑測試，通過後才合併。`main` 不 force-push、不 rebase 已 push 的歷史。
- 開始任務時在 `.agents/working/claude-code.md` 寫下任務一句話、開始時間、預計改的檔案；結束時清成「目前沒有進行中的任務」。
- `PROJECT_STATUS.md` 每個任務用日期＋「Claude Code」開一個段落追加，不改寫舊段落。`AGENTS.md` 用新增段落取代整段重寫。
- 之後若有雲端 routine 自動 commit 文章封包到 `main`，一律當成另一個執行者的成果：不回退、不重做。routine 的提示、啟用與暫停只能由 Darren 決定；本站 routine 須與好材誌 routine 錯開時段，不得兩邊同時每兩小時。
- 絕對不 commit 或 push 密碼、API Token、`.env` 或其他機密。
- Claude Code 雲端是 Linux、每次全新 checkout，進度只靠 Git 與 Sanity 保存。

## 本站固定原則（Darren 2026-10-15 決定，細節見交接文件）

- 讀者是台灣人，繁體中文。主題是日本旅遊的長尾實用資訊，篩選原則是「OTA 庫存蓋不到、大型日旅品牌不寫的題目」。
- 收入結構：住宿頁為主幹（Trip.com 與 Agoda 聯盟分潤＋廣告）；天氣與季節頁為流量墊腳與內連來源；美食為配角。**本站允許 Trip.com 與 Agoda 分潤連結**，這點與好材誌不同。Jalan 與樂天 Travel 對台灣無效，不做。
- AdSense 先不申請。等有自然流量、驗收穩定後，再由 Darren 決定是否加站。AdSense 是帳號層級，會連帶好材誌。
- 不做：廠商名錄、搬家公司推薦類清單、Tabelog 或 Google 評論的改寫段落、直接抓取 Google Maps 或 Tabelog 的內容與照片、用對方網頁 OG 圖當卡片。
- 事實來源優先序：旅館與店家官網、觀光廳與各地觀光協會、氣象廳平年值、國稅廳、消費者廳、Hot Pepper Gourmet Web 服務 API（店家營業資訊，須署名）。Jalan、樂天 Travel、Tabelog、Google Maps 只能當核對與連結，不當正文來源。評價層只放公開榜單事實（米其林、Tabelog 百名店、Tabelog Award）加連結。
- 圖片：整篇封面用免費圖庫實拍（沿用好材誌 stock-image-finder 流程）；店家卡片不放店家照片，重點店用 Google Maps 嵌入；料理與地標可用 Wikimedia Commons 並標示授權；找不到合格實拍時才用 AI 示意圖且必須明確標示。
- 住宿頁每頁帶查核日期，每年重查官網一次；清單要有「訂房管道」欄（官網／Trip.com／Agoda／僅 Jalan）。
- 選題規則：第一名實得流量大於搜尋量、前五名沒有繁中好答案、SERP 確認是日本而非台灣同名地名（岡山、松山、中山、板橋、豐原等）。Ahrefs 顯示 10 的詞視為雜訊，一頁要抓一組變體。
- 規劃結果不等於發布授權。每頁仍要 Darren 核准進清單才能寫；試點 30 頁的構成見交接文件第四節。

## 文章語氣與結構

- 公開文章不使用「先看結論」「重點整理」「懶人包」「TL;DR」等制式摘要標題。開頭直接用自然段落回答讀者的核心問題。
- 標題、H1 與 SEO Title 不用冒號切開主題與說明。整棵 H 樹要能辨識文章主題；H1 關鍵字遺失、標題跳級、重複標題、冒號式 H1、制式摘要與正文式標題都是不可略過門檻。
- 文章由一位作者研究與一次成稿、另一位驗收者唯讀驗收；格式檢查不代表成品合格。

## Skill 路由（待建立）

- 本 repo 的 Skill 尚未建立。第一個任務是從好材誌抽出 `answer-first`、`auto-publisher`、`stock-image-finder`、`hub-keyword-planner` 的通用部分，改寫成本站的來源規則與分類樹，放在本 repo 的 `.agents/skills/`。建立前不得直接套用好材誌的 Skill 寫本站文章。
- 本專案停用 `anthropic-skills:seo-content-writer` 與 `anthropic-skills:serp-analysis`。
- Ahrefs 只用於規劃層；需要 Darren 在 claude.ai 連接 Ahrefs 連接器並在開新 session 後才會載入。未連接時只能做搜尋結果觀察，不得標為「Ahrefs 已驗證」。

## 每次最終回覆格式

```text
目前：一句話描述目前階段
下一步：只列一個動作
建議：繼續／這裡適合告一段落
```

## Skill 路由（2026-10-16 建立）

本站 Skill 放在 `.agents/skills/`，取代上一段「待建立」的說明。建立前與 Darren 討論的決定見 `PROJECT_STATUS.md` 2026-10-16 段落。

- 規劃區域、挑題目、判斷要不要單獨成頁：`japan-travel-topic-planner`。
- 依已核准規格研究與寫作：`japan-travel-answer-first`。日文官方資料為主，只取事實不翻譯段落，保母等級寫法。
- 驗收：`japan-travel-acceptance`。格式檢查、事實查核 agent、讀者驗收 agent 三層，兩個 agent 都不能是作者。
- 選圖：`japan-travel-image-finder`。維基共享資源與免費圖庫優先，不用 NC 與 ND 授權。
- 自動發布 Skill（auto-publisher）尚未建立；要等網站路由決定（是否改成地點在前）與 routine 啟用前再建。
- 這四個 Skill 只能用在本站，不得拿去寫好材誌文章；好材誌的 Skill 也不得用在本站。
