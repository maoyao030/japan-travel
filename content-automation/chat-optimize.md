# 在 Claude Code 對話裡優化文章（2026-11-03）

Darren 在 Sanity 後台改文章時，常常需要 Claude 幫忙（查事實、找連結、順句子），後台做不到。改成：Darren 在 Claude Code 對話裡叫 Claude，Claude 挑一篇、把稿件（Markdown）一節一節拿出來，Darren 在對話裡改，Claude 寫進 Git 的稿件、查事實，最後上傳到網站。

後台照樣可以用；兩邊都會記進優化紀錄（`studioEditLog`、`content-automation/manual-edits-log.json`），成效報表一起算。

## 口令

- 「優化一篇」「今天優化哪篇」：照第 1 步挑今天輪到的那篇。
- 「優化 <文章>」「繼續優化 <文章>」：直接處理指定的文章。
- 「上傳」「這篇好了」：照第 5 步上傳。

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
