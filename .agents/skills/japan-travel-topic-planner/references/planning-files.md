# 規劃檔格式

routine 與規劃 session 共用四種規劃檔。寫完或改完都跑一次：

```bash
node scripts/check-planning.mjs
```

`npm test` 也會檢查 repo 裡的規劃檔，沒通過就不能合併。格式規則寫在 `scripts/planning-formats.mjs`。

## 全站地點清單 `content-planning/places.json`

- `places[]`：每個地點一筆。`placeId`、繁中名 `nameZh`、日文名 `nameJa`、`kind`（`place`、`district` 大城市的區、`region` 地區）、`region`、`groupId`（還沒分群填 `null`）、`status`（`candidate`、`planned`、`published`、`merged`、`excluded`）、`gatewayPlaceIds`、`nearbyPlaceIds`。
- 鄰近地點與出入口可以指向別群或還沒規劃的地點，但那些地點要先登記成 `candidate`，並附 `evidence`（自動完成查詢、日期）。
- 篩選時併入鄰近地點的，`status` 填 `merged`、`mergedInto` 填獨立地點。
- `groups[]`：每群一筆。`placeIds` 最多 6 個、`gatewayPlaceIds` 必填、`selectedAt`、`reasons`（選這一群的理由與證據，含第二、第三名）。一個地點只屬於一群。

## 全站分工表 `content-planning/ownership.json`

- `owners[]`：`topicKey`（這件事的代稱，例如 `rebun-ferry-timetable`）、`description`、`ownerArticleId`（負責頁）、`summaryArticleIds`（只摘要的頁）。
- 一件事只有一筆。頁面上線後才加進來；先上線的負責，後面的群只能摘要並連過去。

## 地點事實表 `content-planning/<地區>/places/<地點>/facts.json`

- 每個地點一份，整群的頁面共用同一套編號；大綱與正文用 `<地點>:F12` 引用。
- `facts[]`：`factId`（`F` 加數字，一經使用不改號）、`claim`、`quote`（日文原文最短摘錄）、`sourceUrl`、`checkedAt`、`condition`（適用條件、算式）、`changeType`、`nextCheckAt`、`decision`（刪除時填 `removed`，保留列）。
- `changeType` 與查核週期見寫作 Skill 的 `research-record.md`；`stable` 不填 `nextCheckAt`。
- 查核狀態（上次重查、來源是否改變）記在維護資料庫 D1 的 `facts`，由同步程式從這份檔案登記。

## 旅行群大綱 `content-planning/<地區>/<群>-outline.json`

- `groupId`、`pages[]`、`division[]`、`links[]`、`writingOrder[]`、`gaps[]`；另有 `spotCoverage[]`、`experienceLeads[]`、`mediaPlan[]`（欄位見 [景點比對與體驗研究](experience-research.md)，檢查程式目前不檢查）。
- `pages[]`：`articleId`、`pageType`、`placeId`、`targetPath`、`primaryQuery`、`secondaryQueries`、`h1`、`mustAnswer`、`headings[]`。每個標題：`level`（2 或 3）、`text`、`facts`（事實編號）、`answers`（回答第幾個必答問題，從 0 起算）。
- `division[]`：`topicKey`、`description`、`owner`、`summarizedBy`。
- `links[]`：`from`、`to`、`purpose`，可加 `section` 與連結句 `sentence`；連到群外頁面標 `external: true`。
- 檢查程式擋下：H1 沒有主要查詢或用冒號、正文 H2 沒帶地名、次要查詢不在任何標題、必答問題沒有對應標題、事實編號不在事實表、同一件事兩個負責頁或搶了全站分工表裡別頁的事、主題頁沒連回主頁或主頁沒連到主題頁、地點主頁沒排在該地點主題頁之後。
