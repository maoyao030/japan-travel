# 維護資料庫（Cloudflare D1）

放一直在變、數量會越來越多的維護狀態。2026-10-17 Darren 決定用 Cloudflare D1：私有、免費額度夠、不用新帳號，網站也架在 Cloudflare。Sanity 免費方案只能開公開資料庫，所以維護資料不放 Sanity。

| 放在哪 | 內容 |
|---|---|
| Git | 規則、規劃與大綱、全站地點清單、研究時的原文證據（地點事實表） |
| Sanity（公開） | 文章、主題中心、作者等網站內容；文章是否已發布、已開放索引 |
| D1（私有，本資料庫） | 執行鎖、每輪紀錄、文章的生產輪數與停放、事實查核狀態與到期日、事實被哪幾頁用到、重查紀錄、待補內連、跨群回補、例外 |
| Google Sheet「日本站規劃總表」 | 給 Darren 看的窗口，內容從 D1 與規劃檔整理過來 |

## 資料庫

- 名稱 `japan-travel-ops`，ID `b8f3156c-5129-42db-b48e-85e179bf926b`，位置亞太區（APAC），2026-10-17 建立在 Darren 的 Cloudflare 帳號。
- 設定檔 `d1/wrangler.jsonc`。網站 Worker 不綁這個資料庫，所以和根目錄的 `wrangler.jsonc` 分開。
- 資料表定義在 `d1/migrations/`，每次改結構都新增一個編號檔案，不改舊檔。

## 指令

Windows PowerShell 會擋 `npx`，地端改用 `npx.cmd`。

```bash
npx wrangler d1 migrations apply japan-travel-ops --remote -c d1/wrangler.jsonc
```

```bash
npx wrangler d1 execute japan-travel-ops --remote -c d1/wrangler.jsonc --command "SELECT * FROM runs ORDER BY started_at DESC LIMIT 5"
```

本機測試把 `--remote` 換成 `--local`，資料存在 `d1/.wrangler/`（不進 Git）。

## 雲端 routine 怎麼連

雲端每次全新下載，沒有登入狀態。2026-10-17 的設定：

- 雲端環境 `japan-travel-publisher`（claude.ai/code 的環境選單 → Cloud）。
- 權杖放在環境的 **Network secret**，不放環境變數：網站 `api.cloudflare.com`，路徑限定 `/client/v4/accounts/6e2acd041446ebca7f3ae7f512500f3d/d1/`，自動附上 `Authorization: Bearer <權杖>`。權杖存進去後誰都看不到，routine 也讀不到，只有連到這個路徑時才會被附上。環境變數的欄位畫面明寫不要放密碼，所以不用 `CLOUDFLARE_API_TOKEN`。
- 環境變數 `OPS_DB_TRANSPORT=http`（不是機密）：程式看到這個值就改用 D1 REST API、不帶權杖，交給 network secret 附上。
- 環境變數 `NODE_USE_ENV_PROXY=1`（不是機密）：network secret 只加在經過代理的請求上，Node 22 內建的 fetch 預設不走 `HTTPS_PROXY`，沒設這個值會直接連線、Cloudflare 回 401。程式在有代理但沒設這個值時會直接報錯。
- 2026-10-17 在雲端 session 實測：curl 回 HTTP 200；`status` → `free`，`acquire` → `acquired`，`release` → `released`，再 `status` → `free`，沒有留下資料。
- 權杖本身是 Cloudflare 的 `japan-travel-ops-routine`（只開 Account / D1 / Edit，範圍只有 Darren 的帳號，不設 IP 限制）。要換權杖時在 Cloudflare 按 Roll，再到環境 Network secret 那一列按 Replace：Name 填 `Authorization`、Prefix 填 `Bearer`（灰字只是提示，要自己打）、Value 貼權杖。注意：Claude 桌面 app 的內建瀏覽器複製不會進電腦剪貼簿，權杖要在自己的瀏覽器複製。

本機不需要設定，`wrangler login` 的登入狀態就夠。權杖不寫進 Git、文件或聊天。

## 程式

都透過 `scripts/ops-db.mjs` 連線：本機用 wrangler，雲端（`OPS_DB_TRANSPORT=http`）用 REST API；加 `--local` 改用本機資料庫。

