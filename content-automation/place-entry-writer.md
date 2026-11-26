# 地點主頁的自動寫作流程（2026-11-25）

排定工作 `japan-travel-daily-writer` 挑到地點主頁（文章清單裡 `pageType` 是 `place-entry` 的頁）時，不照 `local-writer.md` 第 2～4 步，改照這份文件做，做完接 `local-writer.md` 第 5 步上傳。

這套流程是 2026-11-19～25 人工 session 改寫利尻島、禮文島主頁時用的。Darren 一輪一輪看過利尻島，2026-11-25 說「可以當範本」，已登記在 `.agents/skills/japan-travel-answer-first/references/page-models/place-entry/rishiri-island.md`。寫法的規則在寫作 Skill，這份文件只管順序、派誰做、卡住時怎麼辦。

- 寫法：`.agents/skills/japan-travel-answer-first/references/place-entry-page.md`（六節、最上面三樣、看點小標題、只帶過連到子頁的事）、`sentence-rhythm.md`、`writing-guide.md`。
- 吸引力審查：`.agents/skills/japan-travel-answer-first/references/place-entry-hook-review.md`。
- 讀者驗收八題：`.agents/skills/japan-travel-acceptance/references/place-entry-acceptance.md`。
- 前例：`content-production/rishiri-island/`（新寫法第一篇，`review.md` 有每一輪的經過）、`content-production/rebun-island/`（六節之後多兩節資料的過渡版）；研究與樣本在 `content-experiments/place-entry-study-2026-11-19/`。

## 什麼時候用

挑文章時照 `local-writer.md` 第 1 步的順序，挑到地點主頁，兩個前提都符合才寫：

1. **有範本**：`node scripts/page-models.mjs --for=<articleId>` 的 `ready` 是 `true`。
2. **子頁都已上線**：大綱裡 `placeId` 是這個地點、`pageType` 不是 `place-entry` 的每一頁，在 `inspect-article-queue.mjs` 的結果（`.tmp/queue-state.json`）裡都是 `published_indexable`。併進主頁的主題（規格 `decision: merge`）不算子頁。

子頁還沒全上線，就跳過這篇、往下挑，不算停放、不記進停放表；執行紀錄的「最新一輪」寫「跳過 <id>：子頁 <id>、<id> 還沒上線」。

大綱裡這個地點沒有任何子頁（東川那種一頁全包的地方）時，本檔不適用，跳過這篇，在 `content-automation/unattended-summary.md` 記一行「<id> 沒有子頁，要不要拆頁等 Darren 決定」。

## 模型與角色

| 角色 | 模型 | 備註 |
|---|---|---|
| 作者 | Sonnet 5.5（Agent 工具 `model: sonnet`） | 一篇一位，退回修改用 SendMessage 回同一位 |
| 吸引力審查、事實查核、標題檢查、讀者驗收、選圖與找貼文 | Opus 5.5（`model: opus`） | 五個角色各派一位，都不能是作者；審查者也不能是查核者 |
| 協調者（這個 session） | 不寫正文 | 寫規格、整理事實表、跑程式、組封包；要改的字退回作者，或只套用查核者給的最小改法 |

這張表只限地點主頁。Sonnet 5.5 寫、Opus 5.5 審，是照利尻島樣本結果做的預設（同一份規格 Sonnet 5.5 版比 Opus 4.6 版判斷多、景點寫得具體），Darren 2026-11-25 定案：「就確定是用 Sonnet 寫啦」。`local-writer.md` 的「寫作只用 Opus 4.6」在地點主頁以這張表為準。任何角色都不用 Fable。

協調者自己動手改的句子一樣要送查核（利尻島樣本裡，協調者改的兩句有兩處來源沒有）。協調者不得自己把 `fact-check.json` 改成通過。

## 步驟

產出放在 `content-production/<id>/`（下面叫 `<資料夾>`）。子代理一律 `run_in_background: false`，等它完整回傳、親自確認檔案存在才做下一步。

### 0. 重做大綱（協調者）

主頁的大綱一律照六節重排，寫成 `<資料夾>/spec.md`，作者、審查者、驗收者都照這一份，不照大綱 JSON 的 headings。

