import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
// Configured for Cloudflare Pages static hosting (no adapter needed)
// For Cloudflare Workers with SSR, add @astrojs/cloudflare adapter and output: 'server'
export default defineConfig({
  site: 'https://konzerte-petruskirche.de',
  integrations: [react()],
  output: 'static',
  build: {
    inlineStylesheets: 'auto'
  }
});
