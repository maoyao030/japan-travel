# 驗收紀錄：wakkanai-festival（2026-11-28，照多活動祭典頁範本重寫）

- 文章：`content-production/wakkanai-festival/reader-preview.md`（稚內祭典有哪些？2027最新稚內祭典指南）
- SHA-256（換行統一成 LF 後計算）：`be6ff3ddb6d5acfd67207f0b48ef5b476d0c0e1405643c9a7a18be20e4e1e210`
- 規則：寫作 Skill `references/festival-calendar-page.md`（Darren 2026-11-27 定的方向：平鋪直敘，有哪些、什麼時候、逐個介紹特色、配圖片或 IG）、`core-style.md`、`preference-review.md`（A～O 題）、`sentence-rhythm.md`、`heading-style.md`；驗收 Skill `references/festival-calendar-acceptance.md`；範本 `page-models/festival/rebun-island-festival.md`。Darren 2026-11-28：「重寫這兩篇」。研究、規格與每一輪紀錄在 `content-experiments/festival-multi-study-2026-11-27/rewrite-wakkanai/`；重寫前的線上版在 `pre-calendar-page/`。
- 研究：1 個研究子代理（Opus 5.5）補研究並寫規格（歷年日期總表、既有事實更正）。
- 寫作：一位作者（Sonnet 5.5），事實只用本封包 `reference-review.md`。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作），實際打開來源，共 4 輪：第 1 輪 62 項裡 13 項沒過；最後 49 項全部 verified。
- 偏好審查：1 個審查子代理（Opus 5.5，不是作者、查核者、驗收者），3 輪：第 1 輪退回 24 處，第 3 輪的 2 處已套用。
- 讀者驗收：1 個讀者驗收子代理（Opus 5.5），八題，2 次：第 1 次只有回程最後一段要拆句，第 2 次 `acceptable`。
- 名字：1 個子代理照「專有名詞先看台灣網站再決定」查過，對照表 `content-experiments/festival-multi-study-2026-11-27/names-wakkanai-rishiri.md`，新名字已進譯名表。
- 標題檢查：1 個標題檢查子代理（Opus 5.5），`heading-review.json`，改動 0 個標題。
- 協調：人工 session（Claude Code）。Darren 還沒看過這篇重寫稿。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`，沒有問題與審查訊號） |
| 標題 | `acceptable`（`heading_review.py` 改動 0 個） |
| 讀者價值 | `acceptable` |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，49 項全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 1,944 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤；警告是幾個名字第一次出現在開頭時沒附原文，原文附在逐個介紹那一節，不改 |
| 圖片 | 封面、文內照片與嵌入見 `images/` |

**最終結果：`ready_for_user_preview`。**

## 協調者的決定

- 小標題從七個收成三個：狗拉雪橇大會與雪地樂園（冰雪廣場併在最後一句）、北門神社祭、稚內港南極祭。白夜祭只有 2026 年一屆的依據、秋天的穹頂點燈只有兩屆，都只留在時間表與表後一句。
- 和平馬拉松、汽車活動、港口音樂會不放（要報名或遊客沒東西可看）。
- 「犬橇」改用台灣的叫法「狗拉雪橇」，「雪樂園」改「雪地樂園」。
- 狗拉雪橇大會 2027 年 2 月 27、28 日已公布，直接寫；近年曾因雪況取消照事實寫一次。
- 南極祭先寫煙火，太郎、次郎的故事兩三句講完；節目時刻、屆數、供養塔與慰靈祭不寫。

## 待辦

- 線上〈稚內景點〉有四處、〈稚內〉主頁有一處和這次查到的事實對不上（太郎次郎的說法、巴士路線名與時間、點燈寫成每年、「破冰船宗谷」、煙火約 2,500 發），兩頁也還在用「犬橇」，見 `rewrite-wakkanai/fact-check-round1.md` 與名字對照表。
- 北門神社祭的神轎與出海幾點、在哪裡看查不到，沒寫。
- 2027 年夏天各祭典日期與時刻表公布後重查。
