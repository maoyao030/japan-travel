# 圖片驗收規則

AI 圖與自製示意圖都是「生成」的圖，選圖 Skill 自己檢查自己不夠，要由一個沒有參與生圖的 agent 實際看過每一張。實拍照片不需要這一層，它們的風險在授權，由圖片封包驗證處理。

## AI 圖要看什麼

| 檢查 | `checks` 欄位 | 常見錯誤 |
|---|---|---|
| 畫面裡的文字 | `noFakeText` | 招牌與標示出現假漢字、亂碼日文 |
| 日本的基本事實 | `japanFactsCorrect` | 車子靠右行駛（日本靠左）、鳥居形狀錯、電車外觀不像日本 |
| 和正文一致 | `matchesArticle` | 圖說寫七月，畫面卻有雪 |
| 不會被當成實景 | `notMistakableForRealPlace` | 讀者會以為就是禮文島的實景 |
| 人物與品牌 | `noLikenessOrBrand` | 像某位真人，或出現像某品牌的商標 |
| 揭露標示 | `disclosureVisible` | 圖說或圖片角落沒有「AI 示意圖」 |
| 用途允許 | `allowedNeed` | 用在現場辨識或路線時間的位置 |

## 自製示意圖要看什麼

| 檢查 | `checks` 欄位 | 內容 |
|---|---|---|
| 與資料檔一致 | `matchesDataFile` | 圖上的每個標示和資料檔相同，沒有多出來的數字 |
| 事實已查證 | `factsVerified` | 資料檔的每個 `factId` 在 `fact-check.json` 都是 `verified` |
| 比例標示 | `scaleNotePresent` | 路線圖有「位置示意，非實際比例」或實際比例 |
| 手機可讀 | `readableOnPhone` | 縮到手機寬度時文字可讀、沒有重疊 |

## image-review.json

存在 `content-production/<article-id>/images/image-review.json`：

```json
{
  "schemaVersion": 1,
  "articleId": "rebun-island",
  "reviewer": "圖片驗收 agent 的身分描述",
  "reviewedAt": "2026-10-16",
  "items": [
    {
      "slotId": "ferry-routes",
      "candidateId": "ferry-routes-diagram",
      "kind": "diagram",
      "checks": {
        "matchesDataFile": true,
        "factsVerified": true,
        "scaleNotePresent": true,
        "readableOnPhone": true
      },
      "verdict": "pass",
      "notes": ""
    }
  ]
}
```

- 圖片封包裡每一個選定的 AI 圖與自製示意圖，都要在 `items` 有一筆。
- `verdict` 是 `pass` 或 `fail`；任一 `checks` 為 `false` 就必須是 `fail`。
- 試點期間每張 AI 圖還要 Darren 親眼確認，填 `darrenConfirmedAt`。試點結束、Darren 決定不再逐張確認時，修改 `validate-image-review.mjs` 的 `AI_HUMAN_CONFIRMATION_REQUIRED`，並在 `PROJECT_STATUS.md` 記錄決定日期。
- 驗收者不能修圖；發現問題時寫明位置與原因，退回選圖流程。
