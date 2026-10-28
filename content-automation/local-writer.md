# 本機自動寫作流程（2026-10-20）

Darren 2026-10-20 決定：每天 3 篇，跟好材誌一樣每 8 小時跑一輪、一輪寫一篇，時間和好材誌錯開；在本機用 Claude 桌面 app 的排定工作執行，不用雲端 routine；**先不上傳**（不碰 Sanity、D1、規劃總表）。排定工作建好後先暫停，Darren 說好才啟用。

Darren 2026-10-22 改成**每天 5 篇**：一輪仍只寫一篇，改成一天跑 5 輪。前 4 輪實測一篇約用 5 小時額度 10%、每週額度約 1%，一輪約 1 小時。

- 排定工作：`japan-travel-daily-writer`，每天台北 01:42、04:42、10:42、13:42、20:42（好材誌是 00:12、08:12、16:12，每輪至少錯開 1 個半小時）。
- 每輪的流程就是本文件；排定工作的提示只叫它讀這份文件照做。要改流程就改這份文件，不用改排定工作。
Darren 2026-10-24 改成**自動上傳、直接開放收錄**：每輪寫完一篇後，上傳最多 2 篇已驗收、還沒上線的文章（照 `writingOrder` 先後），積壓的清完後就是每輪寫一篇、傳一篇。上傳照自動發布 Skill（`.agents/skills/japan-travel-auto-publisher/SKILL.md`）「produce」第 7～14 步，本機的差異寫在本文件「5. 上傳」。上傳完把分支合併推到 `main`，網站才會重建。

- 這套流程和 2026-10-20 稚內交通的人工流程相同，一篇約用 5 小時額度的 16%、每週額度的 2%（不含選圖）。
- Darren 2026-10-25 加上第 2 步第 0 點「寫作前補研究」：作者動筆前先補這頁缺的事實，補完還太薄或大綱有錯就停放、不上線。同日照 6 篇試跑結果修訂判定規則；試跑每篇約 17～21 萬 token、20～40 分鐘。

## 工作資料夾與分支

- 一律在專用資料夾 `C:\Users\ak472\Documents\GitHub\japan-travel-auto` 工作，分支 `auto/wakkanai-writing`。這是 git worktree（同一個 repo 的第二個工作資料夾），不會動到 Darren 或其他 session 正在用的 `japan-travel` 資料夾。
- 每個指令都用這個資料夾的絕對路徑，或先 `cd` 進去。不要在 `japan-travel` 主資料夾改任何檔案、不要切換它的分支。
- 一開始執行 `git pull --ff-only origin auto/wakkanai-writing`（遠端還沒有這個分支時略過），接著 `git fetch origin` 與 `git merge --no-edit origin/main`，拿到人工 session 改過的規則與程式。拉不下來或合併有衝突（先 `git merge --abort`）就停止，寫執行紀錄說明原因。
- 根目錄或 `studio/` 沒有 `node_modules` 時，先在那個資料夾執行 `npm ci`。

## 每輪的步驟

### 0. 開始前

1. 讀 `AGENTS.md`（人工 session 的規則照用，但「每次最終回覆格式」改用本文件的結束回報）與本文件。
2. **用量**：有 `get_usage` 工具時先看用量。5 小時額度已用 70% 以上，或每週額度已用 80% 以上，就略過這一輪（寫執行紀錄「略過：額度」），不開始寫。
3. **執行鎖**：看 `.auto-writer.lock`（在工作資料夾根目錄，不進 Git）。存在而且裡面的時間不到 6 小時，代表上一輪還在跑，直接結束、不寫紀錄。否則寫入現在時間（ISO 格式）建立鎖，本輪結束時（不管成功失敗）刪掉。
4. **今天的額度**：讀 `content-automation/local-run-log.md`，台北今天已經「完成」的篇數達到 `article-queue.json` 的 `maxArticlesPerDay`（目前 5）就略過。
5. **週末加量（Darren 2026-10-24 決定，到台北 2026-10-26 22:00 週額度重置為止）**：排定工作 `japan-travel-daily-writer` 這段期間每天跑 8 輪，多了 06:42、17:42、22:42。這段期間第 2 點的每週額度門檻改成 95%，第 4 點的每天上限改成 8 篇。過了 2026-10-26 22:00，回到 80% 與 `maxArticlesPerDay`；這時如果本輪是 06:42、17:42 或 22:42 那一輪（開始時間在這三個時間的前後 30 分鐘內），什麼都不做、不寫紀錄，直接結束。