| 指令 | 用途 |
|---|---|
| `node scripts/manage-auto-publisher-lock.mjs acquire --owner=<名稱>` | 搶執行鎖，成功回傳 token；有人持有時回 `busy`、結束碼 1 |
| `node scripts/manage-auto-publisher-lock.mjs release --token=<token>` | 放開自己的鎖 |
| `node scripts/manage-auto-publisher-lock.mjs status` | 看鎖目前是 `free`、`held` 或 `stale` |
| `node scripts/ops-run.mjs start --kind=produce --article=<文章>` | 記錄一輪開始，回傳 runId |
| `node scripts/ops-run.mjs finish --run=<runId> --result=<結果>` | 記錄一輪結束 |
| `node scripts/ops-sheet-sync.mjs collect --out=.tmp/sheet-sync.json` | 整理要加進規劃總表「例外與更新」分頁的列 |
| `node scripts/ops-sheet-sync.mjs mark --from=.tmp/sheet-sync.json` | 試算表寫入成功後，標記已同步 |
| `node scripts/ops-article.mjs start\|accepted\|published\|fail\|unpark\|list` | 文章生產狀態 |
| `node scripts/ops-group.mjs evaluate --group=<id> --auto-approve-on=<日期> --sheet-status=<狀態> --sheet-comment=<意見>` | 依規劃總表的回覆判斷旅行群是否核准 |
| `node scripts/routine-next-action.mjs --sanity=.tmp/queue-state.json` | 決定這一輪做哪一件事 |
| `node scripts/ops-links.mjs register\|ready\|linked\|skip` | 待補內連：登記、列出可補、標記已補、補不上時略過 |
| `node scripts/ops-facts.mjs sync\|due\|checked` | 地點事實表同步、到期清單（依來源網址分組）、重查紀錄 |

鎖的逾時時間讀 `content-automation/article-queue.json` 的 `lockStaleAfterHours`。

## 每週同步到規劃總表

試算表由 routine 用 Google Sheets 連接器寫入，程式本身不碰 Google 權杖：

1. `node scripts/ops-sheet-sync.mjs collect --out=.tmp/sheet-sync.json`。它會先檢查 routine 是不是太久沒跑（超過啟動間隔的兩倍沒有新紀錄，就新增一筆「routine 沒在跑」的例外），再列出還沒同步的例外，以及未來 30 天到期的事實（每個地點一列，同一個地點同一個月份只列一次）。
2. 把輸出的 `appendRows` 附加到 `spreadsheetId` 試算表 `sheetName` 分頁的最後一列之後（先讀 `例外與更新!A:F` 找到最後一列）。
3. 寫入成功並讀回確認後，執行 `node scripts/ops-sheet-sync.mjs mark --from=.tmp/sheet-sync.json`。寫入失敗就不要標記，下次會再列一次。

## 資料表

| 資料表 | 用途 |
|---|---|
| `run_lock` | 執行鎖。用「沒人持有或已逾時才能寫入」的一句 SQL 搶鎖，見 migration 檔開頭的說明；取代放在 `.git` 裡、雲端無效的舊鎖 |
| `runs` | 每一輪的種類、開始與結束時間、結果。最新一筆就是最後執行時間 |
| `article_status` | 文章的生產狀態、輪數、停放種類與原因、延後到何時、用哪一版規則寫 |
| `facts` | 每筆事實的變動類型、來源網址、上次查核、下次查核、來源頁內容指紋。編號格式 `<地點>:F12`，主張與原文摘錄在 Git |
| `fact_usage` | 哪幾頁用到哪筆事實 |
| `fact_checks` | 每次重查的結果 |
| `pending_links` | 待補內連：連結句已寫在正文，目標頁上線後只補連結 |
| `backfill_tasks` | 跨群回補：舊地點的欄位、舊頁結尾的相關連結 |
| `exceptions` | 要 Darren 知道或處理的事，每週同步到規劃總表 |
| `sheet_notices` | 已寫進規劃總表的通知（例如即將重查摘要），避免重複寫同一列 |
| `group_status` | 旅行群的核准狀態：等核准、已核准（Darren 或默許）、要改、暫停 |

`pending_links.skipped_at`、`skip_reason`：補不上而略過的連結，之後不再挑它。`article_status.publish_failures`：定稿、上稿、CI 失敗的次數，連續 3 次停放。

`article_status.first_deferred_at` 記第一次因來源打不開而延後的時間，連續延後超過 3 天就停放。

時間存 UTC 的 ISO 8601 字串，日期存 `YYYY-MM-DD`。

## 免費額度（2026-10-17 查 Cloudflare 文件）

每天讀 500 萬筆、寫 10 萬筆，總容量 5 GB。
