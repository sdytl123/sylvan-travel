import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import englishPages from './scripts/english-pages.mjs';

export default defineConfig({
  integrations: [tailwind(), englishPages()],
  site: 'https://sylvantravel.com',
  outDir: 'dist',
});