### 1. 挑文章

照 `content-automation/article-queue.json` 的 `travelGroups[0].writingOrder` 順序，挑第一篇符合下面條件的：

- `content-production/<articleId>/review.md` 不存在，或存在但最終結果不是 `ready_for_user_preview`；
- 執行紀錄的「停放」表裡沒有它。

全部寫完就略過這一輪，執行紀錄寫「略過：稚內群已全部寫完」。

下面的 `<id>` 是挑到的 articleId，`<資料夾>` 是 `content-production/<id>`，`<地點>` 是大綱裡這頁的 `placeId`。大綱是 `content-planning/hokkaido/hokkaido-wakkanai-outline.json`。

### 2. 寫作與潤稿

子代理一律用 Agent 工具、`model: "opus"`（Opus 5.5），**`run_in_background: false`**，等它完整回傳才做下一步。每一步都要親自確認檔案存在，不能只憑子代理的說法。寫作與潤稿不用 Fable。

0. **寫作前補研究**（新子代理「研究者」，不寫文章；Darren 2026-10-25 決定加這一步，因為事實表薄的頁面寫出來會用「打電話問」填滿表格。判定規則 2026-10-25 照 6 篇試跑結果修訂）。交代：
   - 讀大綱這一頁（mustAnswer、headings、`links`、分工表）、`.agents/skills/japan-travel-answer-first/references/page-types.md` 裡這種頁型的必備欄位、`references/research-record.md`、`references/japanese-sources.md`。
   - 從 `content-planning/hokkaido/places/<地點>/facts.json` 建 `<資料夾>/reference-review.md`：格式照 `content-production/wakkanai-transport/reference-review.md`（原始任務、事實表、推算、查到但不寫、待補內連），事實表收大綱這頁標題用到的事實，加上跟本頁主題直接相關的事實，編號不帶地點前綴。
   - 在 `reference-review.md` 加「## 寫作前缺口檢查」表：每條 mustAnswer、每個大綱或頁型要的表格欄位一行（住宿頁是每一家的區域、離車站或港口多遠、接送、營業期間、訂房管道；Darren 2026-10-26 決定住宿頁不寫價格，含餐只在影響選擇時寫），欄位是項目、已有的事實編號、夠不夠、缺什麼、補研究結果。表格欄位一欄一行，分母是大綱或這頁表格要列的家數。另外列每個 H3 用到幾筆事實。
   - **什麼算「夠」**：
     - 價格、營業期間、休業、時刻這類會變的資料，只有一個來源而且那個來源現在打不開（只讀得到網頁存檔也算），算「不夠」，要另找第二個來源，旅館或店家官網優先。
     - 事實表裡已經有的營業期間、休業與價格，要重開官網核對一次，不只查缺的；跟官網不一致的照官網更正，記在事實表的採用決定欄。
     - 「本主題事實」不算全島或全區通用的句子、影片線索與重複的事實。
     - 官方本來就不公布的欄位（例如沒有官網或官方社群、只有平台資料的小店的營業時間與價格）不放進表格、不算分母，在缺口表註明「官方不公布」。
   - 缺的去查，照來源分級：經營者官網與旅館、店家官網優先，再來是觀光協會與自治體；Trip.com、Agoda 只用來核對有沒有上架、訂不訂得到。找官網先看觀光協會與自治體住宿清單上的官網欄，再網路搜尋「名稱 公式」。網頁讀取工具讀不到就用瀏覽器打開，照本文件「不做的事」（打開後先靜音、不點下載、不開影片頁、遇到驗證碼或機器人檢查不繞過）；用瀏覽器時先開一個自己的新分頁，不用預設分頁，讀完關掉。原站連不上時可以用網頁存檔，記下存檔日期，下次查核日設在 30 天內。新事實照事實表格式接著編號加進去，採用決定欄寫「寫作前補研究」。
   - 可以做、不算填表單的操作：在 Trip.com、Agoda 的搜尋框打旅館名稱查有沒有上架；在官方訂房系統選日期看有沒有開放預約、有哪些房型（不輸入個人資料、不送出）。住宿頁不查價格（2026-10-26）。
   - 補不到的照實記在缺口表，不讓作者用「訂房時問」之類的句子補位。
   - 範圍只限 mustAnswer、表格欄位與已有的會變資料，不擴充別的題目；住宿頁大約 45 分鐘、其他頁 30 分鐘內做完。
   - 最後寫「## 寫作前判定」：`ready`、`thin` 或 `outline-error`，附一句原因。
     - `thin`：有一條 mustAnswer 找不到事實可以正面回答；頁型必備的表格欄位（住宿頁是區域、營業期間、訂房管道）有一欄不到一半的格子有事實；同一頁有 3 個以上 H3 只有一兩筆事實；面向頁的本主題事實少於 15 筆（短頁門檻）。
     - 地點主頁不套 15 筆門檻，改看主頁自己才寫的內容：排幾天、幾月去、依旅客類型的排法、當天來回的比較，各要有事實可寫；有一項沒有就是 `thin`。大綱漏了依旅客類型的排法，記在「## 大綱待調整」。
     - 不是必備的表格欄位不到一半，就寫「整欄拿掉」，不算 `thin`。
     - `outline-error`：大綱寫錯事實，例如旅館放錯區、地點或分工跟官方資料對不上。寫出大綱原文、官方資料與網址。
     - 只有一兩筆事實的 H3（不到 3 個）不影響判定，列進「## 大綱待調整」。
   - 不改資料夾以外的檔案、不 commit。Windows 的 heredoc 會吃反斜線，寫檔用 Write 工具。

   協調者親自讀「寫作前判定」：`thin` 或 `outline-error` 就**停放**這篇（見「失敗」），停放表的原因寫「寫作前補研究後資料仍不足」或「大綱錯誤」與缺什麼、錯在哪，要誰處理寫「人工 session：補研究、改大綱或併進地點主頁」；`ready` 才接第 1 步。有「## 大綱待調整」時，把內容寫進執行紀錄「紀錄」表的待同步欄，文章照寫。

