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

## 旅行群流程、來源分級與評論統整（Darren 2026-10-16 決定）

本段取代上方「本站固定原則」裡事實來源優先序、評價層與 Ahrefs 的說明；細節見 `PROJECT_STATUS.md` 2026-10-16（地端）段落。

- **旅行群大綱**：常一起去的地點算一群（例如稚內、宗谷岬、利尻、禮文），一群最多 6 個地點。寫作前先做整群大綱：分工表、每頁 H1／H2／H3 與事實編號、內連表、缺口。Darren 一群核准一次，不逐篇核准。
- **分工規則**：一件事只有一頁寫細節，其他頁一兩句帶過並連過去。只牽涉一地寫在該地主題頁；從出入口到該地寫在該地交通頁；同群兩地以上寫在跨地點頁；各地相同的操作寫在共用教學頁。
- **不用 Ahrefs**：日文 Google 自動完成查地點與分群，中文 Google 自動完成查台灣讀者的主題與用詞。搜尋量只決定先後，不決定要不要寫。
- **來源依內容分級**：交通與規則只用經營者官方；店家資訊用店家官網與官方社群，平台資訊交叉核對；人氣用榜單、得獎、評分與評論數並附查核日期；Tabelog、Google 地圖、部落格、新聞可以找候選，寫進正文前要再查證。
- **評論統整**：不改寫單則評論。兩個平台以上、三則以上共同提到的特點，可以用自己的話寫成「評論常提到…」，好壞都寫並附查核日期，研究記錄留證據。只手動閱讀，不用程式抓評論；仍然不直接抓取 Google 地圖或 Tabelog 的內容與照片。
- Darren 的意見寫進規則庫（分工規則、主題範本、標題規範、語氣），不只改單篇。

## 跨群關聯（2026-10-17）

- Darren 決定跨群的關聯不需要他另外處理。地點之間的關係記在全站地點登錄，不受群限制。
- 分工跨群照用；兩群地點一起排的事歸後規劃的那群；已上線的頁面負責的事，後面的群不搶。
- 新群上線後，舊群頁面的地點欄位與結尾相關連結由 routine 自動補，事實錯誤走一般修正流程，結果記進每週摘要。
- 規則細節見選題 Skill `references/selection-workflow.md` 的「跨群的關聯」。

## 找下一群與默許核准（Darren 2026-10-17 決定）

本段取代前面「規劃結果不等於發布授權，每頁仍要 Darren 核准進清單」與「Darren 一群核准一次」的核准方式。

- **靠完整的內容群往外擴**：一群做完整才換下一群；下一群只從相鄰的地點選，不跳區，季節只決定相鄰候選的先後。前期靠長尾，高價住宿詞的全國支線暫停。
- 目前這群剩下的篇數約夠寫 7 天時（2026-10-17 改，原本是剩 10 篇），自動找下一群、做研究與大綱；同時只往前規劃一群。地區的第一群才由 Darren 選地區。
- 大綱摘要寫進 Google Sheet「日本站規劃總表」（群清單、頁面清單、例外與更新），並在 Darren 的 Google 日曆加提醒。
- **默許**：自動核准日（目前這群最後一篇預計寫完那天，至少提醒後 3 天）到了，Darren 沒有寫意見或改狀態，就算核准。檢查沒過、要改已上線頁面的分工、新頁型、AI 圖等例外不默許。每篇文章照樣要通過四層驗收才發布。
- **更新後門**：事實表每筆標變動類型與下次查核日，到期由 routine 自動重查；只有例外會出現在規劃總表。
- 流程細節見選題 Skill `references/next-group.md`。

## 維護資料庫（Darren 2026-10-17 決定）

