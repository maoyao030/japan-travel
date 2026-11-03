import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'e8ctf7ee',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // 線上後台網址 https://offpathnotes.sanity.studio（見 README「部署線上後台」）。
  studioHost: 'offpathnotes',
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