1. **作者**（新子代理）。交代：
   - 用 `.agents/skills/japan-travel-answer-first/SKILL.md` 寫內容稿；寫作前讀完 `references/writing-guide.md`（特別是第14條「不要寫成量產頁」與第15條「日文只放在括號與「」裡」）、`references/examples.md`、`references/nanny-level.md`。研究由第 0 步的研究者做完，跳過研究步驟。
   - H1、H2／H3 照大綱這一頁的 headings 一字不改、順序層級不變；mustAnswer 都要正面回答；大綱 `links` 裡 from 是這頁的 sentence 一字不改寫進正文；分工表歸別頁的事一兩句帶過並用內連句連過去。
   - 讀研究者建好的 `<資料夾>/reference-review.md`，只能用裡面的事實。缺口表標「補不到」的不寫；單一格子可以寫成讀者能做的事，但不能用「訂房時用電話問」之類的句子填滿一整欄。缺口檢查寫「整欄拿掉」的欄不放進表格；「官方不公布」的欄位不放。
   - Darren 的寫法要求：讀者會卡住的事講細，其他一兩句帶過，不要每節一樣長；班次少（一天 4 班以下）就列時刻表，用白話說選擇，不算出能待幾分鐘；段落從讀者的處境起頭；有事實撐的判斷直接給、理由寫在同一句，划不划算要用事實的數字算；不寫成去過、不用第一人稱、不加沒有事實的感想；不用「看這張表」「都查得到」「先…」「關鍵是」「最先要搞清楚的是」這類硬裝口語或宣告句；同一個條件詞不整篇重複；查不到的不寫，也不寫「官方沒寫」。
   - 輸出 `<資料夾>/draft-tagged.md`（每句有數字、時間、價格、條件的句子在句號前標 `[F編號]`；結尾 `## 延伸資料`（官方頁）、`## 資料來源`）與 `<資料夾>/publication.json`（`articleId`、`targetPath`、`seoTitle` 與 H1 相同、`seoDescription` 120 字內含具體數字、`excerpt`）。
   - 跑到通過：`python .agents/skills/japan-travel-answer-first/scripts/fact_tags.py <資料夾>`（產生 `reader-preview.md`）、`node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs <資料夾>/reader-preview.md`、`python .agents/skills/japan-travel-answer-first/scripts/audit_answer_first.py <資料夾>/reader-preview.md --json --article-type <大綱這頁的 pageType（place-entry 或 aspect-page）> --reference-review <資料夾>/reference-review.md`（要 `mechanical_clear`）。
   - 不讀 `content-production` 其他文章的正文、不改資料夾以外的檔案、不 commit。Windows 的 heredoc 會吃反斜線，寫檔用 Write 工具。
