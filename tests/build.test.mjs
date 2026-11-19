import { expect, test } from 'vite-plus/test';
import { readFile, readdir } from 'node:fs/promises';

import { getCanonicalUrl, getStaticPagePaths } from '../src/lib/seo.ts';

test('Build: Indexierungsschutz, Formularverdrahtung und lokale Karten', async () => {
  expect(await readFile('dist/.assetsignore', 'utf8')).toMatch(/^server$/m);
  const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
  expect(config.assets.run_worker_first).toBe(true);
  expect(config.assets.binding).toBe('ASSETS');
  expect(config.workers_dev).toBe(false);

  const site = new URL('https://petruskirche.events/');
  const pageFiles = (await readdir('src/pages', { recursive: true }))
    .filter((file) => file.endsWith('.astro'))
    .map((file) => `./${file}`);
  for (const path of getStaticPagePaths(pageFiles).filter(
    (path) => !path.startsWith('/programm/')
  )) {
    const html = await readFile(`dist${path}index.html`, 'utf8');
    expect(
      html.includes(`rel="canonical" href="${getCanonicalUrl(site, path)}"`),
      path
    ).toBeTruthy();
    expect(html.includes('name="robots" content="noindex, follow"'), path).toBeTruthy();
  }

  const enabled = config.vars.CONTACT_FORMS_ENABLED === 'true';
  const email = config.vars.CONTACT_EMAIL;
  for (const path of ['kontakt', 'für-veranstalter']) {
    const html = await readFile(`dist/${path}/index.html`, 'utf8');
    const form = html.match(/<form\b[^>]*>/)?.[0];
    expect(form, `${path}: expected inquiry form`).toBeTruthy();
    expect(form.includes('data-mail-form'), `${path}: activation must match config`).toBe(enabled);
    expect(form.includes(`action="${enabled ? '/api/contact/' : `mailto:${email}?`}`)).toBeTruthy();
    expect(
      html.includes(`href="mailto:${email}"`),
      `${path}: public contact must match config`
    ).toBeTruthy();
  }

  for (const path of ['besuch-planen', 'kontakt']) {
    const html = await readFile(`dist/${path}/index.html`, 'utf8');
    expect(html).toMatch(/href="https:\/\/www\.openstreetmap\.org\/copyright"/);
    expect(html).not.toMatch(/<iframe\b/);
    expect(html.slice(html.indexOf('<body'))).not.toMatch(
      /<(?:script|img|link)\b[^>]*(?:src|href)="https?:\/\//
    );
  }

  if (enabled) {
    expect(config.vars.TURNSTILE_HOSTNAMES).toBe('petruskirche.events');
    expect(config.vars.TURNSTILE_SITE_KEY.trim()).toBeTruthy();
    expect(config.vars.CONTACT_EMAIL).toBe('kontakt@petruskirche.events');
    expect(config.vars.CONTACT_RECIPIENT).toBe('kontakt@petruskirche.events');
    const mailer = config.send_email.find(({ name }) => name === 'MAILER');
    expect(mailer.destination_address).toBe(config.vars.CONTACT_RECIPIENT);
    expect(mailer.allowed_sender_addresses).toStrictEqual([
      'formular@formmail.petruskirche.events'
    ]);
    expect(mailer.remote).toBe(false);
  }
});
