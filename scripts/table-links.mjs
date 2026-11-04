/**
 * 住宿表與景點基本資訊欄的「連結」（Darren 2026-11-04）：官網＋Google 地圖搜尋連結。
 * 連結清單（plan）格式：
 *   {article, infoBoxes: [{tableKey, official, mapQuery}], stayTables: [{tableKey, rows: {"<第一欄文字>": {official, mapQuery}}}]}
 */
export const LINK_LABEL = '連結'

export function mapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function linkCell({official, mapQuery}) {
  const parts = []
  if (official) parts.push(`[官網](${official})`)
  if (mapQuery) parts.push(`[地圖](${mapsUrl(mapQuery)})`)
  return parts.join('・')
}

/** 線上正文（Portable Text）加連結；回傳新的 body 與做了哪些事。已經有連結的表格不重複加。 */
export function addLinksToBody(body, plan) {
  const done = []
  const missing = []
  const info = new Map((plan.infoBoxes ?? []).map((item) => [item.tableKey, item]))
  const stay = new Map((plan.stayTables ?? []).map((item) => [item.tableKey, item]))
  const next = body.map((block) => {
    if (block._type !== 'contentTable') return block
    if (info.has(block._key)) {
      const item = info.get(block._key)
      info.delete(block._key)
      if (block.rows.some((row) => row.cells[0] === LINK_LABEL)) return block
      const cell = linkCell(item)
      if (!cell) return block
      done.push({table: block._key, kind: 'info'})
      return {...block, rows: [...block.rows, {_key: `${block._key}-links`, _type: 'contentTableRow', cells: [LINK_LABEL, cell]}]}
    }
    if (stay.has(block._key)) {
      const item = stay.get(block._key)
      stay.delete(block._key)
      if (block.columns.includes(LINK_LABEL)) return block
      const rows = block.rows.map((row) => {
        const entry = item.rows[row.cells[0]]
        if (!entry) missing.push({table: block._key, name: row.cells[0]})
        return {...row, cells: [...row.cells, entry ? linkCell(entry) : '']}
      })
      done.push({table: block._key, kind: 'stay', rows: rows.length})
      return {...block, columns: [...block.columns, LINK_LABEL], rows}
    }
    return block
  })
  for (const key of [...info.keys(), ...stay.keys()]) missing.push({table: key, reason: '線上找不到這個表格'})
  return {body: next, done, missing}
}

const splitRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())

/**
 * Git 稿件（Markdown）加連結：景點欄用「日文名」那一列對表格，住宿表用表頭含「訂房」的表格、第一欄名稱對列。
 * @param {Array<{ja: string, cell: string}>} infoCells
 * @param {Map<string, string>} stayCells 名稱 → 連結格子
 */
export function addLinksToMarkdown(markdown, infoCells, stayCells) {
  const lines = markdown.split('\n')
  const out = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.startsWith('|') || !lines[index + 1]?.match(/^\|\s*-/)) {
      out.push(line)
      index += 1
      continue
    }
    const table = []
    while (index < lines.length && lines[index].startsWith('|')) table.push(lines[index++])
    const header = splitRow(table[0])
    const body = table.slice(2).map(splitRow)
    const jaRow = body.find((cells) => cells[0] === '日文名')
    if (jaRow && !body.some((cells) => cells[0] === LINK_LABEL)) {
      const match = infoCells.find((item) => item.ja === jaRow[1])
      out.push(...table)
      if (match?.cell) out.push(`| ${LINK_LABEL} | ${match.cell} |`)
      continue
    }
    if (header.some((cell) => cell.includes('訂房')) && !header.includes(LINK_LABEL)) {
      out.push(`| ${[...header, LINK_LABEL].join(' | ')} |`, `|${'---|'.repeat(header.length + 1)}`)
      for (const cells of body) out.push(`| ${[...cells, stayCells.get(cells[0]) ?? ''].join(' | ')} |`)
      continue
    }
    out.push(...table)
  }
  return out.join('\n')
}