2. **潤稿者**（新子代理，沒寫過這篇）。照 `.agents/skills/japan-travel-polish/SKILL.md` 做第 1～4-1 步：第 1-1 步依 `references/style-sources.md` 挑三到五篇好運日本行與 MATCHA 的同類文章，用 curl 存到系統暫存資料夾（不放進 repo），講法寫進 `<資料夾>/polish-notes.md`；先把 `draft-tagged.md`、`reader-preview.md` 各複製成 `before-draft-tagged.md`、`before-reader-preview.md`；五項檢查（`check-polish.mjs --article=<id>`、`fact_tags.py`、`audit_answer_first.py`、`check-voice.mjs --final`、`check-copy.mjs` 列進讀過的每篇）全部通過。
3. **編輯挑錯**（新子代理）：讀 `.agents/skills/japan-travel-polish/agents/editor-review.md` 照做，審 `<資料夾>/reader-preview.md`，輸出 `<資料夾>/editor-review.md`，只讀這篇文章。另外告訴它：網站經營者希望讀起來像好運日本行、MATCHA，特別討厭硬裝口語與同一個條件詞整篇重複。
4. **潤稿者修一輪**（用 SendMessage 回到第 2 步的潤稿者）：照潤稿 Skill 第 4-2 步，只處理措辭，「內容疑問」留給驗收；改完重跑五項檢查，採納與不採納寫進 `polish-notes.md`。
5. **意義比對**（新子代理）：讀 `.agents/skills/japan-travel-polish/agents/meaning-drift.md` 照做（把 `<文章資料夾>`、`<地點>` 換成實際值）。
6. **潤稿者修正**（SendMessage 回潤稿者）：只改意義比對列出的「不可接受」與「遺失」，重跑五項檢查，記進 `polish-notes.md`。

### 3. 驗收

先算 `<資料夾>/reader-preview.md` 換行統一成 LF 後的 SHA-256：`node -e "const c=require('crypto'),f=require('fs');console.log(c.createHash('sha256').update(f.readFileSync('<資料夾>/reader-preview.md','utf8').replace(/\r\n/g,'\n')).digest('hex'))"`。

同一則訊息同時派三個子代理（都 `run_in_background: false`）：

