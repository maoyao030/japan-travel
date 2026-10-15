/**
 * 自動發布的執行鎖：同一時間只允許一個 routine 在生產文章。
 * 鎖放在 Git 共用目錄（.git/）底下，不會被 commit；超過 lockStaleAfterHours 視為逾時可接手。
 *
 * 用法：
 *   node scripts/manage-auto-publisher-lock.mjs acquire [--owner=<名稱>] [--lock-path=<路徑>]
 *   node scripts/manage-auto-publisher-lock.mjs release --token=<acquire 回傳的 token> [--lock-path=<路徑>]
 */
import {randomUUID} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

import {loadArticleQueue} from './article-automation-policy.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const queuePath = path.join(projectRoot, 'content-automation', 'article-queue.json')

function parseArguments(argumentsList) {
  const options = {}
  for (const argument of argumentsList) {
    if (!argument.startsWith('--')) continue
    const [key, ...valueParts] = argument.slice(2).split('=')
    options[key] = valueParts.join('=')
  }
  return options
}

function resolveDefaultLockPath(cwd = projectRoot) {
  const commonDirectory = execFileSync(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    {cwd, encoding: 'utf8'},
  ).trim()
  return path.join(commonDirectory, 'auto-publisher.lock')
}

async function readOwner(lockPath) {
  try {
    return JSON.parse(await readFile(path.join(lockPath, 'owner.json'), 'utf8'))
  } catch {
    return null
  }
}

async function lockAgeMilliseconds(lockPath, owner, now) {
  const startedAt = Date.parse(owner?.startedAt ?? '')
  if (Number.isFinite(startedAt)) return Math.max(0, now.getTime() - startedAt)
  const lockStat = await stat(lockPath)
  return Math.max(0, now.getTime() - lockStat.mtimeMs)
}

export async function acquireAutoPublisherLock({
  lockPath,
  staleAfterHours,
  ownerLabel = 'scheduled-auto-publisher',
  now = new Date(),
}) {
  const token = randomUUID()
  const owner = {
    token,
    ownerLabel,
    startedAt: now.toISOString(),
  }

  try {
    await mkdir(lockPath)
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error
    const existingOwner = await readOwner(lockPath)
    const ageMilliseconds = await lockAgeMilliseconds(lockPath, existingOwner, now)
    if (ageMilliseconds < staleAfterHours * 60 * 60 * 1000) {
      return {status: 'busy', owner: existingOwner, ageMilliseconds}
    }

    await rm(lockPath, {recursive: true, force: true})
    try {
      await mkdir(lockPath)
    } catch (retryError) {
      if (retryError?.code !== 'EEXIST') throw retryError
      return {status: 'busy', owner: await readOwner(lockPath), ageMilliseconds: 0}
    }
    owner.replacedStaleOwner = existingOwner
  }

  await writeFile(path.join(lockPath, 'owner.json'), `${JSON.stringify(owner, null, 2)}\n`, {
    flag: 'wx',
  })
  return {status: 'acquired', token, owner}
}

export async function releaseAutoPublisherLock({lockPath, token}) {
  const owner = await readOwner(lockPath)
  if (!owner) return {status: 'missing'}
  if (owner.token !== token) return {status: 'token-mismatch', owner}
  await rm(lockPath, {recursive: true, force: true})
  return {status: 'released'}
}

async function runCli() {
  const [command] = process.argv.slice(2).filter((argument) => !argument.startsWith('--'))
  const options = parseArguments(process.argv.slice(2))
  const queue = await loadArticleQueue(queuePath, projectRoot)
  const staleAfterHours = queue.publicationCadence.lockStaleAfterHours
  const lockPath = options['lock-path']
    ? path.resolve(options['lock-path'])
    : resolveDefaultLockPath(projectRoot)

  if (command === 'acquire') {
    const result = await acquireAutoPublisherLock({
      lockPath,
      staleAfterHours,
      ownerLabel: options.owner || 'scheduled-auto-publisher',
    })
    console.log(JSON.stringify({...result, lockPath}, null, 2))
    return
  }

  if (command === 'release') {
    if (!options.token) throw new Error('release 必須提供 --token=<acquire token>')
    const result = await releaseAutoPublisherLock({lockPath, token: options.token})
    console.log(JSON.stringify({...result, lockPath}, null, 2))
    if (result.status === 'token-mismatch') process.exitCode = 1
    return
  }

  throw new Error('用法：manage-auto-publisher-lock.mjs acquire|release [--token=...]')
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
