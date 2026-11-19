import { expect, test } from 'vite-plus/test';

import {
  applyRobotsPolicy,
  getCanonicalUrl,
  getRobotsTxt,
  getStaticPagePaths,
  INDEXING_ENABLED
} from './seo.ts';

test('Canonical-URLs, robots.txt und Indexierungsschutz', async () => {
  const site = new URL('https://petruskirche.events/');
  expect(INDEXING_ENABLED, 'Indexing requires a separate launch approval').toBe(false);
  const preview = new URL('https://version-web-konzerte.example.workers.dev/');
  for (const host of [
    preview.href,
    'http://localhost:4321/',
    'https://petruskirche.events.evil/',
    'https://konzerte-petruskirche.de/'
  ]) {
    expect(
      applyRobotsPolicy(new Response('preview'), new URL(host), site, true).headers.get(
        'X-Robots-Tag'
      )
    ).toBe('noindex, follow');
  }
  expect(getCanonicalUrl(site, `${preview.origin}/programm/test/#poster`)).toBe(
    `${site}programm/test/`
  );
  expect(new URL(getCanonicalUrl(site, 'https://example.org//other.test/path')).host).toBe(
    site.host
  );

  expect(
    getStaticPagePaths([
      './index.astro',
      './programm.astro',
      './programm/archiv.astro',
      './für-veranstalter.astro',
      './raum-anfragen.astro',
      './programm/[slug].astro',
      './api/internal.astro',
      './new-page.astro',
      './404.astro',
      './500.astro'
    ])
  ).toStrictEqual(['/', '/programm/', '/programm/archiv/', '/für-veranstalter/', '/new-page/']);

  for (const path of ['/programm/', '/downloads/plan.pdf']) {
    const body = new Uint8Array([0, 1, 255]);
    const asset = new Response(body, {
      headers: { 'Content-Type': 'application/octet-stream', ETag: 'unchanged' }
    });
    const guarded = applyRobotsPolicy(asset, new URL(path, preview), site);
    expect(guarded.headers.get('X-Robots-Tag')).toBe('noindex, follow');
    expect(guarded.headers.get('ETag')).toBe('unchanged');
    expect(new Uint8Array(await guarded.arrayBuffer())).toStrictEqual(body);
    expect(
      applyRobotsPolicy(new Response('preview'), new URL(path, preview), site, true).headers.get(
        'X-Robots-Tag'
      )
    ).toBe('noindex, follow');
    const production = new Response('public');
    expect(
      applyRobotsPolicy(production, new URL(path, site), site).headers.get('X-Robots-Tag'),
      'The canonical host must remain noindex before launch approval'
    ).toBe('noindex, follow');
    expect(applyRobotsPolicy(production, new URL(path, site), site, true)).toBe(production);
    expect(production.headers.get('X-Robots-Tag')).toBe(null);
  }
  for (const status of [404, 503]) {
    const guarded = applyRobotsPolicy(new Response('error', { status }), site, site);
    expect(guarded.status).toBe(status);
    expect(guarded.headers.get('X-Robots-Tag')).toBe('noindex, follow');
    expect(guarded.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
    expect(
      applyRobotsPolicy(new Response('error', { status }), site, site, true).headers.get(
        'X-Robots-Tag'
      )
    ).toBe('noindex, follow');
  }
  for (const path of [
    '/api/availability/',
    '/api',
    '/_actions/test',
    '/_server-islands/test',
    '/__astro_prerender'
  ]) {
    expect(
      applyRobotsPolicy(new Response('{}'), new URL(path, site), site, true).headers.get(
        'X-Robots-Tag'
      )
    ).toBe('noindex, follow');
  }
  const redirect = applyRobotsPolicy(Response.redirect(`${site}programm/`, 301), preview, site);
  expect(redirect.status).toBe(301);
  expect(redirect.headers.get('Location')).toBe(`${site}programm/`);
  expect(redirect.headers.get('X-Robots-Tag')).toBe('noindex, follow');
  for (const status of [204, 304]) {
    const guarded = applyRobotsPolicy(new Response(null, { status }), preview, site);
    expect(guarded.status).toBe(status);
    expect(guarded.headers.get('X-Robots-Tag')).toBe('noindex, follow');
  }
  expect(!getRobotsTxt(site, preview).includes('Disallow:')).toBeTruthy();
  expect(getRobotsTxt(site, site)).toMatch(/Disallow: \/api\//);
  expect(!getRobotsTxt(site, site).includes('Disallow: /programm')).toBeTruthy();
  expect(getRobotsTxt(site, preview).includes(`Sitemap: ${site}sitemap.xml`)).toBeTruthy();
});