1. **標題檢查**：只讀大綱這頁（primaryQuery、secondaryQueries、h1、mustAnswer、headings）、`reader-preview.md`、`.agents/skills/japan-travel-answer-first/references/heading-style.md`（含最後的 Darren 增訂規則）與 `publication.json` 的 seoTitle。寫 `<資料夾>/heading-review.json`：`{"checker":"heading-check-agent","items":[{"level","before","after","reason"}],"seoTitle":{...},"structureNotes":[]}`。只改文字，不增刪、不改層級與順序；正文 H2 帶地名；次要查詢各留在某個 H2／H3；問句標題用全形「？」且下一段第一句是答案。
2. **事實查核**：唯讀，只寫 `<資料夾>/fact-check.json`，照 `.agents/skills/japan-travel-acceptance/references/fact-check-contract.md`。從正文逐句找出所有事實，每個一筆 claim；實際打開來源（curl 或 WebFetch；PDF 用 curl 下載到暫存資料夾讀；要 JavaScript 的頁面用瀏覽器讀，**不要在瀏覽器點下載**）；遇到驗證碼或機器人檢查不繞過，記 unreachable 另找官方來源；編輯判斷與比較用官方數字重算；注意修飾詞、季節期間、條件主詞。`articleSha256` 填上面算的值、`checkedAt` 填今天。跑 `node .agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs <資料夾>` 直到紀錄完整。
3. **讀者驗收第一階段**：只讀大綱這頁、`reader-preview.md`、`.agents/skills/japan-travel-acceptance/references/reader-acceptance.md` 的「讀者設定」與「第一階段」（口吻可讀 writing-guide.md）。依 mustAnswer 自己設兩個台灣讀者情境（月份、人數、交通方式、要趕的行程）實際走一遍。背景（不算缺點）：標題照旅客動線排、不設常見問題 H2；分工歸別頁的事只帶過並連過去。寫 `<資料夾>/reader-stage1.md`（判斷、各項判斷表、必修與加分，每條寫位置、原句、原因）。

接著：

4. **讀者驗收第二階段**（SendMessage 回讀者驗收者）：現在可以讀 `reference-review.md`、`fact-check.json`、`heading-review.json`；把事實查核的非 verified 項目與會讓讀者卡住的備註併進必修，寫 `<資料夾>/reader-stage2.md`（最終必修：位置、原句、修改方向、依據的事實或要補的研究；加分清單）。
5. **作者修改**（SendMessage 回第 2 步的作者）：以潤稿後的稿子為準，只改驗收要求的地方，口吻維持潤稿後的樣子。處理全部必修；加分只做不用新研究、或只用經營者官方就能補的；要補研究只用經營者官方，新事實照格式加進 `reference-review.md`（接著 F 編號），更正的列直接改，最後加「## 驗收後第 1 輪（日期）」一節；標題照 `heading-review.json` 的 after 手動改進 `draft-tagged.md`，再跑 `python .agents/skills/japan-travel-answer-first/scripts/heading_review.py <資料夾>` 確認是 `headings_applied`；逐條處理寫進 `<資料夾>/revisions-round1.md`；三項檢查通過。不改資料夾以外的檔案。
6. **事實查核複查**（SendMessage 回事實查核者）：給新的 SHA-256 與 `revisions-round1.md`，逐句重新比對，改過與新增的句子實際查來源；更新 `fact-check.json` 跑驗證。
7. **讀者最終判定**（SendMessage 回讀者驗收者，可和第 6 步同時）：逐條確認必修有沒有解決，兩個情境再走一遍，寫 `<資料夾>/reader-final.md`（讀者價值與標題的最終判定、剩下的必修）。
8. **收斂**：
   - 事實查核還有非 verified、或讀者最終還有必修：只改那幾句（一兩個詞的小錯由你直接改 `draft-tagged.md` 再跑 `fact_tags.py`；要改段落就 SendMessage 回作者），算新 SHA-256，請事實查核者複查（只差那幾處的話，以雜湊與比對確認只差這幾處）。
   - 事實查核最多 4 輪。第 4 輪還沒全部 verified，或讀者最終判 reject，就**停放**這篇（見「失敗」）。

### 4. 驗收紀錄與定稿檢查

1. 大綱同步：標題檢查改過的標題，把大綱這頁 headings 的 `text` 改成一樣（只改這頁、只改文字），跑 `npm run planning:check` 通過。
2. 寫 `<資料夾>/review.md`，格式照 `content-production/wakkanai-transport/review.md`：SHA-256、規則、作者／潤稿者／標題檢查／事實查核／讀者驗收／協調者的身分、結果表（格式 `mechanical_clear`、標題 `acceptable`、讀者價值 `acceptable`、事實與條件 `verified`、口吻、事實編號、防抄襲、圖片寫「這次沒有選圖」）、最終結果 `ready_for_user_preview`、經過表、查不到所以正文沒寫的、留給之後的事。
3. 跑 `node scripts/local-article-gates.mjs <id>`，要印出 `gates_clear`。沒過就修到過（通常是 review.md 的 SHA 或欄位）。

