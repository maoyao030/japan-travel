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

## 2026-10-16 Claude Code：建立四個 Skill（分支 `feat/skills`）

### 本輪與 Darren 討論後的決定

- 定位往「日旅百科」發展，但從長尾題目往內長，不從大詞開始。繁中市場已有好運日本行、MATCHA、LIVE JAPAN 等雜誌型大站，它們寫精選，沒有窮舉小地方。
- 區域推進：北海道先做，之後照季節挑下一區（建議東北），四國放最後。住宿的高價詞（銀山、黑川、下呂等）另開全國支線，不等區域順序。
- 小地方用「地點條目」一頁回答怎麼去、住哪、看什麼、什麼季節去。Ahrefs 數據顯示小地方的需求集中在地名本身（稚內 1,100、利尻島 600、禮文島 400），「稚內住宿」「稚內交通」只有 10～30。
- 關鍵字用「地點×面向」組合找；組合詞搜尋量 100 以上、搜尋結果頁不同、事實夠多才單獨成頁，其他寫成條目的必答問題。Ahrefs 顯示 0 的詞照樣列進必答問題（Google 自動完成顯示「禮文島船票」「稚內船班」確實有人搜）。
- 不依賴 Ahrefs 發現題目：研究時從日文官方資料記錄祭典、花火、特色料理等「發現清單」，有月份的項目之後接到月份頁。
- 內鏈依地點關係自動產生（地區、鄰近地點、出入口、適合月份），不需要先做完整關鍵字研究。
- 寫作以日文官方資料為主，專有名詞附日文原名，建立全站譯名表；只取事實不翻譯段落。
- 內容採保母等級：日文按鈕對照、指給對方看的日文句子、末班車與停駛備案、付款方式；各地相同的操作寫成共用教學頁。
- 驗收拆成三層：格式檢查程式、事實查核 agent（每個事實附日文原文摘錄）、讀者驗收 agent（模擬不會日文的旅客）。前 30 篇 Darren 每週抽 2～3 篇看原文摘錄。
- 圖片來源順序：維基共享資源、免費圖庫、觀光協會素材、自己拍、AI 示意圖。本站有分潤屬商業網站，NC 與 ND 授權不用；店家與旅館照片、Instagram、地圖照片、OG 圖不用。

### 已完成

- 建立 `japan-travel-topic-planner`、`japan-travel-answer-first`、`japan-travel-acceptance`、`japan-travel-image-finder` 四個 Skill，各含 SKILL.md、agents/openai.yaml 與 references。
- 文章格式檢查器沿用好材誌並新增兩個提醒：日圓價格沒寫含稅或未稅、大段日文可能是整段翻譯。
- 新增事實查核紀錄驗證程式（檢查每筆事實有原文摘錄、對應目前文章版本）與圖片封包驗證程式（擋下 NC、ND、非單張頁、未確認利用規約、跳過實拍直接用 AI）。
- 封面準備與上傳腳本支援維基共享資源、觀光協會素材與自己拍的照片。
- AGENTS.md 新增 Skill 路由段落。
- `npm test` 98 項通過，`npm run build` 通過。

### 尚未決定

- 網址是否改成「地點在前」（`/places/<地點>/`）。地點條目需要這個路由；決定前，頁面規格的 `targetPath` 填 `null`，不能進入文章清單。
- 單獨成頁的 100 次門檻與四到六個月的季節提前量是暫定值，北海道第一輪後再調。

### 尚未完成

- 自動發布 Skill（auto-publisher）。
- Sanity 地點條目的四個欄位（地區、鄰近地點、出入口、適合月份）與依欄位產生地區頁、月份頁的程式。
- 譯名表 `content-planning/glossary.json` 與共用教學頁清單的實際內容。

### 唯一下一步

- 請 Darren 決定網址是否改成「地點在前」；決定後改路由與 Sanity 欄位，再用選題 Skill 試跑稚內、利尻、禮文。

## 2026-10-16 Claude Code：放圖規則、圖片驗收與地點優先網址（分支 `feat/images-and-places-routing`）

### 本輪與 Darren 討論後的決定

- 網址採地點優先，最多三層：地點條目 `/places/<地點>/`、面向頁 `/places/<地點>/<面向>/`、主題頁 `/seasons/<主題>/`。不開第四層，需要更細時升格成獨立地點，或在第三層用連字號，例如 `/places/hakodate/stay-onsen/`。
- 地點的上下關係只記在欄位，不放進網址。地區、鄰近地點、出入口與適合月份決定麵包屑與內連。
- 列表頁內容夠了才建立：面向目錄（例如 `/stay/`）5 篇以上、月份頁 5 個項目以上、地區條目的地點清單 3 個地點以上。三個都是暫定值。
- 圖片只在五種需求放：認現場、決定去不去、吃什麼、季節對照、路線時間軸。每個 H2 放一張裝飾照不算需求。
- 路線與時間軸用自製示意圖。圖從資料檔畫出，圖上每個數字都要在事實查核裡查證過。
- 認現場與路線位置不准用 AI 圖。AI 圖要在圖上標示「AI 示意圖」，由另一個 agent 看過；試點期間每張 AI 圖都要 Darren 確認。
- 找不到合格照片的文內圖可以先進待拍清單，封面不行。

### 已完成

- 寫作 Skill：文章計畫要列圖片需求。
- 選圖 Skill：
  - 新增放圖規則、待拍清單與示意圖資料檔的說明。
  - 新增示意圖產生程式 `render-diagram.mjs`。
  - 圖片封包檢查會擋下沒標需求的文內圖、放錯位置的 AI 圖，以及缺少事實編號的示意圖。
