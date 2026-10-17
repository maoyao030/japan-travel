/**
 * 維護資料庫（Cloudflare D1 `japan-travel-ops`）的共用工具。
 *
 * 透過 wrangler 執行 SQL：本機用 `wrangler login` 的登入狀態，雲端 routine 用環境變數
 * CLOUDFLARE_API_TOKEN（只開 D1 編輯權限）；帳號 ID 寫在 d1/wrangler.jsonc。
 *
 * wrangler 的 `d1 execute --command` 不支援參數綁定，所以 SQL 一律由本檔的 sqlLiteral() 組字串，
 * 呼叫端不得自己拼接使用者輸入。
 */
import {execFile} from 'node:child_process'
import {createRequire} from 'node:module'
import path from 'node:path'
import {promisify} from 'node:util'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

export const OPS_DATABASE_NAME = 'japan-travel-ops'
export const projectRoot = path.resolve(import.meta.dirname, '..')
const configPath = path.join(projectRoot, 'd1', 'wrangler.jsonc')

/** 把值轉成 SQLite 字面值：null／undefined 是 NULL，數字原樣，字串加單引號並把 ' 換成 ''。 */
export function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`SQL 數值必須是有限數字：${value}`)
    return String(value)
  }
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value !== 'string') throw new Error(`不支援的 SQL 值型別：${typeof value}`)
  if (value.includes('\u0000')) throw new Error('SQL 字串不得包含 NUL 字元')
  return `'${value.replaceAll("'", "''")}'`
}

function resolveWranglerBin() {
  const packageJsonPath = require.resolve('wrangler/package.json')
  const packageJson = require('wrangler/package.json')
  const bin = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin.wrangler
  return path.join(path.dirname(packageJsonPath), bin)
}

/**
 * 建立執行器：傳入 SQL 陳述式陣列，回傳每一句的結果列陣列。
 * remote=false 時改用本機資料庫（d1/.wrangler/，不進 Git）。
 */
export function createWranglerExecutor({remote = true} = {}) {
  const wranglerBin = resolveWranglerBin()
  return async function execute(statements) {
    if (!Array.isArray(statements) || statements.length === 0) {
      throw new Error('execute() 需要至少一句 SQL')
    }
    const command = statements.map((statement) => statement.trim().replace(/;$/, '')).join(';\n')
    const {stdout} = await execFileAsync(
      process.execPath,
      [
        wranglerBin,
        'd1',
        'execute',
        OPS_DATABASE_NAME,
        remote ? '--remote' : '--local',
        '-c',
        configPath,
        '--json',
        '--command',
        command,
      ],
      {cwd: projectRoot, maxBuffer: 32 * 1024 * 1024, windowsHide: true},
    )
    const parsed = JSON.parse(stdout.slice(stdout.indexOf('[')))
    if (parsed.some((entry) => entry?.success === false)) {
      throw new Error(`D1 執行失敗：${stdout}`)
    }
    return parsed.map((entry) => entry?.results ?? [])
  }
}

/** 讀取 `--key=value` 形式的參數。 */
export function parseOptions(argumentsList) {
  const options = {}
  for (const argument of argumentsList) {
    if (!argument.startsWith('--')) continue
    const [key, ...valueParts] = argument.slice(2).split('=')
    options[key] = valueParts.length > 0 ? valueParts.join('=') : true
  }
  return options
}

export function positionalArguments(argumentsList) {
  return argumentsList.filter((argument) => !argument.startsWith('--'))
}

/** 台北時間的日期（YYYY-MM-DD）。 */
export function taipeiDate(date) {
  return new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Taipei'}).format(date)
}