- 舊大綱的 H1、H2、H3 **不適用**「標題一字不改」（`local-writer.md` 第 2 步第 1 點那一條）。H1 照 `place-entry-page.md`「最上面三樣」：地名＋旅遊攻略這類類型詞＋一串讀者會搜的具體名詞，包含主要查詢；次要查詢放進 H2 或 H3。
- 舊大綱的 `mustAnswer` 逐條分兩類：屬於主頁的（值不值得去、幾月去、排幾天、和鄰近地點怎麼排）放進對應的節；屬於子頁的（依旅客類型的排法、單一店家或活動的細節、出爐時間、規定細則）不帶進來，列在 `spec.md` 的「## 交給子頁」，寫明是哪一頁負責。
- `spec.md` 的內容：每一節要回答的問題與字數上限（照 `place-entry-page.md` 的結構表）、可用的來源稿清單（下一步）、內連句清單（大綱 `links` 裡 from 是這頁的句子，能照原句用的就照原句）、交給子頁的事。規格裡舉的例子不能用這個地點的真實事實（作者會照抄成事實），要用別的地點或寫明「只是格式」。
- 地點沒有天氣頁或祭典頁時，照下面「沒有天氣頁或祭典頁的地點」在規格裡加資料節。
- 重排的結果（新的 H1 與 H2、交給子頁的條目）記進 `unattended-summary.md` 這篇的段落。大綱 JSON 由人工 session 之後同步，排定工作不改。

### 1. 來源稿與事實表（協調者）

主頁的事實只來自同一地點**已上線**子頁的 `content-production/<子頁>/reader-preview.md`、這個地點主頁的舊版（重寫時），以及鄰近地點的主頁，不重新上網查。`local-writer.md` 第 2 步第 0 點的寫作前補研究與判定（含「缺依旅客類型的排法判 thin」）在地點主頁**不適用**，也不讀競品。

- 把來源稿的路徑列進 `spec.md` 的「## 來源稿」。
- 建 `<資料夾>/reference-review.md`，格式照 `content-production/rishiri-island/reference-review.md`：事實編號沿用地點事實表 `content-planning/hokkaido/places/<地點>/facts.json`（寫成不帶前綴的 `F12`），內容從子頁的 `reference-review.md` 對應列照抄（主張、原文摘錄、網址、查閱日、條件）。鄰近地點的事實，或子頁封包裡暫編、還沒進地點事實表的事實，接在地點事實表最大編號之後暫編，備註寫「暫編，待同步」，編號記進 `unattended-summary.md`。協調者只抄列、不改主張文字。
- 來源稿沒有的畫面或賣點，不寫，記進 `<資料夾>/gaps.md`（哪一節、少了什麼、哪一頁該補）。

### 2. 作者（Sonnet 5.5）

讀 `spec.md`、`core-style.md`（先讀，Darren 要的內容長什麼樣）、`place-entry-page.md`、`writing-guide.md`、`sentence-rhythm.md`、`examples.md`、同頁型範本（`node scripts/page-models.mjs --for=<id>` 列的檔案整篇讀完，也讀 `learn`；用法照 `page-models/README.md`）、來源稿與 `reference-review.md`。

交：

- `<資料夾>/draft-tagged.md`：整篇，每句有數字、時間、條件的句子標 `[F編號]`，結尾 `## 延伸資料`（最多 5 條，只列官方頁）與 `## 資料來源`。
- `<資料夾>/publication.json`：`articleId`、`targetPath`、`seoTitle`（和 H1 相同）、`seoDescription`（120 字內）、`excerpt`（摘要，90 到 110 字，照「最上面三樣」）。
- `<資料夾>/facts-used.md`：每個事實對到來源稿的原句（哪一頁、哪一句）。
- `<資料夾>/gaps.md`：補上「來源沒有所以少寫的」。
- `<資料夾>/order-notes.md` 的 `## 和範本比`：每個 H2 對照範本裡功能相同的那一節，長度與細度差在哪、為什麼；並跑 `node .agents/skills/japan-travel-polish/scripts/check-copy.mjs <資料夾>/reader-preview.md <範本檔> --min=16`，相同片段改成自己的寫法（只是地名、景點名相同的註明即可）。
- 重寫已上線主頁時，另交 `<資料夾>/moved.md`：舊版有、新版沒寫的內容，各自在哪個子頁有沒有寫到。新地點沒有舊版，不交這個檔，也沒有這一步。

第 1 節讓作者先寫，寫完自問：一個沒去過的人讀完會不會想去？

不讀 `content-production` 其他文章的正文（範本與來源稿不在此限），不改資料夾以外的檔案，不 commit。

