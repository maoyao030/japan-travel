import {defineField, defineType} from 'sanity'

export const article = defineType({
  name: 'article',
  title: '文章',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '文章標題（H1）',
      type: 'string',
      validation: (rule) => rule.required().error('請填寫文章標題'),
    }),
    defineField({
      name: 'slug',
      title: '網址代稱',
      description: '使用英文小寫與連字號，例如：ginzan-onsen-ryokan。發布後不要任意更改。',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required().error('請產生網址代稱'),
    }),
    defineField({
      name: 'excerpt',
      title: '站內摘要',
      description: '用於文章列表與相關文章區塊。',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(200).error('請填寫 200 個字元以內的摘要'),
    }),
    defineField({
      name: 'body',
      title: '文章正文',
      description:
        'FAQ 請使用含「常見問題」或「FAQ」的二級標題，每題使用三級標題，下一段直接填答案；網站會從同一份正文自動產生 FAQPage 資料。',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: '一般段落', value: 'normal'},
            {title: '二級標題', value: 'h2'},
            {title: '三級標題', value: 'h3'},
            {title: '引用', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: '粗體', value: 'strong'},
              {title: '斜體', value: 'em'},
              {title: '程式碼', value: 'code'},
            ],
            annotations: [
              {
                name: 'link',
                title: '連結',
                type: 'object',
                fields: [
                  defineField({
                    name: 'href',
                    title: '網址',
                    type: 'url',
                    validation: (rule) =>
                      rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto']}),
                  }),
                ],
              },
            ],
          },
        },
        {type: 'contentTable'},
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: '替代文字',
              type: 'string',
              validation: (rule) => rule.required().error('請描述圖片內容'),
            }),
            defineField({name: 'caption', title: '圖片說明', type: 'string'}),
          ],
        },
      ],
      validation: (rule) => rule.required().error('請填寫文章正文'),
    }),
    defineField({
      name: 'cover',
      title: '封面圖片',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: '替代文字',
          type: 'string',
          validation: (rule) => rule.required().error('請描述封面圖片內容'),
        }),
        defineField({
          name: 'caption',
          title: '圖片說明',
          description: '說明圖片與文章的關係；圖庫示意圖不得寫成特定旅館或店家的實景。',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'credit',
          title: '圖片署名',
          description: '例如：照片：攝影者／Pexels。',
          type: 'string',
        }),
        defineField({
          name: 'sourcePageUrl',
          title: '官方素材頁',
          description: '保存圖庫官方單張素材頁，方便日後追溯授權與攝影者。',
          type: 'url',
          validation: (rule) => rule.uri({scheme: ['https']}),
        }),
      ],
    }),
    defineField({
      name: 'author',
      title: '作者',
      type: 'reference',
      to: [{type: 'author'}],
      validation: (rule) => rule.required().error('請選擇作者'),
    }),
    defineField({
      name: 'primaryHub',
      title: '主要主題中心',
      description: '每篇文章只能歸屬一個主要主題中心，這個關係會決定正式網址。',
      type: 'reference',
      to: [{type: 'hub'}],
      validation: (rule) => rule.required().error('請選擇主要主題中心'),
    }),
    defineField({
      name: 'tags',
      title: '橫向情境 Tag',
      description: '從已建立的受控 Tag 選擇（例如親子、冬季、自駕），不自行輸入近義詞。Tag 不會改變文章正式網址。',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedArticles',
      title: '相關文章',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      validation: (rule) => rule.unique().max(6).warning('相關文章建議不超過 6 篇'),
    }),
    defineField({
      name: 'publishedAt',
      title: '發布日期',
      type: 'datetime',
      validation: (rule) => rule.required().error('請填寫發布日期'),
    }),
    defineField({name: 'updatedAt', title: '重要更新日期', type: 'datetime'}),
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
      name: 'canonicalUrl',
      title: '指定標準網址',
      description: '只有內容原始版本位於其他網址時才填寫。',
      type: 'url',
    }),
    defineField({
      name: 'noindex',
      title: '禁止搜尋引擎索引',
      description: '新文章預設開啟；正式上線前完成檢查並取得核准後才關閉。',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'sponsored',
      title: '贊助內容',
      description: '若文章涉及付費合作，請開啟此項目。',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'sponsorName',
      title: '合作廠商名稱',
      type: 'string',
      hidden: ({document}) => !document?.sponsored,
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.sponsored && !value) return '贊助內容必須填寫合作廠商名稱'
          return true
        }),
    }),
  ],
  orderings: [
    {
      title: '發布日期（新到舊）',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', author: 'author.name', media: 'cover', sponsored: 'sponsored'},
    prepare({title, author, media, sponsored}) {
      const labels = [author, sponsored ? '贊助內容' : undefined].filter(Boolean)
      return {title, subtitle: labels.join('｜'), media}
    },
  },
})
