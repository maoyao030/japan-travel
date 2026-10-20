# 部署設定（2026-10-20 第一次部署）

本站沿用好材誌的部署方式：Cloudflare Workers Builds 連接 GitHub repo，每次推送自動跑測試、建置，通過後才部署。Sanity 專案已於 2026-10-17 建立（專案 ID `e8ctf7ee`、dataset `production` 公開，見 `studio/README.md`）；網域 `offpathnotes.com` 已於 2026-10-20 購買，Cloudflare Workers 專案尚未建立，本文件先記錄設定基準，實際建立時照著做。

## 自動流程

- `main`：每次推送後執行 `npm test && npm run build`，全部測試與 Astro 建置通過後，才執行 `npx wrangler deploy` 更新網站。
- 其他分支：同樣執行 `npm test && npm run build`，通過後以 `npx wrangler versions upload` 建立獨立預覽版本，不取代 `main` 的線上版本。
- Cloudflare 自動使用 `package-lock.json` 安裝鎖定版本，不需要在 GitHub 保存 Cloudflare API Token。
- 任何步驟失敗時，Cloudflare 不會執行後續部署命令，上一個正常版本會繼續提供服務。本機可用 `npm run ci` 跑同樣的流程。

## Cloudflare Builds 設定基準

| 項目 | 設定 |
|---|---|
| Production branch | `main` |
| Build command | `npm test && npm run build` |
| Production deploy command | `npx wrangler deploy` |
| Non-production deploy command | `npx wrangler versions upload` |
| Root directory | `/` |
| Worker name | `japan-travel`（`wrangler.jsonc` 的 `name`） |
| Build 環境變數 | `SANITY_PROJECT_ID`、`SANITY_DATASET`、`SITE_URL`、`PUBLIC_TURNSTILE_SITE_KEY` |
| Worker Secrets | `CONTACT_FORM_RECIPIENT`、`TURNSTILE_SECRET_KEY`（用 `wrangler secret put` 設定） |

## 正式網域

- 正式網域是 `offpathnotes.com`，2026-10-20 由 Darren 在 Cloudflare Registrar 購買（每年 US$10.46，續約同價）。已寫進 `site.config.mjs` 的 `DEFAULT_SITE_URL`、`src/config/contact.ts` 的信箱、`wrangler.jsonc` 的 `routes` Custom Domain 與 `send_email.allowed_sender_addresses`、`.env.example`、`content-automation/article-queue.json` 的 `siteBaseUrl`。
- 第一次部署前還要做：在 Cloudflare Email Routing 設好 `contact@offpathnotes.com` 的收信轉寄，並在 Email Service 驗證這個寄件地址；做不到就先移除 `wrangler.jsonc` 的 `send_email` 段落、停用聯絡表單。
- 站名「繞路筆記」（2026-10-20 決定），在 `src/config/site.ts` 與 Sanity Studio 的 `studio/sanity.config.ts`。
- Cloudflare 會為 Custom Domain 自動建立代理 DNS 紀錄與 HTTPS 憑證。
- 網域綁定不代表開放搜尋引擎收錄；文章與主題中心預設 `noindex`，要經過驗收與核准才會由腳本開放索引。

## 維護資料庫（Cloudflare D1）

2026-10-17 建立 `japan-travel-ops`（私有，亞太區），放執行鎖、停放、事實查核狀態等維護資料。網站 Worker 不綁這個資料庫；設定與指令見 `d1/README.md`。雲端 routine 用環境 `japan-travel-publisher`：權杖放在 network secret（只附加到 D1 的 API 路徑），環境變數只有 `OPS_DB_TRANSPORT=http`；帳號 ID 寫在 `d1/wrangler.jsonc`。

## Sanity 發布後自動建置

Sanity 專案建立後，在該專案的 dataset 加一個 Webhook，連到 Cloudflare 的 Deploy Hook：

- 只處理 `article`、`hub`、`tag`、`author` 四種公開內容文件。
- 建立、更新、取消發布或刪除正式文件時，以 `POST` 觸發 `main` 建置；草稿編輯不觸發。
- Deploy Hook URL 等同機密憑證，只保存在 Cloudflare 與 Sanity，不得寫入 Git、文件或聊天。

## 好材誌有、本站先不建的東西

- 部署失敗的 Discord 通知 Worker（`build-alert`）與 Sanity 可索引文章通知。等本站有 routine 與實際流量後再由 Darren 決定是否需要。
- AdSense 所有權標記與 `ads.txt`：本站先不申請 AdSense。

## 驗收方式

1. 在非 `main` 分支推送一個不影響正式內容的小改動。
2. 確認 Cloudflare 建置成功並產生該分支的 Preview URL。
3. 確認 Preview URL 可開啟，且正式 Workers 網址沒有被替換。
4. 執行一次刻意失敗的預覽建置，確認失敗後正式網址仍維持上一個正常版本。

## 好材誌踩過的坑（2026-10-20 整理，第一次部署照著檢查）

程式已處理（2026-10-20）：

- Sanity 專案 ID 寫死預設 `e8ctf7ee`（`site.config.mjs`），建置變數漏設也不會建成空站；只有 `SANITY_PROJECT_ID=none` 才以空內容建置。
- Sanity 還沒有任何文章時，`check:schema` 不要求文章頁；有文章卻一篇都沒建出來才讓建置失敗。
- `*.workers.dev` 測試網址回 `X-Robots-Tag: noindex, nofollow`，避免跟正式網域重複。
- `.gitattributes` 統一 LF，避免 Windows 換行讓 CI 失敗。
- 沿用好材誌已修好的：http 301 轉 https、首頁與分類頁開放索引、sitemap 只收可索引頁、裝置內建字體、圖片 srcset、Organization logo。

後台操作時要注意：

1. **Workers Builds 連 GitHub**：從 Worker 的 Settings → Build 連，GitHub App 只授權 `maoyao030/japan-travel`。好材誌第一次連時 GitHub 的二次驗證打斷回呼，結果觸發器是 0 個；連完要推一個非 `main` 分支確認真的有建置，沒有就卸載 GitHub App 重連。
2. 第一次建置看 log 的 Node 版本，低於 22.18 就在 Build variables 加 `NODE_VERSION=24`。
3. Worker Secrets 一律用 Secret（或 `wrangler secret put`），不要用純文字 Variables，否則可能被部署覆蓋。
4. **大寫轉小寫的轉址規則一定要排除 `/_astro/`**（也排除 `/api/`）。好材誌誤套到 CSS 檔，全站版面壞掉，而且 301 會被瀏覽器快取。
5. SSL/TLS → Edge Certificates 開「Always Use HTTPS」，跟程式的轉址雙重保險。
6. 綁好網域後本機打不開不一定是設定錯，可能是 DNS 快取，用 `nslookup offpathnotes.com 1.1.1.1` 或手機網路確認。
7. Deploy Hook 網址等同密碼，不貼進聊天或終端機輸出；外洩就刪掉重建。
