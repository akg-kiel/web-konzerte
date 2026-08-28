import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: cloudflare(),
  build: { client: '.' },
  site: 'https://konzerte-petruskirche.de'
});
