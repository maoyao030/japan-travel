# 層雲峽主頁重寫的規格（2026-11-26）

照 `.agents/skills/japan-travel-answer-first/references/place-entry-page.md` 寫。那份檔案是規則，本檔只寫層雲峽特有的事；兩邊衝突時以本檔為準。這份規格就是這一頁的大綱，大綱 JSON 裡 `sounkyo` 的舊標題不適用。

只寫進 `content-production/sounkyo/`，不動其他資料夾，不 commit。

## 讀者

還沒決定的台灣讀者：聽過層雲峽，正在想要不要排進去、幾月去、當天來回還是住一晚、跟旭岳或旭川怎麼一起排。每一句都問：這句會不會影響他去不去、幾月去、排幾天、跟哪裡一起排？不會的，是子頁的事。

## 來源稿

事實只能用下面這些稿與 `content-production/sounkyo/reference-review.md`，不上網查、不用自己的知識。這些稿沒有的事實不寫；因此寫不出來的地方就少寫，記在 `gaps.md`。

- `content-production/sounkyo/pre-place-entry/reader-preview.md`（現在線上的主頁，舊版）
- `content-production/sounkyo-transport/reader-preview.md`
- `content-production/sounkyo-hiking/reader-preview.md`
- `content-production/sounkyo-sights/reader-preview.md`
- `content-production/sounkyo-festival/reader-preview.md`
- `content-production/sounkyo-stay/reader-preview.md`
- `content-production/sounkyo-weather/reader-preview.md`
- `content-production/asahidake-or-sounkyo/reader-preview.md`、`content-production/asahidake/reader-preview.md`、`content-production/asahikawa/reader-preview.md`（只用在第 6 節與「怎麼來」）

## 結構

前六節照規則檔的結構表，開頭到第 6 節正文 2,500 到 3,500 字。第 7 節是資料節，另外算。

| 順序 | H2（文字由作者定，要帶「層雲峽」） | 要回答 | 上限 |
|---|---|---|---|
| 開頭 | 兩段 | 這是哪裡、為什麼有人專程來、幾月去、當天來回還是住一晚 | 約 180 字 |
| 1 | 層雲峽是什麼樣的地方？ | 到了會看到什麼、天氣怎樣、一天裡有什麼。寫畫面，不寫交通 | 250 到 400 字 |
| 2 | 層雲峽有什麼好玩、好吃的？ | 5 到 8 個看點，每個一個 H3（`名字｜賣點`）加兩三句 | 每項兩三句 |
| 3 | 層雲峽幾月去？ | 先一句答案，一張月份表，再一句什麼時候不適合（舊版寫到 11 月中下旬是空檔，來源有就用）。祭典只寫大約幾月、是什麼 | — |
| 4 | 層雲峽要排幾天，怎麼排？ | 先一句答案（當天來回夠不夠、什麼情況要住一晚）；三句以內的怎麼來、到了怎麼移動；3 種左右的排法，每種一個 H3、一行箭頭加最容易卡住的地方 | — |
| 5 | 層雲峽住哪一區？ | 住溫泉街還是上川站，兩三句判斷。不列旅館、不寫家數、不寫住宿稅 | 兩三句 |
| 6 | 層雲峽和旭岳怎麼一起排？ | 只能去一個選哪個、都去怎麼接；從旭川出發的關係一兩句 | 每件事一兩句 |
| 7 | 層雲峽溫泉街與上川町美食（資料節，見下） | 溫泉街與上川吃什麼、冬天晚上哪裡吃 | 不限 |
| 結尾 | `## 延伸資料`、`## 資料來源` | — | 延伸資料最多 5 條，只列官方頁 |

### 第 4 節要留住的排法結論

這是主頁獨有、別頁沒有合起來講的事，舊版有、來源對得上的要留在顯眼位置：

- 回旭川的直達末班車很早，當天來回的行程要照它排。
- 冰瀑祭的煙火和回程末班車接不上，平日開場時間也晚，想看煙火要住一晚。
- 紅葉季想搭一早的纜車，從旭川搭頭班巴士趕不上，要前一晚住溫泉街。
- 冬天自駕翻山往道東的兩條路可能臨時封路。

每種排法只寫用得到的那一兩班車，不放完整時刻表；班次、票價、買票、管制日期與預約的細節連到子頁。

### 第 7 節：層雲峽溫泉街與上川町美食（資料節）

層雲峽沒有美食頁，溫泉街與上川町的店家資料目前只寫在主頁，這些內容不能消失。

