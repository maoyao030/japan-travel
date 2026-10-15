import {defineField, defineType} from 'sanity'

export const hub = defineType({
  name: 'hub',
  title: '主題中心',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '標題',
      type: 'string',
      validation: (rule) => rule.required().error('請填寫主題中心標題'),
    }),
    defineField({
      name: 'slug',
      title: '網址代稱',
      description: '使用英文小寫與連字號，例如：ginzan-onsen。發布後不要任意更改。',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required().error('請產生網址代稱'),
    }),
    defineField({
      name: 'category',
      title: '大分類',
      description: '決定主題中心的網址與麵包屑位置。',
      type: 'string',
      options: {
        list: [
          {title: '住宿', value: 'stay'},
          {title: '天氣與季節', value: 'weather'},
          {title: '美食', value: 'food'},
          {title: '交通', value: 'transport'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('請選擇大分類'),
    }),
    defineField({
      name: 'parentHub',
      title: '父主題中心',
      description: '只有子主題中心需要選擇。父主題中心請留空，網站最多只使用父、子兩層。',
      type: 'reference',
      to: [{type: 'hub'}],
      options: {
        filter: '!defined(parentHub)',
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          if (value?._ref === context.document?._id) return '不能把自己設為父主題中心'
          return true
        }),
    }),
    defineField({
      name: 'landingArticle',
      title: '主題入口內容',
      description:
        '完整指南同時作為主題入口時，選擇原本的文章文件。網站會直接在主題中心網址顯示內容，不會再產生一層重複文章網址。',
      type: 'reference',
      to: [{type: 'article'}],
    }),
    defineField({
      name: 'eyebrow',
      title: '頁首短標',
      description: '顯示在主標題上方，直接說明這個主題的內容範圍。',
      type: 'string',
      validation: (rule) => rule.required().error('請填寫頁首短標'),
    }),
    defineField({
      name: 'introduction',
      title: '主題介紹',
      description: '說明這個主題涵蓋什麼，以及讀者能解決哪些問題。',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required().error('請填寫主題介紹'),
    }),
    defineField({
      name: 'checklist',
      title: '主題閱讀重點',
      description: '列出讀者規劃這類行程時需要確認的條件。',
      type: 'array',
      of: [{type: 'string'}],
      validation: (rule) => rule.required().min(3).max(5).error('請填寫 3～5 個閱讀重點'),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO 標題',
      description: '顯示在搜尋結果的標題，建議不超過 60 個字元。',
      type: 'string',
      validation: (rule) => rule.required().max(60).warning('建議控制在 60 個字元內'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO 描述',
      description: '搜尋結果摘要，建議約 70～155 個字元。',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(160).warning('建議控制在 160 個字元內'),
    }),
    defineField({
      name: 'featuredArticles',
      title: '精選文章',
      description: '選擇要優先呈現在主題中心的文章。',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedHubs',
      title: '相關主題中心',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'hub'}]}],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'publicationState',
      title: '頁面狀態',
      description:
        '設為可發布即會建立正式頁面，不再要求湊滿文章數；子主題也不需要等父主題先發布。',
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
      title: '已完成搜尋需求與內容邊界驗證',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'noindex',
      title: '禁止搜尋引擎索引',
      description: '新主題中心預設開啟；正式上線前完成檢查並取得核准後才關閉。',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'title', parentTitle: 'parentHub.title', noindex: 'noindex'},
    prepare({title, parentTitle, noindex}) {
      const level = parentTitle ? `子主題｜上層：${parentTitle}` : '父主題'
      return {title, subtitle: `${level}｜${noindex ? '禁止索引' : '允許索引'}`}
    },
  },
})
