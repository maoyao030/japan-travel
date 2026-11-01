# 潤稿紀錄：asahikawa-stay（重寫稿，2026-11-01）

重寫稿的潤稿。潤稿前的版本是 `before-draft-tagged.md`、`before-reader-preview.md`（重寫前的線上版在 `pre-rewrite/`；2026-10-26 那一輪的潤稿紀錄在 Git 歷史裡）。照 `.agents/skills/japan-travel-polish/SKILL.md` 第 1～3 步，先刪再調。連結句（`link-sentences.json` 兩句與大綱「旭川自由行怎麼排」那句）一字未動；`rewrite-carry.json` 的三個錨文字都還各出現一次；`media` 是空的，沒有段落數限制。

## 刪掉的事實

這次沒有整筆刪掉事實。作者重寫時已經刪了 HOTEL AMANEK 的開幕年份與早餐會場、款待券價格；剩下的事實都是區域、離車站多遠、巴士、溫泉、早餐、訂房管道與住宿稅，會影響讀者選哪一間或怎麼付。Dormy Inn「露天風呂引地下1,200公尺的溫泉」考慮過刪，但它和頂樓溫泉同在 F136，只刪一部分會讓 check-polish 報數字遺失，留著。

## 跨段刪掉的重複

- 市中心 H3 第一句「這三間走到車站都要13到15分鐘，換來的是機場巴士直接坐到附近[F135, F411, F412]」刪掉：13到15分鐘在開頭、區域那節、推薦 H2 開頭都講過，下面三間也各自寫了分鐘數與機場巴士；F135、F411、F412 同一節還在。

## 主要改動（調）

- 開頭：行程那句加「因為」，寫出住站前最順的理由是巴士在站前上車。
- 區域那節：Art 與 Dormy Inn 位置、兩間的車程拆成兩句；「缺點是」改「不過」；「只是…的話」改成「如果只從機場進出，…」，「只」保留。
- 款待券：「本篇12間」改「下表12間」，不寫文章本身；「最省事」單獨一句，名單接在下一句；「住這幾間時」改「住這四間的人」。
- 推薦 H2 開頭：先講照遠近排，再講兩區各幾間。
- JR Inn：從飯店本身起頭（直結），讀者情況接在後面。
- 站前飯店：Y's Hotel 改成「站前這幾間裡，Y's Hotel旭川站前離車站最近」（範圍限在這一節，JR Inn 直結另成一節）；泡湯那句原本四個逗號，拆成「哪四間有大浴場」與「CABIN天然溫泉、AMANEK在頂樓」兩句；Seicomart 與一條通的早餐是兩件不相干的事，拆開，第二句寫出「Route Inn一條通那間」，不讓主詞留在前一句。
- 訂房管道：上架與冬天營業拆成兩句，F413 兩句都帶（Trip.com 上架與冬天營業都是它）；Agoda 那段從讀者動作起頭。

## 新加的推論句

- 「…住車站周邊最順，因為往動物園、旭岳與機場的巴士都在站前上車」：原稿已把兩件事放在同一句，只加「因為」寫出關係。
- 「站前這幾間裡，Y's Hotel旭川站前離車站最近」：原稿是「想住得離車站最近，Y's Hotel…走路約1分鐘」；同節 KOKO、Route Inn Grand 2分、CABIN、AMANEK 3分、一條通5分（F402～F407），1分鐘最短。範圍寫明「站前這幾間裡」，不跟直結的 JR Inn 比。請意義比對確認。

## 四項檢查

- `check-polish.mjs before-draft-tagged.md draft-tagged.md --article=asahikawa-stay --outline=content-planning/hokkaido/hokkaido-asahikawa-outline.json`：通過（3 句內連句）。
- `fact_tags.py`：`tags_clear`（事實表 35 筆，正文用到 32 筆，和潤稿前相同）。
- `audit_answer_first.py --article-type aspect-page --reference-review`：`mechanical_clear`（待判讀和潤稿前相同：沒有常見問題區、住宿稅金額沒寫含稅未稅）。
- `check-voice.mjs --final`：通過（正文 2,384 字）。
- `check-modifiers.mjs`：3 處次數不同，都是刪掉的重複句與加「因為」的那句；「主要」一度改成「以…為主」，已改回「主要」；Agoda 那句一度加了「要」，已拿掉。
- 錨文字：正文「旭川自由行怎麼排」「旭川交通」「旭山動物園」各 1 次（「旭山動物園」另兩次在資料來源網頁標題，潤稿前就有）。