### 3. 程式初檢（協調者）

`python .agents/skills/japan-travel-answer-first/scripts/fact_tags.py <資料夾>`（產生 `reader-preview.md`，要 `tags_clear`），再 `node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs <資料夾>/reader-preview.md`。沒過就把訊息退回作者，改到過為止；同一個問題退三次還不過，照「停放」處理。

### 4. 吸引力審查（Opus 5.5，最多 3 輪）

照 `place-entry-hook-review.md`：只讀 `reader-preview.md`、`publication.json` 的摘要與同地點子頁的來源稿，不讀規格與作者的說明。審大標題、摘要、序言、「是什麼樣的地方」、每個看點的小標題與小段，寫 `<資料夾>/hook-review.md`（每一輪在同一個檔案往下加一節）。

- 結論是「退回作者（N 處）」就 SendMessage 回作者改，改完重跑第 3 步，再請同一位審查者審改過的地方。
- 三輪還有沒過的，那一處照 `place-entry-hook-review.md`「在流程裡的位置」的預設：找不到更強的事實，就把那個看點併進別項或拿掉，不拿空話上線。這個決定寫進 `review.md` 的「協調者的決定」。
- 通過才送事實查核。

### 5. 事實查核（Opus 5.5，最多 4 輪）

先算 `reader-preview.md` 換行統一成 LF 後的 SHA-256（指令照 `local-writer.md` 第 3 步開頭）。

查核者讀 `reader-preview.md`、`draft-tagged.md`、`reference-review.md`、`facts-used.md` 與來源稿，照 `.agents/skills/japan-travel-acceptance/references/fact-check-contract.md` 寫 `<資料夾>/fact-check.json`：逐句對來源稿原句與事實表的原文摘錄；查說過頭（「才吃得到」「最不建議」「只在夏天」是主頁最常見的錯）、條件掉了、推論不成立；也確認 `reference-review.md` 抄來的列和子頁的列一字不差。順便列出來源稿彼此對不上的地方（寫進 `fact-check.json` 的備註，正文照經營者官方的那一邊寫）。主頁的事實都是子頁已查證過的，原則上不重新上網；子頁之間對不上、或主頁的說法比子頁更強時，才打開原始網址。

跑 `node .agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs <資料夾>` 到紀錄完整。有非 verified：要改段落就 SendMessage 回作者，只差一兩個詞就套用查核者給的最小改法；改完重跑第 3 步、算新雜湊，請同一位查核者複查。第 4 輪還沒全部 verified，照「停放」處理。

### 6. 組封包（協調者，標題檢查派一位 Opus 5.5）

- **標題檢查**：派一位沒寫過這篇的子代理，讀 `spec.md`（當成這頁的大綱）、`reader-preview.md`、`publication.json` 的 seoTitle 與 `.agents/skills/japan-travel-answer-first/references/heading-style.md`，寫 `<資料夾>/heading-review.json`（格式照 `local-writer.md` 第 3 步第 1 點）。只改文字，不增刪、不改層級；地點主頁的六節與「名字｜賣點」小標題是 heading-style 允許的格式。作者照 `after` 改 `draft-tagged.md`，再跑 `python .agents/skills/japan-travel-answer-first/scripts/heading_review.py <資料夾>` 到 `headings_applied`。
- **內連句**：連到子頁的連結照 `place-entry-page.md`「連到子頁的連結怎麼放」寫成單獨一行（`看更多：[頁名](/路徑/)｜那一頁有什麼`，Darren 2026-11-26），不照大綱連結句的原句接在段落最後。正文用的連結句和大綱 `links` 原句一樣的，上線時 `link-at-publish.mjs` 會自動接上。換成新句子的，寫進 `<資料夾>/link-sentences.json`（`to`、`old`、`new`、`anchor`，格式照 `content-production/rishiri-island/link-sentences.json`），並在 `unattended-summary.md` 記「大綱連結句待同步」；大綱同步前，新句子不會自動接上連結，由人工 session 同步後補內連。
- 改過任何字都重跑第 3 步，請查核者對新雜湊複查。

### 7. 程式檢查（協調者）

全部要過：

- `node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs <資料夾>/reader-preview.md --final`
- `python .agents/skills/japan-travel-answer-first/scripts/audit_answer_first.py <資料夾>/reader-preview.md --json --article-type place-entry --reference-review <資料夾>/reference-review.md`（要 `mechanical_clear`）
- `node scripts/check-benchmark.mjs --after=<資料夾>/reader-preview.md`（`errors` 要是空的，`warnings` 只看不擋）
- `node .agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs <資料夾>`

