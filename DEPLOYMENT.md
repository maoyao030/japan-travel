# 部署設定（尚未部署）

本站沿用好材誌的部署方式：Cloudflare Workers Builds 連接 GitHub repo，每次推送自動跑測試、建置，通過後才部署。Sanity 專案已於 2026-10-17 建立（專案 ID `e8ctf7ee`、dataset `production` 公開，見 `studio/README.md`）；Cloudflare 專案與網域尚未建立，本文件先記錄設定基準，實際建立時照著做。

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

- 網域尚未決定。決定後：改 `site.config.mjs` 的 `DEFAULT_SITE_URL`、`src/config/contact.ts` 的信箱、`wrangler.jsonc` 加回 `routes` 的 Custom Domain，並把 `send_email.allowed_sender_addresses` 換成 Cloudflare Email Service 已驗證的寄件地址（或先整段移除、停用聯絡表單）。
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
