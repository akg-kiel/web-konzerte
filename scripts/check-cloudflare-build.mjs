import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

await access('dist/index.html');
assert.match(await readFile('dist/.assetsignore', 'utf8'), /^server$/m);
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
assert.equal(config.assets.directory, '..');
assert.equal(config.workers_dev, false);
assert.equal(config.preview_urls, true);

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
const visit = await readFile('dist/besuch-planen/index.html', 'utf8');
assert.match(
  visit,
  /<svg\b[^>]*role="img"[^>]*aria-labelledby="visit-parking-map-title visit-parking-map-description"/
);
for (const marker of [
  'parking-area',
  'church-building',
  'church-marker',
  'parking-marker',
  'bus-marker'
]) {
  assert(visit.includes(`data-${marker}`), `Visit plan: missing ${marker}`);
}
assert.match(visit, /href="https:\/\/www\.openstreetmap\.org\/copyright"/);
assert.match(visit, /© OpenStreetMap-Mitwirkende · ODbL/);
assert.match(visit, /id="parken"/);
for (const hours of ['18:00–24:00 Uhr', '15:00–24:00 Uhr', '00:00–24:00 Uhr']) {
  assert(visit.includes(hours), `Visit plan: missing ${hours}`);
}
assert.doesNotMatch(visit, /<iframe\b|data-map-consent|Parken-bei-[^"<>]*\.pdf/);
assert.doesNotMatch(
  visit.slice(visit.indexOf('<body')),
  /<(?:script|img|link)\b[^>]*(?:src|href)="https?:\/\//
);
const contactPage = await readFile('dist/kontakt/index.html', 'utf8');
const wikMap = contactPage.match(/<figure\b[^>]*data-wik-map[\s\S]*?<\/figure>/)?.[0];
assert(wikMap, 'Contact: expected local Wik overview');
assert.match(
  wikMap,
  /<svg\b[^>]*role="img"[^>]*aria-labelledby="contact-wik-map-title contact-wik-map-description"/
);
for (const marker of ['wik-water', 'wik-streets', 'location-marker']) {
  assert(wikMap.includes(`data-${marker}`), `Wik overview: missing ${marker}`);
}
const locationMarker = wikMap.match(/<g\b[^>]*data-location-marker[\s\S]*?<\/g>/)?.[0];
assert.match(locationMarker, /transform="translate\(256\.1 303\.9\)"/);
assert.match(
  locationMarker,
  /d="M0 0 L-10 -14 H10 Z"/,
  'Wik pin tip must anchor the church coordinate'
);
for (const label of ['Petruskirche', 'Wik', 'Kieler', 'Förde', 'Holtenauer Straße']) {
  assert(wikMap.includes(label), `Wik overview: missing ${label}`);
}
assert.match(wikMap, /href="https:\/\/www\.openstreetmap\.org\/copyright"/);
assert.match(wikMap, /href="\/besuch-planen\/#parken"/);
assert.doesNotMatch(wikMap, /<(?:iframe|script|img|link)\b/);
assert.doesNotMatch(contactPage, /maps\.google|google\.com\/maps|data-map-consent/);
const privacy = await readFile('dist/datenschutz/index.html', 'utf8');
assert.equal(privacy.includes('an den Cloudflare Worker dieser Website'), enabled);
assert.equal(privacy.includes('übermitteln keine Formulardaten an diese Website'), !enabled);
assert.equal(privacy.includes('https://www.cloudflare.com/turnstile-privacy-policy/'), enabled);
assert.doesNotMatch(
  privacy,
  /spätestens nach zehn Tagen|als statische Website|keine eigenen Anwendungs-/
);
assert(privacy.includes('§ 6 Nr. 4 DSG-EKD'));
assert(privacy.includes('Sie laden keine externen Kartenkacheln oder Kartenskripte.'));
assert.doesNotMatch(privacy, /Google Maps|Google Ireland|policies\.google\.com/);
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
