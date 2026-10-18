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
- 自動發布清單的頻率：Darren 於 2026-10-16 決定每 3 小時一篇（`triggerIntervalHours` 3、每日上限 8）。

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

## 2026-10-16 Claude Code（雲端）：改流程，交接到地端

- 禮文島交通試寫到第 6 輪；依 Darren 回饋改了語氣（旅行手札）、SEO、小知識、不寫日文教學、標題檢查進自動化、每 3 小時一篇。
- 討論出新流程（旅行群大綱、分群、依牽涉地點數分工、不用 Ahrefs、來源分級、評論統整），尚待 Darren 確認後寫入規則。
- Darren 改到地端（Windows）繼續。完整交接見 `content-planning/handoff-2026-10-16.md`。

### 唯一下一步

- 地端 session 讀交接文件，請 Darren 確認交接文件第三節的 7 條決定，再從第一階段開始。

## 2026-10-16 Claude Code（地端）：寫入新流程決定（分支 `plan/wakkanai-rishiri-rebun`）

### Darren 確認的決定

Darren 於 2026-10-16 確認交接文件 `content-planning/handoff-2026-10-16.md` 第三節的 7 條決定，全部寫進規則。評論統整不另外找人確認平台規則，直接正式採用。

1. **旅行群大綱**：寫作前先做一整群的大綱，內容有分工表、每頁的 H1／H2／H3 與事實編號、內連表、缺口。Darren 一群看一次。
2. **分群**：常一起去的地點算一群，例如稚內、宗谷岬、利尻、禮文。大綱以群為單位。
3. **分工規則**：依「這件事牽涉幾個地點」決定負責頁。
   - 只牽涉一地：該地的主題頁。
   - 從出入口到該地：該地的交通頁。
   - 同群兩地以上（島與島之間、兩地怎麼一起排）：跨地點頁。
   - 各地相同的操作：全站共用教學頁。
4. **渡輪**：拿掉獨立的渡輪頁，改成渡輪訂票教學頁 `/guides/heartland-ferry-booking/`。
5. **不用 Ahrefs**：日文 Google 自動完成查地點與分群，中文自動完成查台灣讀者的主題與用詞。
6. **來源依內容分級**：
   - 交通與規則只用經營者官方。
   - 店家資訊用店家官網與官方社群，平台資訊交叉核對。
   - 人氣用榜單、得獎、評分與評論數，附查核日期。
   - 找候選可以用 Tabelog、Google 地圖、部落格、新聞，寫進正文前要再查證。
7. **評論統整**：
   - 不改寫單則評論。
   - 兩個平台以上、三則以上共同提到的特點，可以用自己的話寫成「評論常提到…」。
   - 好壞都寫，附查核日期，研究記錄留證據。
   - 只手動閱讀，不用程式抓評論。

第 6、7 條取代 2026-10-16「建立四個 Skill」段落裡的「寫作以日文官方資料為主」，以及 `AGENTS.md` 固定原則裡「評價層只放公開榜單事實」的限制。「指給對方看的日文句子」已在雲端 session 由「不寫日文教學」取代。

### 已完成

- `AGENTS.md` 新增「旅行群流程、來源分級與評論統整」段落。
- 寫作 Skill：
  - 依內容找來源（`japanese-sources.md` 改成內容分級表）。
  - 照大綱寫：有核准的群大綱時，照分工表與內連表寫；連結目標還沒上線時先寫連結句，記進研究記錄的待補內連。
  - 新增 `references/reviews-and-popularity.md`（人氣數字與評論統整規則）。
  - 頁型新增分工規則與跨地點頁；共用教學頁清單加入 `heartland-ferry-booking`。
  - `fact_tags.py` 支援評論編號 `R`，並新增測試。
- 事實查核規則：核對來源層級、評分要有平台與日期、評論統整要達到兩個平台三則的門檻。
- 選題 Skill：改成旅行群流程（找地點與主題、分群、頁面清單、地點研究、群大綱、Darren 一群核准一次）、改用 Google 自動完成；頁面規格加入 `cross-place-page` 與 `travelGroupId`。
- 新增 `content-planning/automation-assessment-2026-10-16.md`：routine 能做到哪裡、三個迴圈的運作方式、頁面之間怎麼串、內容怎麼保持可調、分三段放手的過關條件、建議先改的設定與工具順序。
- `npm test` 114 項通過（Windows 地端，Node 24、Python 3.13）。

### 尚未決定（Darren）

- 自動化評估第六節：每天篇數（建議試跑期每天 1～2 篇）、停放狀態與輪數上限、執行鎖逾時。
- 第五節分三段放手的過關條件數字。

### 尚未完成

- 清單驗證程式還不接受 `Google autocomplete` 與 `cross-place-page`，批次也還不能以旅行群為單位；寫在評估第六節第 4 點，屬於第二階段的工具工作。
- 北海道頁面規格還沒改成新流程（拿掉 `wakkanai-ferry`、加渡輪訂票教學頁與利尻禮文跨地點頁）。
- 禮文島主頁與禮文島交通的事實表是兩套編號（126 筆與 102 筆），還沒合併。
- 本分支尚未合併到 `main`。

### 唯一下一步

- 做評估第七節工具清單第 1 項：定地點共用事實表的格式，把禮文島兩套事實編號合併成一份。

## 2026-10-17 Claude Code（地端）：找下一群、跨群關聯與默許核准（分支 `plan/wakkanai-rishiri-rebun`）

### Darren 逐步確認的決定

