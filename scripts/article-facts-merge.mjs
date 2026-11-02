// 用法（repo 根目錄）：node scripts/article-facts-merge.mjs .tmp/fact-report.json [--write]（先跑 article-facts-diff.mjs）
// 把文章研究記錄的更正與新增合併進地點事實表；不加 --write 只印統計與記錄。
import fs from 'node:fs'
import path from 'node:path'

const [reportFile] = process.argv.slice(2)
const write = process.argv.includes('--write')
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
const root = process.cwd()
const placesDir = path.join(root, 'content-planning/hokkaido/places')
const tables = {}
for (const p of fs.readdirSync(placesDir)) tables[p] = JSON.parse(fs.readFileSync(path.join(placesDir, p, 'facts.json'), 'utf8'))
const outlines = ['hokkaido-wakkanai-outline.json', 'hokkaido-asahikawa-outline.json'].map((f) =>
  JSON.parse(fs.readFileSync(path.join(root, 'content-planning/hokkaido', f), 'utf8')),
)
const homePlace = {}
for (const o of outlines) for (const p of o.pages) homePlace[p.articleId] = p.placeId
const mtime = (a) => fs.statSync(path.join(root, 'content-production', a, 'reference-review.md')).mtimeMs

const bg = (s) => { s = (s || '').replace(/[\s[\]（）()、，。：:；;「」]/g, ''); const a = new Set(); for (let i = 0; i < s.length - 1; i++) a.add(s.slice(i, i + 2)); return a }
const jac = (x, y) => { const a = bg(x), b = bg(y); let i = 0; a.forEach((v) => b.has(v) && i++); return i / Math.max(1, a.size + b.size - i) }
const hasJapanese = (s) => { const t = (s ?? "").trim(); return t.length > 1 && !/^（?(見|同|參見|詳見)[^）]*）?$/.test(t) }

// 選出同一筆事實最好的一列：查閱日期新的優先；同日時本地點文章優先，再看檔案新舊
const better = (a, b) => {
  if ((a.checkedAt ?? '') !== (b.checkedAt ?? '')) return (a.checkedAt ?? '') > (b.checkedAt ?? '') ? a : b
  const ah = homePlace[a.article] === a.place, bh = homePlace[b.article] === b.place
  if (ah !== bh) return ah ? a : b
  return mtime(a.article) >= mtime(b.article) ? a : b
}

