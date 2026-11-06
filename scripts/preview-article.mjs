/**
 * 口述優化的預覽：把 content-production/<文章>/reader-preview.md 照網站的樣子畫出來，
 * 開在 Darren 的預覽視窗，不用讀 Markdown 稿（Darren 2026-11-06）。
 *
 * - 線上正文的照片、嵌入與站內連結照上傳時的規則搬進來（scripts/replace-body.mjs），看到的就是上傳後的樣子。
 * - 候選照片寫在 .tmp/preview/<文章>/candidates.json（不進 Git），畫在指定段落後面，用橘框標「候選 1」「候選 2」。
 *   格式：[{"near": "段落裡的一段字", "label": "候選 1", "url": "https://…", "alt": "…", "credit": "…"}]
 * - 稿件或候選檔一改，預覽視窗兩秒內自動重新整理、停在原本的位置。上方可以切換手機寬度與電腦寬度。
 * - 只讀網站的公開資料，不寫 Sanity、不改稿件。
 *
 * 用法：node scripts/preview-article.mjs --article=<文章> [--port=4400]
 */
import {createServer} from 'node:http'
import {readFile, stat} from 'node:fs/promises'
import path from 'node:path'

import {parseMarkdownBody} from './markdown-to-portable-text.mjs'
import {rebuildBody} from './replace-body.mjs'
import {renderPortableText} from '../src/lib/portableText.ts'

const plainText = (block) => (block.children ?? []).map((child) => child.text ?? '').join('')

