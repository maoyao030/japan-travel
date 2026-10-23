# 本機自動寫作流程（2026-10-20）

Darren 2026-10-20 決定：每天 3 篇，跟好材誌一樣每 8 小時跑一輪、一輪寫一篇，時間和好材誌錯開；在本機用 Claude 桌面 app 的排定工作執行，不用雲端 routine；**先不上傳**（不碰 Sanity、D1、規劃總表）。排定工作建好後先暫停，Darren 說好才啟用。

Darren 2026-10-22 改成**每天 5 篇**：一輪仍只寫一篇，改成一天跑 5 輪。前 4 輪實測一篇約用 5 小時額度 10%、每週額度約 1%，一輪約 1 小時。

- 排定工作：`japan-travel-daily-writer`，每天台北 01:42、04:42、10:42、13:42、20:42（好材誌是 00:12、08:12、16:12，每輪至少錯開 1 個半小時）。
- 每輪的流程就是本文件；排定工作的提示只叫它讀這份文件照做。要改流程就改這份文件，不用改排定工作。
- 這套流程和 2026-10-20 稚內交通的人工流程相同，一篇約用 5 小時額度的 16%、每週額度的 2%（不含選圖）。

## 工作資料夾與分支

- 一律在專用資料夾 `C:\Users\ak472\Documents\GitHub\japan-travel-auto` 工作，分支 `auto/wakkanai-writing`。這是 git worktree（同一個 repo 的第二個工作資料夾），不會動到 Darren 或其他 session 正在用的 `japan-travel` 資料夾。
- 每個指令都用這個資料夾的絕對路徑，或先 `cd` 進去。不要在 `japan-travel` 主資料夾改任何檔案、不要切換它的分支。
- 一開始執行 `git pull --ff-only origin auto/wakkanai-writing`（遠端還沒有這個分支時略過）。拉不下來（有衝突或未提交的改動）就停止，寫執行紀錄說明原因。

## 每輪的步驟

### 0. 開始前

1. 讀 `AGENTS.md`（人工 session 的規則照用，但「每次最終回覆格式」改用本文件的結束回報）與本文件。
2. **用量**：有 `get_usage` 工具時先看用量。5 小時額度已用 70% 以上，或每週額度已用 80% 以上，就略過這一輪（寫執行紀錄「略過：額度」），不開始寫。
3. **執行鎖**：看 `.auto-writer.lock`（在工作資料夾根目錄，不進 Git）。存在而且裡面的時間不到 6 小時，代表上一輪還在跑，直接結束、不寫紀錄。否則寫入現在時間（ISO 格式）建立鎖，本輪結束時（不管成功失敗）刪掉。
4. **今天的額度**：讀 `content-automation/local-run-log.md`，台北今天已經「完成」的篇數達到 `article-queue.json` 的 `maxArticlesPerDay`（目前 5）就略過。

### 1. 挑文章

照 `content-automation/article-queue.json` 的 `travelGroups[0].writingOrder` 順序，挑第一篇符合下面條件的：

- `content-production/<articleId>/review.md` 不存在，或存在但最終結果不是 `ready_for_user_preview`；
- 執行紀錄的「停放」表裡沒有它。

全部寫完就略過這一輪，執行紀錄寫「略過：稚內群已全部寫完」。

下面的 `<id>` 是挑到的 articleId，`<資料夾>` 是 `content-production/<id>`，`<地點>` 是大綱裡這頁的 `placeId`。大綱是 `content-planning/hokkaido/hokkaido-wakkanai-outline.json`。

### 2. 寫作與潤稿

子代理一律用 Agent 工具、`model: "opus"`（Opus 5.5），**`run_in_background: false`**，等它完整回傳才做下一步。每一步都要親自確認檔案存在，不能只憑子代理的說法。寫作與潤稿不用 Fable。

