import {Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {type Tool, useClient} from 'sanity'
import {useRouter} from 'sanity/router'

import {
  ASPECT_NAMES,
  aspectOf,
  paragraphHints,
  pickForDay,
  rankCandidates,
  taipeiDate,
} from '../../scripts/daily-optimize.mjs'
import {SITE_URL, articlePath} from './articleUrl'

const API_VERSION = '2026-08-29'
const LIST_QUERY = `*[_type == "article" && !(_id in path("drafts.**"))]{
  _id, title, noindex, publishedAt, studioEditedAt, studioEditLog[]{at},
  "slug": slug.current,
  "hub": primaryHub->{"slug": slug.current, category, "landing": landingArticle._ref, "parent": parentHub->slug.current}
}`

type Article = {
  id: string
  title: string
  slug?: string
  path?: string
  noindex?: boolean
  publishedAt?: string
  studioEditedAt?: string
  studioEditLog?: Array<{at: string}>
}
type Hint = {text: string; length: number; commasPerSentence: number}

/**
 * 後台第一頁「今天優化哪篇」：挑一篇還沒手動優化的上線文章（規則和每日推播一樣，見 scripts/daily-optimize.mjs），
 * 按「開始改這篇」直接打開編輯畫面，「換一篇」看下一篇。
 */
function OptimizeToday() {
  const client = useClient({apiVersion: API_VERSION})
  const router = useRouter()
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [error, setError] = useState<string>()
  const [offset, setOffset] = useState(0)
  const [hints, setHints] = useState<Hint[] | null>(null)

  useEffect(() => {
    client
      .fetch(LIST_QUERY, {}, {perspective: 'published'})
      .then((rows: Array<Record<string, unknown> & {_id: string}>) =>
        setArticles(
          rows.map((row) => ({
            ...(row as unknown as Article),
            id: row._id,
            path: articlePath({id: row._id, slug: row.slug as string, hub: row.hub as never}),
          })),
        ),
      )
      .catch((fetchError: Error) => setError(fetchError.message))
  }, [client])

  const today = taipeiDate(new Date().toISOString())
  const {candidates, live, editedCount} = useMemo(() => {
    const all = articles ?? []
    const liveArticles = all.filter((article) => article.noindex !== true && article.path)
    const ranked = rankCandidates(all) as Article[]
    return {
      candidates: ranked,
      live: liveArticles,
      editedCount: liveArticles.length - ranked.length,
    }
  }, [articles])

  const pick = useMemo(() => {
    const base = pickForDay(candidates, today, editedCount) as Article | null
    if (!base) return null
    const index = candidates.indexOf(base)
    return candidates[(index + offset) % candidates.length]
  }, [candidates, today, editedCount, offset])

  useEffect(() => {
    if (!pick) return
    setHints(null)
    client
      .fetch('*[_id == $id][0].body', {id: pick.id}, {perspective: 'published'})
      .then((body: unknown[]) => setHints(paragraphHints(body)))
      .catch(() => setHints([]))
  }, [client, pick])

  if (error) {
    return (
      <Card padding={5} tone="critical">
        <Text>讀不到文章清單：{error}</Text>
      </Card>
    )
  }
  if (!articles) {
    return (
      <Flex padding={5} justify="center">
        <Spinner />
      </Flex>
    )
  }
  if (!pick) {
    return (
      <Card padding={5}>
        <Text size={3}>上線的 {live.length} 篇都手動優化過了。</Text>
      </Card>
    )
  }

  const position = candidates.indexOf(pick) + 1
  return (
    <Box padding={[4, 5, 6]} style={{maxWidth: 820, margin: '0 auto'}}>
      <Stack gap={5}>
        <Text muted size={2}>
          {today}・上線 {live.length} 篇，已優化 {editedCount} 篇，還有 {candidates.length} 篇
        </Text>
        <Stack gap={4}>
          <Text size={2} weight="semibold">
            {offset === 0 ? '今天這篇還沒優化' : `換一篇（第 ${offset + 1} 篇）`}
          </Text>
          <Heading size={4} as="h1">
            {pick.title}
          </Heading>
          <Text muted size={2}>
            {ASPECT_NAMES[aspectOf(pick) as keyof typeof ASPECT_NAMES]}頁，還沒優化的{' '}
            {candidates.length} 篇裡排第 {position}（住宿最前，其次交通、景點）。
          </Text>
        </Stack>
        <Flex gap={3} wrap="wrap">
          <Button
            tone="primary"
            fontSize={2}
            padding={4}
            text="開始改這篇"
            onClick={() => router.navigateIntent('edit', {id: pick.id, type: 'article'})}
          />
          <Button
            mode="ghost"
            fontSize={2}
            padding={4}
            text="在網站上看"
            as="a"
            href={`${SITE_URL}${pick.path}`}
            target="_blank"
            rel="noopener"
          />
          <Button
            mode="bleed"
            fontSize={2}
            padding={4}
            text="換一篇"
            onClick={() => setOffset((value) => value + 1)}
          />
        </Flex>
        <Card padding={4} radius={3} border>
          <Stack gap={4}>
            <Text size={2} weight="semibold">
              可以先看這幾段（句子裡逗號最多、讀起來最容易卡）
            </Text>
            {hints === null ? (
              <Spinner />
            ) : hints.length === 0 ? (
              <Text muted>這篇沒有特別長的段落。</Text>
            ) : (
              hints.map((hint, index) => (
                <Stack key={hint.text} gap={2}>
                  <Text size={2}>
                    {index + 1}. {hint.text.length > 80 ? `${hint.text.slice(0, 80)}…` : hint.text}
                  </Text>
                  <Text muted size={1}>
                    {hint.length} 字，平均每句 {hint.commasPerSentence.toFixed(1)} 個逗號
                  </Text>
                </Stack>
              ))
            )}
          </Stack>
        </Card>
        <Text muted size={1}>
          改完在編輯畫面按「發布」就算一次優化，這篇之後不會再出現在這裡。
        </Text>
      </Stack>
    </Box>
  )
}

export const optimizeTool: Tool = {
  name: 'optimize-today',
  title: '今天優化哪篇',
  component: OptimizeToday,
}