- H2 用「層雲峽溫泉街與上川町美食」（次要查詢「上川町美食」要原樣出現在標題）。
- 沿用舊版「層雲峽溫泉街與上川町美食」整節的內容：兩張店家表（每一格的事實照舊版，不改數字）、冬天晚上還開的店、上川站周邊的拉麵與起司工房。可以重排、刪掉重複的話、把句子寫順，**事實一筆都不能少**。H3 可以沿用舊版的兩個，也可以調整文字。
- 這一節是資料節，不用寫得吸引人，寫清楚就好；可以照舊版寫當年的日期與時間。
- 第 2 節如果列了吃的看點，小段最後指到第 7 節（同一頁，寫「下面的…一節」這類話，不用連結），不要整段重複第 7 節的內容。

## 標題

- H1：照規則檔「最上面三樣」（地名＋旅遊攻略這類類型詞＋一串讀者會搜的具體名詞），必須包含「層雲峽」，不用冒號，不寫成三連問，不承諾頁面沒有的東西。
- 整棵標題樹裡要出現「層雲峽溫泉」「上川町美食」各至少一次（放在 H1、H2 或 H3 都可以）。
- H2 帶「層雲峽」。看點小標題是 `名字｜賣點`，賣點照規則檔「有什麼好玩、好吃的怎麼寫」，寫完自問：別的地方的同類東西能不能也這樣講？
- 不設「常見問題」，不設「依旅客類型」一節（排法併進第 4 節）。

## 交給子頁（舊大綱的 mustAnswer 怎麼分）

| 舊大綱的 mustAnswer | 這一版放哪 |
|---|---|
| 層雲峽是什麼地方、值得去嗎 | 開頭、第 1 節 |
| 從旭川當天來回或住一晚 | 第 4 節 |
| 幾月去（紅葉、冰瀑祭、雪季） | 第 3 節 |
| 溫泉街與上川吃什麼、冬天晚上哪裡吃 | 第 7 節資料節 |
| 和旭岳怎麼選 | 第 6 節；兩地的詳細比較與縱走在 `asahidake-or-sounkyo` |
| 依旅客類型怎麼排 | 併進第 4 節，每種一行箭頭加卡住的地方；班次、票價、營業時間交給子頁 |

細節各自的負責頁：巴士班次、車資、網路票、Sunrise號、銀泉台管制與包車、自駕路況 → `sounkyo-transport`；纜車吊椅時間與票價、黑岳登山、滑雪場 → `sounkyo-hiking`；瀑布、大函、紅葉谷、黑岳之湯、導覽團、沒車怎麼去 → `sounkyo-sights`；冰瀑祭的日期、門票、煙火時間、穿著、火祭與紅葉點燈 → `sounkyo-festival`；旅館、接駁巴士、含晚餐方案、住宿稅 → `sounkyo-stay`；各月氣溫、積雪、紅葉時期 → `sounkyo-weather`。

## 站內連結

只連到來源稿對應的頁面，路徑：

- `/places/sounkyo/transport/`、`/places/sounkyo/hiking/`、`/places/sounkyo/sights/`、`/places/sounkyo/festival/`、`/places/sounkyo/stay/`、`/places/sounkyo/weather/`
- `/places/asahidake/asahidake-or-sounkyo/`、`/places/asahidake/`、`/places/asahikawa/`

每個子頁至少連到一次。連結句寫讀者什麼時候需要、那頁有什麼，不要每句都是「如果要…可以看…那一頁」。舊大綱的連結句（下面）能照原句用就照原句用，上線時會自動接上連結；不合新寫法的就寫新句，並在 `link-sentences.json` 記 `to`、`old`、`new`、`anchor`（格式照 `content-production/rishiri-island/link-sentences.json`）。

| 連到 | 舊大綱的連結句 | 錨點文字 |
|---|---|---|
| sounkyo-transport | 想先在網路買好車票，或要對照每一班的發車時刻，層雲峽交通列了全部班次與網路票的買法。 | 層雲峽交通 |
| sounkyo-transport | 要搭接駁巴士前往，層雲峽交通寫了費用與預約網站。 | 層雲峽交通 |
| sounkyo-hiking | 打算從七合目繼續登頂，或想先查好纜車與吊椅的票價，可以看層雲峽纜車與黑岳登山，營業時間和登山路線也都在裡面。 | 層雲峽纜車與黑岳登山 |
| sounkyo-sights | 沒開車又想把瀑布和大函都排進去，層雲峽景點那一頁寫了兩處各自怎麼去。 | 層雲峽景點 |
| sounkyo-festival | 想先知道煙火幾點放、會場怎麼走，層雲峽冰瀑祭把日期、交通與煙火時間列在同一頁。 | 層雲峽冰瀑祭 |
| sounkyo-stay | 溫泉街的旅館離纜車多遠、哪幾家有接駁巴士，比較寫在層雲峽住宿。 | 層雲峽住宿 |
| sounkyo-stay | 冬天打算住溫泉街，又擔心晚上沒地方吃，層雲峽住宿也談到要不要訂含晚餐的方案。 | 層雲峽住宿 |
| sounkyo-weather | 要依月份抓穿著，層雲峽天氣與楓葉有各月的氣溫、積雪與紅葉時期。 | 層雲峽天氣與楓葉 |
| asahidake-or-sounkyo | 兩邊都想去、要決定先後或住哪一邊，旭岳與層雲峽怎麼選比較了兩地的差別，也寫了怎麼排在同一趟。 | 旭岳與層雲峽怎麼選 |
| asahikawa | 從札幌或機場過來、想前一晚先住在轉車的城市，旭川那一頁整理了轉乘方式與住宿。 | 旭川 |