沒過的照訊息退回作者或套用最小改法，改完回第 3 步。

### 8. 讀者驗收（Opus 5.5，最多退 4 次）

派一位沒寫過、沒查核過這篇的子代理，照 `place-entry-acceptance.md` 的八題加「和範本比」驗收，寫 `<資料夾>/acceptance-place-entry.md`。

- `needs_revision`：一定要改的 SendMessage 回作者改（作者只改驗收要求的地方），改完照第 3、5、7 步重跑，再請同一位驗收者看第二次。
- 驗收改過序言、摘要、看點小標題或小段第一句的，**改過的地方要再給吸引力審查者看一次**（第 4 步那一位），通過才送查核複查（禮文島：驗收嫌重複，作者刪到序言沒有畫面、海膽小標題變成品種名，第四輪才抓到）。
- 審查者與驗收者意見相反時，不取其中一邊：退回作者回子頁找更具體的事實重寫，兩邊的意見都留在封包裡。
- 退 4 次還沒 `acceptable`，或驗收判 `reject`，照「停放」處理。

### 9. 驗收紀錄與定稿檢查（協調者）

- 寫 `<資料夾>/review.md`，格式照 `content-production/rishiri-island/review.md`：文章與 SHA-256、規則、作者／吸引力審查／事實查核／標題檢查／讀者驗收／協調者的身分與模型、結果表（格式 `mechanical_clear`、標題 `acceptable`、讀者價值 `acceptable`、事實與條件 `verified`、口吻、名字與表格連結）、最終結果 `ready_for_user_preview`、「協調者的決定」（每個照預設做的決定都寫）、`gaps.md` 摘要、留給之後的事。
- 跑 `node scripts/local-article-gates.mjs <id>`，要印出 `gates_clear`。沒過就修到過（通常是 review.md 的 SHA 或欄位）。

### 10. 照片與貼文（一位 Opus 5.5，用瀏覽器）

照選圖 Skill `.agents/skills/japan-travel-image-finder/SKILL.md` 選封面與文內照片，貼文照 `references/embed-plan.md`。地點主頁和其他頁型不同的地方：

- **每個看點（「有什麼好玩、好吃的」底下每個 H3）一張本尊實拍**，一頁約 6 到 8 張，一節 1 張；景點與特有種的花要是本尊，料理要是當地或那家店的。同一張照片可以和子頁重複用。
- 找不到合格實拍的看點，**不放替代照片**，改放一則 Instagram 貼文：官方帳號優先，沒有才用遊客的公開貼文；`embed-plan.json` 最上層寫 `"pageType": "place-entry"`（最多 12 則、一節 1 則，同一個看點不同時放照片和貼文）。
- 找貼文用日文、多種組合，Google 搜尋每次隔 30 秒以上，遇到機器人檢查就停、不繞過，還沒試的搜尋字記下來，下一輪接著搜（`embed-plan.md` 最後兩條）。
- 照片和貼文都找不到的看點：**這一輪照樣上線，那個看點暫時沒圖**，在 `unattended-summary.md` 記「<id> 的 <看點> 還沒有圖，下一輪接著找（已試的搜尋字…）」。之後每一輪上傳前先補這些看點。不放替代照片。
- 瀏覽器的規矩照 `local-writer.md`「不做的事」：開分頁先靜音、不點下載、不在瀏覽器開影片頁、不登入、同一時間只有一位助手用瀏覽器。
- `local-writer.md` 第 5 步「一篇最多 4 張、找不到就不放、嵌入最多 2 個只用官方」在地點主頁以本節為準。封面照 `local-writer.md`：只用實拍，找不到就不上傳、記進上傳停放。

### 11. 上傳（照 `local-writer.md` 第 5 步）

定稿、封面、文內照片、嵌入、Sanity 暫存、開放索引、D1 登記都照 `local-writer.md` 第 5 步與自動發布 Skill「produce」。地點主頁的 `routeMode` 是 `hub-landing`：CI 通過後**緊接著**照 produce 第 11 步把這篇掛成父 Hub 的入口文章（`prepare-parent-hub.mjs <batchId> --set-landing`，先 dry-run 再 `--apply`），中間不做別的事；掛不上就撤回、不開放索引，照 `local-writer.md`「失敗」記錄。

