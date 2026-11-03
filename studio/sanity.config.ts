import {zhHantLocale} from '@sanity/locale-zh-hant'
import {defineConfig, isDev} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {SITE_URL, articlePath} from './lib/articleUrl'
import {withStudioEditStamp} from './lib/studioEditStamp'
import {ViewOnSiteAction} from './lib/viewOnSiteAction'
import {structure} from './lib/structure'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: '繞路筆記',

  // 專案 ID 不是機密；沒有 studio/.env 的雲端 routine 直接用預設值。
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'e8ctf7ee',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  // 介面用繁體中文；查詢工具（Vision）只在本機開發時出現，線上後台不放。
  plugins: [zhHantLocale(), structureTool({structure}), ...(isDev ? [visionTool()] : [])],

  schema: {
    types: schemaTypes,
  },

  document: {
    // 在後台按「發布」時記下手動修改的時間，自動工具就不會蓋掉。
    actions: (previous, context) =>
      context.schemaType === 'article'
        ? [
            // 文章不在後台刪除或複製（刪掉就從網站消失）；要下架請交給 Claude Code 照流程處理。
            ...previous
              .filter((action) => action.action !== 'delete' && action.action !== 'duplicate')
              .map((action) =>
                action.action === 'publish' ? withStudioEditStamp(action) : action,
              ),
            ViewOnSiteAction,
          ]
        : previous,

    // 文章右上角選單的「開啟預覽」打開網站上的這一頁；在這個版本不一定出現，主要入口是「發布」旁的「在網站上看這篇」。
    productionUrl: async (previous, {document, getClient}) => {
      if (document._type !== 'article') return previous
      const data = await getClient({apiVersion: '2026-08-29'}).fetch(
        `*[_id == $id][0]{"slug": slug.current, "hub": primaryHub->{"slug": slug.current, category, "landing": landingArticle._ref, "parent": parentHub->slug.current}}`,
        {id: document._id.replace(/^drafts\./, '')},
      )
      const path = data ? articlePath({id: document._id, ...data}) : undefined
      return path ? `${SITE_URL}${path}` : previous
    },
  },
})
