/** 把一份 reader-preview.md 照網站樣式畫成一個 HTML 檔。用法：node build-preview-single.mjs <reader-preview.md> <輸出.html> */
import {readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {parseMarkdownBody} from '../../scripts/markdown-to-portable-text.mjs'
import {renderPortableText} from '../../src/lib/portableText.ts'
const root = path.resolve(import.meta.dirname, '..', '..')
const [input, out] = process.argv.slice(2)
const markdown = readFileSync(input, 'utf8')
const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? ''
const css = readFileSync(path.join(root, 'src/styles/global.css'), 'utf8')
const html = renderPortableText(parseMarkdownBody(markdown).blocks)
writeFileSync(out, `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${css}
body{background:var(--paper)}.preview-frame{max-width:46rem;margin:0 auto;padding:1.25rem 1rem 4rem;box-sizing:border-box;width:100%}
.article-body,.portable-content{min-width:0;max-width:100%}.portable-content>*{max-width:100%;box-sizing:border-box}.article-table-scroll{overflow-x:auto}.article-table-scroll td{overflow-wrap:anywhere}
.preview-tag{display:inline-block;margin:0 0 .75rem;padding:.2rem .7rem;border-radius:999px;background:#1a1f2b;color:#fff;font:700 14px/1.6 system-ui,sans-serif}
</style></head><body><div class="preview-frame"><span class="preview-tag">試寫，還沒上線</span><h1>${title}</h1><div class="article-body"><div class="portable-content">${html}</div></div></div></body></html>`)
console.log(out)
