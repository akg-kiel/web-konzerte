import { CONCERTS_PER_PAGE, cacheProgramme, splitConcerts } from '../data/concerts.ts';
import type { Concert, ConcertFilters } from '../data/concerts.ts';

export const isProductionHost = (requestUrl: URL, site: URL) => requestUrl.host === site.host;

// Even an existing absolute canonical override must resolve on the configured site.
export function getCanonicalUrl(site: URL, path: string) {
  const url = new URL(path, site);
  const canonical = new URL(site);
  canonical.pathname = url.pathname;
  canonical.search = url.search;
  canonical.hash = '';
  return canonical.href;
}

export function getProgrammeSeo(site: URL, url: URL, filters: ConcertFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.season) params.set('season', filters.season);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  const filterKeys = ['q', 'season', 'from', 'to'];
  return {
    canonicalUrl: getCanonicalUrl(site, url.pathname + (query ? `?${query}` : '')),
    // Filter results are crawlable, but not a separate search landing page.
    noindex:
      filterKeys.some((key) => url.searchParams.has(key)) ||
      (url.searchParams.has('page') && url.searchParams.get('page') !== String(page)) ||
      url.searchParams.getAll('page').length > 1
  };
}

const technicalPaths = ['/api/', '/_actions/', '/_server-islands/', '/__astro'];
const isTechnicalPath = (path: string) =>
  technicalPaths.some((prefix) => path.startsWith(prefix) || path === prefix.replace(/\/$/, ''));

export function applyRobotsPolicy(response: Response, url: URL, site: URL) {
  const noindex =
    !isProductionHost(url, site) || isTechnicalPath(url.pathname) || response.status >= 400;
  if (!noindex) return response;
  // Asset binding responses can have immutable headers; retain the streamed body.
  const result = new Response(response.body, response);
  result.headers.set('X-Robots-Tag', 'noindex, follow');
  if (response.status >= 400) {
    result.headers.set('Cache-Control', 'no-store');
    result.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  }
  return result;
}

export function getRobotsTxt(site: URL, requestUrl: URL) {
  // Preview crawling must remain allowed so crawlers can see X-Robots-Tag.
  const rules = isProductionHost(requestUrl, site)
    ? technicalPaths.map((path) => `Disallow: ${path}`)
    : ['Allow: /'];
  return `User-agent: *\n${rules.join('\n')}\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
}

export function getStaticPagePaths(files: string[]) {
  return files
    .filter((file) => !file.includes('['))
    .map((file) =>
      `/${file.replace(/^.*\/pages\/|^\.\//, '')}`.replace(/(?:\/index)?\.astro$/, '/')
    )
    .filter(
      (path) =>
        path !== '/raum-anfragen/' && !/^\/(404|500)\/$/.test(path) && !isTechnicalPath(path)
    );
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export function getSitemapResponse(
  site: URL,
  result: { concerts: Concert[]; error: boolean },
  staticPaths: string[],
  now = new Date()
) {
  if (result.error) {
    return new Response('Konzertprogramm derzeit nicht verfügbar.', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
        'Retry-After': '300'
      }
    });
  }
  const paths = [...staticPaths, ...result.concerts.map(({ detailsHref }) => detailsHref)];
  const { programmeConcerts, archiveConcerts } = splitConcerts(result.concerts, now);
  for (const [path, concerts] of [
    ['/programm/', programmeConcerts],
    ['/programm/archiv/', archiveConcerts]
  ] as const) {
    const pageCount = Math.ceil(concerts.length / CONCERTS_PER_PAGE);
    for (let page = 2; page <= pageCount; page++) paths.push(`${path}?page=${page}`);
  }
  const urls = [...new Set(paths.map((path) => getCanonicalUrl(site, path)))];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  const response = new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
  cacheProgramme(response);
  return response;
}
