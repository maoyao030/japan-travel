import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: '日本旅遊長尾站',

  // Sanity 專案建立後，在 studio/.env 設 SANITY_STUDIO_PROJECT_ID 與 SANITY_STUDIO_DATASET。
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'replace-with-project-id',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
