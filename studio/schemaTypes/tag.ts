import {defineField, defineType} from 'sanity'

export const tag = defineType({
  name: 'tag',
  title: '橫向情境 Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tag 名稱',
      description: '描述跨主題的旅遊情境、條件或對象，例如：親子旅行、冬季自駕。',
      type: 'string',
      validation: (rule) => rule.required().error('請填寫 Tag 名稱'),
    }),
    defineField({
      name: 'slug',
      title: '網址代稱',
      description: '使用英文小寫與連字號，例如：family-trip。',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required().error('請產生網址代稱'),
    }),
    defineField({
      name: 'description',
      title: '獨立介紹與內容範圍',
      description: '說明這個 Tag 收錄哪些情境、排除哪些內容，以及讀者可以怎麼使用此頁。',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required().error('請填寫獨立介紹與內容範圍'),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO 標題',
      type: 'string',
      validation: (rule) => rule.required().max(60).warning('建議控制在 60 個字元內'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO 描述',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(160).warning('建議控制在 160 個字元內'),
    }),
    defineField({
      name: 'featuredArticles',
      title: '精選文章',
      description: '選擇要排在 Tag 頁前面的文章。',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedHubs',
      title: '相關主題中心',
      description: '列出這個情境橫跨的主題中心。',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'hub'}]}],
      validation: (rule) => rule.unique().min(2).warning('公開前至少應涵蓋 2 個主題中心'),
    }),
    defineField({
      name: 'publicationState',
      title: '頁面狀態',
      description: '文章數量、跨主題價值與內容邊界都確認後，才改為可發布。',
      type: 'string',
      options: {
        list: [
          {title: '草稿', value: 'draft'},
          {title: '可發布', value: 'ready'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'researchValidated',
      title: '已確認搜尋需求與內容邊界不重複',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'noindex',
      title: '禁止搜尋引擎索引',
      description: '新 Tag 預設開啟；正式上線檢查與核准後才關閉。',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'title', publicationState: 'publicationState', noindex: 'noindex'},
    prepare({title, publicationState, noindex}) {
      const state = publicationState === 'ready' ? '可發布' : '草稿'
      return {title, subtitle: `${state}｜${noindex ? '禁止索引' : '允許索引'}`}
    },
  },
})