- **擴張方式**：靠完整的內容群往外擴。一群做完整才換下一群；下一群只從相鄰的地點選，不跳區，季節只決定相鄰候選的先後。前期靠長尾，高價住宿詞（銀山、黑川、下呂）的全國支線暫停。過程中曾討論「季節題目可以跳區」，Darren 以主題權威為由否決。
- **列候選**：出入口與交通路線、自動完成互相出現、モデルコース、發現清單，加季節日曆。每群必填對外出入口；發現清單也記群外線索。
- **篩選**：中文與日文自動完成都查，日本人搜的旅遊題目也算（台灣人開始追求深度旅行）。兩種語言的旅遊建議詞加起來 2 個以上才是獨立地點，其他併入鄰近地點。車站與道の駅用三個問題判斷（專程去或一定經過、第二層自動完成是不是旅遊需求、官方有沒有當觀光資源）。
- **排序**：相連 → 季節 → 台灣需求 → 競爭 → 相連強度，依序比較。
- **跨群關聯**：Darren 不另外處理。分工跨群照用，先上線的負責；舊群頁面的地點欄位與結尾連結由 routine 自動回補。
- **時機**：目前這群剩 10 篇沒寫時開始找下一群；同時只往前規劃一群。
- **核准**：大綱摘要寫進 Google Sheet「日本站規劃總表」（群清單、頁面清單、例外與更新），用 Google 日曆提醒；到自動核准日（目前這群最後一篇預計寫完那天，至少提醒後 3 天）沒有反對就算核准，例外不默許。
- **更新後門**：事實表每筆標變動類型與下次查核日，到期由 routine 自動重查，Darren 只看例外，不放日曆提醒。

### Claude Code 的技術判斷（Darren 可推翻）

- 自動核准日的算法（最後一篇寫完那天、至少提醒後 3 天）是依 Darren「剩 10 篇就研究下一群」推出來的。
- 跨群規則的細節（先上線的負責、結尾連結只跑格式與網站檢查、要改分工時停放）。
- 各變動類型的查核週期。

### 用真實資料試跑的發現（2026-10-17 自動完成）

- 規格裡稚內的出入口是空的，往外找不到線索，所以加了「必填對外出入口」。
- 紋別和網走、知床一起出現，讀者從旭川、札幌過來；照地圖猜的「紋別經浜頓別接回稚內」不成立。照新規則，稚內群之後是旭川群，流冰群接在旭川後面。

### 已完成

- 選題 Skill 新增 `references/next-group.md`（找下一群 6 步、默許核准、規劃總表、登記），`SKILL.md`、`selection-workflow.md`（含跨群的關聯）、`discovery-log.md` 跟著改。
- 頁型的分工規則加上跨群的說明；研究記錄的事實表加「變動類型」「下次查核」欄。
- `AGENTS.md` 新增「跨群關聯」與「找下一群與默許核准」兩個段落；自動化評估加上 2026-10-17 更新說明。
- 在 Darren 的 Google Drive 建立 Google Sheet「日本站規劃總表」：<https://docs.google.com/spreadsheets/d/19ejoyytu_5JZ8Toa1-Me6Y5HG2pe0iXT1DqAEX01vps/edit>。三個分頁（群清單、頁面清單、例外與更新），狀態欄有下拉選單，意見欄備註寫默許規則；群清單先填稚內群（規劃中）。頁面清單等稚內群規格改成新流程後再填。

### 尚未完成

- 全站地點清單 `content-planning/places.json`、全站分工表 `content-planning/ownership.json`、地點事實表與「變動類型」檢查程式都還沒做。
- 雲端 routine 能不能使用 Google Sheets 與 Google 日曆連接器，建 routine 時要確認。

### 唯一下一步

- 做自動化評估第七節工具清單第 1 項：定地點共用事實表的格式（含變動類型與下次查核），把禮文島兩套事實編號合併成一份。

## 2026-10-17 Claude Code（地端）：建立 Sanity 專案（分支 `plan/wakkanai-rishiri-rebun`）

### 已完成

- Darren 要求建立 Sanity。用本機已登入 Darren 帳號的 Sanity CLI 建立專案「日本旅遊長尾站」，專案 ID `e8ctf7ee`，dataset `production`（公開，與好材誌相同，網站不帶權杖讀取）。localhost:3333 已在 CORS。
- 本機 `studio/.env` 已寫入專案 ID（不進 Git）。Studio 的 schema 驗證通過、`sanity build` 通過。
- Studio 型別檢查原本有 4 個錯誤（相關月份、適合月份的驗證沒有先確認是數字），已修正；順便用專案的 Prettier 設定整理了 `article.ts`、`hub.ts` 的格式。
- `studio/README.md`、`DEPLOYMENT.md` 改成記錄實際的專案。

### 刻意還沒做

- 網站根目錄的 `SANITY_PROJECT_ID` 沒有設定：設定後結構化資料檢查會要求至少一篇文章，現在設定會讓建置失敗。等第一篇文章準備發布時再設定（本機 `.env` 與 Cloudflare）。
- 雲端 routine 的寫入權杖 `SANITY_AUTH_TOKEN`：屬於機密，由 Darren 在 Sanity 管理頁建立（Editor 權限），放進雲端環境設定。
- 線上版後台（`*.sanity.studio`）沒有部署，要不要部署由 Darren 決定。
- 維護資料改放 Sanity 的提議 Darren 尚未正式確認。要注意 `production` 是公開的，執行鎖、事實查核狀態這類維護資料若放進 Sanity，應另開私有 dataset。

### 唯一下一步

