import { handle } from '@astrojs/cloudflare/handler';
import { site } from 'astro:config/server';

import { applyRobotsPolicy } from './lib/seo';

// Worker-first routing is required: Astro middleware cannot wrap static assets.
export default {
  async fetch(request: Request, env: Env, context: ExecutionContext) {
    const response = await handle(request, env, context);
    return applyRobotsPolicy(response, new URL(request.url), new URL(site!));
  }
} satisfies ExportedHandler<Env>;