- 一直在變的維護狀態放 Cloudflare D1 `japan-travel-ops`（私有）：執行鎖、每輪紀錄、文章的生產輪數與停放、事實查核狀態與到期日、事實被哪幾頁用到、重查紀錄、待補內連、跨群回補、例外。
- Git 放規則、規劃、全站地點清單與研究證據；Sanity（公開）放網站內容與發布狀態；Google Sheet 是給 Darren 看的窗口。Sanity 免費方案只能開公開資料庫，不放維護資料。
- 事實的主張與原文摘錄在 Git，查核狀態在 D1，兩邊用同一個編號（`<地點>:F12`）對應。
- 執行鎖用 D1 的 `run_lock`（`scripts/manage-auto-publisher-lock.mjs`，2026-10-17 從 `.git` 改過來）；每輪開始與結束用 `scripts/ops-run.mjs` 記錄；每週用 `scripts/ops-sheet-sync.mjs` 把例外與即將重查的事實同步到規劃總表。
- 結構變更一律新增 `d1/migrations/` 的編號檔案。雲端 routine 用環境 `japan-travel-publisher`：權杖放在 network secret，環境變數 `OPS_DB_TRANSPORT=http` 讓程式改用 D1 REST API、`NODE_USE_ENV_PROXY=1` 讓 Node 的請求經過代理（權杖才會被附上）；帳號 ID 寫在 `d1/wrangler.jsonc`。權杖由 Darren 建立與貼上，Claude Code 不經手。細節見 `d1/README.md`。

## 品質先驗證、短頁併入主頁（Darren 2026-10-17 決定）

- 每天寫幾篇、怎麼抽查，Darren 要先看到品質合格的樣本再決定。在那之前 routine 不啟用，`article-queue.json` 的頻率設定只是暫存值。
- 資料太少的主題（本主題事實少於 15 筆或預估不到 800 字）不單獨成頁，併進地點主頁寫成一節；門檻暫定，稚內群寫完後調整。
- 下一群在目前這群剩約 7 天的量時開始準備。

## 自動發布 Skill（2026-10-17 建立）

- routine 每一輪依 `japan-travel-auto-publisher` 執行：拿 D1 執行鎖 → 讀 Sanity 與 D1 狀態 → `scripts/routine-next-action.mjs` 決定只做一件事 → 執行 → 記錄 → commit → 放鎖。整體設計見 `content-automation/routine-architecture.md`，routine 提示見 `content-automation/routine-prompt.md`。
- routine 只有在「規劃下一群」時可以 commit `content-planning/` 與 `article-queue.json`，而且 `npm run planning:check` 與 `npm run queue:validate` 都要通過；其他時候不改程式、清單、Skill 或規則文件。
- 上一段「Skill 路由（2026-10-16 建立）」裡「自動發布 Skill 尚未建立」的說明，由本段取代。

## routine 例外（2026-10-17）

- 雲端 routine 依 `japan-travel-auto-publisher` 執行時，本檔「每個任務在自己的分支做」「`.agents/working/claude-code.md` 工作檔」「每次最終回覆格式」三條不適用：routine 直接在 `main` 提交 Skill 允許的路徑，不寫工作檔，用 Skill 的「結束回報」。
- 人工 session 仍照原本的規則。

## 觀光協會照片與嵌入（Darren 2026-10-18 決定）

- 觀光協會與自治體的照片，網站條款允許轉載的（素材庫，或網站採用「政府標準利用規約」、CC BY 等），直接下載使用、照規定寫好 credit，不用另外寫信詢問；條款頁網址記進圖片封包當證據。
- 不用：條款禁止轉載或沒寫轉載條件的、標示第三者提供或攝影的、觀光協會 Instagram 轉貼的遊客照片。
- Instagram 與 YouTube 的公開貼文只用平台的嵌入功能，不下載；官方帳號優先。網站的嵌入區塊還沒做。
- 細節見 `japan-travel-image-finder` 的 `references/selection-and-licensing.md`。本段取代上方「本站固定原則」圖片一條中與此衝突的部分。

## 稚內群核准與研究、寫作規則（Darren 2026-10-18 決定）

