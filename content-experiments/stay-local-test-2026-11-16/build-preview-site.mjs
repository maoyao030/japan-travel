/** 用網站真正的程式（renderPortableText 與 global.css）畫預覽：final.md 加上 embed-plan.json 的嵌入與封面。
 *  用法：node build-preview-site.mjs <資料夾，例如 breakfast>　→ <資料夾>/preview-site.html */
import {readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {parseMarkdownBody} from '../../scripts/markdown-to-portable-text.mjs'
import {renderPortableText} from '../../src/lib/portableText.ts'
const here = import.meta.dirname
const root = path.resolve(here, '..', '..')
const dir = path.join(here, process.argv[2])
const markdown = readFileSync(path.join(dir, 'final.md'), 'utf8')
const plan = JSON.parse(readFileSync(path.join(dir, 'embed-plan.json'), 'utf8'))
const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? ''
const blocks = parseMarkdownBody(markdown).blocks
const text = (b) => (b.children ?? []).map((c) => c.text ?? '').join('')
for (const e of plan.embeds) {
  const at = blocks.findIndex((b) => b._type === 'block' && /^h[23]$/.test(b.style ?? '') && text(b) === e.placement.heading)
  if (at < 0) throw new Error(`找不到標題：${e.placement.heading}`)
  blocks.splice(at + 1 + e.placement.afterBlocks, 0, {_key: `media-embed-${e.embedId}`, _type: 'mediaEmbed', platform: e.platform, url: e.url, title: e.captionDraft, channelName: e.channelName, publishedAt: e.publishedAt, caption: e.captionDraft})
}
const css = readFileSync(path.join(root, 'src/styles/global.css'), 'utf8')
const c = plan.cover
const cover = c ? `<figure style="margin:0 0 1.25rem"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c.file)}?width=1200" alt="${c.alt}" style="width:100%;border-radius:8px"><figcaption style="font-size:.8rem;color:#666">${c.alt}（${c.source}，${c.license}）</figcaption></figure>` : ''
writeFileSync(path.join(dir, 'preview-site.html'), `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${css}
body{background:var(--paper)}.preview-frame{max-width:46rem;margin:0 auto;padding:1.25rem 1rem 4rem;box-sizing:border-box;width:100%}
.article-body,.portable-content{min-width:0;max-width:100%}.portable-content>*{max-width:100%;box-sizing:border-box}.article-table-scroll{overflow-x:auto}.article-table-scroll td{overflow-wrap:anywhere}
.preview-tag{display:inline-block;margin:0 0 .75rem;padding:.2rem .7rem;border-radius:999px;background:#1a1f2b;color:#fff;font:700 14px/1.6 system-ui,sans-serif}
</style></head><body><div class="preview-frame"><span class="preview-tag">試寫，還沒上線（用網站的程式畫的）</span><h1>${title}</h1>${cover}<div class="article-body"><div class="portable-content">${renderPortableText(blocks)}</div></div></div></body></html>`)
console.log(`${process.argv[2]}：嵌入 ${plan.embeds.length} 則`)
