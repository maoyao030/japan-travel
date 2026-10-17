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