- **稚內群 26 頁整批核准**（`content-planning/hokkaido/page-specs.json`）。資料太少的主題仍照短頁規則併進主頁。
- **景點比對與體驗研究**：地點研究多做兩件事，用官方景點清單比對、從 YouTube、部落格與競品行程頁找體驗與文化切入點，查證後才寫，見選題 Skill `references/experience-research.md`。
- **客觀狀況直接寫**：風大、坡陡、人多、班次少等，有官方資料或三個獨立來源一致就直接寫結論與建議；對店家、旅館的評價維持「評論常提到」。見寫作 Skill `references/reviews-and-popularity.md`。
- **嵌入影片與官方 Instagram 貼文**、**資料圖元件**（季節日曆、天氣圖表、路線圖、行程時間軸、基本資訊欄）：規則見寫作 Skill `references/embeds-and-data-blocks.md`；網站元件還沒做，做好前只列候選。

## 查不到的不寫、讀不到改用瀏覽器（Darren 2026-10-18 決定）

- 正文不寫「官方沒寫」「官方沒有公布」「未查」，也不向讀者交代哪些沒查到；查不到的就不寫。讀者真的會卡住的事，改寫成能做的事（例如出發前到觀光案內所確認）。
- 推算出來的數字（例如在岬上能待幾分鐘），附上推算依據的時刻表，讓讀者自己看得到；不另外說明推算方法。
- 缺口與「未查」只記在研究紀錄與事實表，給重查用，不出現在正文。
- 網頁讀取工具讀不到（PDF 是圖片、要執行 JavaScript、擋讀取工具）時，在規劃 session 用瀏覽器實際打開讀取；遇到驗證碼或機器人檢查不繞過。細節見寫作 Skill `references/japanese-sources.md`。

## 寫作規則整併（2026-10-18）

- 寫作規則整併成寫作 Skill 的 `references/writing-guide.md`（約一頁、13 條原則、衝突時的優先順序、三步流程）與 `references/examples.md`（口吻範例與完整版型範例）。寫文章時只讀這兩份；其他參考檔只在用到的步驟讀，分工寫在 `SKILL.md` 的任務與責任。
- 口吻改成導覽編輯口吻（研究見 `content-experiments/voice-study-2026-10-18/`），取代 2026-10-16 的旅行手札。標點與句長由 `.agents/skills/japan-travel-answer-first/scripts/check-voice.mjs` 自動檢查，`scripts/finalize-release.mjs` 定稿時一起跑，沒通過不發布。
- 以下各段的寫作細節現在以 `writing-guide.md` 為準，本檔只保留決定：「文章語氣與結構」的制式摘要與開頭直接回答；「旅行群流程、來源分級與評論統整」的評論統整寫法；「稚內群核准與研究、寫作規則」的客觀狀況直接寫；「查不到的不寫、讀不到改用瀏覽器」的正文寫法與推算附時刻表。新增的寫法：班次少（一天 4 班以下）就列時刻表、用白話說選擇，不算出能待幾分鐘；每個景點配一張認得出現場的照片與基本資訊欄；每頁結尾在 `## 資料來源` 底下列 `### 延伸資料`，只列官方頁；地點主頁多一節依旅客類型的排法。
- `references/voice-and-seo.md` 刪除，SEO 規範併入 `references/heading-style.md`。`nanny-level.md`、`page-types.md`、`research-record.md`、`embeds-and-data-blocks.md`、`japanese-sources.md`、`reviews-and-popularity.md` 保留為各步驟的參考檔。

## 寫作的四個取捨與範文累積（Darren 2026-10-18 決定）

- 口吻正式改成導覽編輯口吻（寫作 Skill `references/writing-guide.md`），旅行手札不再使用。
- 延伸資料獨立成 `## 延伸資料` 一節，緊接在 `## 資料來源` 之前，可以放官方連結；格式檢查器已配合。
- 基本資訊欄先用 Markdown 表格寫，網站已支援表格（Sanity `contentTable`）。
- 照片只放重點景點（有自己 H3、讀者要到現場認得出來），不是每段配圖。
- 範文累積：Darren 看過並認可的段落放進寫作 Skill 的 `examples.md`，Darren 改過的地方記成修改前後對照；範例只留最好的 3 到 5 篇。模型本身不會記住，進步靠這些檔案。

