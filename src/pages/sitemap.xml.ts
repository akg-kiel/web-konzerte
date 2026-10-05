import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { getConcerts } from '../data/concerts';
import { getSitemapResponse, getStaticPagePaths } from '../lib/seo';

export const prerender = false;

const staticPaths = getStaticPagePaths(Object.keys(import.meta.glob('./**/*.astro')));

export const GET: APIRoute = async ({ site }) =>
  getSitemapResponse(site!, await getConcerts(env), staticPaths);
