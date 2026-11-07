// 用法（repo 根目錄）：node scripts/article-facts-diff.mjs > .tmp/fact-report.json
// 讀所有文章的 reference-review.md 事實表，和地點事實表比對：更正（同編號內容不同）、新增（地點表沒有的編號）。
import fs from 'node:fs'
import path from 'node:path'

const CHANGE = ['timetable', 'annual-event', 'price', 'stay', 'shop-hours', 'seasonal-opening', 'popularity', 'climate-normal', 'stable']
const root = process.cwd()
const outlines = ['hokkaido-wakkanai-outline.json', 'hokkaido-asahikawa-outline.json', 'hokkaido-furano-outline.json'].map((f) =>
  JSON.parse(fs.readFileSync(path.join(root, 'content-planning/hokkaido', f), 'utf8')),
)
const placeOf = {}
for (const o of outlines) for (const p of o.pages) placeOf[p.articleId] = p.placeId
const placesDir = path.join(root, 'content-planning/hokkaido/places')
const tables = {}
for (const p of fs.readdirSync(placesDir)) tables[p] = JSON.parse(fs.readFileSync(path.join(placesDir, p, 'facts.json'), 'utf8'))

const norm = (s) => (s ?? '').replace(/\s+/g, '').replace(/[`*]/g, '')

function parseRow(line) {
  const cells = line.split('|').slice(1, -1).map((c) => c.trim())
  if (cells.length < 9) return null
  const id = cells[0].replace(/\*/g, '').replace(/~~/g, '')
  const m = id.match(/^(?:([a-z0-9-]+):)?(F\d+)$/)
  if (!m) return null
  const urlIdx = cells.findIndex((c, i) => i >= 2 && /^<?https?:\/\//.test(c))
  if (urlIdx < 0) return null
  const ctIdx = cells.findIndex((c, i) => i > urlIdx + 1 && CHANGE.includes(c))
  if (ctIdx < 0) return null
  return {
    place: m[1] ?? null,
    factId: m[2],
    claim: cells[1],
    quote: cells.slice(2, urlIdx).join('|'),
    sourceUrl: cells[urlIdx].replace(/^<|>$/g, '').split(/\s/)[0],
    checkedAt: (cells[urlIdx + 1].match(/\d{4}-\d{2}-\d{2}/g) ?? []).sort().at(-1) ?? null,
    condition: cells.slice(urlIdx + 2, ctIdx).join('|'),
    changeType: cells[ctIdx],
    nextCheckAt: (cells[ctIdx + 1] ?? '').match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null,
    decision: cells.slice(ctIdx + 2).join('|'),
  }
}

const rows = []
const dir = path.join(root, 'content-production')
for (const article of fs.readdirSync(dir)) {
  const file = path.join(dir, article, 'reference-review.md')
  if (!fs.existsSync(file) || !placeOf[article]) continue
  let inTable = false
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (/^\| *編號 *\| *主張/.test(line)) { inTable = true; continue }
    if (!line.startsWith('|')) { inTable = false; continue }
    if (!inTable) continue
    const row = parseRow(line)
    if (row) rows.push({article, ...row, place: row.place ?? placeOf[article]})
  }
}

const updates = []
const newFacts = []
for (const row of rows) {
  const table = tables[row.place]
  if (!table) { newFacts.push({...row, note: 'no-place-table'}); continue }
  const existing = table.facts.find((f) => f.factId === row.factId)
  if (!existing) { newFacts.push(row); continue }
  const same = norm(existing.claim) === norm(row.claim) && norm(existing.quote) === norm(row.quote) && existing.sourceUrl === row.sourceUrl
  if (same && (existing.checkedAt ?? '') >= (row.checkedAt ?? '')) continue
  const sameSource = existing.sourceUrl === row.sourceUrl || norm(existing.quote) === norm(row.quote)
  updates.push({...row, existing: {claim: existing.claim, quote: existing.quote, sourceUrl: existing.sourceUrl, checkedAt: existing.checkedAt, kind: existing.kind}, sameSource, onlyDate: same})
}
console.log(JSON.stringify({rows: rows.length, updates, newFacts}, null, 1))