## 標題照旅客動線排（Darren 2026-10-18 決定）

- 渡輪頁並排比較後，Darren 同意整群大綱改成照旅客動線排：H2 跟著讀者實際要做的事走（先決定、再訂票、搭乘當天、現場、費用、出狀況），不照資料類別切；H3 用讀者的動作或問題命名；不設「常見問題」H2。
- 原因：照類別切每節都得自成一體，段落會寫成「主題句→規則→例外→建議」的小論證，讀起來有起承轉合的架構感。
- 稚內群 24 頁的大綱已重排（`content-planning/hokkaido/hokkaido-wakkanai-outline.json`，重排過的頁標 `headingOrder: traveler-journey`）。各頁型的順序寫在選題 Skill `references/selection-workflow.md` 第6節與寫作 Skill `references/heading-style.md`。
- 潤稿流程定案：Opus 5.5 照潤稿 Skill 潤稿 → 編輯挑錯一輪再修 → 意義比對 → 驗收。寫作與潤稿不用 Fable，Fable 只用在評審與策略。研究見 `content-experiments/polish-test-2026-10-18/ai-tone-study.md`。

## 不寫成量產頁、口吻照好運日本行與 MATCHA（Darren 2026-10-19 決定）

- Darren 擔心 Google 抓出太像 AI 的內容。Google 看的是對讀者有沒有用，處罰大量產出、內容空洞、每頁長一樣的頁面（scaled content abuse），不是 AI 偵測。所以寫作照寫作 Skill `writing-guide.md` 第14條：輕重有別、結構跟著主題走、有事實撐的編輯判斷、本站獨有的資料放前面；不故意放錯字、不假裝去過。
- 口吻目標是好運日本行（GLTJP）與 MATCHA。潤稿前依段落功能讀他們的同類文章、照講法重寫（潤稿 Skill 第 1-1 步）；repo 只存網址，`check-copy.mjs` 擋照抄。真正訓練（微調）模型做不到。
- 評審的「自然度」「怪句」分數有偏（會把真的好運日本行判成最怪），只當參考；最後由 Darren 看。

## 本機自動寫作（Darren 2026-10-20 決定）

- 每天 3 篇，跟好材誌一樣每 8 小時一輪、一輪一篇，時間錯開：台北 04:42、12:42、20:42（好材誌雲端 routine 是 00:12、08:12、16:12）。
- 用 Claude 桌面 app 的排定工作 `japan-travel-daily-writer` 在本機跑，不用雲端 routine；**先不上傳**（不碰 Sanity、D1、規劃總表，不選圖）。排定工作建好後是暫停狀態，Darren 說好才啟用；啟用與暫停只由 Darren 決定。
- 每輪流程在 `content-automation/local-writer.md`，執行紀錄在 `content-automation/local-run-log.md`。工作資料夾是 git worktree `C:\Users\ak472\Documents\GitHub\japan-travel-auto`（分支 `auto/wakkanai-writing`），不動主資料夾；人工 session 不要在那個資料夾改檔案。
- 自動產出的文章封包一律當成另一個執行者的成果：不回退、不重做；要合併回 `main` 時照 Git 規則先跑測試。

## 景點升格（Darren 2026-10-21 決定）

- 景點預設寫在該地點景點頁裡的一個 H3，不單獨成頁。
- 兩條都符合才給景點自己一頁：中文 Google 自動完成有這個景點的延伸詞（交通、路線、時間、開放之類）；只屬於它的事實達到短頁門檻（15 筆、800 字）。
- 景點頁是面向頁的一種（`aspect-page`、主題 `sight`），網址 `/places/<地點>/<景點>/`；已核准的群要新增景點頁屬於例外，不默許。
- 細節見選題 Skill `references/selection-workflow.md` 第 4 步「景點升格」。
