import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

await access('dist/index.html');
assert.match(await readFile('dist/.assetsignore', 'utf8'), /^server$/m);
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
assert.equal(config.assets.directory, '..');
assert.equal(config.workers_dev, false);
assert.equal(config.preview_urls, true);
assert.equal(
  config.images.binding,
  'IMAGES',
  'Dynamic concert images still need runtime transforms.'
);

const home = await readFile('dist/index.html', 'utf8');
assert.match(home, /<source\b[^>]*type="image\/avif"[^>]*srcset="\/_astro\//);
assert.match(
  home,
  /<img\b[^>]*src="\/_astro\/l1130722-hero\.[^"]+\.webp"[^>]*fetchpriority="high"/
);
for (const source of ['l1130722-hero', 'petruskirche-exterior']) {
  const images = [...home.matchAll(/<img\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => tag.match(/\ssrc="([^"]+)"/)?.[1].startsWith(`/_astro/${source}.`));
  assert(images.length > 0, `Expected ${source} on the home page.`);
  for (const image of images) {
    assert.match(image, /src="\/_astro\//, `${source}: optimize fixed images at build time.`);
    assert.match(image, /srcset="[^"]+"/, `${source}: keep responsive variants.`);
    assert.match(image, /\ssizes="[^"]+"/, `${source}: declare the rendered image size.`);
  }
}

for (const [card] of home.matchAll(/<article\b[^>]*>[\s\S]*?<img\b[^>]*>/g)) {
  const image = card.match(/<img\b[^>]*>/)?.[0];
  assert.match(
    image,
    /\ssrc="(?:\/_image\/|https:\/\/)/,
    'Cards must use runtime URLs or unoptimized external posters.'
  );
  assert.match(
    image,
    /\ssrcset="(?:\/_image\/|https:\/\/)/,
    'Responsive card URLs must also stay stable.'
  );
}

const enabled = config.vars.CONTACT_FORMS_ENABLED === 'true';
const email = config.vars.CONTACT_EMAIL;
for (const [path, label] of [
  ['kontakt', 'Kontaktformular'],
  ['für-veranstalter', 'Raumanfrage']
]) {
  const html = await readFile(`dist/${path}/index.html`, 'utf8');
  const form = html.match(new RegExp(`<form\\b[^>]*aria-label="${label}"[^>]*>`))?.[0];
  assert(form, `${path}: expected inquiry form`);
  assert.equal(form.includes('data-mail-form'), enabled, `${path}: activation must match config`);
  assert(form.includes(`action="${enabled ? '/api/contact/' : `mailto:${email}?`}`));
  assert(html.includes(`href="mailto:${email}"`), `${path}: public contact must match config`);
  assert.match(html, /<meta\b[^>]*name="robots"[^>]*content="noindex, follow"/);
}
const privacy = await readFile('dist/datenschutz/index.html', 'utf8');
assert.equal(privacy.includes('an den Cloudflare Worker dieser Website'), enabled);
assert.equal(privacy.includes('übermitteln keine Formulardaten an diese Website'), !enabled);
assert.equal(privacy.includes('https://www.cloudflare.com/turnstile-privacy-policy/'), enabled);
assert.doesNotMatch(
  privacy,
  /spätestens nach zehn Tagen|als statische Website|keine eigenen Anwendungs-/
);
assert(privacy.includes('§ 6 Nr. 4 DSG-EKD'));
assert(privacy.includes('§ 6 Nr. 2 DSG-EKD'));
assert(privacy.includes('id="programm"'));
const imprint = await readFile('dist/impressum/index.html', 'utf8');
assert(imprint.includes('Körperschaft des öffentlichen Rechts'));
assert(imprint.includes('durch den Kirchengemeinderat'));
assert.doesNotMatch(imprint, /vertreten durch Pastor|Vorsitzender ist/);
assert(imprint.includes('https://akg-kiel.de/impressum'));
if (enabled) {
  assert.equal(config.vars.TURNSTILE_HOSTNAMES, 'petruskirche.events');
  assert(config.vars.TURNSTILE_SITE_KEY.trim());
  assert.equal(config.vars.CONTACT_EMAIL, 'kontakt@petruskirche.events');
  assert.equal(config.vars.CONTACT_RECIPIENT, 'kontakt@petruskirche.events');
  const mailer = config.send_email.find(({ name }) => name === 'MAILER');
  assert.equal(mailer.destination_address, config.vars.CONTACT_RECIPIENT);
  assert.deepEqual(mailer.allowed_sender_addresses, ['formular@formmail.petruskirche.events']);
  assert.equal(mailer.remote, false);
}