正文裡的連結直接寫成 `[錨點文字](/路徑/)`。

## 事實編號

- `content-production/sounkyo/reference-review.md` 是舊版主頁的研究記錄，事實表已有 F1～F477 的一部分。正文每一句有數字、時間、條件的句子標 `[F編號]`，編號用這張表的。
- 要用的事實在這張表找不到、但子頁的來源稿有寫：到那個子頁的 `reference-review.md` 找出對應的列，**逐字複製**到本頁 `reference-review.md` 最後新增的一節 `## 地點主頁改版新增（2026-11-26）`（表頭照原事實表的九欄），編號從 **F600** 往下編，「採用決定」欄寫「複製 <子頁資料夾> 研究記錄 F編號；暫編，待同步」。只複製、不改主張文字。
- 子頁的研究記錄也找不到對應列的事實，不寫，記進 `gaps.md`。

## 寫法

先讀規則檔全文，再讀同一個 references 資料夾的 `writing-guide.md`、`sentence-rhythm.md`、`heading-style.md`、`examples.md`，以及範本 `page-models/place-entry/rishiri-island.md`（整篇讀完；用法照 `page-models/README.md`：學整篇的輕重與每節寫到多細，不抄句子、不拿事實）。

- 第 1 節先寫，寫完自問：一個沒去過的人讀完會不會想去？
- 名字照 `content-planning/glossary.json`；表裡沒有的沿用來源稿的寫法並記在 `gaps.md`。名字第一次出現寫「中文（日文原名）」，之後只寫中文；標題與表格只寫中文。
- 不用「我」「小編」，不假裝去過。不用絕美、夢幻、療癒、必吃這類形容詞。
- 用台灣說法（單程、來回、停駛、門票、車資）。
- 第 1 到 6 節不寫今年或明年的具體日期，只寫每年大約什麼時候；第 7 節照舊版。
- 一句最多 4 個逗號。
- 來源稿彼此對不上的數字，照經營者官方的那一邊寫，並列在 `gaps.md`。

## 要交的檔案（都放在 `content-production/sounkyo/`）

1. `draft-tagged.md`：整篇，`# H1` 開頭，有數字、時間、條件的句子標 `[F編號]`，結尾 `## 延伸資料`（最多 5 條，只列官方頁，格式照舊版）與 `## 資料來源`（從舊版主頁與用到的子頁抄，用到哪些來源列哪些）。
2. `publication.json`：`articleId`（`sounkyo`）、`targetPath`（`/places/sounkyo/`）、`seoTitle`（和 H1 相同）、`seoDescription`（120 字內）、`excerpt`（摘要，90 到 110 字，照規則檔「最上面三樣」）。
3. `facts-used.md`：新版每一個事實一列：新版句子片段｜來源稿檔名｜來源稿原句片段。
4. `moved.md`：舊版主頁有、新版沒寫的內容：內容一句話｜哪個子頁已經有（檔名與原句片段）｜或「子頁沒有」。
5. `gaps.md`：因為來源沒有而少寫的、譯名表沒有的名字、來源稿對不上的地方、你覺得規格不合理的地方。
6. `order-notes.md`：`## 和範本比`，每個 H2 對照範本裡功能相同的那一節，長度與細度差在哪、為什麼。
7. `link-sentences.json`：換了字的連結句。

寫完跑下面兩個指令，沒過的改到過；改不過的列在 `gaps.md`：

```
python .agents/skills/japan-travel-answer-first/scripts/fact_tags.py content-production/sounkyo
node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs content-production/sounkyo/reader-preview.md
```

再跑 `node .agents/skills/japan-travel-polish/scripts/check-copy.mjs content-production/sounkyo/reader-preview.md .agents/skills/japan-travel-answer-first/references/page-models/place-entry/rishiri-island.md --min=16`，和範本相同的片段改成自己的寫法。
