import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

import {
  filterConcerts,
  getConcertFilters,
  getConcerts,
  hasInvalidConcertDateRange,
  paginateConcerts,
  splitConcerts
} from '../src/data/concerts.ts';
import {
  applyRobotsPolicy,
  getCanonicalUrl,
  getProgrammeSeo,
  getRobotsTxt,
  getSitemapResponse,
  getStaticPagePaths,
  isProductionHost
} from '../src/lib/seo.ts';

const config = await readFile('astro.config.mjs', 'utf8');
const site = new URL(config.match(/site:\s*'([^']+)'/)[1]);
assert.equal(site.href, 'https://konzerte-petruskirche.de/');
const preview = new URL('https://version-web-konzerte.example.workers.dev/');
assert.equal(isProductionHost(site, site), true);
for (const host of [
  preview.href,
  'http://localhost:4321/',
  'https://konzerte-petruskirche.de.evil/'
]) {
  assert.equal(isProductionHost(new URL(host), site), false);
}
assert.equal(
  getCanonicalUrl(site, `${preview.origin}/programm/test/#poster`),
  `${site}programm/test/`
);
assert.equal(
  new URL(getCanonicalUrl(site, 'https://example.org//other.test/path')).host,
  site.host
);

const pageFiles = (await readdir('src/pages', { recursive: true }))
  .filter((file) => file.endsWith('.astro'))
  .map((file) => `./${file}`);
const paths = getStaticPagePaths(pageFiles);
assert(paths.includes('/'));
assert(paths.includes('/programm/'));
assert(paths.includes('/programm/archiv/'));
assert(paths.includes('/für-veranstalter/'));
assert(
  !paths.some(
    (path) => path.includes('[') || path.includes('raum-anfragen') || path.includes('api')
  )
);
assert.deepEqual(
  getStaticPagePaths(['./new-page.astro', './api/internal.astro', './404.astro', './500.astro']),
  ['/new-page/']
);

