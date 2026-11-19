import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { getConcerts } from '../features/concerts/churchtools.server.ts';
import { getSitemapResponse } from '../features/concerts/seo.ts';
import { getStaticPagePaths } from '../lib/seo.ts';

export const prerender = false;

const staticPaths = getStaticPagePaths(Object.keys(import.meta.glob('./**/*.astro')));

export const GET: APIRoute = async ({ site }) =>
  getSitemapResponse(site!, await getConcerts(env), staticPaths);