- 驗收 Skill 改成四層，新增第四層圖片驗收與 `validate-image-review.mjs`。
- Sanity 文內圖片新增署名（必填）、來源頁與授權欄位，網站會顯示圖說與署名連結。
- 網站分類改成地點、季節、神社與祭典、旅行教學。
  - Hub 新增地點種類、日文原名、所屬地區、鄰近地點、出入口、適合月份。
  - 文章新增面向與相關月份。
  - 地點分類不准用子 Hub。
- 新增面向目錄頁、月份頁與地區的地點清單，都設有門檻。
- 建置時新增網址層數與點擊深度檢查：網址超過三層，或可索引頁從首頁要點超過三下，建置就失敗。
- 文章清單規則：
  - 每篇要標面向與頁型。
  - 地點條目必須是地點 Hub 的入口文章，並要有訂房管道與查核日期。
- 選題 Skill 的頁面規格改成直接填網址，不再填 `pending`。
- 用模擬內容（北海道、稚內、利尻、禮文、函館共 6 篇）建置過一次，確認以下各項都正常：
  - 麵包屑、鄰近地點、出入口、月份頁、`/stay/` 目錄。
  - Sitemap、站內連結與深度檢查。
- `npm test` 111 項通過，`npm run build` 通過。

### 尚未完成

- 自動發布 Skill（auto-publisher）。
- 譯名表 `content-planning/glossary.json`、缺圖清單 `content-planning/missing-images.json` 與共用教學頁清單的實際內容。
- Sanity Studio 的依賴沒有安裝，Studio 的型別檢查本輪沒跑；欄位是照現有寫法加的。

### 唯一下一步

- 用選題 Skill 試跑稚內、利尻、禮文，產出頁面規格給 Darren 核准；核准後把地點填進 `src/data/categories.ts` 的 `places.topics`。

## 2026-10-16 Claude Code：待拍清單改成缺圖清單（分支 `feat/missing-image-list`）

### 決定

- Darren 不預期去現場拍照，「待拍清單」改成「缺圖清單」`content-planning/missing-images.json`，缺圖不擋發布。
- 找不到「認現場」的照片時：
  - 正文一律寫出日文招牌原文、位置描述與地標，有官方照片頁、構內圖或 Google 地圖街景就附連結。
  - 有素材庫的觀光協會，整理成申請清單；要不要寄由 Darren 決定。
- 缺圖清單的狀態：改用文字、已申請素材、已補上、放棄。

### 已完成

- 選圖 Skill：
  - 待拍清單說明換成缺圖清單。
  - 圖片封包的 `shotListId` 改成 `missingImageId`。
  - 缺圖的位置必須記錄文字替代，至少一個日文招牌原文、位置描述，連結只收 HTTPS。
- 寫作 Skill：認現場的段落一律先寫成不看照片也認得出來。
- 讀者驗收的問題與校準例子跟著改。
- `npm test` 111 項通過。

### 唯一下一步

- 用選題 Skill 試跑稚內、利尻、禮文，產出頁面規格給 Darren 核准。

## 2026-10-16 Claude Code：試跑選題，稚內、利尻、禮文（分支 `plan/wakkanai-rishiri-rebun`）

### 已完成

- 用 Ahrefs（台灣）查三地所有組合詞與搜尋結果頁，三個研究代理分別查日文官方資料。
- 產出 `content-planning/hokkaido/`：頁面規格、候選登記、關鍵字紀錄、發現清單（24 項）與說明。
- 建議保留 6 頁：
  - 稚內、宗谷岬、利尻島、禮文島 4 個地點條目。
  - 整理券巴士共用教學。
  - 稚內景點面向頁。
- 渡輪、稚內天氣、利尻山不單獨成頁，寫進條目；利尻昆布是染髮劑意圖，不寫。
- 新發現宗谷岬自己有 200 的量，搜尋結果和稚內不重疊，所以獨立成條目。

### 尚未完成

- 稚內景點與整理券教學的搜尋結果頁要在台灣 Google 補看。
- 驗證程式要求每個批次的 `plannedPageCount` 等於整份規格的保留頁數，和「一個批次一個父 Hub」對不上，建文章清單時要處理。

### 唯一下一步

- 請 Darren 核准 `content-planning/hokkaido/README.md` 的 6 頁清單（可刪減或調整順序）。

## 2026-10-16 Claude Code：禮文島試寫三輪（分支 `draft/rebun-island`，未合併）

### 決定

- Darren 要求一篇樣本，選禮文島，規格未核准，不進文章清單。
- 第 1 輪判退後，Darren 同意改用「標編號寫作＋分段檢查」，並要求流程跑完不要停下來問。我把上限設為三輪。

### 已完成

- 寫作 Skill 新增規則：
  - 先做完事實表，清單自己數，不用常識補細節。
  - 推理不是來源，算出來的數字附算式。
  - 標編號寫作、`fact_tags.py`、分段檢查。
- 事實查核驗證程式接受 http 來源。
- 三輪結果：
  - 錯誤：19 → 6 → 0。
  - 標題：第 2 輪起通過。
  - 讀者價值：三輪都判退。第 3 輪只剩群生地、礼文林道起點、觀光巴士網路預約三個擋路缺口，以及幾個中度缺口（見 `content-production/rebun-island/review.md`）。
- 每輪的稿件、查核紀錄與驗收紀錄保存在 `round-1/`、`round-2/` 與文章資料夾。

### 尚未完成

- 第 4 輪補讀者價值缺口，等 Darren 決定。
- 圖片、訂房管道（Trip.com／Agoda）尚未做。
- 譯名表 `content-planning/glossary.json` 尚未建立。

### 唯一下一步

- 請 Darren 決定是否寫第 4 輪，只補讀者價值缺口。