1. **作者**（新子代理）。交代：
   - 用 `.agents/skills/japan-travel-answer-first/SKILL.md` 寫內容稿；寫作前讀完 `references/writing-guide.md`（特別是第14條「不要寫成量產頁」）、`references/examples.md`、`references/nanny-level.md`。研究已做完，跳過研究步驟。
   - H1、H2／H3 照大綱這一頁的 headings 一字不改、順序層級不變；mustAnswer 都要正面回答；大綱 `links` 裡 from 是這頁的 sentence 一字不改寫進正文；分工表歸別頁的事一兩句帶過並用內連句連過去。
   - 先從 `content-planning/hokkaido/places/<地點>/facts.json` 建 `<資料夾>/reference-review.md`：格式照 `content-production/wakkanai-transport/reference-review.md`（原始任務、事實表、推算、查到但不寫、待補內連），事實表收大綱這頁標題用到的事實，加上跟本頁主題直接相關的事實，編號不帶地點前綴。只能用地點事實表的事實。
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

### 5. 收尾

1. 更新 `content-automation/local-run-log.md`（見「執行紀錄」）。
2. `git add` 只限：`<資料夾>/`、`content-automation/local-run-log.md`、大綱檔（有同步標題時）。commit 訊息 `feat(content): <id> 本機寫作完成`（停放用 `<id> 停放`、略過用 `chore(automation): 本機寫作略過 <原因>`），結尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。`git push origin auto/wakkanai-writing`。
3. 刪掉 `.auto-writer.lock`。

## 失敗

- **停放**：事實查核 4 輪還沒全部 verified、讀者最終判 reject、大綱或分工和事實對不上、作者回報缺事實寫不出 mustAnswer。把資料夾留著（不刪），review.md 的最終結果寫 `parked` 與原因；執行紀錄「停放」表加一列；下一輪自動換下一篇。停放的文章等 Darren 或人工 session 處理。
- **來源打不開**（網站掛了，不是驗證碼）：那筆照查核規則記 unreachable；整篇不能放行時停放並寫原因。
- **工具或環境錯誤**（腳本跑不動、git 拉不下來）：停止這一輪，寫執行紀錄，不換下一篇。
- 不降低任何門檻、不跳過驗收、不改程式、Skill 或規則文件。

## 不做的事

- 不上傳 Sanity、不開放索引、不碰 D1 與規劃總表、不建 Hub。
- 不選圖、不下載圖片。
- 不改 `content-planning/` 的事實表、譯名表與規格（研究時發現的更正與新事實只記在文章的 `reference-review.md`，執行紀錄寫「待同步」）；大綱只同步標題文字。
- 不在瀏覽器點下載（會在 Darren 的電腦跳出存檔視窗）。
- 不讓電腦發出聲音（Darren 2026-10-23：影片自動播放的音樂會嚇到人）。不在瀏覽器打開 YouTube、Instagram、TikTok 或其他影片頁，影片資訊（標題、說明欄、章節、字幕）用 curl 或 WebFetch 讀。其他網頁要用瀏覽器開時，打開後第一個動作就執行 JavaScript `document.querySelectorAll('video,audio').forEach(m=>{m.muted=true;m.pause()})`，讀完立刻關掉分頁。派子代理會用到瀏覽器時，把這一條原文交代給它。
- 不合併到 `main`、不 force-push。

## 執行紀錄

`content-automation/local-run-log.md` 三段：

- **最新一輪**：整段覆寫。台北時間、文章 ID、結果（`完成`／`停放`／`略過`／`停止`）、停在哪一步與原因、事實查核輪數與 claim 數、讀者驗收必修條數、開始與結束的用量（有 get_usage 時）、commit 短碼、下一輪預期文章。
- **停放**：表格（文章 ID、日期、原因、要誰處理），解決後改狀態不刪列。
- **紀錄**：表格第一列插入本輪（日期時間、文章 ID、結果、事實查核輪數、5 小時額度用量變化、待同步的事實）。

## 結束回報

三行：這一輪做了哪篇（或略過與原因）、結果、下一輪預期哪篇。最後一行：執行紀錄是否已更新並推送、鎖是否已刪掉。
