// A canonical domain is not launch approval. Enable only after explicit indexing release.
export const INDEXING_ENABLED = false;
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

const technicalPaths = ['/api/', '/_actions/', '/_server-islands/', '/__astro'];
const isTechnicalPath = (path: string) =>
  technicalPaths.some((prefix) => path.startsWith(prefix) || path === prefix.replace(/\/$/, ''));

export function applyRobotsPolicy(
  response: Response,
  url: URL,
  site: URL,
  indexingEnabled = INDEXING_ENABLED
) {
  const noindex =
    !indexingEnabled ||
    !isProductionHost(url, site) ||
    isTechnicalPath(url.pathname) ||
    response.status >= 400;
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