- 請 Darren 決定四件事（抽查方式、短頁門檻、觸發點、每天篇數）與維護資料是否改放 Sanity，一起寫進規則。

## 2026-10-17 Claude Code（地端）：維護資料庫改用 Cloudflare D1（分支 `plan/wakkanai-rishiri-rebun`）

### 決定

- Darren 決定維護資料放私有資料庫，選 Cloudflare D1。查證時發現 Sanity 免費方案只能開 2 個公開資料庫、上限 1 萬份文件、成員角色只有管理員與檢視者，所以不在 Sanity 開私有資料庫。

### 已完成

- Darren 在地端重新登入 Cloudflare（`npx.cmd wrangler login`，PowerShell 擋 `npx`）。
- 建立 D1 資料庫 `japan-travel-ops`（亞太區，ID `b8f3156c-5129-42db-b48e-85e179bf926b`）。帳號裡另有一個不相關的 D1（`hibi-nihongo-sync`），沒有動它。
- 新增 `d1/wrangler.jsonc`（與網站 Worker 的設定分開）與 `d1/migrations/0001_maintenance.sql`：九張表（執行鎖、每輪紀錄、文章生產狀態、事實查核狀態、事實使用、重查紀錄、待補內連、跨群回補、例外），已套用到線上資料庫並確認。
- 在本機資料庫測過執行鎖：第二輪在鎖逾時前搶不到，逾時後可以接手。
- 新增 `d1/README.md`；`AGENTS.md`、`DEPLOYMENT.md`、`.env.example`、研究記錄規則跟著改。`studio/README.md` 的 Sanity 權杖說明改成「選有寫入權限的角色」（免費方案沒有 Editor 角色可選）。

### 尚未完成

- `scripts/manage-auto-publisher-lock.mjs` 還是把鎖放在 `.git`，要改成用 D1 的 `run_lock`。
- 雲端 routine 的 `CLOUDFLARE_API_TOKEN`（只開 D1 編輯權限）與 `CLOUDFLARE_ACCOUNT_ID`，由 Darren 建立並放進雲端環境。
- 從 D1 同步例外與到期清單到規劃總表的程式。

### 唯一下一步

- 請 Darren 決定四件事：抽查方式、短頁門檻、觸發點、每天篇數。

## 2026-10-17 Claude Code（地端）：執行鎖改用 D1、每輪紀錄與規劃總表同步（分支 `plan/wakkanai-rishiri-rebun`）

### 已完成

- `scripts/manage-auto-publisher-lock.mjs` 改寫：鎖放在 D1 的 `run_lock`，新增 `status` 指令；共用工具在 `scripts/ops-db.mjs`（透過 wrangler 執行 SQL，字串一律跳脫）。
- 新增 `scripts/ops-run.mjs`（每輪開始與結束紀錄）與 `scripts/ops-sheet-sync.mjs`（整理例外與未來 30 天到期的事實，routine 用 Google Sheets 連接器寫入規劃總表後再標記已同步；routine 超過啟動間隔兩倍沒跑會自動新增例外）。
- 新增 `d1/migrations/0002_sheet_notices.sql`（避免同一則到期通知重複寫入），已套用到線上與本機資料庫。
- 帳號 ID 寫進 `d1/wrangler.jsonc`，雲端 routine 只需要 `CLOUDFLARE_API_TOKEN`。
- 測試：舊的檔案鎖測試換成 `tests/ops-db.test.ts`，用 Node 內建 SQLite 跑同一份 migration（鎖、每輪紀錄、同步、routine 沒在跑）。`npm test` 118 項通過。
- 實測：線上資料庫的搶鎖、第二輪 `busy`、放鎖、`status`、同步 `collect` 都正常；本機資料庫的每輪紀錄正常；在規劃總表寫入一列範例確認格式（日期維持文字、狀態下拉接受）後已刪除。
- `d1/README.md` 補上程式與每週同步步驟；`AGENTS.md`、`DEPLOYMENT.md`、`.env.example`、`content-automation/README.md`、`package.json`（`ops:run`、`ops:sheet-sync`）跟著改。

### 只有 Darren 能做

- 建立 `CLOUDFLARE_API_TOKEN`（只開 Account / D1 / Edit），放進雲端 routine 環境的機密設定。Claude Code 不建立、不經手權杖。

### 唯一下一步

- 請 Darren 決定四件事：抽查方式、短頁門檻、觸發點、每天篇數。

## 2026-10-17 Claude Code（地端）：雲端環境與 Cloudflare 權杖（分支 `plan/wakkanai-rishiri-rebun`）

### 已完成

- 依 Darren 要求開啟本 session 的 Remote Control。
- 在內建瀏覽器建立 Cloudflare 權杖 `japan-travel-ops-routine`（Account / D1 / Edit，只限 Darren 的帳號）。Darren 自己登入、自己複製權杖；Claude Code 沒有讀取或經手權杖內容。
- 建立雲端環境 `japan-travel-publisher`。權杖放在 Network secret（只附加到 `api.cloudflare.com` 的本帳號 D1 路徑），由 Darren 貼上；環境變數加 `OPS_DB_TRANSPORT=http`。環境變數欄位明寫不要放密碼，所以不用 `CLOUDFLARE_API_TOKEN`。
- `scripts/ops-db.mjs` 新增 REST API 連線方式（`OPS_DB_TRANSPORT=http` 時使用，不帶權杖，交給 network secret），三支維護程式改用 `createOpsExecutor()`；新增 2 項測試，`npm test` 120 項通過。本機仍用 wrangler，實測正常。

