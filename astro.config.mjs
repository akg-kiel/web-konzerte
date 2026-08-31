import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [react()],
  vite: { server: { allowedHosts: ['.trycloudflare.com'] } },
  build: { client: '.' },
  site: 'https://konzerte-petruskirche.de'
});
