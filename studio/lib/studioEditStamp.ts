import {type DocumentActionComponent, useDocumentOperation} from 'sanity'

/**
 * 在後台按「發布」時，順便記下 studioEditedAt。
 * 上稿與修訂工具不經過這個按鈕，所以有這個時間就代表有人在後台手動改過；
 * 工具看到它比 studioEditsSyncedAt 新，就不整篇覆蓋（見 studio/scripts/lib/studio-edit-guard.mjs）。
 */
export function withStudioEditStamp(original: DocumentActionComponent): DocumentActionComponent {
  const Stamped: DocumentActionComponent = (props) => {
    const result = original(props)
    const {patch} = useDocumentOperation(props.id, props.type)
    if (!result) return result
    return {
      ...result,
      onHandle: () => {
        patch.execute([{set: {studioEditedAt: new Date().toISOString()}}])
        result.onHandle?.()
      },
    }
  }
  Stamped.action = original.action
  return Stamped
}
