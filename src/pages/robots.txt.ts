import type { APIRoute } from 'astro';

import { getRobotsTxt } from '../lib/seo';

export const prerender = false;

export const GET: APIRoute = ({ site, url }) =>
  new Response(getRobotsTxt(site!, url), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' }
  });
