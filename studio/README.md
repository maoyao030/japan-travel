# Sanity Studio（文章後台）

Sanity 是存放文章、主題中心、作者與情境 Tag 的後台；網站建置時從這裡讀取內容。

## Sanity 專案

- 專案：日本旅遊長尾站，專案 ID `e8ctf7ee`（2026-10-17 建立，Darren 的 Sanity 帳號）。管理頁：<https://www.sanity.io/manage/project/e8ctf7ee>
- Dataset：`production`，公開（網站建置時不帶權杖直接讀取，與好材誌相同）。公開代表任何人都讀得到這個 dataset 的正式文件，不要把不該公開的資料放進來。
- 本機：在 `studio/.env` 寫入 `SANITY_STUDIO_PROJECT_ID=e8ctf7ee` 與 `SANITY_STUDIO_DATASET=production`（這個檔案不會進 Git），再 `cd studio && npm install && npm run dev` 開啟後台（http://localhost:3333 已加入 CORS）。
- 網站：根目錄的 `SANITY_PROJECT_ID`、`SANITY_DATASET` 等第一篇文章準備發布時再設定（本機 `.env` 與 Cloudflare 建置設定）。設定後結構化資料檢查會要求至少一篇文章，沒有文章時建置會失敗。
- 雲端 routine 的寫入權杖 `SANITY_AUTH_TOKEN` 由 Darren 在管理頁的 API → Tokens 建立（選有寫入權限的角色；免費方案可選的角色較少），只放進雲端環境的機密設定，不寫進 Git、文件或聊天。

## 文件類型

- `hub`：主題中心。`category` 只能選住宿、天氣與季節、美食、交通；父主題中心的 slug 必須先列在 `src/data/categories.ts` 的 `topics`。
- `article`：文章。新文章預設 `noindex=true`，驗收通過後才由腳本開放索引。
- `author`：作者。網址代稱 `editorial-team` 代表編輯部，文章會連到關於頁。
- `tag`：橫向情境 Tag。至少 5 篇文章、跨 2 個主題中心才會建頁。
- `contentTable`：文章內的表格。

## 腳本

`scripts/` 內的腳本都先 dry-run，再用同一份輸入加 `--apply`。本機用 `--with-user-token` 登入；雲端 routine 用 `SANITY_AUTH_TOKEN`。用途見各檔案開頭與 `package.json` 的 scripts。

## 手動修改文章（2026-11-03）

後台就是 Darren 直接改文章的地方：打字改、按「發布」，不用碰 Git 或程式。

- **線上後台**：<https://offpathnotes.sanity.studio>（要先部署一次，見下面）。用建立 Sanity 專案的同一個帳號登入。介面是繁體中文。
- **找文章**：左邊「網站上的文章」，最近改過的排在前面；上方放大鏡可以搜標題。
- **改完**：右下角按「發布」。網站要等下一次重建才會變（目前是每次推 `main` 時，自動寫作一天會推好幾次）。
- **看網站上的樣子**：文章右上角「⋯」選單的「開啟預覽」，會打開網站上的這一頁。
- **按發布時後台會自動記下「最後在後台手動發布」**。會用 Git 稿件改寫正文的工具（`replace-article-body`、`revise-article-text`、`replace-article-paragraphs`、`link-bare-urls`、`publish-prepared-article --update-existing`）看到還沒同步的手動修改就停下來，不會蓋掉 Darren 的修改。補內連、加照片與嵌入的工具只在現有正文上加東西，照常可以用。
- **把手動修改抓回 Git**：左邊「後台改過、還沒同步回 Git」會列出這些文章。人工 session 在 `studio/` 跑：

  ```bash
  npm run pull:studio-edits -- --article=<文章>
  ```

  先只產生 `content-production/<文章>/studio-edits/<時間>/changes.md`（修改前後對照）與 `studio-version.md`，看過後加 `--apply`：把後台版本寫回 `reader-preview.md`、標題與摘要寫回 `publication.json`，並在後台記下「已同步回 Git」。之後照 `changes.md` 最後的清單補事實來源、同步 `draft-tagged.md`，值得學的改法記進寫作 Skill 的 `examples.md`。
- 主題中心（Hub）的手動修改還沒有這個保護，Hub 文案先不要在後台改。

### 部署線上後台

第一次（或改了 `sanity.config.ts`、`schemaTypes/`、`lib/` 之後）在 Darren 已登入 Sanity CLI 的電腦上，於 `studio/` 執行：

```bash
npm install
```

```bash
npx sanity deploy
```

網址代稱寫在 `sanity.cli.ts` 的 `studioHost`（`offpathnotes`）；被別人用走時改一個再部署。部署完 CLI 會提示把 `appId` 加進 `sanity.cli.ts`，照做並 commit。
