---
name: japan-travel-polish
description: Polish (with Opus 5.5) a fact-checked Japan travel article draft so it reads like a Taiwanese travel editor explaining to a friend, without changing any fact. Works from a short list of principles plus Darren-approved example paragraphs (references/examples.md), not numeric targets. Keeps every number, time, price, fact tag, heading, table and internal-link sentence and every modifier (要、可能、約、只、都…), then is verified by check-polish.mjs, check-voice.mjs --final and a separate meaning-drift reviewer. Use as the polish step before acceptance.
---

# 日本旅遊長尾站潤稿

2026-10-30 Darren 比較三種潤稿做法（見 `content-experiments/polish-compare-2026-10-30/README.md`），選了「短原則加範例」這一種：不給數字目標，不叫潤稿者對答案，只講原則、給好段落看。之前那一版（長規則、句長與用字頻率門檻、讀參考文章、編輯挑錯一輪）留在 Git 歷史裡。

內容稿已經正確、完整，但讀起來像資料表拆成句子。潤稿讓它像一位熟悉當地的台灣旅遊編輯在跟朋友解釋怎麼排。**事實一個都不改，也不多加。**

## 一定要遵守

1. 事實一個都不改、不多加：數字、時間、價格、日期、電話全部照原文；不加原文沒有的評價、建議或資訊（「是個好選擇」「輕鬆」「中小型」都算加）。
2. 修飾詞照原文：要、可能、約、原則上、只、都、每天、主要、目前、建議，不能加也不能拿掉。「可能停駛」不寫成「會停駛」，「要出示證件」不寫成「出示就可以了」。「要」換成「得」可以，意思一樣強。
3. 出處照留：「觀光協會的地圖標了」「北海道觀光機構寫」「宗谷巴士說」這類句子，不能改成本站自己的斷言。表格下面說明時刻來自哪張表的句子也留著。
4. 標題（#、##、###）與層級一字不改；表格內容不改；事實編號 `[F12]` 跟著它說明的句子走，放在句號前。
5. 大綱內連表的連結句（「如果還要從札幌先到旭川站，可以看另外整理的旭川交通」）一字不改。
6. 名稱照 `content-planning/glossary.json`：第一次寫「中文寫法（日文原名）」，之後只寫中文；日文只留在括號與「」裡。日文漢字詞用台灣說法（檢討→評估、運休→停駛或停航、運賃→車資、料金→費用、割引→折扣、片道→單程、往復→來回、見学→參觀、混雑→擁擠、入場料→門票）。
7. 不用「先看結論」「重點整理」「懶人包」這類制式摘要，也不加新的段落標題。

## 怎麼改

- 重要的放前面直接講，不先宣布「關鍵是…」「有兩件事要注意」「第一…第二…」。
- 句子從讀者想做的事開始，不用名詞標籤開頭；不寫查資料的過程（「手冊上標示為」）。
- 連續的動作串成一句；節奏有長有短。
- 少用「所以」「記得」「…的人」，不要每段都用提醒收尾；不分類讀者，改成「…的話」。
- 同一件事只講一次。

**沒有字數、句長、逗號或用字次數的目標。** 讀起來順、意思沒變就好。

## 流程

1. 讀內容稿的 `draft-tagged.md`、研究記錄的事實表、大綱裡這一頁的內連句，以及 `references/examples.md`（Darren 認可的段落）。
2. 先把 `draft-tagged.md`、`reader-preview.md` 各複製成 `before-draft-tagged.md`、`before-reader-preview.md`，再照上面的原則改寫 `draft-tagged.md`。另寫 `polish-notes.md`，列出所有新加的推論句與跨節刪掉的重複。
3. 跑檢查，直到通過：
   - `node .agents/skills/japan-travel-polish/scripts/check-polish.mjs <潤稿前> <潤稿後> --article=<articleId>`：數字、日文、事實編號、標題、表格、內連句。
   - 寫作 Skill 的 `fact_tags.py <資料夾>`（產生 `reader-preview.md`）、`audit_answer_first.py <reader-preview.md> --article-type <頁型> --reference-review <研究記錄>`、`check-voice.mjs --final <reader-preview.md>`（只擋 AI 腔句型、括號外的日文與日式漢字詞、「官方沒寫」這類用字；數字只記錄）。
4. **意義比對**：派一個沒參與潤稿的子代理，照 `agents/meaning-drift.md` 做。先給它 `node .agents/skills/japan-travel-polish/scripts/check-modifiers.mjs <before-reader-preview.md> <reader-preview.md>` 的輸出當線索（修飾詞前後次數不同的句子；只是線索，次數變了不一定錯）。
5. 潤稿者只改意義比對列出的「不可接受」與「遺失」，盡量保留潤稿後的寫法，再重跑第 3 步。
6. 交給驗收。事實查核只需要重看新加的推論句與被改到的句子。

## 推論的界線

- **可以推的**：時刻表推出「錯過末班船當天回不了」；「2等不對號」推出「不在意座位的話2等就夠」。理由寫在同一句、而且是事實的輕微建議可以用。
- **不能推的**：營業時間沒寫的設施不建議「在這裡吃飯」；兩個選項的「比較好」「最方便」要有事實比較兩邊；「唯一」「一定」「很多」要有事實或數字撐。
- **不能前後矛盾**：改完整段重讀一次。

## 範例怎麼累積

Darren 看過、說好的段落，照「改前／改後」加進 `references/examples.md`；Darren 改過的地方記成修改前後對照。範例最多留 15 組，舊的換掉。進步靠這份檔案，不靠加規則或數字門檻。

## 完成條件

`check-polish.mjs`、`fact_tags.py`、`audit_answer_first.py`、`check-voice.mjs --final` 通過；意義比對沒有「不可接受」與「遺失」；內連句原樣保留。
