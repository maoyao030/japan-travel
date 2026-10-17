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

雲端每次全新下載，沒有登入狀態，要在雲端環境的機密設定放兩個值，由 Darren 在 Cloudflare 建立：

- `CLOUDFLARE_API_TOKEN`：只開 D1 編輯權限的 API 權杖（Cloudflare 控制台 → My Profile → API Tokens → 自訂權杖，權限選 Account / D1 / Edit）。
- `CLOUDFLARE_ACCOUNT_ID`：帳號 ID。

權杖不寫進 Git、文件或聊天。

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

時間存 UTC 的 ISO 8601 字串，日期存 `YYYY-MM-DD`。

## 免費額度（2026-10-17 查 Cloudflare 文件）

每天讀 500 萬筆、寫 10 萬筆，總容量 5 GB。