/** 把候選照片插在含有 near 那段字的段落後面；找不到就放在最前面並標出來。 */
export function insertCandidates(body, candidates) {
  const result = [...body]
  const missing = []
  for (const candidate of candidates) {
    const image = {
      _type: 'image',
      _key: `candidate-${candidate.label}`,
      url: candidate.url,
      alt: candidate.alt || candidate.label,
      caption: `${candidate.label}${candidate.alt ? `｜${candidate.alt}` : ''}`,
      credit: candidate.credit,
      candidate: true,
    }
    const index = result.findIndex((block) => block._type === 'block' && plainText(block).includes(candidate.near))
    if (index === -1) missing.push(candidate.label)
    else {
      let at = index + 1
      while (result[at]?.candidate) at += 1
      result.splice(at, 0, image)
    }
  }
  return {body: result, missing}
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = Object.fromEntries(
    process.argv
      .slice(2)
      .filter((argument) => argument.startsWith('--'))
      .map((argument) => {
        const [key, ...value] = argument.slice(2).split('=')
        return [key, value.length ? value.join('=') : true]
      }),
  )
  if (typeof options.article !== 'string') throw new Error('必須提供 --article')
  const slug = options.article.replace(/^article-/, '')
  const port = Number(options.port ?? 4400)
  const root = path.resolve(import.meta.dirname, '..')
  const packet = path.join(root, 'content-production', slug)
  const markdownFile = path.join(packet, 'reader-preview.md')
  const candidatesFile = path.join(root, '.tmp', 'preview', slug, 'candidates.json')

  async function fetchLive() {
    const query = `*[_id == "article-${slug}"][0]{title, body[]{..., _type == "image" => {"url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height}}}`
    const url = new URL('https://e8ctf7ee.api.sanity.io/v2026-08-29/data/query/production')
    url.searchParams.set('query', query)
    try {
      const {result} = await (await fetch(url)).json()
      return result
    } catch {
      return null
    }
  }

  async function buildPage() {
    const markdown = await readFile(markdownFile, 'utf8')
    const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? slug
    const live = await fetchLive()
    let body
    let note = ''
    if (live?.body) {
      const rebuilt = rebuildBody(live.body, markdown, {articleId: `article-${slug}`})
      body = rebuilt.body
      if (rebuilt.notCarried.length) note = `有 ${rebuilt.notCarried.length} 個照片、嵌入或連結找不到位置，上傳前要處理`
    } else {
      body = parseMarkdownBody(markdown).blocks
      note = '讀不到網站上的版本，預覽沒有線上的照片'
    }
    const candidates = JSON.parse(await readFile(candidatesFile, 'utf8').catch(() => '[]'))
    const placed = insertCandidates(body, candidates)
    if (placed.missing.length) note = [note, `找不到放候選照片的段落：${placed.missing.join('、')}`].filter(Boolean).join('；')
    let html = renderPortableText(placed.body)
    for (const candidate of candidates) {
      html = html.replace(`<figure class="article-image"><img src="${candidate.url.replaceAll('&', '&amp;')}"`, `<figure class="article-image preview-candidate"><img src="${candidate.url.replaceAll('&', '&amp;')}"`)
    }
    const css = await readFile(path.join(root, 'src/styles/global.css'), 'utf8')
    return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>預覽｜${title}</title><style>${css}
  body{background:var(--paper)}
  .preview-note{margin:0 0 1rem;padding:.6rem .8rem;border-radius:.4rem;background:#fff1e8;color:var(--clay);font:14px/1.5 var(--font-sans)}
  .preview-frame{max-width:46rem;margin:0 auto;padding:1.25rem 1rem 4rem}
  .preview-candidate{outline:4px solid var(--clay);outline-offset:4px;border-radius:.5rem}
  .preview-candidate figcaption span{color:var(--clay);font-weight:800}
  </style></head><body>
  <div class="preview-frame">${note ? `<p class="preview-note">${note}</p>` : ''}<h1>${title}</h1><div class="article-body"><div class="portable-content">${html}</div></div></div>
  </body></html>`
  }

  // 外框：上方切換手機／電腦寬度，文章放在 iframe 裡，手機寬度時網站的手機樣式（表格卡片）才會出現
  const SHELL = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>文章預覽</title><style>
  html,body{margin:0;height:100%;background:#d9dde3;font:14px/1.4 "PingFang TC","Noto Sans TC",system-ui,sans-serif}
  .bar{display:flex;gap:.5rem;align-items:center;padding:.55rem 1rem;background:#1a1f2b;color:#fff}
  .bar button{border:1px solid #fff6;background:none;color:#fff;border-radius:.4rem;padding:.25rem .8rem;font:inherit;cursor:pointer}
  .bar button[aria-pressed=true]{background:#fff;color:#1a1f2b}
  .stage{height:calc(100% - 2.6rem);display:flex;justify-content:center}
  iframe{border:0;background:#fff;height:100%;width:100%}
  body.phone iframe{width:390px;box-shadow:0 0 0 1px #0002}
  </style></head><body class="phone">
  <div class="bar"><strong>預覽（還沒上傳）</strong><button data-w="phone">手機</button><button data-w="desktop">電腦</button></div>
  <div class="stage"><iframe id="page" src="/page"></iframe></div>
  <script>
  const frame=document.getElementById('page')
  const set=(w)=>{document.body.className=w;localStorage.previewWidth=w;document.querySelectorAll('[data-w]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.w===w))}
  document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>set(b.dataset.w));set(localStorage.previewWidth||'phone')
  let v=null,y=0
  frame.onload=()=>{try{frame.contentWindow.scrollTo(0,y)}catch{}}
  setInterval(async()=>{try{const n=await (await fetch('/version')).text();if(v&&n!==v){y=frame.contentWindow.scrollY;frame.contentWindow.location.reload()}v=n}catch{}},2000)
  </script></body></html>`

  async function version() {
    const times = await Promise.all([markdownFile, candidatesFile].map((file) => stat(file).then((s) => s.mtimeMs).catch(() => 0)))
    return times.join('-')
  }

    createServer(async (request, response) => {
      try {
        if (request.url === '/version') {
          response.end(await version())
          return
        }
        response.setHeader('content-type', 'text/html; charset=utf-8')
        response.end(request.url === '/page' ? await buildPage() : SHELL)
      } catch (error) {
        response.statusCode = 500
        response.end(String(error?.stack ?? error))
      }
    }).listen(port, () => console.log(`預覽：http://localhost:${port}/（${slug}）`))
}
