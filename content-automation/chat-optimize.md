# 在 Claude Code 對話裡優化文章（2026-11-03）

Darren 在 Sanity 後台改文章時，常常需要 Claude 幫忙（查事實、找連結、順句子），後台做不到。改成：Darren 在 Claude Code 對話裡叫 Claude，Claude 挑一篇、把稿件（Markdown）一節一節拿出來，Darren 在對話裡改，Claude 寫進 Git 的稿件、查事實，最後上傳到網站。

後台照樣可以用；兩邊都會記進優化紀錄（`studioEditLog`、`content-automation/manual-edits-log.json`），成效報表一起算。

## 口令

- 「優化一篇」「今天優化哪篇」：照第 1 步挑今天輪到的那篇。
- 「優化 <文章>」「繼續優化 <文章>」：直接處理指定的文章。
- 「上傳」「這篇好了」：照第 5 步上傳。
- 「口述優化 <文章>」：Darren 邊看網站邊用語音輸入，照下面「口述優化」一節做。

## 1. 挑文章、把後台的修改先搬進 Git

1. 沒指定文章時跑 `npm run optimize:today`，用它挑的那篇（和每日推播、後台「今天優化哪篇」同一篇）。
2. 在 `studio/` 查這篇在後台有沒有修改：
   - 有沒按「發布」的草稿：`npm run pull:studio-edits -- --article=<文章> --draft` 看 `changes.md`，再加 `--apply` 把草稿寫進 `reader-preview.md`。草稿先留在後台，上傳時才清掉（第 5 步）。
   - 有已發布、還沒同步的修改：`npm run pull:studio-edits -- --article=<文章>`，看過後加 `--apply`。
3. 告訴 Darren 後台改過哪幾處，接著從他停下來的那一節開始。

## 2. 一節一節給 Darren 看

- 貼出 `content-production/<文章>/reader-preview.md` 那一節的原文（H2 到下一個 H2），表格照原樣。
- 附上這節裡逗號最多、句子最長的段落，當作建議先改的地方。
- 一次一節，不要整篇丟出來。

## 3. Darren 改，Claude 寫進稿件

- Darren 可以直接貼改好的段落，或說「這句幫我改」「這裡幫我查」「這裡加連結」。
- **Darren 的文字為準**。Claude 只把明顯的錯字、漏字列出來，Darren 同意才改；Darren 要求改寫時給一到兩種寫法讓他挑。
- 寫進 `reader-preview.md` 後，把改好的那段貼回對話給 Darren 確認。
- 在自己電腦上的 session，Darren 也可以直接用編輯器打開 `reader-preview.md` 改，改完說一聲，Claude 再接著查。

## 4. Claude 幫忙的事

- **查事實**：先找這篇的 `fact-check.json`、`reference-review.md` 與地點事實表；沒有再查官方來源（照 `AGENTS.md` 的來源分級）。回答附來源。新查到、寫進正文的事實補進 `reference-review.md` 留證據。
- **檢查 Darren 改過的句子**：改到數字、時間、車資、營業日的句子，對照事實表；和事實不一致時告訴 Darren，附來源。
- **站內連結**：目標頁要已上線。連結句寫讀者什麼時候需要、那頁有什麼。上傳時，原本就有的連結會照連結文字搬過去；新加的連結上傳後用 `studio/scripts/apply-pending-link.mjs` 補。
- **規則提醒**：上傳前跑 `node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs content-production/<文章>/reader-preview.md`。沒過的項目列給 Darren 看，由他決定改不改；括號外的日文、日文漢字詞、標題用冒號這幾項建議一定要改。

## 5. 上傳

1. 在 `studio/` 先預覽：
   `npx sanity exec scripts/replace-article-body.mjs --with-user-token -- --article=<文章> --manual`
   （後台有草稿時加 `--discard-draft`）。確認 `notCarried` 是空的、`fields` 只有 Darren 要改的標題與摘要。
2. Darren 說好，再加 `--apply`。這一步會：
   - 換正文（照片、嵌入、站內連結搬到新正文），H1 改了就一起換文章標題，SEO 標題、描述與摘要照 `publication.json`；
   - 後台 `studioEditLog` 加一筆（來源記「在 Claude Code 對話裡改」），Git 的 `manual-edits-log.json` 加一筆；
   - 後台的草稿和抓進 Git 的版本一樣才清掉；草稿之後又改過就停下來，要重新抓回。
3. commit 稿件與紀錄，照 `AGENTS.md` 的 Git 規則推到 `main`（先合併 `origin/main`、跑測試），網站重建後才看得到。
4. 值得學的改法記進寫作 Skill 的 `examples.md`（修改前後對照）。

## 進度

每篇的對話優化狀態在 `content-production/<文章>/chat-optimize.json`：草稿版本（`draftRev`）、最後上傳時間（`lastPublishedAt`）。下次說「繼續優化 <文章>」時先看這份與 `git log`。

