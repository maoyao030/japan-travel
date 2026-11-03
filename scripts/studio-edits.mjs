/**
 * 把後台的手動修改整理成「修改前後對照」，給 studio/scripts/pull-studio-edits.mjs 用。
 * 修改前＝Git 的 reader-preview.md 與 publication.json，修改後＝後台現在的文章。
 */
import {blockPlainText, diffParagraphs, markdownParagraphs, portableTextToMarkdown} from './portable-text-to-markdown.mjs'

export const PUBLICATION_FIELDS = ['seoTitle', 'seoDescription', 'excerpt']
const FIELD_NAMES = {title: '文章標題（H1）', seoTitle: 'SEO 標題', seoDescription: 'SEO 描述', excerpt: '站內摘要'}

/** 後台記錄的時間轉成資料夾名稱，例如 2026-11-03T0412Z。 */
export function editFolderName(isoTime) {
  return new Date(isoTime).toISOString().slice(0, 16).replace(':', '') + 'Z'
}

/**
 * @param {{_id: string, title: string, body: Array, studioEditedAt: string} & Record<string, unknown>} article 後台的文章
 * @param {string | null} gitMarkdown Git 的 reader-preview.md，沒有就是 null
 * @param {Record<string, string> | null} publication Git 的 publication.json，沒有就是 null
 */
export function buildStudioEditReport(article, gitMarkdown, publication) {
  const studioMarkdown = portableTextToMarkdown(article.title, article.body)
  const gitTitle = gitMarkdown?.match(/^# (.+)$/m)?.[1]?.trim() ?? null
  const fieldChanges = []
  if (gitTitle !== null && gitTitle !== article.title) {
    fieldChanges.push({field: 'title', before: gitTitle, after: article.title})
  }
  for (const field of PUBLICATION_FIELDS) {
    const before = publication?.[field]
    if (typeof before === 'string' && typeof article[field] === 'string' && before !== article[field]) {
      fieldChanges.push({field, before, after: article[field]})
    }
  }

  const studioParagraphs = (article.body ?? []).map(blockPlainText).filter((text) => text !== '')
  const paragraphChanges = gitMarkdown === null ? [] : diffParagraphs(markdownParagraphs(gitMarkdown), studioParagraphs)

  const quote = (text) => text.split('\n').map((line) => `> ${line}`).join('\n')
  const lines = [
    `# ${article.title}：後台手動修改`,
    '',
    `- 文章：\`${article._id}\``,
    `- 後台發布時間：${article.studioEditedAt}`,
    `- 比對對象：Git 的 \`reader-preview.md\`${publication ? '與 `publication.json`' : ''}`,
    '',
  ]
  if (gitMarkdown === null) lines.push('Git 裡沒有這篇的 reader-preview.md，只存下後台版本。', '')
  if (fieldChanges.length === 0 && paragraphChanges.length === 0 && gitMarkdown !== null) {
    lines.push('文字和 Git 稿件一樣（可能只改了照片、連結或其他欄位）。', '')
  }
  if (fieldChanges.length > 0) {
    lines.push('## 標題與摘要', '')
    for (const change of fieldChanges) {
      lines.push(`### ${FIELD_NAMES[change.field]}`, '', '修改前：', '', quote(change.before), '', '修改後：', '', quote(change.after), '')
    }
  }
  if (paragraphChanges.length > 0) {
    lines.push('## 正文', '')
    paragraphChanges.forEach((change, index) => {
      const label = {changed: '改寫', removed: '刪掉', added: '新增'}[change.type]
      lines.push(`### ${index + 1}. ${label}`, '')
      if (change.before !== undefined) lines.push('修改前：', '', quote(change.before), '')
      if (change.after !== undefined) lines.push('修改後：', '', quote(change.after), '')
    })
  }
  lines.push(
    '## 抓回之後要做的事',
    '',
    '- 修改裡有新的事實（時間、價格、地點、規則），到研究記錄補官方來源與事實編號。',
    '- `draft-tagged.md` 還是舊版，照修改後的文字同步，事實編號跟著調整。',
    '- 值得學的改法，照寫作 Skill `references/examples.md` 的規則記成修改前後對照。',
    '',
  )

  return {studioMarkdown, fieldChanges, paragraphChanges, report: lines.join('\n')}
}

/** 套用修改後的 publication.json（只換有變的欄位）。 */
export function applyFieldChanges(publication, fieldChanges) {
  const next = {...publication}
  for (const change of fieldChanges) {
    if (PUBLICATION_FIELDS.includes(change.field)) next[change.field] = change.after
  }
  return next
}

/**
 * 後台正文轉回 Markdown 時，資料來源與延伸資料的條目會變成「- [名稱](網址)，說明」，
 * Git 稿件原本寫「- **名稱**，說明網址」。名稱與網址都一樣的條目改回 Git 的原文，免得被當成修改。
 */
export function keepGitSourceLines(gitMarkdown, studioMarkdown) {
  if (!gitMarkdown) return studioMarkdown
  const original = new Map()
  for (const line of gitMarkdown.split('\n')) {
    const match = line.match(/^- \*\*(.+?)\*\*，.*?(https?:\/\/\S+)$/)
    if (match) original.set(`${match[1]}\n${match[2]}`, line)
  }
  return studioMarkdown
    .split('\n')
    .map((line) => {
      const match = line.match(/^- \[(.+?)\]\((https?:\/\/[^)\s]+)\)，/)
      return (match && original.get(`${match[1]}\n${match[2]}`)) ?? line
    })
    .join('\n')
}
