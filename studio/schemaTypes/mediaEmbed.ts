import {defineField, defineType} from 'sanity'

// 文章裡嵌入的 YouTube 影片或官方 Instagram 貼文。內容留在對方平台，網站只在讀者點了之後才載入。
export const mediaEmbed = defineType({
  name: 'mediaEmbed',
  title: '嵌入影片或 Instagram 貼文',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: '平台',
      type: 'string',
      options: {list: [{title: 'YouTube', value: 'youtube'}, {title: 'Instagram', value: 'instagram'}]},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: '網址',
      description: 'YouTube：https://www.youtube.com/watch?v=影片ID；Instagram：https://www.instagram.com/p/代碼/',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'startSeconds',
      title: '從第幾秒開始播',
      description: '只有 YouTube 用。',
      type: 'number',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'title',
      title: '原標題',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'channelName',
      title: '頻道或帳號名稱',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: '發布年月',
      description: 'YYYY-MM',
      type: 'string',
      validation: (rule) => rule.required().regex(/^\d{4}-\d{2}$/),
    }),
    defineField({
      name: 'caption',
      title: '說明',
      description: '一句中文，說畫面是什麼、從哪裡開始看。',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {platform: 'platform', channelName: 'channelName', caption: 'caption'},
    prepare({platform, channelName, caption}) {
      return {
        title: caption || '嵌入',
        subtitle: `${platform === 'instagram' ? 'Instagram' : 'YouTube'}｜${channelName ?? ''}`,
      }
    },
  },
})