## 口述優化（Darren 2026-11-06）

Darren 不想動滑鼠：在手機或電腦上看網站，用語音輸入（手機鍵盤的麥克風、Windows `Win + H`、Mac 按兩下 `Fn`）說要改哪裡。Claude 不叫他讀 Markdown 稿，也不要他找行數。流程照上面第 1、5 步，中間換成這樣：

### 先判斷他說的是哪一種

| 他說的 | 例子 | Claude 做什麼 |
|---|---|---|
| 給讀者看的句子 | 「冰雪莊只收現金，記得先去領錢」 | **輕潤**（見下） |
| 要 Claude 查 | 「這裡補一下冬天的營業時間」「幫我查巴士多久一班」 | **查資料補上**（見下） |
| 要補圖 | 「冰雪莊那段補一張外觀照片」 | **找候選圖**（見下） |
| 改結構 | 「這段太長拆開」「這節移到前面」 | 照做，只動結構不動字 |

分不出來時，句子像要給讀者看的就當輕潤，像在下指令的就當要查。一次說了好幾件事，逐件做，回報時照他說的順序列。

### 找位置

他用自己的話指位置（「第二節」「講早餐那段」「冰雪莊那裡」），Claude 在 `reader-preview.md` 找到那段，回報時先引那段開頭十來個字，讓他確認是同一段。找到兩處以上就列出來問。

### 輕潤：他說的話

語音輸入的字以 Darren 為準，只做這幾件事：

- 同音錯字照 `content-planning/glossary.json` 與上下文改回來（「至內」→稚內、「利息島」→利尻島）。
- 補標點、拆掉一路接下去的長句；刪口頭禪（「嗯」「然後」「就是」「那個」）。
- 日文漢字詞換台灣說法、名字照譯名表（寫作指南第15條），跑 `check-voice.mjs` 擋得到的照改。
- 數字、時間、價格對照事實表；不一致**不改他的字**，告訴他並附來源，他決定。

不加他沒說的資訊、不換他的口氣、不重排他的順序。回報時給「你說的 → 潤過的」兩行對照，改了哪幾個字一眼看得出來。

### 查資料補上：他要 Claude 找的

- 照 `AGENTS.md` 的來源分級：交通與規則只用經營者官方，店家與旅館用官網與官方社群，先找這篇的 `fact-check.json`、`reference-review.md` 與地點事實表，沒有再上網查。
- 用 Darren 的語氣寫（寫作指南第17條），長度跟周圍段落差不多；查不到的不寫，告訴他查不到、在哪裡查過。
- 新事實與原文摘錄記進 `reference-review.md`，正文的「資料來源」補上網址。
- 回報時給補上的句子與來源連結，標明「這是我查的，不是你說的」。

### 找候選圖

- 照選圖 Skill 的來源順序：觀光協會與自治體等條款允許轉載的官方照片 → 免費圖庫 → 維基共享資源；只用實拍，授權照 `references/selection-and-licensing.md`。
- 找 2～3 張，把縮圖用檔案傳給他看，附來源與授權；他說「第二張」就用那張。都不好就說找不到，不硬放。
- 照 `AGENTS.md`「自動寫作加回文內照片」的限制：一篇最多 4 張、一節最多 1 張，接在那一節第一段之後。用 `npm run image:prepare:inline` 準備、`studio` 的 `npm run publish:article-inline-images` 預覽與 `--apply`。圖片封包照 `references/image-packet.md`。

### 給他看

- **預覽視窗**：開始時跑 `npm run preview:article -- --article=<文章>`（預設 port 4400），再用 `report_preview_port` 回報這個 port，Darren 的 app 就能在旁邊的預覽視窗看到文章照網站樣式畫出來的樣子（線上的照片、嵌入、連結都在）。上方切換手機／電腦寬度；稿件一改兩秒內自動更新、停在原位置。
- 候選照片寫進 `.tmp/preview/<文章>/candidates.json`（`[{near, label, url, alt, credit}]`，`near` 是那一段裡的一段字），預覽會把它畫在那段後面、用橘框標「候選 1」「候選 2」，他看著說「第二張」就好。選定後照上面「找候選圖」的步驟準備與上傳，候選檔清空。
- 每改完一件就回報，不要整篇貼。改字給那一段的新版本（短的整段貼、長的只貼改到的句子）。
- 他說「好」「可以」才算定案；說「不對」就照他的話再改，不爭論。
- 全部說完、他說「上傳」，照第 5 步上傳（字與圖分開：先換正文，再插圖）。上傳後用手機尺寸截圖他改過的那幾段給他看。

### 記下來

他口述改過的句子是範例來源：上傳後照第 5 步第 4 點，值得學的寫進寫作 Skill 的 `examples.md`。

