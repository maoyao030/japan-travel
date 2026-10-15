import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {getQueueBatches, loadArticleQueue} from './article-automation-policy.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const queueArgument = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
const queuePath = queueArgument
  ? path.resolve(queueArgument)
  : path.join(projectRoot, 'content-automation', 'article-queue.json')

const queue = await loadArticleQueue(queuePath, projectRoot)
const batches = getQueueBatches(queue)
const batchSummary = batches
  .map((batch) => `${batch.themeLabel}批次 ${batch.items.length} 篇`)
  .join('、')
console.log(
  batches.length === 0
    ? '文章自動化清單驗證通過：目前沒有任何已核准的批次，自動發布不會選到文章。'
    : `文章自動化清單驗證通過：${batchSummary}，進度由 Sanity 文件狀態判斷。`,
)
