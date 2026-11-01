# 已上線文章重寫一輪（2026-11-01）

Darren 2026-11-01 要求把網站上還沒重寫的 42 篇全部照新流程（讀競品、先刪再調）重寫一輪，自動寫作照常跑。這份是每個子代理的工作說明；人工 session 協調，三篇試跑（旭山動物園、層雲峽住宿、稚內美食）的做法見各自的 `review.md`。

步驟沿用 `content-automation/local-writer.md` 第 2、3 步，差別寫在下面。共通規定：

- `<資料夾>` 是 `content-production/<id>`，`<大綱>` 是 `content-planning/hokkaido/hokkaido-wakkanai-outline.json` 或 `hokkaido-asahikawa-outline.json`（協調者會告訴你）。
- 現在網站上的版本就是 `<資料夾>/draft-tagged.md`、`reader-preview.md`（`pre-rewrite/` 是備份，不改）。
- `<資料夾>/rewrite-carry.json`：線上正文的照片、嵌入在哪個標題底下，以及站內連結的錨文字與所在句子。
- 只改 `<資料夾>` 裡的檔案（研究者另外可以改 `reference-review.md`），不 commit，不碰 Sanity、D1、規劃總表。Windows 的 heredoc 會吃反斜線，寫檔用 Write 工具。
- 回報給協調者只寫 5 行內：結果、檔案、檢查有沒有通過、要協調者決定的事。

## 研究者（重查與讀競品）

1. 讀大綱這一頁（mustAnswer、`links`、分工表）、`<資料夾>/reader-preview.md`、`reference-review.md`。研究記錄已經有了，不重建。
2. **重查會變的資料**：正文用到的營業期間、休業、時刻、班次、價格、費用、預約方式，逐筆重開經營者或店家官網核對（試跑三篇有 11 筆營業時間、車資已經過期）。照 `local-writer.md` 第 2 步第 0 點「什麼算夠」與來源分級。不一致的照官網更正事實表那一列，在採用決定欄寫「重寫前重查 2026-11-xx：原本…」；新事實接著 F 編號加。最後加「## 重寫前重查（日期）」一節：查了幾筆、改了哪幾筆、打不開的來源。
3. **讀競品**：照 `.agents/skills/japan-travel-answer-first/references/competitor-reading.md` 寫 `<資料夾>/competitor-notes.md`。
4. 讀者會卡住、但事實表沒有的（競品有、我們缺），回官方來源查，查到才加進事實表。
5. 約 40 分鐘內做完。網頁讀取工具讀不到才用瀏覽器（開自己的新分頁、先靜音、不點下載、不開影片頁、遇到驗證碼不繞過、讀完關掉）。

## 作者（重寫）

照 `local-writer.md` 第 2 步第 1 點的作者交代，差別：

- 從現在的 `draft-tagged.md` 改寫，讀 `competitor-notes.md` 重排每一節的資訊順序，寫 `order-notes.md`。事實只用 `reference-review.md`（含重查後更正的列）。
- **H1、H2、H3 照現在的 `draft-tagged.md` 一字不改、順序層級不變**（網站上的版本已經過標題檢查；照片和嵌入靠標題對位置）。
- `rewrite-carry.json` 的每個站內連結：錨文字在新稿要剛好出現一次；能保留原句就保留，要改句子時錨文字不動。
- **連結句**：大綱 `links` 裡 from 是這頁的句子，寫成「…，見○○」或「○○見△△」的，照 `writing-guide.md` 第10條改寫成完整的一句（先講讀者什麼情況需要點過去，再說那頁整理了什麼；同一篇不套同一個句型），錨文字（目標頁的名稱）一字不改、全文只出現一次。不是這種句型的照原句。改了哪幾句寫進 `<資料夾>/link-sentences.json`：`[{"to":"<目標 id>","old":"<大綱原句>","new":"<新句>","anchor":"<錨文字>"}]`，沒改就寫 `[]`。協調者在潤稿前把新句同步進大綱。列在 `link-sentences.json` 的連結，換正文工具會先找新句，錨文字不用為了它全文唯一；資料來源的網頁標題不要為此改寫。
- 住宿頁不寫價格（2026-10-26）：線上稿留下的房價、每人費用、露營場費用一律刪掉；住宿稅的稅額可以留。
- `media` 列的每個標題底下，至少要留下和 `afterBlocks` 一樣多的一般段落或表格，照片才放得回原位。
- `publication.json` 的 `title`、`seoTitle` 不改；`seoDescription`、`excerpt` 跟著新稿改。
- 跑三項檢查到通過（`fact_tags.py`、`check-voice.mjs`、`audit_answer_first.py --reference-review`）。

## 潤稿者

連結句（`link-sentences.json` 列的新句與大綱裡其他 from 是這頁的句子）一字不改。照 `local-writer.md` 第 2 步第 2 點（`.agents/skills/japan-travel-polish/SKILL.md` 第 1～3 步，先刪再調）。`before-*` 檔照常覆寫（重寫前的版本在 `pre-rewrite/`）。刪事實時，`rewrite-carry.json` 的錨文字與 `media` 標題底下的段落數不能因此少掉。四項檢查通過。之後協調者會把意義比對結果轉給你，只改「不可接受」與「遺失」。

## 意義比對

照 `local-writer.md` 第 2 步第 3 點。

## 事實查核

照 `local-writer.md` 第 3 步第 2 點；`articleSha256` 由協調者給。

## 讀者驗收

照 `local-writer.md` 第 3 步第 3、4、7 點。標題沿用網站上的版本，不另做標題檢查；第二階段可以讀 `heading-review.json`（舊的）。

## 修稿者（作者）

照 `local-writer.md` 第 3 步第 5 點，標題不改（不跑 `heading_review.py`）；錨文字與 `media` 段落數的規定照上面作者一節。

## 協調者收尾

1. 事實查核全部 verified、讀者最終可接受後，寫 `review.md`（格式照 `content-production/sounkyo-stay/review.md`），跑 `node scripts/local-article-gates.mjs <id>` 到 `gates_clear`。
2. 在 `studio/` 跑 `npx sanity exec scripts/replace-article-body.mjs --with-user-token -- --article=<id> --before-publication=../content-production/<id>/pre-rewrite/publication.json`（dry-run），`notCarried` 是空的才加 `--apply`。
3. 研究者重查時打不開官網、或判定資料不夠的篇，網站上的版本不動，記進 `PROJECT_STATUS.md`。
4. 每換完一批照 Git 規則推 `main`。
