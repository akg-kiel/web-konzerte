import {
  getConcertImagePosition,
  getImageAspectRatio,
  type Concert,
  type ConcertDate
} from './concerts.ts';
import { eventDate, factualText, normalizeFocus, safeUrl } from './content.ts';

interface ChurchToolsEnvironment {
  CHURCHTOOLS_BASE_URL?: string;
  CHURCHTOOLS_CALENDAR_IDS?: string;
  CHURCHTOOLS_TOKEN?: string;
}

interface ChurchToolsAppointment {
  id: number;
  title: string;
  description?: string | null;
  address?: { name?: string; street?: string; zip?: string; city?: string } | null;
  image?: {
    imageUrl?: string;
    description?: string | null;
    imageMetadata?: { aspectRatio?: number; width?: number; height?: number };
    imageOption?: { focus?: { x?: number | string; y?: number | string } };
  } | null;
  link?: string | null;
  allDay?: boolean;
}

interface ChurchToolsRow {
  appointment?: {
    base?: ChurchToolsAppointment;
    calculated?: { startDate?: string; endDate?: string };
  };
}

const defaults = {
  baseUrl: 'https://akg-kiel.church.tools',
  calendarIds: '3'
};

const dateParts = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const longDate = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const fieldNames: Record<string, string> = {
  program: 'programme',
  programm: 'programme',
  untertitel: 'subtitle',
  kurzbeschreibung: 'shortDescription',
  langbeschreibung: 'longDescription',
  programmhinweise: 'programmeNotes',
  mitwirkende: 'performers',
  veranstalter: 'organizer',
  barrierefreiheit: 'accessibility',
  einlass: 'admission',
  pause: 'intermission',
  ort: 'location'
};

const parseMetadata = (description: unknown = '') => {
  if (typeof description !== 'string') return {};
  const metadata: Record<string, string> = {};
  let section: string | null | undefined;
  for (const line of description.split(/\r?\n/)) {
    const heading = line.match(/^\s*---\s*(.*?)\s*$/);
    const field = line.match(/^([^:]+):\s*(.+)$/);
    const label = heading?.[1] ?? field?.[1];
    const key = label
      ?.trim()
      .toLocaleLowerCase('de-DE')
      .replaceAll(/[^a-zäöü]/g, '');
    if (heading) {
      section = (key ? fieldNames[key] : undefined) ?? null;
      if (section) metadata[section] = '';
    } else if (section) {
      metadata[section] += `${line}\n`;
    } else if (section === undefined && field && key && fieldNames[key]) {
      metadata[fieldNames[key]] = field[2].trim();
    }
  }
  return Object.fromEntries(
    Object.entries(metadata)
      .map(([key, value]) => [key, factualText(value)])
      .filter(([, value]) => value)
  );
};

const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');

const formatDate = (iso: string, allDay = false): ConcertDate => {
  const date = new Date(iso);
  const parts = Object.fromEntries(
    dateParts.formatToParts(date).map(({ type, value }) => [type, value])
  );
  const time = allDay ? 'Termin folgt' : `${parts.hour}:${parts.minute}`;
  const displayDate = longDate.format(date);

  return {
    iso,
    timeKnown: !allDay,
    month: parts.month.replace('.', ''),
    day: parts.day,
    time,
    display: allDay ? displayDate : `${displayDate} • ${time} Uhr`
  };
};