### 尚未確認

- 雲端實際連線還沒驗證：要在 `japan-travel-publisher` 環境開一次雲端 session，跑 `node scripts/manage-auto-publisher-lock.mjs status` 確認回 `free`。
- 環境的網路權限目前是 Limited。寫文章要連各地日本官方網站、Sanity、Google 自動完成，Limited 會擋。改成 Full 或列出允許網域由 Darren 決定（Claude Code 試著改成 Full 被安全規則擋下）。

### 唯一下一步

- 請 Darren 決定四件事：抽查方式、短頁門檻、觸發點、每天篇數。

## 2026-10-17 Claude Code（地端）：雲端連 D1 驗證通過（分支 `plan/wakkanai-rishiri-rebun`）

### 排查經過

- 前三次雲端測試都回 401。排除網路（Full、代理有重新簽 TLS、NO_PROXY 不含 cloudflare）、路徑與帳號後，發現兩個原因：
  1. Network secret 的 Prefix 欄位顯示的「Bearer」只是灰色提示字，要自己打；Name 欄位也一樣。
  2. Claude 桌面 app 內建瀏覽器的複製（Copy 按鈕、Ctrl+C）不會進電腦剪貼簿，之前每次貼進密鑰的都是剪貼簿裡原本的文字，不是權杖。改在 Darren 自己的 Chrome 複製權杖，先在本機確認（長度 53、Cloudflare verify active、查 D1 成功），再貼上並用欄位字數確認。
- 密鑰改好後 curl 回 200，但程式仍 401：Node 22 內建 fetch 不走 `HTTPS_PROXY`。雲端環境加上 `NODE_USE_ENV_PROXY=1` 後通過。

### 已完成

- 雲端實測通過：`status` → free，`acquire` → acquired，`release` → released，再 `status` → free，沒有留下資料。
- 雲端環境 `japan-travel-publisher` 的環境變數：`OPS_DB_TRANSPORT=http`、`NODE_USE_ENV_PROXY=1`；網路 Full；權杖在 network secret。Cloudflare 權杖 `japan-travel-ops-routine` 為了排查 Roll 過數次，目前有效的是最後一次。
- `scripts/ops-db.mjs` 在有代理但沒設 `NODE_USE_ENV_PROXY=1` 時直接報錯並說明；新增測試。文件（`d1/README.md`、`AGENTS.md`、`.env.example`）補上這兩點與換權杖的正確步驟。

### 唯一下一步

- 請 Darren 決定四件事：抽查方式、短頁門檻、觸發點、每天篇數。

## 2026-10-17 Claude Code（地端）：雲端最終驗證與四個待決定事項（分支 `plan/wakkanai-rishiri-rebun`）

### 已完成

- 新開的雲端 session 完全照環境設定（`OPS_DB_TRANSPORT=http`、`NODE_USE_ENV_PROXY=1`、network secret），不手動加任何變數，`status`、`acquire`、`release` 全部通過，結論「通過」。維護資料庫維持用 D1，不改 Google Sheet。

### Darren 的決定

- **每天篇數與抽查方式**：先驗證到品質合格再決定。routine 在那之前不啟用；`content-automation/article-queue.json` 的每 3 小時一篇、每天 8 篇只是暫存值。
- **資料太少的主題**：併進地點主頁寫成一節。門檻暫定為本主題事實少於 15 筆或預估不到 800 字（Claude Code 訂，稚內群寫完再調）。
- **準備下一群的時機**：剩下的篇數約夠寫 7 天時（7 × 每天上限，上限未定前用 2 篇計算），取代原本的剩 10 篇。

### 已寫入

- 選題 Skill（`SKILL.md`、`selection-workflow.md`、`next-group.md`）、頁型、`AGENTS.md` 新增段落。

### 唯一下一步

- 做一篇給 Darren 驗收品質的樣本：把「禮文島交通」照新規則（來源分級、照大綱寫、分工規則）改完並跑完驗收，請 Darren 看是否達到可以開始自動化的品質。

## 2026-10-17 Claude Code（地端）：routine 架構與程式（分支 `plan/wakkanai-rishiri-rebun`）

### Darren 的指示

- 文章品質是另一條流程；這一輪只處理網站的 routine 與架構。

### 已完成

- `content-automation/routine-architecture.md`：資料分工（Git、Sanity、D1、Google Sheet）、一輪只做一件事的優先順序、文章生命週期、旅行群默許核准、程式分工。
- 清單規則：旅行群 `travelGroups[]`（一群可跨多個 Hub、依寫作順序生產、自動核准日至少提醒後 3 天）、`Google autocomplete` 證據、`cross-place-page`、每批只數自己的規劃頁。
- D1 工具：`ops-article.mjs`（文章生產狀態：事實錯誤可重寫一次、架構問題停放、來源打不開延後，連續 3 天停放）、`ops-group.mjs`（依規劃總表回覆判斷明確核准或默許）、`routine-next-action.mjs`（每輪決定做哪一件事）、`ops-links.mjs`、`ops-facts.mjs`。D1 新增 0003、0004，已套用到線上。
- 規劃檔格式與檢查：`places.json`、`ownership.json`、地點事實表、群大綱（`planning-formats.mjs`、`check-planning.mjs`，`npm test` 會檢查）；建立 `places.json`（稚內群與出入口候選）與 `ownership.json`。
- 發布：`scripts/finalize-release.mjs`（從好材誌移植，加上事實查核、標題檢查、圖片驗收門檻）；補內連 `studio/scripts/apply-pending-link.mjs`（只加連結標記、revision 保護、可回復）。
- `japan-travel-auto-publisher` Skill、`content-automation/routine-prompt.md`、執行紀錄範本 `auto-publisher-run-log.md`。
- 實測：線上 D1 與 Sanity 上 `routine-next-action`（空清單時回每週摘要）、`ops-facts`、`ops-links`、`ops-group`、`ops-article` 的讀取都正常。測試 139 項通過。

