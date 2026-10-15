import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const [, , configArgument, outputArgument] = process.argv

if (!configArgument || !outputArgument) {
  throw new Error('用法：node scripts/prepare-sanity-content.mjs <設定 JSON> <輸出資料夾>')
}

const configPath = path.resolve(configArgument)
const outputPath = path.resolve(outputArgument)
const config = JSON.parse(await readFile(configPath, 'utf8'))
const sourcePath = path.resolve(path.dirname(configPath), config.source)
const markdown = await readFile(sourcePath, 'utf8')

let keyNumber = 0

function nextKey(prefix) {
  keyNumber += 1
  return `${prefix}${String(keyNumber).padStart(4, '0')}`
}

function parseInline(text) {
  const children = []
  const markDefs = []
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let cursor = 0

  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) {
      children.push({
        _key: nextKey('span'),
        _type: 'span',
        marks: [],
        text: text.slice(cursor, match.index),
      })
    }

    const token = match[0]
    if (token.startsWith('**')) {
      children.push({
        _key: nextKey('span'),
        _type: 'span',
        marks: ['strong'],
        text: token.slice(2, -2),
      })
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (!linkMatch) throw new Error(`無法解析連結：${token}`)
      const markKey = nextKey('link')
      markDefs.push({_key: markKey, _type: 'link', href: linkMatch[2]})
      children.push({
        _key: nextKey('span'),
        _type: 'span',
        marks: [markKey],
        text: linkMatch[1],
      })
    }

    cursor = match.index + token.length
  }

  if (cursor < text.length || children.length === 0) {
    children.push({
      _key: nextKey('span'),
      _type: 'span',
      marks: [],
      text: text.slice(cursor),
    })
  }

  return {children, markDefs}
}

function createBlock(text, options = {}) {
  const {children, markDefs} = parseInline(text)
  return {
    _key: nextKey('block'),
    _type: 'block',
    children,
    markDefs,
    style: options.style ?? 'normal',
    ...(options.listItem ? {level: 1, listItem: options.listItem} : {}),
  }
}

function isTableDivider(line) {
  const cells = splitTableRow(line)
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isSpecialLine(line, nextLine) {
  return (
    line.trim() === '' ||
    line.trim() === '---' ||
    /^#{2,3}\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^>\s?/.test(line) ||
    (line.trim().startsWith('|') && nextLine && isTableDivider(nextLine))
  )
}

function parseMarkdownBody(markdownSource) {
  const lines = markdownSource
    .replaceAll('\r\n', '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
  const titleIndex = lines.findIndex((line) => line.startsWith('# '))

  if (titleIndex === -1) throw new Error('文章來源缺少 H1')

  const title = lines[titleIndex].slice(2).trim()
  const blocks = []
  let index = titleIndex + 1

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed || trimmed === '---') {
      index += 1
      continue
    }

    if (trimmed.startsWith('|') && lines[index + 1] && isTableDivider(lines[index + 1])) {
      const columns = splitTableRow(trimmed)
      const rows = []
      index += 2

      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push({
          _key: nextKey('row'),
          _type: 'contentTableRow',
          cells: splitTableRow(lines[index]),
        })
        index += 1
      }

      if (rows.some((row) => row.cells.length !== columns.length)) {
        throw new Error(`表格「${columns.join('｜')}」的欄數不一致`)
      }

      blocks.push({
        _key: nextKey('table'),
        _type: 'contentTable',
        columns,
        rows,
      })
      continue
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/)
    if (heading) {
      blocks.push(
        createBlock(heading[2].trim(), {
          style: heading[1].length === 2 ? 'h2' : 'h3',
        }),
      )
      index += 1
      continue
    }

    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      blocks.push(createBlock(bullet[1].trim(), {listItem: 'bullet'}))
      index += 1
      continue
    }

    const number = line.match(/^\d+\.\s+(.+)$/)
    if (number) {
      blocks.push(createBlock(number[1].trim(), {listItem: 'number'}))
      index += 1
      continue
    }

    if (line.startsWith('>')) {
      const quote = []
      while (index < lines.length && lines[index].startsWith('>')) {
        quote.push(lines[index].replace(/^>\s?/, '').trim())
        index += 1
      }
      blocks.push(createBlock(quote.join(' '), {style: 'blockquote'}))
      continue
    }

    const paragraph = [trimmed]
    index += 1
    while (
      index < lines.length &&
      !isSpecialLine(lines[index], lines[index + 1]) &&
      !lines[index].startsWith('# ')
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(createBlock(paragraph.join(' ')))
  }

  return {title, blocks}
}

function paragraphsToBlocks(paragraphs) {
  return paragraphs.map((paragraph) => createBlock(paragraph))
}

const {title: sourceTitle, blocks: body} = parseMarkdownBody(markdown)

if (sourceTitle !== config.article.title) {
  throw new Error(`H1 與同步設定不一致：\n來源：${sourceTitle}\n設定：${config.article.title}`)
}

const author = config.author
  ? {
      ...config.author,
      _type: 'author',
      slug: {_type: 'slug', current: config.author.slug},
    }
  : null

const hub = config.hub
  ? {
      ...config.hub,
      _type: 'hub',
      slug: {_type: 'slug', current: config.hub.slug},
      introduction: paragraphsToBlocks(config.hub.introduction),
    }
  : null

const childHub = config.childHub
  ? {
      ...config.childHub,
      _type: 'hub',
      slug: {_type: 'slug', current: config.childHub.slug},
      introduction: paragraphsToBlocks(config.childHub.introduction),
      parentHub: {_type: 'reference', _ref: config.hub._id},
      landingArticle: {_type: 'reference', _ref: config.article._id},
    }
  : null

const authorId = author?._id ?? config.authorRef
const primaryHubId = childHub?._id ?? hub?._id ?? config.primaryHubRef

if (!authorId) throw new Error('同步設定缺少 author 或 authorRef')
if (!primaryHubId) throw new Error('同步設定缺少 hub、childHub 或 primaryHubRef')

const article = {
  ...config.article,
  _type: 'article',
  slug: {_type: 'slug', current: config.article.slug},
  author: {_type: 'reference', _ref: authorId},
  primaryHub: {
    _type: 'reference',
    _ref: primaryHubId,
  },
  body,
}

await mkdir(outputPath, {recursive: true})
await Promise.all(
  [
    ...(author ? [['author.json', author]] : []),
    ...(hub ? [['hub.json', hub]] : []),
    ...(childHub ? [['child-hub.json', childHub]] : []),
    ['article.json', article],
  ].map(([fileName, document]) =>
    writeFile(path.join(outputPath, fileName), `${JSON.stringify(document, null, 2)}\n`, 'utf8'),
  ),
)

console.log(`已準備 Sanity 文件：${outputPath}`)
