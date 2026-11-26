# 天氣頁的自動寫作流程（2026-11-26）

排定工作 `japan-travel-daily-writer` 挑到天氣頁（文章清單裡 `pageType` 是 `aspect-page`、主題是 `weather`，網址結尾 `/weather/`）時，不照 `local-writer.md` 第 2～4 步，改照這份文件做，做完接 `local-writer.md` 第 5 步上傳。

這套流程是 2026-11-26 人工 session 做〈禮文島天氣〉樣本時用的。Darren 先同意結構提案，再一節一節看過樣本，整篇看完說「可以，寫成規則並準備上線」。寫法的規則在寫作 Skill，這份文件只管順序、派誰做、卡住時怎麼辦。

- 寫法：`.agents/skills/japan-travel-answer-first/references/weather-page.md`（結構、兩張表、開頭先介紹這個地方、最容易說過頭的地方）、`writing-guide.md`、`sentence-rhythm.md`、`examples.md` 第 6 節。
- 偏好審查：`.agents/skills/japan-travel-answer-first/references/preference-review.md`。
- 讀者驗收八題：`.agents/skills/japan-travel-acceptance/references/weather-acceptance.md`。
- 前例：`content-production/rebun-island-weather/`（`spec.md`、每一輪的 `fact-check.json`、`preference-review.md`、`acceptance-weather.md`、`review.md`）；研究與兩版樣本在 `content-experiments/weather-page-study-2026-11-24/`。

## 什麼時候用

挑文章時照 `local-writer.md` 第 1 步的順序，挑到天氣頁，兩個前提都符合才寫：

1. **有範本**：`node scripts/page-models.mjs --for=<articleId>` 的 `ready` 是 `true`。沒有範本就跳過、往下挑（`local-writer.md` 第 1 步的通則）。
2. **同地點的主頁已有可用的事實**：開頭介紹這個地方要用地點事實表裡主頁的事實。主頁還沒寫也沒關係，只要地點事實表（`content-planning/hokkaido/places/<地點>/facts.json`）有這個地方的身分、位置、招牌景色的事實；沒有就在第 1 步補研究。

## 模型與角色

| 角色 | 模型 | 備註 |
|---|---|---|
| 研究者 | Opus 5.5（`model: opus`） | 補事實；不是作者 |
| 作者 | Sonnet 5.5（`model: sonnet`） | 一篇一位，退回修改用 SendMessage 回同一位 |
| 事實查核、偏好審查、讀者驗收、標題檢查、選圖 | Opus 5.5 | 各派一位，都不能是作者；偏好審查者也不能是查核者或驗收者 |
| 協調者（這個 session） | 不寫正文 | 寫規格、整理事實表、跑程式、組封包；要改的字退回作者，或只套用查核者、審查者給的最小改法 |

這張表只限天氣頁。依據：樣本用 Opus 4.6 與 Sonnet 5.5 各寫一版，Sonnet 5.5 初稿約 4 分鐘、空話少；Darren 看了兩版後說「我覺得你可以參考一下我前兩個範例我對他要求的偏好」（住宿頁、地點主頁都是 Sonnet 5.5 寫、Opus 5.5 審），協調者照這句話定成同一個組合，他沒有反對。`local-writer.md` 的「寫作只用 Opus 4.6」在天氣頁以這張表為準。任何角色都不用 Fable。

協調者套用的每一處最小改法都要送事實查核複查。協調者不得自己把 `fact-check.json` 改成通過。

## 步驟

產出放在 `content-production/<id>/`（下面叫 `<資料夾>`）。子代理等它完整回傳、親自確認檔案存在才做下一步。

### 0. 重做大綱（協調者）

天氣頁的標題一律照 `weather-page.md` 的結構重排，寫成 `<資料夾>/spec.md`（格式照 `content-production/rebun-island-weather/spec.md`）。作者、審查者、驗收者都照這一份。

