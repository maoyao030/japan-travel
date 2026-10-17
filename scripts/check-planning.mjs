/**
 * 檢查 content-planning 裡的規劃檔：全站地點清單、全站分工表、所有地點事實表與旅行群大綱。
 * 用法：node scripts/check-planning.mjs
 */
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {validateFactTable, validateOutline, validateOwnership, validatePlaces} from './planning-formats.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const planningRoot = path.join(projectRoot, 'content-planning')

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const files = []
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

const toPosix = (file) => file.split(path.sep).join('/')

export async function checkPlanning(root = planningRoot) {
  const report = []
  const relative = (file) => toPosix(path.relative(projectRoot, file))
  const places = await readJson(path.join(root, 'places.json'))
  const ownership = await readJson(path.join(root, 'ownership.json'))
  report.push({file: relative(path.join(root, 'places.json')), issues: validatePlaces(places)})
  report.push({file: relative(path.join(root, 'ownership.json')), issues: validateOwnership(ownership)})

  const files = (await walk(root)).map((file) => ({file, posix: toPosix(file)}))
  const factTables = {}
  for (const {file} of files.filter(({posix}) => /\/places\/[^/]+\/facts\.json$/.test(posix))) {
    const table = await readJson(file)
    factTables[table.placeId] = table
    report.push({file: relative(file), issues: validateFactTable(table)})
  }
  for (const {file} of files.filter(({posix}) => posix.endsWith('-outline.json'))) {
    report.push({file: relative(file), issues: validateOutline(await readJson(file), {places, ownership, factTables})})
  }
  return report
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  const report = await checkPlanning()
  let failed = false
  for (const {file, issues} of report) {
    console.log(`${issues.length === 0 ? '通過' : '未通過'}：${file}`)
    for (const issue of issues) console.log(`  - ${issue}`)
    if (issues.length > 0) failed = true
  }
  if (failed) process.exitCode = 1
}
