/**
 * 把兩位作者的 reader-preview.md 照網站樣式畫成一個 HTML 檔，上方可切換 A／B 兩版與手機、電腦寬度。
 * 只給 Darren 並排比較用，檔案寫到指定路徑（不進 repo）。
 *
 * 用法：node content-experiments/asahikawa-stay-full-2026-11-12/build-preview.mjs <輸出.html>
 */
import {readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'

import {parseMarkdownBody} from '../../scripts/markdown-to-portable-text.mjs'
import {renderPortableText} from '../../src/lib/portableText.ts'

const here = import.meta.dirname
const root = path.resolve(here, '..', '..')
const out = process.argv[2]
if (!out) throw new Error('要給輸出檔路徑')
// 代號對應寫在 README，這裡只用代號
const versions = [['A', 'opus'], ['B', 'sonnet']]
const css = readFileSync(path.join(root, 'src/styles/global.css'), 'utf8')
const escapeAttribute = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;')

const pages = versions.map(([label, folder]) => {
  const markdown = readFileSync(path.join(here, folder, 'reader-preview.md'), 'utf8')
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? label
  const html = renderPortableText(parseMarkdownBody(markdown).blocks)
  const page = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}
body{background:var(--paper)}.preview-frame{max-width:46rem;margin:0 auto;padding:1.25rem 1rem 4rem;box-sizing:border-box;width:100%}
.article-body,.portable-content{min-width:0;max-width:100%}.portable-content>*{max-width:100%;box-sizing:border-box}.article-table-scroll{overflow-x:auto}.article-table-scroll td{overflow-wrap:anywhere}
.preview-tag{display:inline-block;margin:0 0 .75rem;padding:.2rem .7rem;border-radius:999px;background:#1a1f2b;color:#fff;font:700 14px/1.6 system-ui,sans-serif}
</style></head><body><div class="preview-frame"><span class="preview-tag">${label} 版（試寫，還沒上線）</span><h1>${title}</h1><div class="article-body"><div class="portable-content">${html}</div></div></div></body></html>`
  return [label, page]
})

const shell = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>旭川住宿完整版｜A、B 兩版比較</title><style>
html,body{margin:0;height:100%;background:#d9dde3;font:14px/1.4 "PingFang TC","Noto Sans TC",system-ui,sans-serif}
.bar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;padding:.55rem 1rem;background:#1a1f2b;color:#fff}
.bar span{opacity:.7;margin-left:.5rem}
.bar button{border:1px solid #fff6;background:none;color:#fff;border-radius:.4rem;padding:.3rem .9rem;font:inherit;cursor:pointer}
.bar button[aria-pressed=true]{background:#fff;color:#1a1f2b;font-weight:700}
.stage{height:calc(100% - 3rem);display:flex;justify-content:center}
iframe{border:0;background:#fff;height:100%;width:100%;display:none}
iframe.on{display:block}
body.phone iframe{width:390px;max-width:100%;box-shadow:0 0 0 1px #0002}
</style></head><body class="phone">
<div class="bar"><strong>旭川住宿完整版</strong>${pages.map(([label]) => `<button data-v="${label}">${label} 版</button>`).join('')}<span>寬度</span><button data-w="phone">手機</button><button data-w="desktop">電腦</button></div>
<div class="stage">${pages.map(([label, page]) => `<iframe id="v${label}" title="${label} 版" srcdoc="${escapeAttribute(page)}"></iframe>`).join('')}</div>
<script>
const show=(v)=>{document.querySelectorAll('iframe').forEach(f=>f.classList.toggle('on',f.id==='v'+v));document.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v))}
const width=(w)=>{document.body.className=w;document.querySelectorAll('[data-w]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.w===w))}
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>show(b.dataset.v))
document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>width(b.dataset.w))
show('A');width(window.innerWidth<700?'phone':'desktop')
</script></body></html>`
writeFileSync(out, shell)
console.log(`${out}（${Math.round(shell.length / 1024)} KB）`)
