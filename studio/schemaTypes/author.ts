import {defineField, defineType} from 'sanity'

export const author = defineType({
  name: 'author',
  title: '作者',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '姓名或筆名',
      type: 'string',
      validation: (rule) => rule.required().error('請填寫作者姓名或筆名'),
    }),
    defineField({
      name: 'slug',
      title: '網址代稱',
      description: '作者頁網址使用的英文小寫文字，例如：darren-chen。',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required().error('請產生網址代稱'),
    }),
    defineField({
      name: 'bio',
      title: '作者簡介',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().min(20).error('請填寫至少 20 個字的作者簡介'),
    }),
    defineField({
      name: 'expertise',
      title: '專業背景',
      description: '說明與日本旅遊、在地生活或內容查證相關的經驗；沒有相關背景時可留白。',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'photo',
      title: '作者照片',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: '替代文字',
          description: '供看不到圖片的讀者與搜尋引擎理解圖片。',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'links',
      title: '個人連結',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'authorLink',
          title: '個人連結',
          fields: [
            defineField({name: 'label', title: '連結名稱', type: 'string'}),
            defineField({name: 'url', title: '網址', type: 'url'}),
          ],
          validation: (rule) => rule.required(),
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'expertise', media: 'photo'},
  },
})
