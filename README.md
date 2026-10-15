# japan-travel

台灣讀者的日本旅遊長尾資訊站。這是 `maoyao030/building-materials-tw`（好材誌）流程的第二個站：同一套「規劃 → 排程研究寫作 → 獨立驗收 → 免費圖庫封面 → Sanity 上稿 → CI → 開放索引」流程，換成日本旅遊的題目、來源規則與分潤原則。

- 專案規則：`AGENTS.md`
- 交接文件（定位、數據、決策）：`content-planning/handoff-2026-10-15.md`
- 專案狀態：`PROJECT_STATUS.md`
- 部署方式：`DEPLOYMENT.md`

## 目錄

| 路徑 | 用途 |
|---|---|
| `src/` | Astro 網站：版面、頁面、分類樹（`src/data/categories.ts`）、Sanity 讀取與結構化資料 |
| `public/` | 靜態檔案（favicon、佔位 logo 與社群圖） |
| `studio/` | Sanity Studio 的 schema（主題中心、文章、作者、Tag）與上稿腳本 |
| `scripts/` | 建置檢查（站內連結、結構化資料、sitemap）與文章自動化清單規則、執行鎖 |
| `tests/` | `npm test` 跑的自動測試 |
| `workers/site/` | Cloudflare Worker：HTTPS 轉址、聯絡表單、靜態資產 |
| `content-automation/` | 已核准的文章清單（目前是空殼） |
| `content-planning/` | 規劃與交接文件 |

## 本機指令

```bash
npm install          # 安裝套件（Node 22 以上）
npm test             # 跑自動測試
npm run build        # 建置網站並跑站內連結、結構化資料與 sitemap 檢查
npm run ci           # 以上兩個一起跑，和 Cloudflare 建置相同
npm run dev          # 本機預覽
```

還沒設定 `SANITY_PROJECT_ID` 時，網站會以「沒有任何文章」的狀態建置，用來驗證骨架。環境變數清單見 `.env.example`。