### 尚未完成

- 跨群回補的執行程式（D1 `backfill_tasks` 已建）。
- routine 本身還沒建：要先把本分支合併到 `main`、建 Sanity 寫入權杖並放進雲端環境、決定頻率（等品質樣本）。
- 網站還沒部署：Cloudflare Workers Builds、網域、Sanity Deploy Hook 都還沒設定。

### 唯一下一步

- 把 `plan/wakkanai-rishiri-rebun` 合併到 `main`（Darren 同意後）。

## 2026-10-17 Claude Code（地端）：routine 審查與修正（分支 `plan/wakkanai-rishiri-rebun`）

### Darren 的指示

- 合併前用一個子代理驗證流程，再用 Fable 子代理檢視能不能真的執行。

### 審查結果與修正

- 驗證子代理：2 個會卡住的問題、12 個該修的問題；Fable 檢視：現在還不能跑，原因多半是 Darren 才能做的設定。
- 已修：補內連無限重試（改成目標與來源都上線才補、補不上用 `ops-links.mjs skip` 略過並寫例外）、續做重複定稿、雲端缺 `.tmp/`、等核准的群卡住維護（每群每天只讀一次規劃總表）、意見蓋過「已核准」、每週摘要重複挑中、CI 失敗直接停放（改成上稿失敗連續 3 次才停放）、父 Hub 讀錯文章、索引狀態過期、補內連回復路徑錯誤、規劃太晚觸發（排到生產前、每天最多一次）、子 Hub（自動化先拒絕）、延後計數不歸零、補登記、移除的事實、CLI 參數與 batchId。
- D1 新增 0005（`pending_links.skipped_at`、`skip_reason`、`article_status.publish_failures`），已套用到線上。
- 文件：Skill 全文改寫（前置檢查、收尾、rebase 衝突處理）、架構文件與流程圖、routine 提示（環境變數、允許的工具、連接器、先手動跑一次）、`AGENTS.md` 加 routine 例外。Studio 專案 ID 預設 `e8ctf7ee`；`package.json` 要求 Node 22.18 以上。
- 雲端環境 `japan-travel-publisher` 已加 `SANITY_PROJECT_ID`、`SANITY_DATASET`。
- 測試 141 項通過。

### 尚未完成（Darren）

- 合併到 `main`；建立 Sanity 寫入權杖並貼進雲端環境的 `SANITY_AUTH_TOKEN`；照 `routine-prompt.md` 建 routine；看過品質樣本後決定頻率。
- 跨群回補的執行程式還沒做（routine 不會挑這類工作）。

### 唯一下一步

- 把 `plan/wakkanai-rishiri-rebun` 合併到 `main`（Darren 同意後）。

## 2026-10-17 Claude Code（地端）：第二次審查後的修正（分支 `plan/wakkanai-rishiri-rebun`）

### 第二次審查

- 新的子代理在副本上用本機資料庫模擬多輪：上一輪的 13 項修正都有效，6 種情境都照設計運作。
- 擋路問題：地點主頁（Hub 入口文章）沒有掛到父 Hub，網址會算成 `/places/wakkanai/wakkanai/`，開放索引一定失敗，每群主頁都會被停放。

### 已修

- `prepare-parent-hub.mjs --set-landing`：地點主頁暫存後、開放索引前掛成父 Hub 的入口文章（判斷邏輯 `decideHubLandingAction`，有測試）；Skill 的生產與續做都加上這一步。
- 續做：驗收通過就記 `accepted`；定稿、選圖、上稿失敗的文章下一輪從定稿接手（`resumeFrom: finalize`），不重寫。來源打不開不算一次寫作。
- 補登記：不挑停放的文章，失敗照上稿失敗計次，3 次停放。
- 登記順序：先登記待補內連與事實，最後才標已發布。
- 補內連：上一輪補好沒標記的直接標記；其他錯誤略過；補上後 CI 失敗記一次，同一個連結 3 次就略過（D1 新增 0006，已套用到線上）。登記時沒有網址的跨群連結，用清單網址補上。
- 解除停放時上稿失敗次數歸零。
- 測試 143 項通過。

### 還沒處理（較小，不擋執行）

- 規劃總表「routine 沒在跑」的提醒永遠不會出現；規劃可能超前一群以上；重查打不開的來源不會升級成例外；例外原因寫在「你的意見」欄會被誤判成 Darren 的意見；Sheets 連接器失敗時每輪都會重試核准檢查。

### 唯一下一步

- 子代理再測一次；通過後把 `plan/wakkanai-rishiri-rebun` 合併到 `main`（Darren 同意後）。

## 2026-10-17 Claude Code（地端）：地點主頁改在開放索引前一刻掛上（分支 `plan/wakkanai-rishiri-rebun`）

### 第三次審查

- 子代理重測：143 項測試通過，11 種情境（含續做從定稿接手、補登記與補內連 3 次上限、跨群連結網址、來源打不開不算輪數）都照設計運作，沒有擋路問題。
- 建議：入口文章在 CI 前就掛上，Sanity 會觸發重新部署，已上線的主題頁會在開放索引前不被索引；主頁停放時會一直不被索引。

