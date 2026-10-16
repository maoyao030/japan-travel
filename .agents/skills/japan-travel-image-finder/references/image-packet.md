# 圖片封包

每篇文章的選圖紀錄放在 `content-production/<article-id>/images/image-plan.json`。只保存文字與網址；原始大圖放 `.tmp/image-selection/<article-id>/`，不加入 Git。

## 結構

```json
{
  "schemaVersion": 1,
  "articleId": "rebun-island",
  "articleTitle": "禮文島交通、住宿與花季",
  "targetUrl": "/places/rebun-island/",
  "articleSource": "approved-reader-preview",
  "articleSourceCheckedAt": "2026-10-16",
  "status": "selected",
  "selectionMode": "criteria-based-auto-selection",
  "selectedCandidateIds": {"cover": "cover-01"},
  "selectedAt": "2026-10-16",
  "slots": [
    {
      "slotId": "cover",
      "kind": "cover",
      "purpose": "呈現禮文島的海岸地形，作為條目封面。",
      "mustShow": ["禮文島的海岸或山稜"],
      "mustNotShow": ["其他島嶼冒充禮文島", "可辨識人物"],
      "targetAspectRatio": "16:9",
      "minimumWidth": 1600,
      "preparation": {
        "sourceFile": "source.jpg",
        "sourceDownloadUrl": "https://upload.wikimedia.org/example.jpg",
        "focalPoint": {"x": 0.5, "y": 0.5},
        "output": {"width": 1600, "height": 900, "format": "webp", "quality": 82}
      },
      "selectionNotes": "唯一能確認拍攝地點為禮文島的實拍。",
      "sourcing": {
        "policy": "real-photo-first-ai-if-none",
        "photoSearchOutcome": "qualified-photo-found",
        "photoSearchCheckedAt": "2026-10-16",
        "photoSearchNotes": "已查維基共享資源分類頁與三個免費圖庫。"
      },
      "candidates": [
        {
          "candidateId": "cover-01",
          "sourceType": "commons-photo",
          "provider": "Wikimedia Commons",
          "assetType": "photo",
          "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Example.jpg",
          "creatorName": "Example Author",
          "sourceTitle": "File:Example.jpg",
          "sourceDescription": "檔案頁說明摘要",
          "takenAt": "2019-07",
          "width": 4000,
          "height": 2667,
          "licenseName": "CC BY-SA 4.0",
          "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
          "licenseCheckedAt": "2026-10-16",
          "matchType": "exact",
          "whyItFits": "檔案頁標示拍攝地點為禮文島，畫面為海岸線。",
          "altDraft": "禮文島西海岸的斷崖與海",
          "captionDraft": "禮文島西海岸。",
          "creditDraft": "照片：Example Author／Wikimedia Commons／CC BY-SA 4.0",
          "commercialReview": {
            "people": "none",
            "logos": "none",
            "artwork": "none",
            "property": "natural landscape",
            "risk": "low",
            "notes": "沒有人物、招牌或建築。"
          },
          "checks": {
            "fullImageInspected": true,
            "officialSourcePage": true,
            "licenseVerified": true,
            "notAiGenerated": true,
            "noWatermark": true
          }
        }
      ]
    }
  ]
}
```

範例網址只示範結構，不是真實候選。

## 欄位規則

- 文內位置（`kind: "inline"`）必須有 `need`：`site-identification`、`decide-visit`、`food`、`season-contrast`、`route-timeline`。封面不需要。
- 找不到現場照片時，該位置寫 `shotListId`（對應 `content-planning/shot-list.json`），`photoSearchOutcome` 為 `no-qualified-photo`，候選保持空白；這種位置不需要選定候選，文章用文字描述。
- `route-timeline` 的位置 `photoSearchOutcome` 填 `diagram-preferred`，候選只能是 `diagram`。

- `status`：`planning`、`selected` 或 `blocked`。`blocked` 要有 `blockedReason`。
- `targetUrl`：正式網址，兩層或三層，例如 `/places/rebun-island/` 或 `/stay/ginzan-onsen/ryokan/`。
- `sourcing.policy` 固定為 `real-photo-first-ai-if-none`。`photoSearchOutcome`：
  - `not-run`：尚未搜尋，不能有候選。
  - `qualified-photo-found`：至少一張實拍合格；候選只能是實拍。
  - `no-qualified-photo`：搜尋完成但零張合格；候選只能是 AI，或保持空白並 `blocked`。
- `sourceType`：
  - `commons-photo`：`provider` 為 `Wikimedia Commons`，`sourcePageUrl` 是 `commons.wikimedia.org/wiki/File:` 頁，`licenseName` 是 CC0、Public domain、CC BY 或 CC BY-SA 的版本之一，`creditDraft` 要含作者與授權名稱。
  - `stock-photo`：`provider` 為 Unsplash、Pexels 或 Pixabay，規則同好材誌。
  - `official-material`：觀光協會或自治體素材。必填 `termsUrl`、`termsCheckedAt`、`commercialUseAllowed: true`、`modificationAllowed: true`、`creditRequirement`；`applicationRequired` 為 `true` 時要有 `applicationApprovedAt`。
  - `own-photo`：必填 `photographer`、`takenAt`；不需要授權網址。
  - `ai-generated`：`provider` 為 `OpenAI ImageGen`，必填 `generatedAt`、`promptSummary`、`factualLimits`、`disclosureDraft`；圖說與揭露要含「AI」，`checks.onImageLabel` 為 `true` 表示圖片角落已印「AI 示意圖」。不得填寫任何來源或授權欄位。不能用在 `site-identification` 與 `route-timeline`。
  - `diagram`：`provider` 為 `self-made`，必填 `dataFile`（`images/diagrams/<diagramId>.json`）、`factIds`、`svgFile`；`route` 類型的資料檔要有 `scaleNote`。署名草案寫「本站製作示意圖」。
- `kind` 為 `inline` 時，實拍只能是 `exact`。
- 授權或利用規約查核超過 30 天要重新查核。
- 所有候選的 `commercialReview.risk` 必須是 `low`。

## 驗證

```bash
node .agents/skills/japan-travel-image-finder/scripts/validate-image-packet.mjs content-production/<article-id>
```

驗證器會擋下 NC、ND 授權、非單張頁來源、跳過實拍直接用 AI、實拍與 AI 混放、未確認利用規約的觀光協會素材，以及缺少選定紀錄。它不能代替人眼確認畫面，也不提供法律意見。
