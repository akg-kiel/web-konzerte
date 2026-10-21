import assert from 'node:assert/strict';
import { register } from 'node:module';

import {
  LEGACY_CONTACT_EMAIL,
  PLANNED_CONTACT_EMAIL,
  getContactSettings,
  handleContactRequest
} from '../src/lib/contact-mail.ts';

const origin = 'https://petruskirche.events';
const contact = {
  kind: 'contact',
  Name: 'Zoë <Probe> & "Übung"',
  'E-Mail': 'synthetic.visitor@example.invalid',
  Betreff: "Synthetische Frage <b> & 'Probe'",
  Nachricht:
    'Guten Tag 👋\n<script>synthetic("test")</script> & \'Übung\'\r\nZweite Zeile\tmit Tab.',
  'cf-turnstile-response': 'synthetic-token'
};
const booking = {
  kind: 'booking',
  'Art der Veranstaltung': 'Konzert – Musik <Live>',
  'Erwartete Besucherzahl': '650',
  Wunschdatum: '2099-12-31',
  Alternativdatum: '2024-02-29',
  'Name / Organisation': 'Synthetischer Kulturverein Übung',
  'E-Mail': 'synthetic.organisation@example.invalid',
  Telefon: '+49 (0) 123 456-789',
  'Technische Anforderungen und Bemerkungen': 'Synthetische Bühne <10m>\nLicht & Ton 🎵',
  'cf-turnstile-response': 'synthetic-token'
};
const config = {
  CONTACT_EMAIL: PLANNED_CONTACT_EMAIL,
  CONTACT_RECIPIENT: PLANNED_CONTACT_EMAIL,
  CONTACT_FORMS_ENABLED: 'true',
  TURNSTILE_SITE_KEY: 'synthetic-site-key',
  TURNSTILE_SECRET: 'synthetic-secret',
  TURNSTILE_HOSTNAMES: 'petruskirche.events'
};
const testRecipient = 'synthetic.verified.recipient@example.invalid';
const maximumEmail = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(53)}.invalid`;
const privateValues = [
  ...Object.values(contact),
  ...Object.values(booking),
  testRecipient,
  config.TURNSTILE_SECRET,
  'synthetic-provider-error'
].filter((value) => value.length > 12);

function request(
  data = contact,
  { method = 'POST', url = `${origin}/api/contact/`, headers = {}, body } = {}
) {
  const allHeaders = new Headers({
    Origin: new URL(url).origin,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  });
  for (const [name, value] of Object.entries(headers)) {
    if (value === null) allHeaders.delete(name);
    else allHeaders.set(name, value);
  }
  const result = new Request(url, {
    method,
    headers: allHeaders,
    ...(method === 'GET' || method === 'HEAD'
      ? {}
      : { body: body ?? new URLSearchParams(data), duplex: 'half' })
  });
  for (const [name, value] of Object.entries(headers)) {
    if (value === null) result.headers.delete(name);
  }
  return result;
}

function mocks({ kind = 'contact', verify, send } = {}) {
  const sent = [];
  const verified = [];
  const env = {
    ...config,
    MAILER: {
      async send(message) {
        sent.push(message);
        return send ? send(message) : { messageId: 'synthetic-acceptance-id' };
      }
    }
  };
  const fetcher = async (url, init) => {
    verified.push({ url, init });
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'manual');
    assert(init.signal instanceof AbortSignal);
    const body = new URLSearchParams(init.body);
    assert.deepEqual([...body.keys()].sort(), ['response', 'secret']);
    assert.equal(body.get('secret'), config.TURNSTILE_SECRET);
    assert.equal(body.get('response'), 'synthetic-token');
    return verify
      ? verify(url, init)
      : Response.json({
          success: true,
          action: kind,
          hostname: 'petruskirche.events',
          'error-codes': []
        });
  };
  return { env, fetcher, sent, verified };
}

async function check(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(response.headers.get('Content-Type'), /^application\/json/);
  const text = await response.text();
  for (const value of privateValues)
    assert(!text.includes(value), 'Response must not echo private data');
  const payload = JSON.parse(text);
  if (status === 200) assert.deepEqual(payload, { ok: true });
  else {
    assert.deepEqual(Object.keys(payload).sort(), ['error', 'ok']);
    assert.equal(payload.ok, false);
    assert.equal(typeof payload.error, 'string');
    assert(payload.error.length > 0);
  }
  return payload;
}

async function rejected(data, status = 400, options = {}) {
  const mock = mocks();
  await check(await handleContactRequest(request(data, options), mock.env, mock.fetcher), status);
  assert.equal(mock.verified.length, 0, 'Invalid requests must not call Siteverify');
  assert.equal(mock.sent.length, 0, 'Invalid requests must not send mail');
}

const originalFetch = globalThis.fetch;
const originalTimeout = AbortSignal.timeout;
const originals = Object.fromEntries(
  ['log', 'warn', 'error', 'info', 'debug'].map((name) => [name, console[name]])
);
const logs = [];
let unexpectedNetworkCalls = 0;
globalThis.fetch = async () => {
  unexpectedNetworkCalls++;
  throw new Error('Real network access is forbidden in this check');
};
AbortSignal.timeout = (milliseconds) => {
  assert.equal(milliseconds, 10_000);
  return originalTimeout(milliseconds);
};
for (const name of Object.keys(originals)) console[name] = (...args) => logs.push(args);

try {
  assert.equal(LEGACY_CONTACT_EMAIL, 'konzerte@akg-kiel.de');
  assert.equal(PLANNED_CONTACT_EMAIL, 'kontakt@petruskirche.events');
  assert.deepEqual(getContactSettings({}), {
    email: LEGACY_CONTACT_EMAIL,
    recipient: null,
    enabled: false,
    siteKey: ''
  });
  assert.deepEqual(getContactSettings(config), {
    email: PLANNED_CONTACT_EMAIL,
    recipient: PLANNED_CONTACT_EMAIL,
    enabled: true,
    siteKey: 'synthetic-site-key'
  });
  assert.deepEqual(
    getContactSettings({
      ...config,
      CONTACT_EMAIL: LEGACY_CONTACT_EMAIL,
      CONTACT_RECIPIENT: testRecipient
    }),
    {
      email: LEGACY_CONTACT_EMAIL,
      recipient: testRecipient,
      enabled: true,
      siteKey: 'synthetic-site-key'
    }
  );
  for (const email of [undefined, '', ' ', 'attacker@example.invalid', testRecipient]) {
    const settings = getContactSettings({ ...config, CONTACT_EMAIL: email });
    assert.equal(settings.email, LEGACY_CONTACT_EMAIL);
    assert.equal(settings.enabled, false);
  }

  for (const recipient of [
    undefined,
    '',
    ' ',
    ` ${testRecipient}`,
    `${testRecipient} `,
    'x',
    'a@b',
    'a@@example.invalid',
    'a..b@example.invalid',
    'a@-example.invalid',
    `One <${testRecipient}>`,
    `${testRecipient},other@example.invalid`,
    `${testRecipient};other@example.invalid`,
    '"quoted"@example.invalid',
    'ü@example.invalid',
    `${'a'.repeat(65)}@example.invalid`,
    `${maximumEmail}a`,
    ...[
      '\r\nBcc: attacker@example.invalid',
      '\n',
      '\t',
      '\0',
      '\x7f',
      '\x85',
      '\u2028',
      '\u2029'
    ].map((control) => testRecipient + control)
  ]) {
    const mock = mocks();
    const env = { ...mock.env, CONTACT_RECIPIENT: recipient };
    const settings = getContactSettings(env);
    assert.equal(settings.recipient, null);
    assert.equal(settings.enabled, false);
    await check(await handleContactRequest(request(), env, mock.fetcher), 503);
    assert.equal(mock.verified.length, 0, 'Invalid recipients must not call Siteverify');
    assert.equal(mock.sent.length, 0, 'Invalid recipients must not send mail');
  }

  for (const missing of [
    { CONTACT_FORMS_ENABLED: undefined },
    { CONTACT_FORMS_ENABLED: 'false' },
    { CONTACT_FORMS_ENABLED: 'TRUE' },
    { CONTACT_FORMS_ENABLED: '1' },
    { CONTACT_EMAIL: undefined },
    { CONTACT_EMAIL: '' },
    { CONTACT_EMAIL: 'attacker@example.invalid' },
    { CONTACT_EMAIL: testRecipient },
    { TURNSTILE_SITE_KEY: undefined },
    { TURNSTILE_SITE_KEY: ' ' },
    { TURNSTILE_SECRET: undefined },
    { TURNSTILE_SECRET: ' ' },
    { MAILER: undefined },
    { MAILER: {} },
    { TURNSTILE_HOSTNAMES: undefined },
    { TURNSTILE_HOSTNAMES: ' , ' }
  ]) {
    const mock = mocks();
    await check(
      await handleContactRequest(request(), { ...mock.env, ...missing }, mock.fetcher),
      503
    );
    assert.equal(mock.verified.length, 0);
    assert.equal(mock.sent.length, 0);
  }
  await check(await handleContactRequest(request(), {}), 503);
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE']) {
    const response = await handleContactRequest(request(contact, { method }), {});
    assert.equal(response.headers.get('Allow'), 'POST');
    await check(response, 405);
  }

  for (const data of [contact, booking]) {
    const mock = mocks({ kind: data.kind });
    await check(await handleContactRequest(request(data), mock.env, mock.fetcher), 200);
    assert.equal(mock.verified.length, 1);
    assert.equal(mock.sent.length, 1);
    const mail = mock.sent[0];
    assert.deepEqual(Object.keys(mail).sort(), [
      'from',
      'html',
      'replyTo',
      'subject',
      'text',
      'to'
    ]);
    assert.equal(mail.from, 'formular@formmail.petruskirche.events');
    assert.equal(mail.to, PLANNED_CONTACT_EMAIL);
    assert.equal(mail.replyTo, data['E-Mail']);
    assert.equal(
      mail.subject,
      data.kind === 'contact' ? contact.Betreff : 'Raumanfrage Petruskirche'
    );
    for (const [name, value] of Object.entries(data)) {
      if (name === 'kind' || name === 'cf-turnstile-response') continue;
      assert(mail.text.includes(`${name}:\n${value}`));
    }
    assert(!mail.text.includes('synthetic-token'));
    assert(!mail.text.includes(config.TURNSTILE_SECRET));
    assert(!mail.html.includes('<script>'));
    assert(!mail.html.includes('<Live>'));
    assert(mail.html.includes('&amp;'));
    if (data.kind === 'contact') {
      assert(mail.html.includes('&lt;script&gt;synthetic(&quot;test&quot;)&lt;/script&gt;'));
      assert(mail.html.includes('&#39;Übung&#39;\r\nZweite Zeile\tmit Tab.'));
    }
  }

  for (const data of [contact, booking]) {
    const mock = mocks({ kind: data.kind });
    const env = {
      ...mock.env,
      CONTACT_EMAIL: LEGACY_CONTACT_EMAIL,
      CONTACT_RECIPIENT: testRecipient
    };
    const query = new URLSearchParams({
      to: data['E-Mail'],
      recipient: PLANNED_CONTACT_EMAIL,
      from: LEGACY_CONTACT_EMAIL
    });
    await check(
      await handleContactRequest(
        request(data, { url: `${origin}/api/contact/?${query}` }),
        env,
        mock.fetcher
      ),
      200
    );
    assert.equal(mock.verified.length, 1);
    assert.equal(mock.sent.length, 1);
    assert.equal(mock.sent[0].to, testRecipient);
    assert.equal(mock.sent[0].from, 'formular@formmail.petruskirche.events');
    assert.equal(mock.sent[0].replyTo, data['E-Mail']);
    assert(!mock.sent[0].text.includes(testRecipient));
    assert(!mock.sent[0].html.includes(testRecipient));
  }

  assert.equal(maximumEmail.length, 254);
  for (const data of [
    {
      ...contact,
      Name: 'x'.repeat(160),
      'E-Mail': maximumEmail,
      Betreff: 'x'.repeat(160),
      Nachricht: 'Ü'.repeat(5000)
    },
    {
      ...booking,
      'Art der Veranstaltung': 'x'.repeat(160),
      'Name / Organisation': 'x'.repeat(160),
      Telefon: '1'.repeat(60),
      'Technische Anforderungen und Bemerkungen': 'Ü'.repeat(5000),
      'Erwartete Besucherzahl': '1',
      Wunschdatum: '0001-01-01',
      Alternativdatum: '9999-12-31'
    }
  ]) {
    const mock = mocks({ kind: data.kind });
    await check(
      await handleContactRequest(
        request(data),
        { ...mock.env, CONTACT_RECIPIENT: maximumEmail },
        mock.fetcher
      ),
      200
    );
    assert.equal(mock.sent.length, 1);
    assert.equal(mock.sent[0].to, maximumEmail);
  }

  // A resolved handler must mean provider acceptance, not just an enqueued promise.
  let acknowledge;
  const delayed = mocks({
    send: () =>
      new Promise((resolve) => {
        acknowledge = resolve;
      })
  });
  let settled = false;
  const pending = handleContactRequest(request(), delayed.env, delayed.fetcher).then((response) => {
    settled = true;
    return response;
  });
  await new Promise(setImmediate);
  assert.equal(delayed.sent.length, 1);
  assert.equal(settled, false);
  acknowledge({ messageId: 'synthetic-accepted-later' });
  await check(await pending, 200);

  const optional = { ...booking };
  for (const name of [
    'Alternativdatum',
    'Telefon',
    'Erwartete Besucherzahl',
    'Technische Anforderungen und Bemerkungen'
  ])
    delete optional[name];
  for (const data of [
    optional,
    { ...booking, Wunschdatum: '2024-02-29', Alternativdatum: '2099-12-31' },
    {
      ...booking,
      Alternativdatum: '',
      Telefon: '',
      'Erwartete Besucherzahl': '',
      'Technische Anforderungen und Bemerkungen': ''
    }
  ]) {
    const mock = mocks({ kind: 'booking' });
    await check(await handleContactRequest(request(data), mock.env, mock.fetcher), 200);
    assert.equal(mock.sent.length, 1);
  }

  for (const [data, required] of [
    [contact, ['kind', 'Name', 'E-Mail', 'Betreff', 'Nachricht', 'cf-turnstile-response']],
    [booking, ['Art der Veranstaltung', 'Wunschdatum', 'Name / Organisation', 'E-Mail']]
  ]) {
    for (const name of required) {
      const omitted = { ...data };
      delete omitted[name];
      await rejected(omitted);
      for (const value of ['', '   ']) await rejected({ ...data, [name]: value });
    }
  }
  for (const [data, limits] of [
    [contact, { Name: 160, 'E-Mail': 254, Betreff: 160, Nachricht: 5000 }],
    [
      booking,
      {
        'Art der Veranstaltung': 160,
        'Name / Organisation': 160,
        Telefon: 60,
        'Technische Anforderungen und Bemerkungen': 5000
      }
    ]
  ]) {
    for (const [name, max] of Object.entries(limits))
      await rejected({ ...data, [name]: 'x'.repeat(max + 1) });
  }
  await rejected({ ...contact, Name: 'X' });
  await rejected({ ...contact, Betreff: 'ab' });
  await rejected({ ...contact, Nachricht: 'Zu kurz' });
  for (const email of [
    'x',
    'a@b',
    'a@@example.invalid',
    'a..b@example.invalid',
    '.a@example.invalid',
    'a.@example.invalid',
    'a@-example.invalid',
    'a@example-.invalid',
    'a@example..invalid',
    'a b@example.invalid',
    'One <a@example.invalid>',
    'a@example.invalid,b@example.invalid',
    '"a"@example.invalid',
    `${'a'.repeat(65)}@example.invalid`
  ]) {
    await rejected({ ...contact, 'E-Mail': email });
  }
  for (const name of ['Name', 'E-Mail', 'Betreff']) {
    for (const control of [
      '\r\nBcc: attacker@example.invalid',
      '\n',
      '\t',
      '\0',
      '\x7f',
      '\x85',
      '\u2028',
      '\u2029'
    ])
      await rejected({ ...contact, [name]: contact[name] + control });
  }
  for (const [name, data] of [
    ['Telefon', booking],
    ['Art der Veranstaltung', booking],
    ['Name / Organisation', booking],
    ['Nachricht', contact],
    ['Technische Anforderungen und Bemerkungen', booking]
  ]) {
    await rejected({ ...data, [name]: data[name] + '\0' });
  }
  for (const [input, normalized] of [
    ['050', '50'],
    ['01', '1'],
    ['000650', '650'],
    ['50.0', '50'],
    ['1e2', '100'],
    ['5e1', '50'],
    ['.5e2', '50'],
    ['6.5E+2', '650'],
    [' 050 ', '50'],
    ['0'.repeat(2048) + '50', '50']
  ]) {
    const mock = mocks({ kind: 'booking' });
    await check(
      await handleContactRequest(
        request({ ...booking, 'Erwartete Besucherzahl': input }),
        mock.env,
        mock.fetcher
      ),
      200
    );
    assert.equal(mock.verified.length, 1);
    assert.equal(mock.sent.length, 1);
    assert.equal(mock.sent[0].text.match(/Erwartete Besucherzahl:\n([^\n]*)/)?.[1], normalized);
  }
  for (const value of [
    '0',
    '000',
    '651',
    '0651',
    '-1',
    '1.5',
    '1e-1',
    '6.51e2',
    '1e999',
    '+2',
    'NaN',
    'Infinity',
    '0x1',
    '0b1',
    '0o1',
    '50x',
    '1e',
    '1_0',
    '5 0',
    '\n050',
    '050\r',
    '\t050',
    '050\0',
    '050\u2028'
  ])
    await rejected({ ...booking, 'Erwartete Besucherzahl': value });
  for (const name of ['Wunschdatum', 'Alternativdatum']) {
    for (const date of [
      '2026-02-30',
      '2025-02-29',
      '2024-04-31',
      '2026-2-01',
      '2026-13-01',
      '2026-01-00',
      '2099-01-01T00:00:00Z',
      '0000-01-01',
      'not-a-date'
    ])
      await rejected({ ...booking, [name]: date });
  }
  for (const token of [
    ' ',
    'x'.repeat(2049),
    'token\r\nBcc: injected',
    'token\0',
    'token with space'
  ])
    await rejected({ ...contact, 'cf-turnstile-response': token });

  for (const data of [contact, booking]) {
    for (const name of Object.keys(data)) {
      const duplicates = new URLSearchParams(data);
      duplicates.append(name, data[name]);
      await rejected(duplicates);
    }
  }
  for (const name of [
    'to',
    'from',
    'cc',
    'bcc',
    'recipient',
    'CONTACT_RECIPIENT',
    'kind[]',
    'E-Mail[]',
    '__proto__',
    'constructor',
    'Telefon',
    'Wunschdatum'
  ]) {
    const extra = new URLSearchParams(contact);
    extra.append(name, 'attacker@example.invalid');
    await rejected(extra);
  }
  for (const kind of ['Contact', 'other', 'contact\n']) await rejected({ ...contact, kind });
  for (const type of [
    null,
    'application/json',
    'multipart/form-data; boundary=x',
    'text/plain',
    'application/x-www-form-urlencodedx'
  ]) {
    await rejected(contact, 415, { headers: { 'Content-Type': type } });
  }
  const file = new FormData();
  file.set('Name', new Blob(['synthetic-file']), 'test.txt');
  await rejected(contact, 415, { body: file, headers: { 'Content-Type': 'multipart/form-data' } });
  for (const crossOrigin of [
    null,
    'null',
    'https://evil.invalid',
    'https://sub.petruskirche.events',
    'http://petruskirche.events',
    `${origin}:444`,
    `${origin}/`,
    `${origin}, https://evil.invalid`
  ])
    await rejected(contact, 403, { headers: { Origin: crossOrigin } });
  await rejected(contact, 403, { headers: { 'Sec-Fetch-Site': 'cross-site' } });
  for (const url of [
    'http://localhost:4321/api/contact/',
    'http://127.0.0.1/api/contact/',
    'https://preview.example.invalid/api/contact/'
  ])
    await rejected(contact, 403, { url });

  for (const contentLength of [null, '0', '1']) {
    let chunks = 0;
    let cancelled = false;
    const stream = new ReadableStream({
      pull(controller) {
        if (chunks++ < 10) controller.enqueue(new Uint8Array(16_384).fill(97));
        else controller.close();
      },
      cancel() {
        cancelled = true;
      }
    });
    await rejected(contact, 413, { body: stream, headers: { 'Content-Length': contentLength } });
    assert(cancelled, 'Oversized streams must be cancelled');
    assert(chunks <= 6, 'Do not buffer the rest of an oversized stream');
  }
  await rejected(contact, 400, { body: 'a'.repeat(65_536) });
  await rejected(contact, 413, { body: 'a'.repeat(65_537) });
  await rejected(contact, 400, { body: new Uint8Array([0xff]) });
  await rejected(contact, 400, {
    body: new ReadableStream({
      start(controller) {
        controller.error(new Error('synthetic-provider-error'));
      }
    })
  });
  const small = mocks();
  await check(
    await handleContactRequest(
      request(contact, { headers: { 'Content-Length': '999999' } }),
      small.env,
      small.fetcher
    ),
    200
  );

  for (const result of [
    null,
    [],
    'invalid',
    {},
    { success: false },
    { success: 'true' },
    { success: 1 },
    { success: true },
    { success: true, action: 'booking', hostname: 'petruskirche.events' },
    { success: true, action: 'Contact', hostname: 'petruskirche.events' },
    ...[
      undefined,
      'evil.invalid',
      'sub.petruskirche.events',
      'localhost',
      ['petruskirche.events']
    ].map((hostname) => ({ success: true, action: 'contact', hostname })),
    ...[['invalid-input-response'], ['timeout-or-duplicate'], 'invalid', null].map((errors) => ({
      success: true,
      action: 'contact',
      hostname: 'petruskirche.events',
      'error-codes': errors
    }))
  ]) {
    const mock = mocks({ verify: () => Response.json(result) });
    await check(await handleContactRequest(request(), mock.env, mock.fetcher), 403);
    assert.equal(mock.verified.length, 1);
    assert.equal(mock.sent.length, 0);
  }
  for (const verify of [
    () => new Response('synthetic-provider-error'),
    () => new Response('synthetic-provider-error', { status: 500 }),
    () => new Response(null, { status: 302, headers: { Location: 'https://evil.invalid' } }),
    () => {
      throw new Error(`synthetic-provider-error ${contact['E-Mail']}`);
    },
    () => {
      throw new DOMException('synthetic-provider-error', 'TimeoutError');
    }
  ]) {
    const mock = mocks({ verify });
    await check(await handleContactRequest(request(), mock.env, mock.fetcher), 503);
    assert.equal(mock.verified.length, 1, 'Never retry verification');
    assert.equal(mock.sent.length, 0);
  }

  for (const send of [
    () => {
      throw new Error(`synthetic-provider-error ${contact.Nachricht}`);
    },
    () => undefined,
    () => ({}),
    () => ({ messageId: '' }),
    () => ({ messageId: 123 })
  ]) {
    const mock = mocks({ send });
    const payload = await check(await handleContactRequest(request(), mock.env, mock.fetcher), 503);
    assert.match(payload.error, /könnte bereits übermittelt/);
    assert.equal(mock.verified.length, 1);
    assert.equal(mock.sent.length, 1, 'Never retry a possibly accepted email');
  }

  // Reuse the repository's offline Cloudflare module stub to exercise the actual route.
  register(new URL('./check-availability-loader.mjs', import.meta.url));
  const { env } = await import('cloudflare:workers');
  const route = await import('../src/pages/api/contact.ts');
  assert.equal(route.prerender, false);
  const routeMock = mocks();
  Object.assign(env, routeMock.env);
  globalThis.fetch = routeMock.fetcher;
  await check(await route.POST({ request: request() }), 200);
  assert.equal(routeMock.sent.length, 1);
  await check(await route.ALL({ request: request(contact, { method: 'GET' }) }), 405);
  assert.equal(routeMock.sent.length, 1);
  assert.equal(routeMock.verified.length, 1);
  assert.equal(unexpectedNetworkCalls, 0);
  assert.deepEqual(logs, [], 'Do not log private form data or provider exceptions');
} finally {
  globalThis.fetch = originalFetch;
  AbortSignal.timeout = originalTimeout;
  for (const [name, method] of Object.entries(originals)) console[name] = method;
}
console.log(
  'Contact mail: fail-closed settings, validation, origins, body limits, mocked Turnstile/mail and privacy passed.'
);