function toFact(row, factId) {
  const fact = {factId, claim: row.claim, quote: row.quote, sourceUrl: row.sourceUrl, checkedAt: row.checkedAt}
  if (row.condition) fact.condition = row.condition
  fact.changeType = row.changeType
  if (row.changeType !== "stable") { fact.nextCheckAt = row.nextCheckAt; if (!fact.nextCheckAt && /^\d{4}-\d{2}-\d{2}$/.test(row.checkedAt ?? "")) { fact.nextCheckAt = `${+row.checkedAt.slice(0, 4) + 1}${row.checkedAt.slice(4)}`; log.defaultedNext.push(`${row.place}:${factId}`) } }
  return fact
}
function problems(f) {
  const p = []
  if (!hasJapanese(f.quote)) p.push('quote')
  if (!/^https?:\/\//.test(f.sourceUrl ?? '')) p.push('url')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.checkedAt ?? '')) p.push('checkedAt')
  if (f.changeType !== 'stable' && !(f.nextCheckAt > f.checkedAt)) p.push('nextCheckAt')
  return p
}

const log = {updated: [], added: [], renumbered: [], skipped: [], defaultedNext: []}

// 1. 更正：同編號、地點表已有
const upGroups = {}
for (const u of report.updates) (upGroups[`${u.place}:${u.factId}`] ??= []).push(u)
for (const [key, rows] of Object.entries(upGroups)) {
  const [place, factId] = key.split(':')
  // 跨地點引用的列只有在查閱日期比較新時才採用
  const table = tables[place]
  const existing = table.facts.find((f) => f.factId === factId)
  const usable = rows.filter((r) => homePlace[r.article] === place || (r.checkedAt ?? '') > (existing.checkedAt ?? ''))
  const candidates = usable.filter((r) => hasJapanese(r.quote))
  if (!candidates.length) { log.skipped.push({key, why: '只有跨地點引用或沒有原文摘錄', articles: rows.map((r) => r.article)}); continue }
  const best = candidates.reduce(better)
  const next = {...existing, ...toFact(best, factId)}
  if (best.changeType === 'stable') delete next.nextCheckAt
  if (existing.kind === 'gap') { delete next.kind; delete next.gapKind }
  const bad = problems(next)
  if (bad.length) { log.skipped.push({key, why: `欄位不完整：${bad.join('、')}`, article: best.article}); continue }
  Object.assign(existing, next)
  if (best.changeType === 'stable') delete existing.nextCheckAt
  if (existing.kind === undefined) { delete existing.gapKind }
  log.updated.push({key, from: best.article, checkedAt: best.checkedAt})
}

// 2. 新增：地點表沒有的編號；同編號不同內容的分成不同事實
const newGroups = {}
for (const r of report.newFacts) if (tables[r.place]) (newGroups[`${r.place}:${r.factId}`] ??= []).push(r)
const nextId = {}
for (const [p, t] of Object.entries(tables)) nextId[p] = Math.max(...t.facts.map((f) => +f.factId.slice(1))) + 1
// 先把保留原編號的分配出去，再發新號，避免新號撞到之後要保留的原編號
const reserved = {}
for (const key of Object.keys(newGroups)) { const [p, id] = key.split(':'); (reserved[p] ??= new Set()).add(+id.slice(1)) }
for (const p of Object.keys(nextId)) { const r = [...(reserved[p] ?? [])]; if (r.length) nextId[p] = Math.max(nextId[p], Math.max(...r) + 1) }

for (const [key, rows] of Object.entries(newGroups).sort()) {
  const [place, factId] = key.split(':')
  const clusters = []
  for (const r of rows) {
    const c = clusters.find((cl) => cl.some((x) => jac(x.claim, r.claim) >= 0.3 || (x.sourceUrl === r.sourceUrl && jac(x.quote, r.quote) >= 0.5)))
    if (c) c.push(r); else clusters.push([r])
  }
  // 用到最多篇的那一群保留原編號
  clusters.sort((a, b) => new Set(b.map((x) => x.article)).size - new Set(a.map((x) => x.article)).size)
  clusters.forEach((cluster, index) => {
    const candidates = cluster.filter((r) => hasJapanese(r.quote))
    if (!candidates.length) { log.skipped.push({key, why: '沒有原文摘錄', articles: cluster.map((r) => r.article)}); return }
    const best = candidates.reduce(better)
    const id = index === 0 ? factId : `F${nextId[place]++}`
    const fact = toFact(best, id)
    const bad = problems(fact)
    if (bad.length) { log.skipped.push({key, why: `欄位不完整：${bad.join('、')}`, article: best.article, claim: best.claim.slice(0, 40)}); if (index === 0) return; nextId[place]--; return }
    fact.articleRefs = [...new Set(cluster.map((r) => `${r.article}:${r.factId}`))].sort()
    tables[place].facts.push(fact)
    ;(index === 0 ? log.added : log.renumbered).push({key, id: `${place}:${id}`, refs: fact.articleRefs})
  })
}

for (const t of Object.values(tables)) t.facts.sort((a, b) => +a.factId.slice(1) - +b.factId.slice(1))
console.log(JSON.stringify({updated: log.updated.length, added: log.added.length, renumbered: log.renumbered.length, skipped: log.skipped.length}))
fs.writeFileSync(reportFile.replace(/\.json$/, '-merge-log.json'), JSON.stringify(log, null, 1))
if (write) for (const [p, t] of Object.entries(tables)) fs.writeFileSync(path.join(placesDir, p, 'facts.json'), JSON.stringify(t, null, 2) + '\n')
