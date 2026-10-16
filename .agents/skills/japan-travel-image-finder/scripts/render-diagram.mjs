#!/usr/bin/env node
/**
 * 依自製示意圖的資料檔產生 SVG。只畫資料檔裡的內容，不補任何數字。
 * 用法：node render-diagram.mjs <images/diagrams/<diagramId>.json>
 * 輸出：同資料夾、同檔名的 .svg
 */
import {readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

const COLORS = {background: '#ffffff', text: '#1f2a2e', muted: '#5c676b', line: '#2f5d62', node: '#eef3f2'}
const FONT = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif"

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function validateDiagramData(data) {
  const errors = []
  if (data?.schemaVersion !== 1) errors.push('schemaVersion 必須是 1')
  if (!/^[a-z0-9-]+$/.test(data?.diagramId ?? '')) errors.push('diagramId 只能用小寫英文、數字與連字號')
  if (!['route', 'timeline'].includes(data?.type)) errors.push('type 必須是 route 或 timeline')
  if (!data?.title?.trim?.()) errors.push('title 不得為空')
  if (data?.type === 'route' && !data?.scaleNote?.trim?.()) errors.push('route 必須有 scaleNote')
  const nodes = Array.isArray(data?.nodes) ? data.nodes : []
  if (nodes.length < 2) errors.push('nodes 至少要有 2 個')
  const ids = new Set()
  for (const [index, node] of nodes.entries()) {
    if (!node?.id || ids.has(node.id)) errors.push(`nodes[${index}].id 缺少或重複`)
    ids.add(node?.id)
    if (!node?.label?.trim?.()) errors.push(`nodes[${index}].label 不得為空`)
    if (!node?.factId?.trim?.()) errors.push(`nodes[${index}].factId 不得為空`)
  }
  for (const [index, edge] of (data?.edges ?? []).entries()) {
    if (!ids.has(edge?.from) || !ids.has(edge?.to)) errors.push(`edges[${index}] 指向不存在的節點`)
    if (!edge?.factId?.trim?.()) errors.push(`edges[${index}].factId 不得為空`)
  }
  return errors
}

export function renderDiagram(data) {
  const nodes = data.nodes
  const width = 760
  const gap = (width - 160) / Math.max(nodes.length - 1, 1)
  const positions = new Map(
    nodes.map((node, index) => {
      const x = 80 + index * gap
      const y = data.type === 'route' && nodes.length > 2 ? (index % 2 === 0 ? 150 : 270) : 210
      return [node.id, {x, y}]
    }),
  )
  const edges =
    data.type === 'timeline'
      ? nodes.slice(1).map((node, index) => ({from: nodes[index].id, to: node.id, label: ''}))
      : data.edges ?? []
  const height = 380
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(data.title)}">`,
    `<rect width="${width}" height="${height}" fill="${COLORS.background}"/>`,
    `<text x="24" y="40" font-family="${FONT}" font-size="22" font-weight="700" fill="${COLORS.text}">${escapeXml(data.title)}</text>`,
  ]
  for (const edge of edges) {
    const from = positions.get(edge.from)
    const to = positions.get(edge.to)
    parts.push(`<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${COLORS.line}" stroke-width="3"${data.type === 'route' ? ' stroke-dasharray="8 6"' : ''}/>`)
    if (edge.label) {
      const mx = (from.x + to.x) / 2
      const my = (from.y + to.y) / 2 - 12
      parts.push(`<text x="${mx}" y="${my}" text-anchor="middle" font-family="${FONT}" font-size="15" fill="${COLORS.text}" paint-order="stroke" stroke="${COLORS.background}" stroke-width="5">${escapeXml(edge.label)}</text>`)
    }
  }
  for (const node of nodes) {
    const {x, y} = positions.get(node.id)
    parts.push(`<circle cx="${x}" cy="${y}" r="12" fill="${COLORS.node}" stroke="${COLORS.line}" stroke-width="3"/>`)
    parts.push(`<text x="${x}" y="${y + 38}" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="700" fill="${COLORS.text}">${escapeXml(node.label)}</text>`)
    if (node.labelJa) {
      parts.push(`<text x="${x}" y="${y + 58}" text-anchor="middle" font-family="${FONT}" font-size="13" fill="${COLORS.muted}">${escapeXml(node.labelJa)}</text>`)
    }
  }
  const note = data.scaleNote ? `本站製作示意圖｜${data.scaleNote}` : '本站製作示意圖'
  parts.push(`<text x="24" y="${height - 20}" font-family="${FONT}" font-size="13" fill="${COLORS.muted}">${escapeXml(note)}</text>`)
  parts.push('</svg>')
  return `${parts.join('\n')}\n`
}

function runCli() {
  const input = process.argv[2]
  if (!input) {
    console.error('用法：node render-diagram.mjs <images/diagrams/<diagramId>.json>')
    process.exit(2)
  }
  const dataPath = path.resolve(input)
  const data = JSON.parse(readFileSync(dataPath, 'utf8'))
  const errors = validateDiagramData(data)
  if (errors.length > 0) {
    console.error(`示意圖資料檔有誤（${errors.length} 項）：`)
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  const svgPath = dataPath.replace(/\.json$/, '.svg')
  writeFileSync(svgPath, renderDiagram(data))
  console.log(`已產生示意圖：${svgPath}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
