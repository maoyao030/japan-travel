# 富良野滑雪住宿｜不經 Darren 審核的試跑（2026-11-18）

Darren 2026-11-18 指定富良野，照寫作 Skill `references/stay-topic-page.md` 最後一節「自動化」從頭到尾跑一次，直接上線。協調者是人工 session（Claude Code）。

- 頁面：富良野滑雪住宿（住宿專門頁）。articleId `furano-stay-ski`，網址 `/places/furano/stay-ski/`，上層是 `furano-stay`（富良野住宿，還沒上線：帶回上層的那一句先寫成不帶連結的句子，之後補內連）。
- 為什麼選這個主題：中文 Google 自動完成（`autocomplete-raw.json`，2026-11-18）「富良野 住宿」「富良野 住宿 推薦」後面最多的延伸是滑雪（富良野 滑雪 住宿、富良野 滑雪場 住宿、富良野 滑雪場 附近 住宿、富良野 雪場 住宿 推薦、富良野 王子飯店 滑雪），現在是 11 月、雪季前。
- 分工：滑雪場本身（雪道、纜車、雪票、開放期間）歸 `furano-ski-resort`（還沒上線），本頁只寫「住哪裡去滑雪」：離雪場與纜車多遠、接駁、雪具寄放與乾燥室、溫泉或大浴場、訂房管道。不寫房價與雪票價格。
- 規則：`.agents/skills/japan-travel-answer-first/references/stay-topic-page.md`（固定範本＋最後一節「自動化」的順序與預設做法）、`stay-page.md`、`sentence-rhythm.md`。
- 格式範例：旭川三頁的流程檔在 `content-experiments/stay-local-test-2026-11-16/parking2/`（queries.md、competitor-notes.md、reader-questions.md、facts.md、coverage.md、page-spec.md、spec-check.md、check.md、edit-notes.md、acceptance2.md），已上線的成品在 `content-production/asahikawa-stay-parking/reader-preview.md`。檔名與格式照它。
- 既有資料：`content-planning/hokkaido/places/furano/facts.json`、`content-planning/hokkaido/hokkaido-furano-outline.json`、`content-production/furano-transport/`。
- 所有檔案寫在本資料夾；不改資料夾以外的檔案、不 commit。Windows 寫檔用 Write 工具。
