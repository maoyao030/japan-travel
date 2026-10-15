// Sanity 圖片 CDN 可用網址參數即時縮圖；手機只下載符合版面寬度的圖片，不再拿 1600px 原圖。
const SANITY_IMAGE_HOST = 'cdn.sanity.io'
const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600]
const FALLBACK_WIDTH = 1200

export type ResponsiveImage = {
  src: string
  srcset?: string
}

function isSanityImage(url: URL): boolean {
  return url.hostname === SANITY_IMAGE_HOST && url.pathname.startsWith('/images/')
}

function withWidth(url: URL, width: number): string {
  const sized = new URL(url)
  sized.searchParams.set('w', String(width))
  sized.searchParams.set('auto', 'format')
  return sized.toString()
}

export function getResponsiveImage(src: string, originalWidth?: number | null): ResponsiveImage {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return {src}
  }
  if (!isSanityImage(url)) return {src}

  const maxWidth = originalWidth && originalWidth > 0 ? originalWidth : RESPONSIVE_WIDTHS.at(-1)!
  const widths = RESPONSIVE_WIDTHS.filter((width) => width < maxWidth)
  widths.push(Math.min(maxWidth, RESPONSIVE_WIDTHS.at(-1)!))

  return {
    src: withWidth(url, Math.min(FALLBACK_WIDTH, maxWidth)),
    srcset: widths.map((width) => `${withWidth(url, width)} ${width}w`).join(', '),
  }
}

// 各版位在不同螢幕下的實際顯示寬度，需與 global.css 的版面斷點一致。
export const IMAGE_SIZES = {
  leadStory: '(max-width: 760px) calc(100vw - 2rem), 50rem',
  storyCard: '(max-width: 760px) calc(100vw - 2rem), (max-width: 1200px) 45vw, 24rem',
  categoryStoryCard: '(max-width: 760px) 7rem, (max-width: 1200px) 45vw, 24rem',
  articleCover: '(max-width: 74rem) calc(100vw - 2rem), 72rem',
} as const