### 5. 上傳

寫作停放、略過或停止的輪次也照樣做上傳（只有「工具或環境錯誤」不做）。上傳前先照第 6 步第 2 點的範圍 commit 寫作結果（先不 push），上傳失敗也不會丟稿。

**前置**

- 用量：5 小時額度 70% 以上或每週額度 80% 以上，就不上傳，執行紀錄寫「上傳略過：額度」。
- Git Bash 先 `export MSYS_NO_PATHCONV=1`（不然 `/places/...` 這類參數會被改成 Windows 路徑）。
- Sanity 指令在 `studio/` 執行：`npx sanity exec scripts/<檔名>.mjs --with-user-token -- <參數>`，用這台電腦的 Sanity 登入狀態。D1 指令（`scripts/ops-*.mjs`）用 wrangler 的登入狀態，不設 `OPS_DB_TRANSPORT`。
- 下面說的「第 N 步」都是自動發布 Skill「produce」那一節的步驟，失敗時怎麼記錄也照它。

**1. 讀狀態**：`studio/` 內 `npx sanity exec scripts/inspect-article-queue.mjs --with-user-token > ../.tmp/queue-state.json`，再 `node scripts/ops-article.mjs list` 看 D1 的生產狀態。

**2. 挑文章**：照 `writingOrder` 順序，挑最多 2 篇符合下面全部條件的，一篇做完再做下一篇：

- `review.md` 最終結果是 `ready_for_user_preview`，`node scripts/local-article-gates.mjs <id>` 是 `gates_clear`；
- 不在執行紀錄的「停放」與「上傳停放」表；
- `queue-state.json` 裡這篇不是 `published_indexable`，或是 `published_indexable` 但 D1 還沒標 `published`（只做第 4 點的登記）。

`groupId`、`batchId`、`targetPath`、`routeMode` 用 `article-queue.json` 裡這篇的值。

**3. 每一篇**

1. D1：`ops-article.mjs list` 裡沒有這篇，先 `node scripts/ops-article.mjs start --article=<id> --group=<groupId> --path=<targetPath> --rules=$(git rev-parse --short HEAD)`（已有紀錄的不要再 start，它會把寫作輪數加一）；接著 `ops-article.mjs accepted --article=<id>`。狀態是 `parked` 就加進「上傳停放」表、換下一篇。
2. 父 Hub：第 2 步（`queue-state.json` 的 `parentHubs[]`，`missing` 就 `prepare-parent-hub.mjs <batchId>` dry-run 後 `--apply`）。
3. Sanity 狀態是 `staged_noindex`（上一輪做到一半）：跳過 4、5、6，照 Skill「resume」的 `staged`：沒封面才做第 5 點的封面；封包裡有文內照片的，照第 6 點最後一段補傳（已插入的會顯示 `already-matching`），再接第 7 點。
4. 定稿：`npm run release:finalize -- content-production/<id>`。
5. 選圖：派一個子代理照 `.agents/skills/japan-travel-image-finder/SKILL.md` 選**封面與文內照片**，只用實拍照片（維基共享資源、免費圖庫、條款允許的觀光協會照片），**不用 AI 圖**，圖片用 curl 下載、不在瀏覽器點下載，User-Agent 不放 email，封包寫在 `content-production/<id>/images/`。
   - 封面：選定後 `npm run image:prepare:cover -- content-production/<id> --download`，親自看一次裁切後的圖。找不到合格實拍：這篇加進「上傳停放」表（原因「缺封面」），`ops-article.mjs fail --article=<id> --kind=publish --reason=缺封面`，換下一篇。
   - 文內照片（2026-10-28 加回）：只放重點景點與交通據點，就是有自己一節、讀者到現場要認得出來的地方（渡輪站、機場、車站、主要景點），一篇最多 4 張，一節最多 1 張。每個位置要有 `placement`（那一節標題全文、`afterBlocks` 預設 1，接在第一段之後）與 `preparation`，格式見 image-finder `references/image-packet.md`「文內照片的位置與準備」。找不到合格實拍的位置就不放、不列進封包，**不因為缺文內照片停放**。
   - 有文內照片時，`npm run image:prepare:inline -- content-production/<id> --download`，**親自打開每一張 webp**，確認畫面和 `altDraft`、`captionDraft` 寫的一致（例如寫了看得到招牌字樣，就要真的讀得到）；不一致就改文字，改不了就拿掉那個位置。下載被擋（HTTP 429 之類）就照 `.tmp/image-selection/<id>/inline/<slotId>-source.jpg` 用 curl 下載後重跑（不加 `--download`）；還是不行，這篇先不放文內照片，照樣上線。