- 舊大綱的 H1、H2、H3 **不適用**「標題一字不改」。H2 照結構表，第 3、4 節的標題用這個地方實際的事，先後照這個地方的主角排；沒有的那一節不設。
- H1 照 `weather-page.md`「最上面三樣」的結構，由作者寫、偏好審查者看；要包含主要查詢。
- 舊大綱的 `mustAnswer` 逐條放進對應的節；屬於別頁的（改票、旅館休館日、景點開放時間、祭典日期）列在 `spec.md` 的「交給別頁、這頁不寫的」，寫明哪一頁負責。
- 內連句：大綱 `links` 裡 from 是這頁的句子列進 `spec.md`，可以照用或改寫。連回主頁的那一條不另寫句子，改成開頭第一個地名直接連回主頁。
- 規格裡舉的例子不能用這個地點的真實事實（作者會照抄成事實）。
- 重排的結果記進 `unattended-summary.md`。大綱 JSON 由人工 session 之後同步，排定工作不改。

### 1. 研究與事實表（研究者）

照 `local-writer.md` 第 2 步第 0 點補研究，天氣頁要有的事實：

- **這個地方的 12 個月平年值**：月平均日最高、日最低（氣象廳），以及雨量、日照、風速（寫進事實表，正文只用得到一兩句）。
- **台北的對照**：中央氣象署「氣候月平均」臺北站 1991～2020 的月平均最高、最低氣溫（頁面要執行 JavaScript，用瀏覽器讀；資料檔在 `/V8/C/C/Statistics/MonthlyMean/MOD/Taiwan_meantxmax.html`、`Taiwan_meantxmin.html`）；中央氣象署對寒流的定義（數位科普網〈小石虎的寒流問題〉）。這三筆每個地點的事實表各記一次。
- **推算表**：最熱的月份像台北幾月、哪幾個月比台北最冷的月還冷、早晚低於 10℃ 的月份、同月相差幾度。每條寫算法與依據。
- **天氣怎麼打亂行程**：交通經營者公布的停航、停駛資料（有各月數字最好），停了怎麼知道。
- **這裡才有的天氣**：官方對現象的說明（幾月、什麼條件、在哪看）。
- **季節性的說法**：自治體、氣象台對各季的描述（幾月霧多、幾月開始積雪）。
- **開頭介紹這個地方用的事實**：從同地點主頁的研究紀錄照抄事實列（名號、招牌景色、位置）。
- **四季總表「看得到什麼」用的事實**：從主頁照抄（花期、漁期）；不夠五列裡的四列，就不設這一欄。

判定：平年值、台北對照、推算表三樣缺一就不寫（停放）；「打亂行程」與「這裡才有的天氣」兩節都沒有事實，這頁太薄，照短頁規則併進主頁，記進 `unattended-summary.md`。

來源打不開（網站掛了、存檔也讀不到）的事實不能用：換一個打得開的官方來源，換不到就不寫，記進 `<資料夾>/gaps.md`。

### 2. 作者（Sonnet 5.5）

讀 `spec.md`、`weather-page.md`、`writing-guide.md`、`sentence-rhythm.md`、`examples.md` 第 6 節、同頁型範本（`node scripts/page-models.mjs --for=<id>` 列的檔案整篇讀完，也讀 `learn`；用法照 `page-models/README.md`）與 `reference-review.md`。不讀其他文章的正文，不上網。

交：

- `<資料夾>/draft-tagged.md`：整篇，每句有數字、時間、期間、條件的句子標 `[F編號]`，表格每列在最後一格標；結尾 `## 延伸資料`（最多 4 條，只列官方頁、只列打得開的）與 `## 資料來源`（第一行說明兩邊的觀測站與統計年份）。
- `<資料夾>/publication.json`：`articleId`、`targetPath`、`seoTitle`（和 H1 相同）、`seoDescription`（120 字內）、`excerpt`（90 到 110 字）。
- `<資料夾>/gaps.md`：想寫但事實表沒有、所以沒寫的事。
- `<資料夾>/order-notes.md` 的 `## 和範本比`，並跑 `check-copy.mjs`（照 `page-models/README.md`）。

