import { parseIsoDate } from './availability.ts';

export const LEGACY_CONTACT_EMAIL = 'konzerte@akg-kiel.de';
export const PLANNED_CONTACT_EMAIL = 'kontakt@petruskirche.events';

export function getContactSettings(env: Partial<Env>): {
  email: string;
  recipient: string | null;
  enabled: boolean;
  siteKey: string;
} {
  const configuredEmail = env.CONTACT_EMAIL?.trim();
  const email =
    configuredEmail === PLANNED_CONTACT_EMAIL || configuredEmail === LEGACY_CONTACT_EMAIL
      ? configuredEmail
      : LEGACY_CONTACT_EMAIL;
  const configuredRecipient = env.CONTACT_RECIPIENT ?? '';
  const recipient = isMailbox(configuredRecipient) ? configuredRecipient : null;
  const siteKey = env.TURNSTILE_SITE_KEY?.trim() ?? '';
  return {
    email,
    recipient,
    enabled:
      env.CONTACT_FORMS_ENABLED?.trim() === 'true' &&
      siteKey.length > 0 &&
      configuredEmail === email &&
      recipient !== null,
    siteKey
  };
}

const fields: Record<
  'contact' | 'booking',
  Array<[name: string, min: number, max: number, multiline?: boolean]>
> = {
  contact: [
    ['Name', 2, 160],
    ['E-Mail', 1, 254],
    ['Betreff', 3, 160],
    ['Nachricht', 10, 5000, true]
  ],
  booking: [
    ['Art der Veranstaltung', 1, 160],
    ['Erwartete Besucherzahl', 0, 3],
    ['Wunschdatum', 1, 10],
    ['Alternativdatum', 0, 10],
    ['Name / Organisation', 1, 160],
    ['E-Mail', 1, 254],
    ['Telefon', 0, 60],
    ['Technische Anforderungen und Bemerkungen', 0, 5000, true]
  ]
};

const unavailable =
  'Das Formular ist derzeit nicht verfügbar. Bitte nutzen Sie die E-Mail-Adresse auf der Kontaktseite.';
const invalid = 'Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.';
const uncertain =
  'Die Übergabe Ihrer Nachricht konnte nicht bestätigt werden. Sie könnte bereits übermittelt worden sein. Bitte senden Sie nicht sofort erneut.';

const respond = (status: number, error?: string) =>
  Response.json(error ? { ok: false, error } : { ok: true }, {
    status,
    headers: { 'Cache-Control': 'no-store', ...(status === 405 ? { Allow: 'POST' } : {}) }
  });

async function readBody(request: Request): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > 65_536) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// One unquoted mailbox only; the visitor address is used solely as Reply-To.
const mailbox =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const isMailbox = (value: string) =>
  value.length <= 254 && mailbox.test(value) && value.split('@')[0].length <= 64;

