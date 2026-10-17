# Sanity Studio（文章後台）

Sanity 是存放文章、主題中心、作者與情境 Tag 的後台；網站建置時從這裡讀取內容。

## Sanity 專案

- 專案：日本旅遊長尾站，專案 ID `e8ctf7ee`（2026-10-17 建立，Darren 的 Sanity 帳號）。管理頁：<https://www.sanity.io/manage/project/e8ctf7ee>
- Dataset：`production`，公開（網站建置時不帶權杖直接讀取，與好材誌相同）。公開代表任何人都讀得到這個 dataset 的正式文件，不要把不該公開的資料放進來。
- 本機：在 `studio/.env` 寫入 `SANITY_STUDIO_PROJECT_ID=e8ctf7ee` 與 `SANITY_STUDIO_DATASET=production`（這個檔案不會進 Git），再 `cd studio && npm install && npm run dev` 開啟後台（http://localhost:3333 已加入 CORS）。
- 網站：根目錄的 `SANITY_PROJECT_ID`、`SANITY_DATASET` 等第一篇文章準備發布時再設定（本機 `.env` 與 Cloudflare 建置設定）。設定後結構化資料檢查會要求至少一篇文章，沒有文章時建置會失敗。
- 雲端 routine 的寫入權杖 `SANITY_AUTH_TOKEN` 由 Darren 在管理頁的 API → Tokens 建立（Editor 權限），只放進雲端環境的機密設定，不寫進 Git、文件或聊天。

## 文件類型

- `hub`：主題中心。`category` 只能選住宿、天氣與季節、美食、交通；父主題中心的 slug 必須先列在 `src/data/categories.ts` 的 `topics`。
- `article`：文章。新文章預設 `noindex=true`，驗收通過後才由腳本開放索引。
- `author`：作者。網址代稱 `editorial-team` 代表編輯部，文章會連到關於頁。
- `tag`：橫向情境 Tag。至少 5 篇文章、跨 2 個主題中心才會建頁。
- `contentTable`：文章內的表格。

## 腳本

`scripts/` 內的腳本都先 dry-run，再用同一份輸入加 `--apply`。本機用 `--with-user-token` 登入；雲端 routine 用 `SANITY_AUTH_TOKEN`。用途見各檔案開頭與 `package.json` 的 scripts。