重寫已上線的主頁時，換正文用 `studio` 的 `npm run publish:article-body-replace`（照片、嵌入、站內連結會搬過去；`link-sentences.json` 告訴它哪些連結句換了字）。工具說「在後台手動改過、還沒同步回 Git」就停，照 `local-writer.md`「失敗」記進上傳停放。

### 12. 記錄

照下面「每篇做完」寫進 `unattended-summary.md`，再照 `local-writer.md` 第 6 步更新執行紀錄、commit、推送、刪鎖。

## 新寫與重寫

- **新寫**（地點第一次有主頁）：沒有舊版，沒有 `moved` 這一步；第 8 題看子頁裡會影響判斷的結論有沒有帶到。
- **重寫**（已上線的主頁照新寫法改）：作者交 `moved.md`。舊版有、子頁沒有的內容，排定工作**不改已上線的子頁**：把那些內容留在主頁六節之後的資料節（標題帶地名，例如「○○各月氣溫與穿著」），在 `unattended-summary.md` 記「該補進子頁：<內容> → <子頁>」，由人工 session 補進子頁後再從主頁拿掉。改版前的封包先備份到 `<資料夾>/pre-place-entry/`。

## 沒有天氣頁或祭典頁的地點

氣溫、祭典留在主頁六節之後當資料節（照禮文島過渡版），主頁照樣做完、照樣上線。在 `unattended-summary.md` 這篇段落的**第一句**寫「該拆：缺○○頁」，附這兩節各有幾筆事實、約幾字，對照短頁門檻（15 筆、800 字）。新增頁面要 Darren 親口同意，排定工作不自己加。

## 預設做法（不用問 Darren）

| 情況 | 做法 |
|---|---|
| 來源稿沒有的畫面或賣點 | 不寫，記 `gaps.md` |
| 找不到夠強的賣點 | 那一項和別項合併，或不列 |
| 吸引力審查三輪還沒過 | 照 `place-entry-hook-review.md` 的預設併掉或拿掉那個看點 |
| 子頁之間的數字對不上 | 照經營者官方的那一邊寫；兩邊都不是經營者官方的就不寫那個數字；記進 `unattended-summary.md` |
| 名字沒有通行中文 | 照 `japanese-sources.md`「譯名表」的順序；排定工作不改 `glossary.json`，新名字記進 `unattended-summary.md` 待同步 |
| 開頭要不要加摘要小表 | 不加 |
| 沒有地圖元件 | 用文字寫清楚相對位置 |
| 大綱連結句不合新的寫法 | 寫新句、記 `link-sentences.json` 與「大綱連結句待同步」 |
| 看點找不到照片也找不到貼文 | 先上線、那個看點暫時沒圖，下一輪接著找 |
| 封面找不到合格實拍 | 照 `local-writer.md`：不上傳，記進上傳停放 |

## 要停下來留給 Darren 的事

- 只有 AI 圖可用（封面或看點）。
- 要新增子頁（例如該拆的天氣頁、祭典頁）。
- 要改已上線子頁的分工。

這三件不默許，記進執行紀錄的停放表或上傳停放表，以及 `unattended-summary.md`。其他岔路都照上面的預設做，不停下來問。

## 停放

事實查核 4 輪還沒全部 verified、讀者驗收退 4 次還沒過或判 `reject`、程式初檢同一個問題退三次還不過：review.md 最終結果寫 `parked` 與原因，執行紀錄「停放」表加一列（要誰處理寫「人工 session」），下一輪換下一篇。資料夾留著不刪。

## 每篇做完

在 `content-automation/unattended-summary.md` 加一段：網址、H1、吸引力審查與事實查核與讀者驗收各幾輪、照預設做了哪些決定（含第 0 步交給子頁的條目、暫編的事實編號、待同步的連結句與譯名）、還沒有圖的看點、該補進子頁的內容、之後要重查的日期。該拆的地點，這一段第一句寫「該拆：缺○○頁」。Darren 事後看這份摘要。

## 已接上（2026-11-25）

Darren 2026-11-25 說「接上」。`local-writer.md` 開頭與第 1 步已經把地點主頁分流到本檔，第 2 步第 0 點的主頁判定也改成指到本檔。這套流程還沒有由排定工作自己跑過一篇；第一篇跑完要看 `unattended-summary.md` 與線上頁。
