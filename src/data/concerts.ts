export type ConcertVariant = 'home' | 'programme' | 'archive';
export type ConcertState = 'past' | 'upcoming-with-ticket' | 'upcoming-without-ticket';

export const CONCERTS_PER_PAGE = 18;

export interface ConcertDate {
  iso: string;
  month: string;
  day: string;
  time: string;
  display: string;
}

export interface Concert {
  slug: string;
  title: string;
  programme: string;
  programmeNotes?: string;
  performers?: string;
  date: ConcertDate;
  endIso?: string;
  location: string;
  accessibility: string;
  ticketUrl?: string;
  detailsHref: string;
  image?: string;
  imageAlt: string;
  imagePosition: string;
}

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
  calendarIds: '3',
  location: 'Konzertkirche Petruskirche Kiel',
  accessibility: 'Stufenloser Zugang, Rollstuhlplätze und rollstuhlgerechtes WC vorhanden.'
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

const berlinDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const fieldNames: Record<string, string> = {
  programm: 'programme',
  programmhinweise: 'programmeNotes',
  mitwirkende: 'performers',
  barrierefreiheit: 'accessibility'
};

const parseMetadata = (description = '') =>
  Object.fromEntries(
    description.split('\n').flatMap((line) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      const key = match?.[1]
        .trim()
        .toLocaleLowerCase('de-DE')
        .replaceAll(/[^a-zäöü]/g, '');
      return match && key && fieldNames[key] ? [[fieldNames[key], match[2].trim()]] : [];
    })
  ) as Record<string, string>;

const safeUrl = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
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
    !appointment?.id ||
    !appointment.title?.trim() ||
    !startDate ||
    Number.isNaN(Date.parse(startDate))
  )
    return undefined;

  const metadata = parseMetadata(appointment.description ?? '');
  const ticketUrl = safeUrl(appointment.link);
  const date = formatDate(startDate, appointment.allDay);
  const address = appointment.address;
  const location =
    (address
      ? [address.name, address.street, [address.zip, address.city].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(', ')
      : '') || defaults.location;
  const focus = appointment.image?.imageOption?.focus;
  const focusX = Number(focus?.x ?? 0.5) * 100;
  const focusY = Number(focus?.y ?? 0.5) * 100;
  const slug = `${slugify(appointment.title)}-${appointment.id}-${startDate.slice(0, 10)}`;

  return {
    slug,
    title: appointment.title.trim(),
    programme: metadata.programme ?? 'Weitere Informationen zu diesem Konzert folgen.',
    programmeNotes: metadata.programmeNotes,
    performers: metadata.performers,
    date,
    endIso: endDate && !Number.isNaN(Date.parse(endDate)) ? endDate : undefined,
    location,
    accessibility: metadata.accessibility ?? defaults.accessibility,
    ticketUrl,
    detailsHref: `/programm/${slug}/`,
    image: safeUrl(appointment.image?.imageUrl),
    imageAlt:
      appointment.image?.description ??
      `Konzert „${appointment.title.trim()}“ in der Petruskirche Kiel`,
    imagePosition: `${Number.isFinite(focusX) ? focusX : 50}% ${Number.isFinite(focusY) ? focusY : 50}%`
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

export function getConcertState(concert: Concert, now = new Date()): ConcertState {
  if (new Date(concert.endIso ?? concert.date.iso) <= now) return 'past';
  return concert.ticketUrl ? 'upcoming-with-ticket' : 'upcoming-without-ticket';
}

export function splitConcerts(concerts: Concert[], now = new Date()) {
  const isPast = (concert: Concert) => getConcertState(concert, now) === 'past';
  return {
    programmeConcerts: concerts.filter((concert) => !isPast(concert)),
    archiveConcerts: concerts.filter(isPast).reverse()
  };
}

export interface ConcertFilters {
  search: string;
  season: string;
  from: string;
  to: string;
}

const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function getConcertFilters(params: URLSearchParams): ConcertFilters {
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const season = params.get('season') ?? '';
  return {
    search: (params.get('q') ?? '').trim().slice(0, 100),
    season: /^\d{4}\/\d{2}$/.test(season) ? season : '',
    from: validDate(from) ? from : '',
    to: validDate(to) ? to : ''
  };
}

export function paginateConcerts(concerts: Concert[], params: URLSearchParams) {
  const pageCount = Math.max(1, Math.ceil(concerts.length / CONCERTS_PER_PAGE));
  const value = params.get('page') ?? '';
  const requested = /^\d+$/.test(value) ? Number(value) : 1;
  const page = Number.isSafeInteger(requested) ? Math.min(Math.max(requested, 1), pageCount) : 1;
  const start = (page - 1) * CONCERTS_PER_PAGE;
  return {
    pageConcerts: concerts.slice(start, start + CONCERTS_PER_PAGE),
    page,
    pageCount
  };
}

const getConcertDate = (concert: Concert) => berlinDate.format(new Date(concert.date.iso));

export function getConcertSeason(concert: Concert) {
  const [year, month] = getConcertDate(concert).split('-').map(Number);
  const start = month >= 7 ? year : year - 1;
  return `${start}/${String(start + 1).slice(-2)}`;
}

export function filterConcerts(concerts: Concert[], filters: ConcertFilters) {
  const query = filters.search.toLocaleLowerCase('de-DE');
  return concerts.filter((concert) => {
    const date = getConcertDate(concert);
    return (
      (!filters.season || getConcertSeason(concert) === filters.season) &&
      (!filters.from || date >= filters.from) &&
      (!filters.to || date <= filters.to) &&
      (!query ||
        [concert.title, concert.programme, concert.programmeNotes, concert.performers]
          .filter(Boolean)
          .join('\n')
          .toLocaleLowerCase('de-DE')
          .includes(query))
    );
  });
}

export const cacheProgramme = (response: { headers: Headers }) => {
  response.headers.set('Cache-Control', 'public, max-age=0');
  response.headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=300, stale-if-error=86400');
};
