---
name: japan-travel-auto-publisher
description: Run one scheduled round of the Japan travel site routine — take the D1 run lock, read Sanity and D1 state, let routine-next-action pick exactly one job (resume a staged article, catch up a missed registration, backfill links, plan the next adjacent group, check a travel group's approval, produce one article through answer-first and acceptance, recheck expiring facts, or sync the weekly summary), do it with the project scripts, record the result in D1 and the run log, commit only allowed paths to main, and release the lock. Use only for the scheduled routine or when the user asks to run one routine round.
---

# 日本站自動化一輪

每次被觸發只做**一件事**。整體設計與流程圖見 `content-automation/routine-architecture.md`；本 Skill 是每一步的實際指令。文章怎麼寫、怎麼驗收是另一條流程，由 `$japan-travel-answer-first` 與 `$japan-travel-acceptance` 負責，本 Skill 只負責呼叫它們、依結果記錄狀態。

雲端是一次性的 session，結束回合整個環境就關閉：派子代理一律 `run_in_background: false`；任何一步失敗都要在同一回合完成「收尾」。

`AGENTS.md` 裡「每個任務開分支」「`.agents/working/` 工作檔」「固定回覆格式」三條是給人工 session 的，**routine 不適用**：routine 直接在 `main` 上提交允許的檔案，不寫工作檔，用本 Skill 的「結束回報」。

## 前置

1. 讀 `AGENTS.md`、`content-automation/routine-architecture.md`、`content-automation/auto-publisher-run-log.md`（只了解上一輪，不用它決定這一輪）。
2. 確認環境（只檢查有沒有，不印內容）：`OPS_DB_TRANSPORT=http`、`NODE_USE_ENV_PROXY=1`、`SANITY_AUTH_TOKEN`、`SANITY_PROJECT_ID`；`node -v` 至少 22.18；`python3 --version` 可以執行。
3. `mkdir -p .tmp/auto-publisher`；`npm ci`；到 `studio/` 執行 `npm ci`。Sanity 指令在 `studio/` 執行 `npx sanity exec scripts/<檔名>.mjs -- <參數>`，雲端不加 `--with-user-token`。
4. 前置任何一項沒過：還沒拿鎖、沒有 runId，所以**只**更新執行紀錄（結果「失敗」、原因「前置條件未完成：<哪一項>」）、commit、push，然後結束。不呼叫 `ops-run finish`，也不放鎖。

## 開始

1. 拿鎖：`node scripts/manage-auto-publisher-lock.mjs acquire --owner=routine`。回 `busy` 代表上一輪還沒結束：不記錄、不 commit，直接結束。回 `acquired` 時記下 token，**之後不論成功失敗都要放鎖**。
2. 檢查規劃與清單：`npm run queue:validate`、`npm run planning:check`。失敗就記開始（第 5 步，種類 `maintain`）後直接收尾，結果 `failed`。
3. 讀 Sanity 狀態：`studio/` 內 `npx sanity exec scripts/inspect-article-queue.mjs > ../.tmp/queue-state.json 2> ../.tmp/inspect.err`。
4. 決定這一輪做什麼：`node scripts/routine-next-action.mjs --sanity=.tmp/queue-state.json`。輸出的 `action` 決定下面要執行哪一段；`articleId`、`groupId`、`batchId`、`targetPath`、`routeMode`、`resumeFrom` 直接用輸出的值。
5. 記錄開始：`node scripts/ops-run.mjs start --kind=<種類> [--article=<articleId>]`，記下 runId。種類對照：`resume`、`catch-up`、`produce`、`backfill-links` 用 `produce`；`plan-next-group` 用 `plan`（同一天只規劃一次就是看這個種類）；`evaluate-group`、`recheck-facts`、`idle` 用 `maintain`；`weekly-summary` 用 `summary`。

## 依 action 執行

### evaluate-group：檢查旅行群是否核准

1. 用 Google Sheets 連接器讀規劃總表（試算表 ID 見選題 Skill 的 `references/next-group.md`）「群清單」分頁，找到這一群的列，取「狀態」與「你的意見」兩欄。
2. 判斷群的大綱有沒有例外（新頁型、要用 AI 圖、要改已上線頁面的分工），有就帶入 `--exception=<原因>`。
3. `node scripts/ops-group.mjs evaluate --group=<groupId> --auto-approve-on=<輸出的 autoApproveOn> --sheet-status=<狀態> --sheet-comment=<意見> [--exception=<原因>]`。
4. 依結果更新規劃總表那一列的狀態：`approved` 改「已核准」；例外改「等你處理」並在意見旁寫原因；其他維持。**本輪到此結束**，不在同一輪接著生產，結果 `done`。下一輪會依新狀態決定。

### plan-next-group：規劃下一群

照 `$japan-travel-topic-planner` 的 `references/next-group.md` 走完第 1～6 步：寫地點事實表、群大綱、頁面規格，跑 `npm run planning:check`；把新群寫進 `content-automation/article-queue.json` 的 `batches` 與 `travelGroups`（`approval.remindedAt` 是今天，`autoApproveOn` 依規則算），跑 `npm run queue:validate`；更新規劃總表「群清單」與「頁面清單」，在 Darren 的 Google 日曆加全天提醒。兩個檢查都通過才 commit，接著 `node scripts/ops-facts.mjs sync` 把新群的事實與缺口登記到 D1，結果 `done`；任一沒過就不 commit 這些檔案，結果 `failed`。同一天不會再試第二次。

### produce：生產一篇

1. `node scripts/ops-article.mjs start --article=<articleId> --group=<groupId> --path=<targetPath> --rules=$(git rev-parse --short HEAD)`。輸出 `refused`（結束碼 1）不算失敗：結果 `no-work`，收尾。
2. 在 `queue-state.json` 的 `parentHubs[]` 找 `batchId` 相同的那一列：狀態是 `missing` 就 `prepare-parent-hub.mjs <batchId>` dry-run 後 `--apply`；是 `blocked_*` 就 `ops-article.mjs fail --article=<id> --kind=other --reason=父 Hub 狀態異常` 並收尾。
3. 依 `$japan-travel-answer-first` 寫作：交給作者子代理清單列、頁面規格、群大綱（清單 `travelGroups[].outline`）裡這一頁的標題與分工、地點事實表。站內連結只能連到 `queue-state.json` 裡 `published_indexable` 的頁面；目標還沒上線的連結句照寫、不加連結。
4. 依 `$japan-travel-acceptance` 驗收（驗收者不能是作者）。
5. 結果不是 `ready_for_user_preview` 時，依原因記錄後收尾，不換下一篇：
   - 事實或條件錯誤：`ops-article.mjs fail --article=<id> --kind=facts --reason=<原因>`（第 2 次判退會自動停放）。
   - 缺事實、分工或大綱和實際資料對不上：`--kind=needs-outline`。
   - 來源網站打不開：`--kind=source-unreachable`（延後一天；從第一次延後算起超過 3 天就停放）。
   - 其他：`--kind=other`。
   判退的整個資料夾移到 `content-experiments/<article-id>-<YYYYMMDD>-rejected/`（`content-production/<article-id>/` 不留檔），commit 這個資料夾當證據。結果：重寫 `fixed`、停放 `parked`、延後 `deferred`。
6. 驗收通過：`node scripts/ops-article.mjs accepted --article=<id>`（之後任何一步失敗，下一輪都從「續做」接手，不重寫）。
7. 作者另存 `publication.json`（`seoTitle`、`seoDescription`、`excerpt`），執行 `npm run release:finalize -- content-production/<article-id>`。
8. 依 `$japan-travel-image-finder` 完成封面與文內圖（含 `npm run image:prepare:cover -- content-production/<article-id> --download`）。
9. 第 7、8 步任何一步失敗：`ops-article.mjs fail --article=<id> --kind=publish --reason=<原因>`，封包照樣 commit，結果 `failed`。
10. Sanity 暫存：先接內連，`node scripts/link-at-publish.mjs .tmp/auto-publisher/<article-id>/sanity/article.json --article=<id> --outline=<群大綱> --sanity=.tmp/queue-state.json`（大綱連結句的目標已經上線的，上線前就加上連結；可見文字不變，找不到句子的不擋，之後由補內連處理）。再 `publish-prepared-article.mjs ../.tmp/auto-publisher/<article-id>/sanity/article.json` dry-run 後 `--apply`；`publish-article-cover.mjs ../content-production/<article-id>` dry-run 後 `--apply`。重新 inspect 確認 `staged_noindex` 且 `hasCover`。
11. 開放索引：
    1. 專案根目錄 `npm run ci`。
    2. CI 通過後、`routeMode` 是 `hub-landing`（地點主頁）時，**緊接著**把這篇掛成父 Hub 的入口文章：`prepare-parent-hub.mjs <batchId> --set-landing` dry-run 取得 `currentRevision`，再 `--set-landing --expected-revision=<rev> --apply`（已經掛好會回 `landing-already-set`，不用 apply）。沒掛的話網址會不符清單，開放索引一定失敗；掛上後到開放索引之前，已上線的主題頁會暫時不被索引，所以中間不做別的事。
    3. `release-indexable-article.mjs ../content-production/<article-id>` dry-run 取得 revision，再 `--expected-revision=<rev> --apply`。
    4. 第 2 步掛上入口文章後，第 3 步失敗：先撤回，`prepare-parent-hub.mjs <batchId> --unset-landing` dry-run 取得 `currentRevision`，再 `--unset-landing --expected-revision=<rev> --apply`，讓主題頁恢復原狀；撤回也失敗就在執行紀錄寫明「父 Hub 入口文章未撤回」。
    5. 第 10、11 步失敗：`fail --kind=publish`（狀態不變，下一輪從「續做」接手；連續 3 次才停放），**不得開放索引**，結果 `failed`。
12. 開放索引後重新 inspect：`parentHubs[]` 裡這個 `batchId` 的 `shouldReleaseIndex` 是 true 時，`prepare-parent-hub.mjs <batchId> --release-index` dry-run 後帶 revision `--apply`。
13. 登記，**依這個順序**（前兩個重跑不會重複登記；最後才標已發布，中途斷掉下一輪會「補登記」）：`node scripts/ops-links.mjs register --article=<id> --outline=<群大綱> --sanity=.tmp/queue-state.json --body=.tmp/auto-publisher/<article-id>/sanity/article.json`（已經接好的直接標成已補；檔案不在就不帶 `--body`）；`node scripts/ops-facts.mjs sync`；`ops-article.mjs published --article=<id>`。結果 `published`。
14. 第 12、13 步失敗：`fail --kind=publish`，結果 `failed`。文章已經開放索引，下一輪會「補登記」；連續 3 次就停放並寫例外。

### resume：續做驗收已通過的文章

不重新寫稿。輸出的 `resumeFrom` 決定從哪裡接：

- `finalize`（驗收通過，但定稿、選圖或上稿失敗，Sanity 還沒有這篇）：`content-production/<article-id>/` 裡沒有 `reader-preview.md` 就 `ops-article.mjs fail --article=<id> --kind=other --reason=封包遺失`，結果 `failed`；有就從 produce 第 7 步做到第 14 步。
- `staged`（Sanity 已暫存 noindex）：**不重跑定稿與 `publish-prepared-article`**（正文已經在 Sanity）。
  - `content-production/<article-id>/manifest.json` 不存在（上一輪在提交前中斷）：不重寫，`ops-article.mjs fail --article=<id> --kind=other --reason=封包遺失`，結果 `failed`。
  - 沒有封面（`hasCover` 是 false）：做 produce 第 8 步，再執行 `publish-article-cover.mjs`（dry-run 後 `--apply`）。
  - 先 `ops-article.mjs accepted --article=<id>`（已是 accepted 也沒關係），接 produce 第 11～14 步（地點主頁的入口文章設定在第 11 步裡）。

### catch-up：補登記

文章已經在 Sanity 開放索引，但上一輪在登記前中斷。只做 produce 第 12～14 步，結果 `published`；失敗照第 14 步記 `fail --kind=publish`。

### backfill-links：補內連

1. `node scripts/ops-links.mjs ready --sanity=.tmp/queue-state.json`，列出的全部處理（不設上限，2026-10-25 取消一輪 5 個的限制），依 `link_id` 由小到大，全部補完再跑一次 CI。
2. 每個先 `apply-pending-link.mjs --source=<from_article_id> --target=<to_article_id> --target-path=<target_path> --anchor=<anchor_text> --sentence=<sentence>` dry-run：
   - 錯誤是「這個段落已經連到同一個網址」（上一輪補好了但沒標記）：`node scripts/ops-links.mjs linked --id=<link_id>`，不再 apply。
   - 其他錯誤（找不到連結句、錨文字不唯一等）：`node scripts/ops-links.mjs skip --id=<link_id> --reason=<錯誤訊息>`，不自己改字。
   - 沒有錯誤：加 `--apply`，記下輸出的 `recoveryFile`；apply 失敗就 `ops-links.mjs failed --id=<link_id> --reason=<錯誤訊息>`，換下一個。
3. 一個都沒補上（全部標記或略過）：不跑 CI，結果 `done`。有補上才跑 `npm run ci`。失敗：依補的**相反順序**逐一 `apply-pending-link.mjs --rollback=<recoveryFile>` 回復，再對每個回復的連結 `ops-links.mjs failed --id=<link_id> --reason=CI 失敗`（同一個連結失敗 3 次會自動略過並寫例外），結果 `failed`。通過：逐一 `node scripts/ops-links.mjs linked --id=<link_id>`，結果 `done`。

### recheck-facts：事實重查

`node scripts/ops-facts.mjs due` 依來源網址分組，一輪最多 10 個網址。每個網址實際打開一次，逐筆核對摘錄與條件，用 `ops-facts.mjs checked --fact=<fact_id> --result=<unchanged|changed|unreachable|removed> --next=<依變動類型的下次查核日>` 記錄（打不開的 `--next` 填明天）。資料改變記 `changed`（會自動寫例外），不自己改文章或事實表。結果 `done`。

### weekly-summary：每週摘要

`node scripts/ops-sheet-sync.mjs collect --out=.tmp/sheet-sync.json`。`appendRows` 是空的就不用連接器；不是空的，用 Google Sheets 連接器附加到「例外與更新」分頁最後一列之後，讀回確認後 `node scripts/ops-sheet-sync.mjs mark --from=.tmp/sheet-sync.json`。**不論有沒有新列，結果都記 `done`**（否則下一輪會重挑每週摘要）。

### idle

不做事。結果 `no-work`，原因用輸出的 `notes`。idle 不更新執行紀錄、不 commit（D1 的每輪紀錄已經足夠當心跳）。

## 收尾（每一輪都要做，idle 只做 3、4）

1. 更新 `content-automation/auto-publisher-run-log.md`（依檔案內的更新規則；結果欄的中文詞與 D1 結果對照：`published` 已開放索引、`fixed` 判退、`parked` 停放、`deferred` 延後、`failed` 失敗、`no-work` 略過、`done` 依 action 寫已補內連／已規劃／已重查／已同步／已檢查核准）。
2. Git：只 add 這些路徑：本輪的 `content-production/<article-id>/`、判退時的 `content-experiments/<article-id>-<YYYYMMDD>-rejected/`、`content-automation/auto-publisher-run-log.md`，以及 plan-next-group 通過檢查時的 `content-planning/` 與 `content-automation/article-queue.json`。不得 add `.tmp/` 或任何憑證。commit 訊息 `feat(content): <article-id> <結果>` 或 `chore(automation): <action> <結果>`。然後 `git pull --rebase origin main`；**有衝突就 `git rebase --abort`、不 push，結果改記 `failed`**；沒衝突就 `git push origin main`。
3. `node scripts/ops-run.mjs finish --run=<runId> --result=<結果> --note=<一句話>`。
4. `node scripts/manage-auto-publisher-lock.mjs release --token=<token>`。

## 嚴格限制

- 每輪最多新寫一篇；不為篇數補題、不改題、不改網址或 Hub、不改分工。
- 除了 plan-next-group，不改程式、清單、Skill 或規則文件。
- 任一門檻失敗依上面的規則記錄，不降低門檻、不關閉 noindex。
- 不印出、不 commit 任何權杖。

## 結束回報

三行：這一輪做了什麼（action 與文章或群）、結果、下一輪預期會做什麼。再加一行：執行紀錄是否已更新並推送、鎖是否已放開。
