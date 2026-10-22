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
assert.doesNotMatch(imprint, /vertreten durch Pastor/);
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