不改資料夾以外的檔案，不 commit。

### 3. 程式初檢（協調者）

`python .agents/skills/japan-travel-answer-first/scripts/fact_tags.py <資料夾>`（要 `tags_clear`），再 `node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs <資料夾>/reader-preview.md`。沒過就退回作者；同一個問題退三次還不過，照「停放」處理。

### 4. 事實查核（Opus 5.5，最多 4 輪）

照 `.agents/skills/japan-travel-acceptance/references/fact-check-contract.md` 寫 `<資料夾>/fact-check.json`。天氣頁特別要查：

- **推算與加總**全部重算（幾天、幾成、差幾度）。
- **換算成台北的話**拿兩邊的表對一次，也看有沒有說輕。
- **說過頭**：`weather-page.md`「最容易說過頭的地方」那幾類（最多最少、有這樣的日子、單一年的公告、推論）。
- 四季總表每一格、摘要、seoDescription、大標題。
- 資料來源每條連結打不打得開、標題是不是那一頁真正的標題。
- 預報頁這類要操作的畫面，用瀏覽器實際打開確認畫面上的字。

跑 `node .agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs <資料夾>` 到紀錄完整。有非 verified：要改段落就 SendMessage 回作者，只差一兩個詞就套用查核者給的最小改法；改完重跑第 3 步、算新雜湊，請同一位查核者複查。`unreachable` 的事實照第 1 步的規則換來源或拿掉。第 4 輪還沒全部 verified，照「停放」處理。

### 5. 偏好審查（Opus 5.5，最多 3 輪）

照 `preference-review.md`：審查者只讀 `reader-preview.md` 與 `publication.json`，拿 Darren 講過的話逐句審，寫 `<資料夾>/preference-review.md`。

- 退回作者改，改完重跑第 3 步，**改過的句子送事實查核複查**（改語氣會改到強度），再請同一位審查者看。
- 大標題由審查者判斷是不是 `weather-page.md` 的結構；不是就退回作者照結構重寫，不停下來問 Darren。
- 第 3 輪還剩的：只差一兩個詞就套用審查者示範的改法（一樣要查核）；要改段落的照「停放」處理。

### 6. 讀者驗收（Opus 5.5，最多退 4 次）

派一位沒寫過、沒查核過、沒審查過這篇的子代理，照 `weather-acceptance.md` 的八題驗收，寫 `<資料夾>/acceptance-weather.md`。

- `needs_revision`：一定要改的 SendMessage 回作者，改完照第 3、4 步重跑；改到序言、摘要、定調的，再給偏好審查者看一次。
- 驗收者與偏好審查者意見相反時，不取其中一邊：退回作者用事實重寫，兩邊的意見都留在封包裡。
- 退 4 次還沒 `acceptable`，或判 `reject`，照「停放」處理。

### 7. 標題檢查與程式檢查（協調者，標題檢查派一位 Opus 5.5）

- 標題檢查：讀 `spec.md`（當成這頁的大綱）、`reader-preview.md`、`publication.json` 的 seoTitle 與 `heading-style.md`，寫 `<資料夾>/heading-review.json`，再跑 `heading_review.py` 到 `headings_applied`。
- 全部要過：`check-voice.mjs --final`、`audit_answer_first.py --json --article-type aspect-page --reference-review <資料夾>/reference-review.md`（要 `mechanical_clear`）、`node scripts/check-benchmark.mjs --after=<資料夾>/reader-preview.md`（`errors` 空）、`validate-fact-check.mjs`。
- 改過任何字都重跑第 3 步，請查核者對新雜湊複查。

### 8. 驗收紀錄與定稿檢查（協調者）

寫 `<資料夾>/review.md`（格式照 `content-production/rebun-island-weather/review.md`），跑 `node scripts/local-article-gates.mjs <id>`，要印出 `gates_clear`。

### 9. 照片與上傳