### 已修（Darren 指示：先修再合併）

- Skill 生產第 11 步：CI 通過後才 `prepare-parent-hub.mjs --set-landing`，緊接著開放索引；開放索引失敗就 `--unset-landing` 撤回（入口文章已開放索引就不撤）。判斷邏輯 `decideHubLandingRollback`，有測試。
- 架構文件與流程圖同步。測試 143 項通過。

### 唯一下一步

- 把 `plan/wakkanai-rishiri-rebun` 合併到 `main`（Darren 同意後）。

## 2026-10-18 Claude Code（地端）：觀光協會照片與嵌入規則（分支 `plan/image-sources`）

### Darren 的決定

- 觀光協會與自治體的照片，網站條款允許轉載的就直接用、寫好 credit，不寫信詢問。業界做法是直接拿；Claude Code 指出條款禁止、第三者提供、遊客轉貼照片三種情況仍不能用，Darren 接受用條款判斷。
- Instagram 與 YouTube 公開貼文用嵌入，不下載。

### 已完成

- 選圖 Skill（`japan-travel-image-finder`）的來源順序、一律不用清單、搜尋步驟、`references/selection-and-licensing.md`（新增條款判斷與「嵌入」一節）、`references/image-packet.md` 同步；圖片封包驗證程式原本就支援 `official-material` 與條款欄位，不用改。
- `AGENTS.md` 新增「觀光協會照片與嵌入」段落。

### 尚未決定（等 Darren）

- 稚內群 26 頁是否整批核准；體驗與文化切入點研究步驟與觀光協會景點清單比對；客觀狀況直接寫；文章嵌入影片；資料圖元件。
- 網站的嵌入區塊與資料圖元件還沒做。

### 唯一下一步

- Darren 決定上面五項；同意後寫進規則並開始做稚內群正式大綱。

## 2026-10-18 Claude Code（地端）：稚內群正式大綱（分支 `plan/wakkanai-outline`）

### Darren 的決定

- 26 頁核准；加景點比對與體驗研究；客觀狀況直接寫；可以嵌入影片；做資料圖元件。規則已寫進 Skill 與 `AGENTS.md`。

### 已完成

- 四個地點各派一個研究子代理：地點事實表（稚內 187、宗谷岬 97、利尻島 184、禮文島 280 筆，全部來自實際開啟的官方頁，附日文摘錄、變動類型與下次查核日）、官方景點清單比對、YouTube 與部落格的體驗與文化線索（查證後才用）、客觀狀況、住宿清單與訂房管道、媒體計畫、缺口。
- 研究後併頁：禮文島天氣與祭典事實不足 15 筆，併進禮文島主頁（規格 `decision: merge`）；其餘 24 頁保留。
- 正式大綱 `content-planning/hokkaido/hokkaido-wakkanai-outline.json`：24 頁、312 個標題（每個附事實編號與必答問題）、33 項分工、65 條內連與連結句、寫作順序、182 筆景點比對、72 條體驗線索、27 條客觀狀況、52 個媒體與資料圖候選、55 個缺口。`npm run planning:check` 通過。產生程式 `content-planning/hokkaido/build-outline.mjs`。
- 渡輪規則改成：稚內群三地航線由 `/places/wakkanai/ferry/` 負責（隨 26 頁核准）。`wakkanai-transport` 必答問題改成「機場巴士只收現金或 PayPay」。發現清單新增 23 筆，利尻島鴛泊煙火日期更正為 8/4。

### 研究發現（寫作要注意）

- 利尻山沓形路線九合目以上封閉，實際只能走鴛泊路線。
- 宗谷丘陵風車 2026 年 5～10 月左右拆除，平日單線交替管制；2027 年以後未公布。
- 稚內的流冰近年幾乎看不到；JR 特急 2026-03-14 起全車指定席；宗谷巴士只收現金或 PayPay。
- 北方金絲雀公園是電影《北のカナリアたち》外景地（官方查證）；台灣片名只有維基百科來源，不寫。

### 尚未完成

- 把稚內群寫進 `content-automation/article-queue.json`（批次、旅行群、關鍵字證據），以及 Sanity 北海道地區 Hub、`src/data/categories.ts` 的地點。
- 網站的嵌入區塊與資料圖元件。
- 本分支與 `plan/image-sources` 還沒合併到 `main`。

### 唯一下一步

- 把稚內群寫進文章清單並建好 Sanity 與分類的前置（之後第一篇才能開始寫）。

## 2026-10-18 Claude Code（地端）：寫作調性研究（分支 `plan/wakkanai-outline`）

### Darren 的要求

- 研究競品旅遊網站的寫法，找出寫出好運日本行那種調性、但不寫成本站去過的方法，先試寫再自己比對。

### 已完成

- 看了好運日本行（GLTJP，地球の歩き方經營）、tsunagu Japan、JNTO、北海道觀光機構、Funliday 的口吻與結構。
- 寫法草案「導覽編輯口吻」：`content-experiments/voice-study-2026-10-18/style-guide-draft.md`。
- 兩輪盲測（評審子代理對照競品）：新口吻四段都贏過現行「旅行手札」，實用性也較高；修掉評審抓到的問題後定稿 `final-samples.md`。報告見同資料夾 `README.md`。

### 尚未決定（等 Darren）

- 要不要把「導覽編輯口吻」定成正式規則，取代 `voice-and-seo.md` 的「旅行手札」。

### 唯一下一步

- Darren 看 `content-experiments/voice-study-2026-10-18/final-samples.md` 決定口吻。