6. Sanity 暫存：第 10 步（先 `node scripts/link-at-publish.mjs .tmp/auto-publisher/<id>/sanity/article.json --article=<id> --outline=content-planning/hokkaido/hokkaido-wakkanai-outline.json --sanity=.tmp/queue-state.json` 接上已上線頁面的內連，再 `publish-prepared-article.mjs ../.tmp/auto-publisher/<id>/sanity/article.json` 與 `publish-article-cover.mjs ../content-production/<id>`，都先 dry-run 再 `--apply`），重新 inspect 確認 `staged_noindex` 而且 `hasCover`。
   - 有文內照片時接著在 `studio/` 跑 `npm run publish:article-inline-images -- ../content-production/<id>` 預覽：每張都要是 `upload-and-insert`（續做時可以是 `already-matching`），位置在指定那一節。再加 `--apply`，看到 `inline-images-published-and-verified` 才算完成。文內照片上傳失敗**不擋上線**：先 `--remove --apply` 拿掉已插入的照片，在「上傳」表備註原因，繼續第 7 點。
7. 開放索引：第 11 步。CI 用 `SANITY_PROJECT_ID=e8ctf7ee SANITY_DATASET=production npm run ci`。`routeMode` 是 `hub-landing` 時照第 11 步掛入口文章、失敗時撤回。
8. 第 12 步：重新 inspect，父 Hub 的 `shouldReleaseIndex` 是 true 就 `--release-index`。
9. 登記：第 13 步，`--outline=content-planning/hokkaido/hokkaido-wakkanai-outline.json --sanity=.tmp/queue-state.json --body=.tmp/auto-publisher/<id>/sanity/article.json`（先重新 inspect；resume 的 `staged` 沒有這個檔案就不帶 `--body`）。

任何一點失敗照 Skill 記 `ops-article.mjs fail --kind=publish`，**不開放索引**，在「上傳」表記「失敗」與停在哪一點，換下一篇；同一篇連續 3 次失敗會自動停放，加進「上傳停放」表。

**4. 補內連**：上傳做完後（這輪沒上傳也要做），先重新 inspect，照 Skill「backfill-links」把 `ops-links.mjs ready --sanity=.tmp/queue-state.json` 列出的**全部補完**，不設上限（2026-10-25 取消一輪 5 個）。CI 一樣要帶上面的兩個環境變數。

**5. 推上網站**：有任何一篇開放索引或補了內連，才做這一點。

1. commit 上傳的封包：`git add content-production/<上傳的 id>/`（`manifest.json`、`audit.json`、`sanity-sync.json`、`images/`；`.tmp/` 裡的原圖與 webp 不加入 Git），訊息 `feat(content): <id> 上線`。
2. `git fetch origin`、`git merge --no-edit origin/main`，有衝突就 `git merge --abort`、不推 `main`，在執行紀錄寫明（文章已經在 Sanity，下一次推 `main` 網站才會更新）。
3. `npm test` 通過後 `git push origin HEAD:main`，Cloudflare 會自動建置並更新網站，約 5 分鐘。不用等它完成；下一輪開始前用 `curl -s -o /dev/null -w "%{http_code}" https://offpathnotes.com<targetPath>` 確認上一輪上線的網址是 200，不是就寫進執行紀錄。

### 6. 收尾

