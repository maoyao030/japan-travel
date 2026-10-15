// @ts-check
import { defineConfig } from 'astro/config';
import {resolveSiteUrl} from './site.config.mjs'

export default defineConfig({
  site: resolveSiteUrl(),
});