## 2026-10-18 Claude Code（地端）：地點百科流程第一步（分支 `plan/wakkanai-outline`）

### Darren 的決定

- 地點百科先行的方向；Fable 子代理審查後修正（交通改成「節點＋最後一段」、缺口當事實、routine 窄權限等，見 `content-automation/encyclopedia-design-draft.md`）。
- 正文不寫「官方沒寫」「未查」，查不到的不寫；推算的數字附時刻表；讀不到的來源改用瀏覽器讀（驗證碼不繞過）。

### 已完成

- 寫作規則與 `AGENTS.md`：查不到的不寫、讀不到改用瀏覽器；`check-voice.mjs` 擋「官方沒寫」等字。
- 事實表格式：缺口 `kind: "gap"`、六種原因、推算事實 `derivedFrom`；大綱標題不能引用缺口。測試 146 項通過。
- D1 0007（facts 加 kind、gap_kind、derived_from），已套用到線上；重查發現改變時推算事實一起標記，缺口查到資料寫例外。
- 稚內群 748 筆事實、817 筆引用同步到 D1；75 天內到期 124 筆（11 月 114 筆）。同步改成分批送出（原本一次送會超過 Windows 指令長度）。

### 尚未完成

- 景點「交通節點＋最後一段」欄位、稚內群補資料（先用瀏覽器重讀讀不到的缺口）、routine 寫作前重查的窄權限。
- routine 還沒建立，11 月到期的重查要等 routine 啟用或手動處理。

### 唯一下一步

- 加景點「交通節點＋最後一段」欄位與檢查，再派子代理補齊稚內群資料。

## 2026-10-18 Claude Code（地端）：寫作規則整併（分支 `plan/wakkanai-outline`）

### Darren 的要求

- 規則太多怕寫不好；用 Fable 子代理優化。班次少時列時刻表、用白話說明選擇，不算精確分鐘。

### 已完成（Fable 子代理整併，Claude Code 檢查後小修）

- 新增 `writing-guide.md`（13 條原則、衝突順序、三步流程）與 `examples.md`（範例）；寫作時必讀從約 630 行降到 130 行。
- 刪除 `voice-and-seo.md`（旅行手札口吻改成導覽編輯口吻），SEO 規則併進 `heading-style.md`；其他參考檔改成只在用到的步驟讀。
- `check-voice.mjs` 搬進寫作 Skill，接進 `finalize-release.mjs`，口吻與標點不通過就不能定稿；新增 7 項測試，共 153 項通過。
- 驗收規則同步：「查不到直接說」改成「只寫能做的事」；推算數字沒附時刻表要修改。

### 尚未決定（等 Darren）

- 口吻正式改成導覽編輯；延伸資料放在「資料來源」底下或獨立一節；基本資訊欄先用表格；每個景點一張照片和選圖 Skill「不按段落配額」的取捨。

### 唯一下一步

- Darren 確認上面四點後，用渡輪頁試寫一整篇。

## 2026-10-18 Claude Code（地端）：寫作四個取捨定案（分支 `plan/wakkanai-outline`）

### Darren 的決定（都照建議）

- 口吻正式改成導覽編輯；延伸資料獨立成 `## 延伸資料`，緊接在資料來源之前；基本資訊欄用表格；照片只放重點景點。
- 討論「訓練模型」：模型本身不會記住，改進靠 Skill、範例與檢查程式；之後把 Darren 認可的段落與修改前後對照累積進 `examples.md`，只留最好的 3 到 5 篇。

### 已完成

- `audit_answer_first.py` 允許 `## 延伸資料` 放官方連結（要緊接在資料來源之前），自我測試加兩個案例；大綱檢查把「延伸資料」列為固定標題。
- 確認基本資訊欄的表格可以發布：轉換程式與網站都支援 `contentTable`。
- 寫作指南、範例、標題規範、選圖 Skill 的 `image-needs.md` 同步；範例的時刻表拆成去程與回程兩張（原本一列把無關的去回班次放在一起，容易誤讀）。
- `AGENTS.md` 記錄四個取捨與範文累積的做法。測試 153 項通過。

### 唯一下一步

- 用渡輪頁（`wakkanai-ferry`）照新規則試寫一整篇，給 Darren 看品質。

## 2026-10-18 Claude Code（地端）：渡輪頁整篇試寫與驗收（分支 `plan/wakkanai-outline`）

### Darren 的要求

- 照新規則用渡輪頁試寫一整篇，寫完經過檢查與驗收再給他看。

### 結果

- `content-production/wakkanai-ferry/`：`ready_for_user_preview`。格式 mechanical_clear、標題與讀者價值 acceptable、事實 125 項 verified、口吻檢查通過。驗收紀錄見 `review.md`。
- 經過 8 輪：作者成稿、6 個分段檢查（27 處修改）、標題檢查、事實查核 3 輪（第 1 輪抓到協調者給錯的機場巴士票價）、讀者驗收兩階段與最終判定。
- 寫作前重查：渡輪官網全部來源頁重開，只有 F44 賣店時間改變，已同步 `content-planning/hokkaido/places/wakkanai/facts.json`。之前讀不到的樓層圖與停航天數圖改用瀏覽器與圖片讀到。
- 流程修正：範例的事實編號改放在句號前（配合 `fact_tags.py`）；寫作 Skill 的延伸資料位置改成獨立一節。

### 尚未完成

- `fact_tags.py` 讓延伸資料段不要求編號；讀者驗收列的 5 個選擇性小修改等 Darren 看過再決定。
- 還沒選圖、還沒上 Sanity。