1. 更新 `content-automation/local-run-log.md`（見「執行紀錄」）。
2. `git add` 只限：`<資料夾>/`、`content-automation/local-run-log.md`、大綱檔（有同步標題時），以及第 5 步上傳的 `content-production/<id>/`。commit 訊息 `feat(content): <id> 本機寫作完成`（停放用 `<id> 停放`、略過用 `chore(automation): 本機寫作略過 <原因>`），結尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。`git push origin auto/wakkanai-writing`；第 5 步推過 `main` 的話，紀錄更新後再 `git push origin HEAD:main` 一次（先照第 5 步第 2、3 點合併與測試）。
3. 刪掉 `.auto-writer.lock`。

## 失敗

- **停放**：寫作前補研究判定 `thin` 或 `outline-error`、事實查核 4 輪還沒全部 verified、讀者最終判 reject、大綱或分工和事實對不上、作者回報缺事實寫不出 mustAnswer。把資料夾留著（不刪），review.md 的最終結果寫 `parked` 與原因；執行紀錄「停放」表加一列；下一輪自動換下一篇。停放的文章等 Darren 或人工 session 處理。
- **來源打不開**（網站掛了，不是驗證碼）：那筆照查核規則記 unreachable；整篇不能放行時停放並寫原因。
- **工具或環境錯誤**（腳本跑不動、git 拉不下來）：停止這一輪，寫執行紀錄，不換下一篇。
- 不降低任何門檻、不跳過驗收、不改程式、Skill 或規則文件。
- 上傳的任何一步失敗都不開放索引，也不為了上線改文章內容；寫作驗收沒過的文章不上傳。

## 不做的事

- 只做第 5 步列出的上傳動作；不碰規劃總表、不改已上線文章的文字（補內連只加連結）、不改 Hub 文案。
- 不用 AI 圖。文內照片只放第 5 步「每一篇」第 5 點說的重點景點與交通據點。
- 不改 `content-planning/` 的事實表、譯名表與規格（研究時發現的更正與新事實只記在文章的 `reference-review.md`，執行紀錄寫「待同步」）；大綱只同步標題文字。
- 不在瀏覽器點下載（會在 Darren 的電腦跳出存檔視窗）。
- 不讓電腦發出聲音（Darren 2026-10-23：影片自動播放的音樂會嚇到人）。不在瀏覽器打開 YouTube、Instagram、TikTok 或其他影片頁，影片資訊（標題、說明欄、章節、字幕）用 curl 或 WebFetch 讀。其他網頁要用瀏覽器開時，打開後第一個動作就執行 JavaScript `document.querySelectorAll('video,audio').forEach(m=>{m.muted=true;m.pause()})`，讀完立刻關掉分頁。派子代理會用到瀏覽器時，把這一條原文交代給它。
- 只用第 5、6 步的方式推 `main`（先合併 `origin/main`、測試通過）；不 force-push、不 rebase。

## 執行紀錄

`content-automation/local-run-log.md` 五段：

- **最新一輪**：整段覆寫。台北時間、文章 ID、結果（`完成`／`停放`／`略過`／`停止`）、停在哪一步與原因、事實查核輪數與 claim 數、讀者驗收必修條數、開始與結束的用量（有 get_usage 時）、commit 短碼、下一輪預期文章。
- **停放**：表格（文章 ID、日期、原因、要誰處理），解決後改狀態不刪列。
- **上傳**：表格第一列插入本輪每一篇（台北時間、文章 ID、結果 `已上線`／`失敗`／`上傳停放`、網址、停在哪一點與原因、封面來源與授權、文內照片張數與沒放的原因）。
- **上傳停放**：表格（文章 ID、日期、原因、要誰處理），解決後改狀態不刪列。
- **紀錄**：表格第一列插入本輪（日期時間、文章 ID、結果、事實查核輪數、5 小時額度用量變化、待同步的事實）。

## 結束回報

四行：這一輪寫了哪篇（或略過與原因）與結果、上傳了哪幾篇與結果、下一輪預期寫哪篇。最後一行：執行紀錄是否已更新並推送（含 `main`）、鎖是否已刪掉。
