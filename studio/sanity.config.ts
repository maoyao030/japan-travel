import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: '日本旅遊長尾站',

  // 專案 ID 不是機密；沒有 studio/.env 的雲端 routine 直接用預設值。
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'e8ctf7ee',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
