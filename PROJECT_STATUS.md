# 專案狀態

## 2026-10-15 Claude Code：repo 建立與交接

- Darren 於 2026-10-15 決定開第二個站（日本旅遊長尾），在新 repo、新 session 進行。本 repo 由 Darren 建立，起始檔案由好材誌 session 推入：`README.md`、`AGENTS.md`、`.gitignore`、`content-planning/handoff-2026-10-15.md`（與好材誌 repo 內同名檔案相同）、本檔與宣告檔。
- 尚未有網站程式、Sanity 專案、Cloudflare 專案、網域與 routine。
- 唯一下一步：依交接文件第五節，把好材誌的通用程式（Astro 站骨架、Sanity schema、`scripts/article-automation-policy.mjs`、測試、CI 檢查）抽成本 repo 的模板，去掉建材專用內容；完成後再連 Ahrefs 規劃 30 頁試點給 Darren 核准。

## 2026-10-15 Claude Code：網站模板建立（分支 `feat/site-template`）

### 已完成

- 用 `add_repo` 唯讀掛上好材誌，把通用程式抽成本 repo 的模板，沒有改好材誌任何檔案。
- Astro 網站骨架：版面、首頁、分類頁、主題頁、文章頁、情境 Tag 頁、關於、聯絡、隱私、404，以及由 Sanity 作者文件動態產生的作者頁。所有公開文案改成日本旅遊版本，沒有好材誌、建材、書隅的殘留字串（有測試擋）。
- 分類樹 `src/data/categories.ts` 改為住宿（stay）／天氣與季節（weather）／美食（food）／交通（transport）四大類，各自的 `topics` 刻意留空：主題中心要等 Darren 核准試點清單後才填，填了 Sanity 裡的同名 Hub 才會通過發布門檻。
- Sanity Studio schema（主題中心、文章、作者、Tag、表格）與上稿腳本（上稿、封面、開放索引、父子 Hub、清單狀態查詢）。專案 ID 改由環境變數提供。
- `scripts/article-automation-policy.mjs` 改寫為本站版本：一個主題一個批次、每篇由 Darren 核准後才列入、進度只看 Sanity 狀態、每日上限、執行鎖（`scripts/manage-auto-publisher-lock.mjs`）。本站新增兩條規則：住宿頁必填訂房管道（官網／Trip.com／Agoda／僅 Jalan）與查核日期加一年後重查日；關鍵字證據沒有連 Ahrefs 時只能標「SERP observation」，不得標成 Ahrefs 已驗證，並要確認搜尋結果是日本而非台灣同名地名。`content-automation/article-queue.json` 是通過驗證的空清單。
- CI 檢查沿用：站內連結、結構化資料、sitemap 與 robots.txt 產生。沒有設定 `SANITY_PROJECT_ID` 時網站以零篇文章建置，結構化資料檢查允許零篇；設定後則要求至少一篇。
- Cloudflare Worker（HTTPS 轉址、聯絡表單、靜態資產）與 `wrangler.jsonc`；寄件地址、網域、信箱、Turnstile 金鑰都是佔位值。沒有建部署失敗 Discord 通知 Worker。
- 測試 92 項全部通過（`npm test`），`npm run build` 通過並產出 9 頁。瀏覽器截圖確認首頁、分類頁、關於頁版面正常。

### 已決定（本次由 Claude Code 做的技術判斷，Darren 可推翻）

- 站名暫用「日本旅遊長尾站」、網址暫用 `https://japan-travel.example/`，都集中在 `src/config/site.ts`、`src/config/contact.ts`、`site.config.mjs`，確定後只改這三個檔案。
- GA 與 AdSense 的 ID 留空，留空時不輸出任何標記、不顯示同意視窗；`ads.txt` 不放。
- 好材誌的舊網址轉址、一次性遷移腳本、Discord 通知、規劃待寫區（planningIntake）、候補內連（contextual-link backlog）都沒有搬過來；需要時再從好材誌抽。
- 自動發布清單的 `triggerIntervalHours` 先填 4（交接文件建議與好材誌錯開），實際 routine 頻率由 Darren 決定。

### 尚未完成

- `.agents/skills/` 還沒建立（answer-first、auto-publisher、stock-image-finder、hub-keyword-planner 的本站版本），這是交接文件第五節的第 3 步。
- Sanity 專案、Cloudflare 專案、網域、routine、AdSense 都還沒有，等 Darren 決定。
- 關於頁、首頁、隱私頁的文案是依交接文件寫的草稿，Darren 要看過。

### 阻礙

- 無。

### 唯一下一步

- 連接 Ahrefs 後用 hub-keyword-planner 規劃 30 頁試點（15 個小溫泉地住宿頁、10 個城市×月份天氣頁、5 個季節頁），出清單給 Darren 核准；核准後把主題填進 `src/data/categories.ts` 的 `topics` 與 `content-automation/article-queue.json`。
