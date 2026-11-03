import {defineField, defineType} from 'sanity'

export const article = defineType({
  name: 'article',
  title: '文章',
  type: 'document',
  // 打開文章先看到標題與正文；摘要、封面與網址等設定放在其他分頁，避免手動修改時誤動。
  groups: [
    {name: 'content', title: '標題與正文', default: true},
    {name: 'summary', title: '摘要、封面與搜尋結果'},
    {name: 'settings', title: '網址與設定'},
  ],
  fields: [
    defineField({
      name: 'title',
      group: 'content',
      title: '文章標題（H1）',
      type: 'string',
      validation: (rule) => rule.required().error('請填寫文章標題'),
    }),
    defineField({
      name: 'slug',
      group: 'settings',
      readOnly: ({document}) => Boolean(document?.publishedAt),
      title: '網址代稱',
      description:
        '使用英文小寫與連字號，例如：ginzan-onsen-ryokan。文章有發布日期後就鎖住，改了網址舊連結會失效。',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required().error('請產生網址代稱'),
    }),
    defineField({
      name: 'excerpt',
      group: 'summary',
      title: '站內摘要',
      description: '用於文章列表與相關文章區塊。',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(200).error('請填寫 200 個字元以內的摘要'),
    }),
    defineField({
      name: 'body',
      group: 'content',
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
        {type: 'mediaEmbed'},
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
            defineField({
              name: 'credit',
              title: '圖片署名',
              description: '照片：作者／來源／授權，或「本站製作示意圖」、「AI 示意圖」。',
              type: 'string',
              validation: (rule) => rule.required().error('請填寫圖片署名'),
            }),
            defineField({
              name: 'sourcePageUrl',
              title: '來源頁',
              description:
                '維基共享資源檔案頁、圖庫單張素材頁或觀光協會素材頁；自製圖與 AI 圖留空。',
              type: 'url',
              validation: (rule) => rule.uri({scheme: ['https']}),
            }),
            defineField({
              name: 'license',
              title: '授權',
              description: '例如 CC BY-SA 4.0、Unsplash License；自製圖與 AI 圖留空。',
              type: 'string',
            }),
          ],
        },
      ],
      validation: (rule) => rule.required().error('請填寫文章正文'),
    }),
    defineField({
      name: 'cover',
      group: 'summary',
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
      group: 'settings',
      title: '作者',
      type: 'reference',
      to: [{type: 'author'}],
      validation: (rule) => rule.required().error('請選擇作者'),
    }),
    defineField({
      name: 'primaryHub',
      group: 'settings',
      title: '主要主題中心',
      description: '每篇文章只能歸屬一個主要主題中心，這個關係會決定正式網址。',
      type: 'reference',
      to: [{type: 'hub'}],
      validation: (rule) => rule.required().error('請選擇主要主題中心'),
    }),
    defineField({
      name: 'aspect',
      group: 'settings',
      title: '面向',
      description: '這篇在回答哪一類問題。同一面向收錄滿 5 篇時，網站會建立目錄頁，例如 /stay/。',
      type: 'string',
      options: {
        list: [
          {title: '住宿', value: 'stay'},
          {title: '美食', value: 'food'},
          {title: '交通', value: 'transport'},
          {title: '天氣', value: 'weather'},
          {title: '登山與步道', value: 'hiking'},
          {title: '祭典與花火', value: 'festival'},
          {title: '景點', value: 'sight'},
          {title: '其他', value: 'other'},
        ],
      },
      validation: (rule) => rule.required().error('請選擇面向'),
    }),
    defineField({
      name: 'months',
      group: 'settings',
      title: '相關月份',
      description:
        '這篇特別適合哪幾個月閱讀，例如 12 月天氣頁填 12。月份頁收錄滿 5 個項目才會建立。',
      type: 'array',
      of: [{type: 'number'}],
      validation: (rule) =>
        rule
          .unique()
          .custom((value) =>
            (value ?? []).every(
              (month) =>
                typeof month === 'number' && Number.isInteger(month) && month >= 1 && month <= 12,
            )
              ? true
              : '相關月份必須是 1～12 的整數',
          ),
    }),
    defineField({
      name: 'tags',
      group: 'settings',
      title: '橫向情境 Tag',
      description:
        '從已建立的受控 Tag 選擇（例如親子、冬季、自駕），不自行輸入近義詞。Tag 不會改變文章正式網址。',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'relatedArticles',
      group: 'settings',
      title: '相關文章',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      validation: (rule) => rule.unique().max(6).warning('相關文章建議不超過 6 篇'),
    }),
    defineField({
      name: 'publishedAt',
      group: 'settings',
      title: '發布日期',
      type: 'datetime',
      validation: (rule) => rule.required().error('請填寫發布日期'),
    }),
    defineField({name: 'updatedAt', title: '重要更新日期', type: 'datetime', group: 'settings'}),
    defineField({
      name: 'seoTitle',
      group: 'summary',
      title: 'SEO 標題',
      description: '顯示在搜尋結果的標題，建議不超過 60 個字元。',
      type: 'string',
      validation: (rule) => rule.required().max(60).warning('建議控制在 60 個字元內'),
    }),
    defineField({
      name: 'seoDescription',
      group: 'summary',
      title: 'SEO 描述',
      description: '搜尋結果摘要，建議約 70～155 個字元。',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(160).warning('建議控制在 160 個字元內'),
    }),
    defineField({
      name: 'canonicalUrl',
      group: 'settings',
      title: '指定標準網址',
      description: '只有內容原始版本位於其他網址時才填寫。',
      type: 'url',
    }),
    defineField({
      name: 'noindex',
      group: 'settings',
      title: '禁止搜尋引擎索引',
      description: '新文章預設開啟；正式上線前完成檢查並取得核准後才關閉。',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'sponsored',
      group: 'settings',
      title: '贊助內容',
      description: '若文章涉及付費合作，請開啟此項目。',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'sponsorName',
      group: 'settings',
      title: '合作廠商名稱',
      type: 'string',
      hidden: ({document}) => !document?.sponsored,
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.sponsored && !value) return '贊助內容必須填寫合作廠商名稱'
          return true
        }),
    }),
    defineField({
      name: 'studioEditedAt',
      group: 'settings',
      title: '最後在後台手動發布',
      description:
        '在後台按「發布」時自動記錄，不用填。這個時間比下面的「已同步回 Git」新，代表這篇有手動修改還沒抓回 Git，自動工具不會整篇覆蓋這篇。',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'studioEditsSyncedAt',
      group: 'settings',
      title: '手動修改已同步回 Git',
      description: '抓回手動修改的工具（pull:studio-edits）寫的，不用填。',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: '最近修改（新到舊）',
      name: 'updatedDesc',
      by: [{field: '_updatedAt', direction: 'desc'}],
    },
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