const mapAppointment = (row: ChurchToolsRow): Concert | undefined => {
  const appointment = row.appointment?.base;
  const startDate = row.appointment?.calculated?.startDate;
  const endDate = row.appointment?.calculated?.endDate;
  if (
    !appointment ||
    !Number.isSafeInteger(appointment.id) ||
    appointment.id <= 0 ||
    typeof appointment.title !== 'string' ||
    !appointment.title.trim() ||
    !startDate ||
    !eventDate(startDate)
  )
    return undefined;

  const metadata = parseMetadata(appointment.description ?? '');
  const addressName = factualText(appointment.address?.name);
  const location = metadata.location ?? addressName;
  // A conflicting (or unnamed) CT address cannot establish the chosen venue's address.
  const addressMatches =
    addressName && location?.toLocaleLowerCase('de-DE') === addressName.toLocaleLowerCase('de-DE');
  const address = addressMatches
    ? {
        street: factualText(appointment.address?.street),
        zip: factualText(appointment.address?.zip),
        city: factualText(appointment.address?.city)
      }
    : undefined;
  const validEnd =
    endDate && eventDate(endDate) && Date.parse(endDate) >= Date.parse(startDate)
      ? endDate
      : undefined;
  const ticketUrl = safeUrl(appointment.link);
  const image = safeUrl(appointment.image?.imageUrl);
  const imageUrl = image ? new URL(image) : undefined;
  if (imageUrl?.origin === defaults.baseUrl && imageUrl.pathname.startsWith('/images/')) {
    // ChurchTools returns a 150px square thumbnail unless width and height are requested explicitly.
    imageUrl.searchParams.set('fit', 'max');
    imageUrl.searchParams.set('h', '0');
    imageUrl.searchParams.set('w', '1200');
  }
  const date = formatDate(startDate, appointment.allDay || !startDate.includes('T'));
  const durationMinutes = validEnd ? (Date.parse(validEnd) - Date.parse(startDate)) / 60_000 : NaN;
  const pause = metadata.intermission?.toLocaleLowerCase('de-DE');
  const focus = appointment.image?.imageOption?.focus;
  const imageFocus = { x: normalizeFocus(focus?.x), y: normalizeFocus(focus?.y) };
  const { aspectRatio: ratio, width, height } = appointment.image?.imageMetadata ?? {};
  const imageRatio =
    ratio && Number.isFinite(ratio) && ratio >= 0.25 && ratio <= 4
      ? ratio
      : getImageAspectRatio(width, height);
  const slug = `${slugify(appointment.title)}-${appointment.id}-${startDate.slice(0, 10)}`;

  return {
    slug,
    title: appointment.title.trim(),
    subtitle: metadata.subtitle,
    shortDescription: metadata.shortDescription,
    longDescription: metadata.longDescription,
    programme: metadata.programme,
    programmeNotes: metadata.programmeNotes,
    performers: metadata.performers,
    organizer: metadata.organizer,
    date,
    endIso: validEnd,
    location,
    address: address && Object.values(address).some(Boolean) ? address : undefined,
    accessibility: metadata.accessibility,
    admission: metadata.admission,
    durationMinutes:
      date.timeKnown && Number.isFinite(durationMinutes) && durationMinutes > 0
        ? Math.max(1, Math.round(durationMinutes))
        : undefined,
    intermission:
      pause === 'true' || pause === 'ja' || pause === 'mit pause'
        ? 'Mit Pause'
        : pause === 'false' || pause === 'nein' || pause === 'ohne pause'
          ? 'Ohne Pause'
          : undefined,
    ticketUrl,
    detailsHref: `/programm/${slug}/`,
    image: imageUrl?.protocol === 'https:' ? imageUrl.href : undefined,
    imageAspectRatio: imageRatio,
    imageFocus,
    imageAlt:
      appointment.image?.description ??
      `Konzert „${appointment.title.trim()}“${location ? ` – ${location}` : ''}`,
    imagePosition: getConcertImagePosition(imageFocus, imageRatio)
  };
};

const fetchCalendar = async (url: string, headers?: Record<string, string>) => {
  const edgeCache =
    typeof caches === 'undefined'
      ? undefined
      : (caches as CacheStorage & { default?: Cache }).default;
  const cacheKey = new Request(url);
  let cached: Response | undefined;
  try {
    cached = await edgeCache?.match(cacheKey);
  } catch (error) {
    console.error('ChurchTools cache read failed:', error);
  }
  const cachedAt = Number(cached?.headers.get('x-akg-cached-at') ?? 0);
  if (cached && Date.now() - cachedAt < 300_000) return cached;

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return cached ?? response;

    if (edgeCache) {
      const copy = response.clone();
      const cacheHeaders = new Headers(copy.headers);
      cacheHeaders.set('Cache-Control', 'public, max-age=86400');
      cacheHeaders.set('x-akg-cached-at', String(Date.now()));
      try {
        await edgeCache.put(
          cacheKey,
          new Response(copy.body, {
            status: copy.status,
            statusText: copy.statusText,
            headers: cacheHeaders
          })
        );
      } catch (error) {
        console.error('ChurchTools cache write failed:', error);
      }
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
};

export async function getConcerts(environment: ChurchToolsEnvironment = {}) {
  const baseUrl = (environment.CHURCHTOOLS_BASE_URL || defaults.baseUrl).replace(/\/$/, '');
  const calendarIds = (environment.CHURCHTOOLS_CALENDAR_IDS || defaults.calendarIds)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const headers = environment.CHURCHTOOLS_TOKEN
    ? { Authorization: `Login ${environment.CHURCHTOOLS_TOKEN}` }
    : undefined;

  try {
    if (new URL(baseUrl).protocol !== 'https:')
      throw new Error('CHURCHTOOLS_BASE_URL must use HTTPS');
    if (calendarIds.length === 0) throw new Error('CHURCHTOOLS_CALENDAR_IDS must not be empty');

    const responses = await Promise.all(
      calendarIds.map((id) =>
        fetchCalendar(
          `${baseUrl}/api/calendars/${encodeURIComponent(id)}/appointments?from=2000-01-01&to=2100-12-31`,
          headers
        )
      )
    );
    if (responses.some((response) => !response.ok))
      throw new Error(`ChurchTools returned ${responses.map(({ status }) => status).join(', ')}`);

    const payloads = (await Promise.all(responses.map((response) => response.json()))) as Array<{
      data?: ChurchToolsRow[];
    }>;
    const concerts = payloads
      .flatMap(({ data }) => data ?? [])
      .map(mapAppointment)
      .filter((concert): concert is Concert => Boolean(concert));
    return {
      concerts: concerts.sort((a, b) => a.date.iso.localeCompare(b.date.iso)),
      error: false
    };
  } catch (error) {
    console.error(
      'ChurchTools concerts unavailable:',
      error instanceof Error ? error.message : error
    );
    return { concerts: [], error: true };
  }
}