**封面單獨派、先交**：封面會擋上線，文內照片與嵌入不會。先派一位只找封面（已核准過的同地點照片、自治體官方素材庫優先，最快），封面一到就接上傳；文內照片與嵌入另外派，上線後再補傳也可以（2026-11-26：一位助手同時找三樣，15 分鐘沒交出任何檔案）。

其餘照 `local-writer.md` 第 5 步：封面只用實拍；文內照片最多 4 張、一節最多 1 張，只放讀者看了有用的（這裡才有的天氣現象、會停的交通據點）；嵌入最多 2 個、Instagram 只用官方。不放穿搭照。找不到合格實拍的位置就不放，不因為缺文內照片停放；缺封面照 `local-writer.md` 記進上傳停放。

### 10. 記錄

照下面「每篇做完」寫進 `unattended-summary.md`，再照 `local-writer.md` 第 6 步收尾。

## 預設做法（不用問 Darren）

| 情況 | 做法 |
|---|---|
| 事實表沒有的穿著單品（發熱衣、冰爪、雪靴） | 不寫，記 `gaps.md` |
| 「看得到什麼」五列空兩列以上 | 不設這一欄，花與現象放進定調 |
| 來源網站打不開、查核者無法重開 | 換打得開的官方來源；換不到就拿掉那幾句，記 `gaps.md`，延伸資料也不放那個網址 |
| 觀光機構的概括說法和平年值對不上 | 照平年值 |
| 沒有「這裡才有的天氣」或沒有「打亂行程」的事實 | 那一節不寫；兩節都沒有就併進主頁 |
| 同一份資料兩個地點都用得到（共用航線的停航天數） | 兩頁都放結論與一張表，改票方法只寫在交通頁 |
| 大標題不合結構 | 退回作者照 `weather-page.md` 的結構重寫 |
| 字數不到 1,300 但驗收說讀者沒少東西 | 不補字 |
| 名字沒有通行中文 | 照 `japanese-sources.md`「譯名表」；排定工作不改 `glossary.json`，記進 `unattended-summary.md` 待同步 |
| 大綱連結句不合新的寫法 | 寫新句，記 `link-sentences.json` 與「大綱連結句待同步」 |

## 要停下來留給 Darren 的事

- 只有 AI 圖可用。
- 這頁太薄、要併進主頁（改已上線頁面的分工）。
- 要改已上線的其他頁面（例如兩頁的說法對不上）。

這三件記進執行紀錄的停放表與 `unattended-summary.md`。其他岔路都照上面的預設做，不停下來問。

## 停放

事實查核 4 輪還沒全部 verified、偏好審查 3 輪後還有要改段落的、讀者驗收退 4 次還沒過或判 `reject`、程式初檢同一個問題退三次：`review.md` 最終結果寫 `parked` 與原因，執行紀錄「停放」表加一列（要誰處理寫「人工 session」），下一輪換下一篇。資料夾留著不刪。

## 每篇做完

在 `content-automation/unattended-summary.md` 加一段：網址、H1、事實查核／偏好審查／讀者驗收各幾輪、照預設做了哪些決定、`gaps.md` 摘要（尤其來源打不開而沒寫的）、之後要重查的日期（平年值 2031 年改版、交通經營者每年更新的統計）。Darren 事後看這份摘要。

## 第一篇的結果（2026-11-26）

〈禮文島天氣〉照這份流程由人工 session 做完並上線，Darren 說「把這個也列成範本」，已登記。這次在雲端環境做，沒有 D1 的權限，所以 D1 的登記（`ops-article`、`ops-links register`、`ops-facts sync`）沒做，等本機 session 或排定工作補登記；新事實 F677～F680 也還沒進 D1。

## 還沒接上的

- 這套流程還沒有由排定工作自己跑過一篇；第一篇跑完要看 `unattended-summary.md` 與線上頁。排定工作仍暫停，啟用只由 Darren 決定。
- 已上線的四篇天氣頁（利尻島、旭川、層雲峽、稚內）是舊寫法，要不要照這份重寫還沒問 Darren。
