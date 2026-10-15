import {defineArrayMember, defineField, defineType} from 'sanity'

export const contentTable = defineType({
  name: 'contentTable',
  title: '比較表格',
  type: 'object',
  fields: [
    defineField({
      name: 'columns',
      title: '欄位名稱',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(2).error('表格至少需要 2 個欄位'),
    }),
    defineField({
      name: 'rows',
      title: '資料列',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'contentTableRow',
          title: '資料列',
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: '儲存格',
              type: 'array',
              of: [defineArrayMember({type: 'string'})],
              validation: (rule) => rule.required().min(2).error('每列至少需要 2 個儲存格'),
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(1).error('表格至少需要 1 列資料'),
    }),
  ],
  preview: {
    select: {columns: 'columns', rows: 'rows'},
    prepare({columns, rows}) {
      return {
        title: Array.isArray(columns) ? columns.join('｜') : '比較表格',
        subtitle: `${Array.isArray(rows) ? rows.length : 0} 列資料`,
      }
    },
  },
})