const originalFetch = globalThis.fetch;
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');
const originalConsoleError = console.error;
let rows = Array.from({ length: 40 }, (_, index) => ({
  appointment: {
    base: {
      id: index + 1,
      title: `Konzert ${index}`,
      image: { imageUrl: 'https://example.org/poster.jpg' }
    },
    calculated: { startDate: index < 20 ? '2027-08-06T17:30:00Z' : '2020-08-06T17:30:00Z' }
  }
}));
let calls = 0;
Object.defineProperty(globalThis, 'caches', { configurable: true, value: undefined });
globalThis.fetch = async (url) => {
  assert.match(String(url), /\/api\/calendars\/3\/appointments\?/);
  calls++;
  return Response.json({ data: rows });
};
try {
  const result = await getConcerts();
  assert.equal(calls, 1, 'No sitemap image probes');
  const now = new Date('2026-01-01T00:00:00Z');
  const response = getSitemapResponse(site, result, paths, now);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/xml; charset=utf-8');
  assert.equal(
    response.headers.get('Cloudflare-CDN-Cache-Control'),
    'public, max-age=300, stale-if-error=86400'
  );
  const xml = await response.text();
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(locations).size, locations.length);
  assert(locations.every((url) => new URL(url).origin === site.origin));
  for (const concert of result.concerts)
    assert(locations.includes(getCanonicalUrl(site, concert.detailsHref)));
  assert(locations.includes(`${site}programm/?page=2`));
  assert(locations.includes(`${site}programm/archiv/?page=2`));
  assert(!locations.some((url) => /workers\.dev|raum-anfragen|\[slug\]|\/api\//.test(url)));
  const duplicate = getSitemapResponse(
    site,
    { ...result, concerts: [...result.concerts, result.concerts[0]] },
    [...paths, paths[0]],
    now
  );
  assert.equal(await duplicate.text(), xml);
  const escaped = await getSitemapResponse(site, { concerts: [], error: false }, [
    '/a/?x=1&y=2'
  ]).text();
  assert.match(escaped, /x=1&amp;y=2/);

  const { programmeConcerts, archiveConcerts } = splitConcerts(result.concerts, now);
  for (const path of ['/programm/', '/programm/archiv/']) {
    const concerts = path === '/programm/' ? programmeConcerts : archiveConcerts;
    const seoFor = (query) => {
      const url = new URL(path + query, preview);
      const filters = getConcertFilters(url.searchParams);
      const filtered = hasInvalidConcertDateRange(filters) ? [] : filterConcerts(concerts, filters);
      const pagination = paginateConcerts(filtered, url.searchParams);
      return { ...pagination, ...getProgrammeSeo(site, url, filters, pagination.page) };
    };
    assert.equal(seoFor('?page=2').canonicalUrl, `${site.origin}${path}?page=2`);
    assert.equal(seoFor('?page=2').noindex, false);
    assert.equal(seoFor('?page=2').pageConcerts.length, 2);
    assert.equal(seoFor('?page=999').canonicalUrl, `${site.origin}${path}?page=2`);
    assert.equal(seoFor('?page=999').noindex, true);
    for (const query of [
      '?page=bad',
      '?page=0',
      '?page=-1',
      '?page=1.5',
      '?page=',
      '?page=9007199254740992'
    ]) {
      assert.equal(seoFor(query).canonicalUrl, `${site.origin}${path}`);
      assert.equal(seoFor(query).noindex, true);
    }
    assert.equal(seoFor('?page=1').canonicalUrl, `${site.origin}${path}`);
    assert.equal(seoFor('?page=1').noindex, false);
    assert.equal(seoFor('?page=2&utm_source=test').canonicalUrl, `${site.origin}${path}?page=2`);
    assert.equal(seoFor('?page=2&page=1').noindex, true);
    assert.equal(
      seoFor('?q=Konzert&page=2').canonicalUrl,
      `${site.origin}${path}?q=Konzert&page=2`
    );
    for (const query of [
      '?q=Konzert',
      '?season=2027%2F28',
      '?from=2027-08-01',
      '?to=bad',
      '?q=',
      '?from=2028-01-01&to=2027-01-01'
    ]) {
      assert.equal(seoFor(query).noindex, true);
    }
    const url = new URL(path + '?q=no-match&page=2', site);
    assert.equal(
      getProgrammeSeo(site, url, getConcertFilters(url.searchParams), 1).canonicalUrl,
      `${site.origin}${path}?q=no-match`
    );
  }

  rows.push({
    appointment: {
      base: { id: 100, title: 'Neues Konzert' },
      calculated: { startDate: '2028-08-06T17:30:00Z' }
    }
  });
  const updated = await getConcerts();
  assert.equal(calls, 2);
  assert.match(
    await getSitemapResponse(site, updated, paths, now).text(),
    /neues-konzert-100-2028-08-06/
  );
  globalThis.fetch = async () => new Response(null, { status: 503 });
  console.error = () => {};
  const failed = getSitemapResponse(site, await getConcerts(), paths, now);
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get('Cache-Control'), 'no-store');
  assert.equal(failed.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
  assert.equal(failed.headers.get('Retry-After'), '300');
  assert(!(await failed.text()).includes('<urlset'));
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
  else delete globalThis.caches;
}

for (const path of [
  '/',
  '/programm/',
  '/programm/test/',
  '/_astro/image.webp',
  '/downloads/plan.pdf',
  '/sitemap.xml',
  '/robots.txt'
]) {
  const body = new Uint8Array([0, 1, 255]);
  const asset = new Response(body, {
    headers: { 'Content-Type': 'application/octet-stream', ETag: 'unchanged' }
  });
  const guarded = applyRobotsPolicy(asset, new URL(path, preview), site);
  assert.equal(guarded.headers.get('X-Robots-Tag'), 'noindex, follow');
  assert.equal(guarded.headers.get('ETag'), 'unchanged');
  assert.deepEqual(new Uint8Array(await guarded.arrayBuffer()), body);
  const production = new Response('public');
  assert.equal(applyRobotsPolicy(production, new URL(path, site), site), production);
  assert.equal(production.headers.get('X-Robots-Tag'), null);
}
for (const status of [404, 503]) {
  const guarded = applyRobotsPolicy(new Response('error', { status }), site, site);
  assert.equal(guarded.status, status);
  assert.equal(guarded.headers.get('X-Robots-Tag'), 'noindex, follow');
  assert.equal(guarded.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
}
for (const path of [
  '/api/availability/',
  '/api',
  '/_actions/test',
  '/_server-islands/test',
  '/__astro_prerender'
]) {
  assert.equal(
    applyRobotsPolicy(new Response('{}'), new URL(path, site), site).headers.get('X-Robots-Tag'),
    'noindex, follow'
  );
}
const redirect = applyRobotsPolicy(Response.redirect(`${site}programm/`, 301), preview, site);
assert.equal(redirect.status, 301);
assert.equal(redirect.headers.get('Location'), `${site}programm/`);
assert.equal(redirect.headers.get('X-Robots-Tag'), 'noindex, follow');
for (const status of [204, 304]) {
  const guarded = applyRobotsPolicy(new Response(null, { status }), preview, site);
  assert.equal(guarded.status, status);
  assert.equal(guarded.headers.get('X-Robots-Tag'), 'noindex, follow');
}
assert(!getRobotsTxt(site, preview).includes('Disallow:'));
assert.match(getRobotsTxt(site, site), /Disallow: \/api\//);
assert(!getRobotsTxt(site, site).includes('Disallow: /programm'));
assert(getRobotsTxt(site, preview).includes(`Sitemap: ${site}sitemap.xml`));

const wrangler = await readFile('wrangler.toml', 'utf8');
assert.match(wrangler, /main = "\.\/src\/worker\.ts"/);
assert.match(wrangler, /\[assets\][\s\S]*run_worker_first = true/);
const worker = await readFile('src/worker.ts', 'utf8');
assert.match(worker, /@astrojs\/cloudflare\/handler/);
assert.match(worker, /applyRobotsPolicy\(response/);
assert.match(worker, /astro:config\/server/);
assert(!worker.includes('NODE_ENV'));
const layout = await readFile('src/layouts/Layout.astro', 'utf8');
assert.match(layout, /getCanonicalUrl\(siteUrl, canonicalUrl \?\? Astro.url.pathname\)/);
assert.match(layout, /\(Astro.response.status \?\? 200\) >= 400/);
assert.match(layout, /!Astro.isPrerendered/);
for (const page of ['src/pages/programm.astro', 'src/pages/programm/archiv.astro']) {
  const source = await readFile(page, 'utf8');
  assert.match(source, /getProgrammeSeo\(Astro.site!, Astro.url, filters, page\)/);
  assert.match(source, /<Layout\s+\{\.\.\.seo\}/);
}
assert.match(await readFile('src/pages/sitemap.xml.ts', 'utf8'), /await getConcerts\(env\)/);
assert.match(await readFile('src/pages/robots.txt.ts', 'utf8'), /prerender = false/);

if (process.argv.includes('--built')) {
  const generated = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
  assert.equal(generated.assets.run_worker_first, true);
  assert.equal(generated.assets.binding, 'ASSETS');
  assert.equal(generated.assets.directory, '..');
  for (const path of paths.filter((path) => !path.startsWith('/programm/'))) {
    const html = await readFile(`dist${path}index.html`, 'utf8');
    assert(html.includes(`rel="canonical" href="${getCanonicalUrl(site, path)}"`));
    assert(html.includes('name="robots" content="index, follow"'));
  }
  console.log('SEO generated asset routing and static HTML checks passed.');
}
console.log(
  'SEO offline checks passed (canonical pagination/filters, runtime sitemap, robots, preview asset policy).'
);
