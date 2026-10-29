---
name: japan-travel-image-finder
description: Find and select commercially usable images for an approved Japan travel article — tourism-association, municipal and Ministry of the Environment photos whose site terms allow reuse with credit first, then free stock libraries, then Wikimedia Commons, own photos, and only when no real photo qualifies a clearly labelled AI illustration. Excludes non-commercial and no-derivatives licenses because the site earns affiliate income, never downloads hotel, shop, Instagram, map or OG images (official Instagram and YouTube posts may only be embedded), and records license evidence in an image packet. Use for cover images, inline images, or image replacement. Do not upload to Sanity or publish.
---

# 日本旅遊長尾站選圖

先找「內容真的對題」且可以在商業網站使用的實拍照片，保存來源與授權證據，依固定門檻自行選定。本站有 Trip.com 與 Agoda 分潤，按商業網站審查授權。某個圖片位置確認沒有任何合格實拍時，才用 AI 另製一張清楚標示的示意圖。

## 啟動前

1. 讀取根目錄 `AGENTS.md` 與 `PROJECT_STATUS.md`，確認 Git 狀態。
2. 使用已通過驗收的 `content-production/<article-id>/reader-preview.md` 與 `reference-review.md`。只有草稿時可暫定選圖，但不得上傳。
3. 完整閱讀 [來源與授權](references/selection-and-licensing.md)；保存成果前讀 [圖片封包](references/image-packet.md)。
4. 不修改文章內容。文章與圖片互相矛盾時，記錄阻礙並交回寫作流程。

## 先判斷要不要放圖

只在讀者「要看到才懂」的地方放圖，依 [放圖時機](references/image-needs.md) 的五種需求：現場辨識、決定要不要去、料理、季節差異、路線與時間。作者在文章計畫列出圖片需求，本 Skill 依需求找圖，不自行增加裝飾用的位置。

- 現場辨識的圖不准用 AI；找不到合格照片就記進 [缺圖清單](references/missing-images.md)，正文改用日文招牌、位置描述與官方照片連結；缺圖不擋發布。
- 路線與時間用 [自製示意圖](references/diagrams.md)，由程式依已查證的資料畫成 SVG。
- 不截取任何網站的畫面。

## 來源順序

| 順序 | 來源 | 適合用在 |
|---|---|---|
| 1 | 觀光協會、自治體、環境省等官方的照片（素材庫，或網站條款允許轉載的照片） | 小地方、地標、步道、祭典；條款逐一確認，照規定寫 credit |
| 2 | Unsplash、Pexels、Pixabay | 封面、大地方、季節氛圍；文內只用說明寫明地點、畫面對得上的照片 |
| 3 | 維基共享資源 Wikimedia Commons | 前兩種都沒有時；交通工具、站房、料理常只有這裡有 |
| 4 | Darren 或作者自己拍的照片 | 目前不預期有；未來有實拍時才用 |
| 5 | 自製示意圖 | 路線與時間；由程式依資料畫成 SVG |
| 6 | AI 示意圖 | 前面都沒有合格照片時，必須標示，且不能用在現場辨識 |

Darren 2026-10-29 覺得維基共享資源的照片太多，所以先找官方照片與免費圖庫，維基共享資源放到後面。環境省國立公園網站與很多自治體採用「政府標準利用規約」，照片旁沒有標示第三者提供的，註明出處就能用。只有照片看不夠的地方（步道、祭典、交通工具的實際樣子），另外找影片或官方 Instagram 貼文用嵌入補，見 [嵌入封包](references/embed-plan.md)。

## 一律不用

- 旅館、店家官網的照片（除非取得書面授權並保存）
- 店家卡片放店家照片：交接文件規定店家卡片不放照片
- 下載 Instagram、Facebook、部落格的照片（觀光協會等官方帳號的公開貼文可以用平台的嵌入功能放進文章，見 [來源與授權](references/selection-and-licensing.md)「嵌入」）
- Google 地圖、Tabelog、Jalan 上的照片
- 對方網頁的分享預覽圖（OG 圖）
- 授權含「非商業使用」（NC）或「禁止改作」（ND）的照片；裁切封面就算改作

## 先建立視覺規格