export async function handleContactRequest(
  request: Request,
  env: Partial<Env>,
  fetcher: typeof fetch = fetch
): Promise<Response> {
  if (request.method !== 'POST') return respond(405, 'Diese Methode wird nicht unterstützt.');

  const settings = getContactSettings(env);
  const secret = env.TURNSTILE_SECRET?.trim();
  const mailer: SendEmail | undefined = env.MAILER;
  const hostnames = (env.TURNSTILE_HOSTNAMES ?? '')
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
  if (
    !settings.enabled ||
    !settings.recipient ||
    !secret ||
    typeof mailer?.send !== 'function' ||
    !hostnames.length
  )
    return respond(503, unavailable);

  const url = new URL(request.url);
  if (
    request.headers.get('Origin') !== url.origin ||
    request.headers.get('Sec-Fetch-Site') === 'cross-site' ||
    !hostnames.includes(url.hostname)
  )
    return respond(
      403,
      'Die Anfrage konnte nicht bestätigt werden. Bitte laden Sie die Seite neu.'
    );

  if (
    request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !==
    'application/x-www-form-urlencoded'
  )
    return respond(415, 'Dieses Anfrageformat wird nicht unterstützt.');

  let form: URLSearchParams;
  try {
    // Content-Length is not authoritative: count the bytes of the actual stream.
    const body = await readBody(request);
    if (body === null)
      return respond(413, 'Die Anfrage ist zu groß. Bitte kürzen Sie Ihre Angaben.');
    form = new URLSearchParams(body);
  } catch {
    return respond(400, invalid);
  }

  const kind = form.get('kind');
  if (kind !== 'contact' && kind !== 'booking') return respond(400, invalid);
  const spec = fields[kind];
  const allowed = new Set(['kind', 'cf-turnstile-response', ...spec.map(([name]) => name)]);
  for (const name of form.keys()) {
    if (!allowed.has(name) || form.getAll(name).length !== 1) return respond(400, invalid);
  }

  const values: Record<string, string> = {};
  for (const [name, min, max, multiline] of spec) {
    const rawValue = form.get(name) ?? '';
    // Native number inputs allow leading zeros, decimals and exponents; bound the canonical count.
    const value =
      name === 'Erwartete Besucherzahl' && /^(?:\d+|\d*\.\d+)(?:e[+-]?\d+)?$/i.test(rawValue.trim())
        ? String(Number(rawValue))
        : rawValue;
    /* eslint-disable no-control-regex -- Body fields allow tabs/newlines; headers allow no controls. */
    const controls = multiline
      ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u
      : /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u;
    /* eslint-enable no-control-regex */
    if (value.length > max || value.trim().length < min || controls.test(rawValue))
      return respond(400, invalid);
    values[name] = multiline ? value : value.trim();
  }
  const email = values['E-Mail'];
  if (!isMailbox(email)) return respond(400, invalid);

  if (kind === 'booking') {
    const visitors = values['Erwartete Besucherzahl'];
    if (visitors && (!/^[1-9]\d{0,2}$/.test(visitors) || Number(visitors) > 650))
      return respond(400, invalid);
    // Inquiry dates are independent and are not constrained by the availability preview horizon.
    for (const name of ['Wunschdatum', 'Alternativdatum']) {
      if (
        values[name] &&
        (!Number.isFinite(parseIsoDate(values[name])) || values[name] < '0001-01-01')
      )
        return respond(400, invalid);
    }
  }

  const token = form.get('cf-turnstile-response') ?? '';
  if (!/^[\x21-\x7e]{1,2048}$/.test(token)) return respond(400, invalid);

  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
      // Reject redirects below without forwarding the secret; manual works with our compatibility date.
      redirect: 'manual'
    });
    if (!response.ok) return respond(503, 'Die Sicherheitsprüfung ist derzeit nicht verfügbar.');
    const verification = (await response.json()) as {
      success?: unknown;
      action?: unknown;
      hostname?: unknown;
      'error-codes'?: unknown;
    } | null;
    const errors = verification?.['error-codes'];
    if (
      verification?.success !== true ||
      verification.action !== kind ||
      typeof verification.hostname !== 'string' ||
      verification.hostname !== url.hostname ||
      !hostnames.includes(verification.hostname) ||
      (errors !== undefined && (!Array.isArray(errors) || errors.length > 0))
    )
      return respond(
        403,
        'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte laden Sie die Seite neu.'
      );
  } catch {
    return respond(503, 'Die Sicherheitsprüfung ist derzeit nicht verfügbar.');
  }

  const text = [
    kind === 'contact' ? 'Kontaktanfrage Petruskirche' : 'Unverbindliche Raumanfrage Petruskirche',
    ...spec.map(([name]) => `${name}:\n${values[name] || '—'}`)
  ].join('\n\n');
  try {
    const result = await mailer.send({
      from: 'formular@formmail.petruskirche.events',
      to: settings.recipient,
      replyTo: email,
      subject: kind === 'contact' ? values['Betreff'] : 'Raumanfrage Petruskirche',
      text,
      html: `<pre>${escapeHtml(text)}</pre>`
    });
    if (typeof result?.messageId !== 'string' || !result.messageId.trim())
      return respond(503, uncertain);
    return respond(200);
  } catch {
    // A failed acknowledgement cannot prove non-delivery. Never retry automatically.
    return respond(503, uncertain);
  }
}
