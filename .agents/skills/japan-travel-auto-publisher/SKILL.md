---
name: japan-travel-auto-publisher
description: Run one scheduled round of the Japan travel site routine — take the D1 run lock, read Sanity and D1 state, let routine-next-action pick exactly one job (resume a staged article, backfill links, check a travel group's approval, produce one article through answer-first and acceptance, plan the next adjacent group, recheck expiring facts, or sync the weekly summary), do it with the project scripts, record the result in D1 and the run log, commit only allowed paths, and release the lock. Use only for the scheduled routine or when the user asks to run one routine round.
---

# 日本站自動化一輪

每次被觸發只做**一件事**。整體設計見 `content-automation/routine-architecture.md`；本 Skill 是每一步的實際指令。文章怎麼寫、怎麼驗收是另一條流程，由 `$japan-travel-answer-first` 與 `$japan-travel-acceptance` 負責，本 Skill 只負責呼叫它們、依結果記錄狀態。

雲端是一次性的 session，結束回合整個環境就關閉：派子代理一律 `run_in_background: false`；任何一步失敗都要在同一回合完成「收尾」（記錄結果、commit、放鎖）。

## 前置

1. 讀 `AGENTS.md`、`PROJECT_STATUS.md` 最後兩段、`content-automation/routine-architecture.md`、`content-automation/auto-publisher-run-log.md`（只了解上一輪，不用它決定這一輪）。
2. 確認環境：`OPS_DB_TRANSPORT=http`、`NODE_USE_ENV_PROXY=1`、`SANITY_AUTH_TOKEN` 有設定（只檢查有沒有，不印內容）。缺任何一個就記錄「前置條件未完成」並收尾。
3. `npm ci`，再到 `studio/` 執行 `npm ci`。Sanity 指令在 `studio/` 執行 `npx sanity exec scripts/<檔名>.mjs -- <參數>`，雲端不加 `--with-user-token`。

## 開始

1. 拿鎖：`node scripts/manage-auto-publisher-lock.mjs acquire --owner=routine`。回 `busy` 代表上一輪還沒結束：不記錄、不 commit，直接結束。回 `acquired` 時記下 token，**之後不論成功失敗都要放鎖**。
2. 檢查規劃與清單：`npm run queue:validate`、`npm run planning:check`。失敗就停止（結果 `failed`），不自己改。
3. 讀 Sanity 狀態：`studio/` 內 `npx sanity exec scripts/inspect-article-queue.mjs > ../.tmp/queue-state.json`。
4. 決定這一輪做什麼：`node scripts/routine-next-action.mjs --sanity=.tmp/queue-state.json`。
5. 記錄開始：`node scripts/ops-run.mjs start --kind=<種類>`，記下 runId。種類對照：`resume`、`produce`、`backfill-links` 用 `produce`；`evaluate-group`、`plan-next-group` 用 `plan`；`recheck-facts` 用 `maintain`；`weekly-summary` 用 `summary`；`idle` 用 `maintain`。

## 依 action 執行

### evaluate-group：檢查旅行群是否核准

1. 用 Google Sheets 連接器讀規劃總表（試算表 ID 見選題 Skill 的 `references/next-group.md`）「群清單」分頁，找到這一群的列，取「狀態」與「你的意見」兩欄。
2. 判斷群的大綱有沒有例外（新頁型、要用 AI 圖、要改已上線頁面的分工），有就把原因帶入 `--exception`。
3. `node scripts/ops-group.mjs evaluate --group=<id> --auto-approve-on=<清單 travelGroups 的 autoApproveOn> --sheet-status=<狀態> --sheet-comment=<意見> [--exception=<原因>]`。
4. 結果是 `approved`：把規劃總表那一列的狀態改成「已核准」，重新執行「開始」第 4 步，照新的 action 繼續（同一輪仍只生產最多一篇）。其他結果：狀態改成「等你處理」（例外）或維持，結果記 `no-work`。

### produce：生產一篇

1. `node scripts/ops-article.mjs start --article=<id> --group=<groupId> --path=<targetPath> --rules=<git rev-parse --short HEAD>`。回 `refused` 就收尾（結果 `no-work`）。
2. 這篇所屬批次的父 Hub 若在 Sanity 還沒建立（`queue-state.json` 的 `nextProductionUnit.parentHubAction` 是 `prepare-parent-hub`），`prepare-parent-hub.mjs <batchId>` dry-run 後 `--apply`。
3. 依 `$japan-travel-answer-first` 寫作：交給作者子代理清單列、頁面規格、群大綱（`travelGroups[].outline`）裡這一頁的標題與分工、地點事實表。站內連結只能連到 `queue-state.json` 裡 `published_indexable` 的頁面；目標還沒上線的連結句照寫、不加連結。
4. 依 `$japan-travel-acceptance` 驗收（驗收者不能是作者）。
5. 結果不是 `ready_for_user_preview` 時，依原因記錄後收尾，不換下一篇：
   - 事實或條件錯誤：`ops-article.mjs fail --kind=facts`（第 2 次判退會自動停放）。
   - 缺事實、分工或大綱和實際資料對不上：`--kind=needs-outline`。
   - 來源網站打不開：`--kind=source-unreachable`（延後一天，連續 3 天停放）。
   - 其他：`--kind=other`。
   判退的封包移到 `content-experiments/<article-id>-<YYYYMMDD>-rejected/` 保留證據。
6. 通過後，作者另存 `publication.json`（`seoTitle`、`seoDescription`、`excerpt`），執行 `npm run release:finalize -- content-production/<article-id>`。失敗記 `--kind=other` 並收尾。
7. 依 `$japan-travel-image-finder` 完成封面與文內圖。封面 `blocked` 記 `--kind=other` 並收尾。
8. `node scripts/ops-article.mjs accepted --article=<id>`。
9. Sanity 暫存：`publish-prepared-article.mjs ../.tmp/auto-publisher/<article-id>/sanity/article.json` dry-run 後 `--apply`；`publish-article-cover.mjs ../content-production/<article-id>` dry-run 後 `--apply`；重新 inspect 確認 `staged_noindex` 且 `hasCover`。
10. 專案根目錄 `npm run ci`；通過後 `release-indexable-article.mjs ../content-production/<article-id>` dry-run 取得 revision，再 `--expected-revision=<rev> --apply`。CI 失敗不得開放索引，記 `--kind=other`（文章維持 noindex，下一輪會從「續做」接手）。
11. 開放索引後：父 Hub 若 `shouldReleaseIndex`，`prepare-parent-hub.mjs <batchId> --release-index` dry-run 後帶 revision `--apply`。
12. 登記：`ops-article.mjs published --article=<id>`；重新 inspect 後 `node scripts/ops-links.mjs register --article=<id> --outline=<群大綱> --sanity=.tmp/queue-state.json`；`node scripts/ops-facts.mjs sync`。

### resume：續做已暫存的文章

不重新寫稿。確認 `content-production/<article-id>/manifest.json` 存在，從還沒完成的步驟接手：沒有封面就從 produce 第 7 步，有封面就從第 10 步。

### backfill-links：補內連

1. `node scripts/ops-links.mjs ready --sanity=.tmp/queue-state.json`，一輪最多處理 5 個。
2. 每個先 `apply-pending-link.mjs --source=<from> --target=<to> --target-path=<網址> --anchor=<錨文字> --sentence=<連結句>` dry-run，再加 `--apply`；找不到連結句或錨文字不唯一就跳過那一個（記進例外），不自己改字。
3. 全部寫完後 `npm run ci`。失敗就用每個輸出的 recovery file 執行 `--rollback=<file>` 回復，停止並記錄。通過後逐一 `node scripts/ops-links.mjs linked --id=<link_id>`。

### plan-next-group：規劃下一群

照 `$japan-travel-topic-planner` 的 `references/next-group.md` 走完第 1～6 步：寫地點事實表、群大綱、頁面規格，跑 `npm run planning:check`；把新群寫進 `article-queue.json` 的 `batches` 與 `travelGroups`（`approval.remindedAt` 是今天，`autoApproveOn` 依規則算），跑 `npm run queue:validate`；更新規劃總表「群清單」與「頁面清單」，在 Darren 的 Google 日曆加全天提醒。這一步允許 commit `content-planning/` 與 `article-queue.json`，但兩個檢查都要通過。

### recheck-facts：事實重查

`node scripts/ops-facts.mjs due` 依來源網址分組，一輪最多 10 個網址。每個網址實際打開一次，逐筆核對摘錄與條件，用 `ops-facts.mjs checked --fact=<id> --result=<結果> --next=<依變動類型的下次查核日>` 記錄。資料改變記 `changed`（會自動寫例外），不自己改文章或事實表。

### weekly-summary：每週摘要

`node scripts/ops-sheet-sync.mjs collect --out=.tmp/sheet-sync.json`；用 Google Sheets 連接器把 `appendRows` 附加到「例外與更新」分頁最後；讀回確認後 `node scripts/ops-sheet-sync.mjs mark --from=.tmp/sheet-sync.json`。

### idle

不做事，結果記 `no-work`，原因寫 `notes`。

## 收尾（每一輪都要做）

1. 更新 `content-automation/auto-publisher-run-log.md`（依檔案內的更新規則）。
2. Git：只 add 本輪產生的 `content-production/<article-id>/`、判退時的 `content-experiments/...`、執行紀錄，以及 plan-next-group 允許的規劃檔。commit 訊息 `feat(content): <article-id> <結果>` 或 `chore(automation): <action> <結果>`，`git pull --rebase origin main` 後 `git push origin main`。不得 commit `.tmp/` 或任何憑證。
3. `node scripts/ops-run.mjs finish --run=<runId> --result=<結果> --note=<一句話>`。結果用 `published`、`accepted`、`fixed`、`parked`、`deferred`、`failed`、`no-work`、`done`。
4. `node scripts/manage-auto-publisher-lock.mjs release --token=<token>`。

## 嚴格限制

- 每輪最多新寫一篇；不為篇數補題、不改題、不改網址或 Hub、不改分工。
- 除了 plan-next-group，不改程式、清單、Skill 或規則文件。
- 任一門檻失敗依上面的規則停放或延後，不降低門檻、不關閉 noindex。
- 不印出、不 commit 任何權杖。

## 結束回報

三行：這一輪做了什麼（action 與文章或群）、結果、下一輪預期會做什麼。再加一行：執行紀錄是否已更新並推送、鎖是否已放開。