每個圖片位置先從正文整理：用途（封面或文內）、必須看見的主體、可以接受的替代、不能暗示的事實、要避開的內容、比例與最低解析度（封面橫式且寬度至少 1600 px，文內至少 1200 px）。

封面可以用地區或季節情境，但不能讓讀者誤以為照片是某間旅館、某個祭典當年的實況或本站實地拍攝。文內圖要直接呈現正文說的地點、料理、交通工具或標示。

## 搜尋與查核

1. 用日文與英文描述畫面搜尋，例如「礼文島 桃岩」「Rebun Island Momoiwa」。維基共享資源可用日文地名的分類頁找。
2. 只接受官方單張素材頁：維基共享資源的 `File:` 頁、圖庫的單張照片頁、觀光協會素材庫的單張頁。搜尋縮圖、轉貼網站與直接圖片網址不能當證據。
3. 打開大圖看完整構圖；核對作者、授權條款、拍攝地點與說明。維基共享資源要看檔案頁下方的授權區塊，不只看縮圖旁的文字。
4. 觀光協會或自治體的照片要打開網站的利用規約（素材庫的規約，或網站的「著作權」「サイトポリシー」頁），確認允許商業網站使用、允許裁切、署名方式、是否需要申請。需要申請的，申請核准前不能使用。照片旁標示由第三者提供（例如「写真提供：○○」）的，不在網站條款的授權範圍內，不用。
5. 排除 AI 生成、3D render、浮水印、可辨識人物肖像、醒目商標與看不出地點的照片。
6. 每個位置以 2～3 張強候選為目標；只有一張合格就保留一張並說明。

## AI 備援

只有在依多組描述搜尋過所有實拍來源、仍是零張合格時，才在封包記錄 `no-qualified-photo` 與原因，再使用 AI。

- AI 圖只能當情境示意，不能代表特定旅館、店家、祭典實況或地點的真實樣貌。
- 現場辨識（`site-identification`）與路線時間（`route-timeline`）的位置不准用 AI。
- 圖說必須包含「AI 示意圖」，圖片角落也要印上「AI 示意圖」，被截圖轉貼時揭露才不會消失。
- 生成後由 `$japan-travel-acceptance` 的圖片驗收 agent 檢查；試點期間每張 AI 圖還要 Darren 親眼確認後才能上線。

## 選定與交付

依 [圖片封包](references/image-packet.md) 保存 `content-production/<article-id>/images/image-plan.json`，再執行：

```bash
node .agents/skills/japan-travel-image-finder/scripts/validate-image-packet.mjs content-production/<article-id>
```

選定順序：

1. 直接符合 `mustShow`，完全避開 `mustNotShow`。
2. `exact` 優先於 `contextual`；有合格實拍就不比較 AI 圖。
3. 不需猜地點、季節或主體身分，事實限制較少。
4. 裁成目標比例後主體仍清楚。
5. 前項相同時，選授權條件最簡單、來源資訊最完整者。

封面選定後執行 `npm run image:prepare:cover -- content-production/<article-id> --download`（自己拍的照片與 AI 圖先放到 `.tmp/image-selection/<article-id>/`，省略 `--download`），用人眼確認 16:9 裁切沒有誤導。原始大圖不加入 Git。

要上傳的文內照片加上 `placement` 與 `preparation`（見 `references/image-packet.md`「文內照片的位置與準備」），執行 `npm run image:prepare:inline -- content-production/<article-id> --download`，逐張打開 webp 確認畫面和替代文字、圖說一致。

向使用者提供一次簡潔的結果預覽：選定圖、來源頁、為何符合、限制與署名草案。不要求逐張核准。本 Skill 不上傳 Sanity、不發布、不 commit 或 push。

## 完成條件

每個圖片位置都對應作者列出的一種圖片需求並已建立視覺規格；候選都看過大圖並核對官方單張頁與授權；沒有 NC、ND 或來源不明的素材；觀光協會素材已確認利用規約；選定理由與署名草案已記錄；找不到現場照片的位置已記進缺圖清單並有文字替代；自製示意圖已由資料檔產生；封包驗證通過，或在沒有可靠圖片時設為 `blocked`。
