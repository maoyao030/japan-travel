import {type DocumentActionComponent, useDocumentOperation} from 'sanity'

/**
 * 在後台按「發布」時，記下這次手動修改：
 * - studioEditedAt：最後一次手動發布的時間；
 * - studioEditLog：每次手動發布都加一筆，用來算優化了幾次、哪幾天（報表見 scripts/manual-edits-report.mjs）。
 * 上稿與修訂工具不經過這個按鈕，所以有這些紀錄就代表有人在後台手動改過；
 * 工具看到 studioEditedAt 比 studioEditsSyncedAt 新，就不整篇覆蓋（見 scripts/studio-edit-guard.mjs）。
 */
export function withStudioEditStamp(original: DocumentActionComponent): DocumentActionComponent {
  const Stamped: DocumentActionComponent = (props) => {
    const result = original(props)
    const {patch} = useDocumentOperation(props.id, props.type)
    if (!result) return result
    return {
      ...result,
      onHandle: () => {
        const at = new Date().toISOString()
        patch.execute([
          {set: {studioEditedAt: at}},
          {setIfMissing: {studioEditLog: []}},
          {
            insert: {
              after: 'studioEditLog[-1]',
              items: [{_key: `edit${Date.now().toString(36)}`, _type: 'studioEdit', at}],
            },
          },
        ])
        result.onHandle?.()
      },
    }
  }
  Stamped.action = original.action
  return Stamped
}