### 唯一下一步

- Darren 看 `content-production/wakkanai-ferry/reader-preview.md`，決定品質是否合格與每天篇數。

## 2026-10-18 Claude Code（地端）：潤稿 Skill 與去掉 AI 腔（分支 `plan/wakkanai-outline`）

### Darren 的要求

- 渡輪頁讀起來僵硬，另做潤稿 Skill；第2次潤稿後仍有「關鍵是」「最先要搞清楚的是兩件事」這類 AI 腔。要我自己微調、多方論證、自己試出結果；不要只用改 Skill 一種方式，用 Fable 評估別的做法；寫作不會用 Fable，正式流程用 Opus 5.5。

### 結果

- 研究記錄：`content-experiments/polish-test-2026-10-18/ai-tone-study.md`（真人語料量測、第2到第6輪、六種做法的並排比較、定案）。
- 定案流程：Opus 5.5 照潤稿 Skill（第4版加修正）潤稿 → 編輯挑錯一輪再修（`agents/editor-review.md`）→ 意義比對 → 驗收。
- 效果：兩位不同模型的評審並排比較，「像AI的程度」內容稿 55～60 → 潤稿 25～30 → 加編輯挑錯一輪 25～30（同一稿再降 15）；沒看過的利尻島交通頁 40～55 → 20～30。
- 檢查程式：`check-voice.mjs` 擋 AI 腔句型（真人 9 篇 4.7 萬字只出現 6 次）；用字頻率只提醒不擋（第4輪證明門檻會讓潤稿者換字過關）；「預約」不算進「約」；「的話」上限 2.5→3.5。`check-polish.mjs` 改成整篇比對事實、列出各小節刪重複；日文只比連續假名。`fact_tags.py` 不檢查延伸資料段。測試 155 項通過。
- 範例第0節拿掉「最需要先搞清楚的只有兩件事」「查一下就知道」；寫作指南第4、11條同步；保母等級檢查表加「日本時間、外國人姓名怎麼填、只能打日文電話時」。
- 不採用：從事實表直接重寫、事實表先去日文化、每節先口說再寫（對 Opus 退步）、再加規則或用字門檻、Fable 寫稿。

### 尚未完成

- 意義比對抓到的內容稿問題要交事實查核：利尻島住宿接送前後矛盾、租自行車價目列了10月、渡輪頁網路選位是否只限部分1等艙、「15人以上團體」怎麼訂。
- 大綱的內連句拿掉連結後讀不通（「整理在利尻島」），要改大綱的連結句寫法。
- 渡輪頁正式稿還是 `content-production/wakkanai-ferry/` 的驗收版；新流程的成品在 `content-experiments/polish-test-2026-10-18/round-6g/`，要不要換上去、再跑一次驗收，等 Darren 看過。

### 唯一下一步

- Darren 看 `round-6g/reader-preview.md`，決定口吻是否合格。

### 補充（同日稍晚）：起承轉合的架構感

- Darren 看 G 版後說還是有起承轉合的架構感。兩位評審（Opus、Fable）對照 Funliday 的診斷一致：每段都是「主題句→規則→例外→建議收尾」的小論證、每節同一個模子，根源是大綱照資料類別（航線、票價、訂票、停航、渡輪站、船上）切 H2。
- 試了兩種（Opus 5.5）：只改段落形狀（H）幾乎沒用；照旅客動線重排標題（I：挑船班→訂票→搭船當天→船上→票價→停航→渡輪站）兩位評審都判最好，架構感 75～78 → 45、自然度 3～3.5 → 4。意義比對 6 處已修。成品：`content-experiments/polish-test-2026-10-18/round-7i/reader-preview.md`。
- `check-polish.mjs` 也保護研究記錄「待補內連」表的連結句（H、I、G 三版都刪改過這種句子），新增 `tests/check-polish.test.ts`。
- 唯一下一步改成：Darren 決定稚內群的大綱要不要改成照旅客動線排（影響 24 頁的 H2／H3）。

## 2026-10-18 Claude Code（地端）：稚內群大綱照旅客動線重排（分支 `plan/wakkanai-outline`）

### Darren 的要求

- 「照旅客動線重新整理稚內群大綱，先從交通頁開始。」

### 結果

- 交通頁 5 頁（渡輪、稚內、宗谷岬、利尻島、禮文島交通）重排標題與部分改名：渡輪頁照第7輪 I 版；禮文島交通拿掉「常見問題」H2，問題併進路線巴士那節。
- 其他頁照頁型重排：主頁（值得去→幾月→排幾天→怎麼接別的地點）、住宿（先選區→各區→訂房，稚內宿泊稅移到訂房那節）、禮文島景點（從香深港往北）、利尻島景點、稚內祭典（月曆移到最前）、禮文島健行（季節與封閉先）。美食、天氣、利尻山登山原本就順，不動。
- 每頁事實集合不變；`npm run planning:check` 與測試 158 項通過。規則寫進選題 Skill 第6節、標題規範與 `AGENTS.md`。

### 尚未完成

- 渡輪頁正式稿（`content-production/wakkanai-ferry/`）還是舊結構；新結構的稿是 `content-experiments/polish-test-2026-10-18/round-7i/`，要照新大綱跑一次完整驗收（事實查核、讀者驗收）才能換上去。
- 意義比對抓到要交事實查核的內容稿問題（見上一段）。

### 唯一下一步

- 用新大綱與定案流程，把渡輪頁的 round-7i 版跑完整驗收，換成正式稿。
