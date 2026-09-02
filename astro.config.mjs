import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [react()],
  vite: { server: { allowedHosts: ['.trycloudflare.com'] } },
  build: { client: '.' },
  image: { remotePatterns: [{ protocol: 'https', hostname: 'akg-kiel.church.tools' }] },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  session: false,
  site: 'https://konzerte-petruskirche.de',
  trailingSlash: 'always'
});
