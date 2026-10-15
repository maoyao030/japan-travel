# Sanity Studio（文章後台）

Sanity 是存放文章、主題中心、作者與情境 Tag 的後台；網站建置時從這裡讀取內容。

## 尚未建立 Sanity 專案

目前只有 schema（`schemaTypes/`）與腳本，還沒有實際的 Sanity 專案。Darren 建立專案後：

1. 在 `studio/.env` 寫入 `SANITY_STUDIO_PROJECT_ID=<專案 ID>` 與 `SANITY_STUDIO_DATASET=production`（這個檔案不會進 Git）。
2. 在專案根目錄的環境變數（本機 `.env`、Cloudflare 建置設定）寫入同一個 `SANITY_PROJECT_ID` 與 `SANITY_DATASET`，網站才會抓到內容。
3. `cd studio && npm install && npm run dev` 可在本機開啟後台。

## 文件類型

- `hub`：主題中心。`category` 只能選住宿、天氣與季節、美食、交通；父主題中心的 slug 必須先列在 `src/data/categories.ts` 的 `topics`。
- `article`：文章。新文章預設 `noindex=true`，驗收通過後才由腳本開放索引。
- `author`：作者。網址代稱 `editorial-team` 代表編輯部，文章會連到關於頁。
- `tag`：橫向情境 Tag。至少 5 篇文章、跨 2 個主題中心才會建頁。
- `contentTable`：文章內的表格。

## 腳本

`scripts/` 內的腳本都先 dry-run，再用同一份輸入加 `--apply`。本機用 `--with-user-token` 登入；雲端 routine 用 `SANITY_AUTH_TOKEN`。用途見各檔案開頭與 `package.json` 的 scripts。
