import { eventDate, factualText, safeUrl } from './concert-seo.ts';

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
  subtitle?: string;
  shortDescription?: string;
  longDescription?: string;
  programme?: string;
  programmeNotes?: string;
  performers?: string;
  organizer?: string;
  date: ConcertDate;
  endIso?: string;
  location?: string;
  address?: { street?: string; zip?: string; city?: string };
  accessibility?: string;
  admission?: string;
  durationMinutes?: number;
  intermission?: 'Mit Pause' | 'Ohne Pause';
  ticketUrl?: string;
  detailsHref: string;
  image?: string;
  imageAspectRatio?: number;
  imageFocus?: { x: number; y: number };
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

const berlinDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: '2-digit',
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
    month: parts.month.replace('.', ''),
    day: parts.day,
    time,
    display: allDay ? displayDate : `${displayDate} • ${time} Uhr`
  };
};

const normalizeFocus = (value?: number | string) => {
  const coordinate =
    typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN;
  return Number.isFinite(coordinate) ? Math.min(1, Math.max(0, coordinate)) : 0.5;
};

export const getImageAspectRatio = (width?: number, height?: number) => {
  const ratio =
    typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0
      ? width / height
      : NaN;
  return Number.isSafeInteger(width) &&
    Number.isSafeInteger(height) &&
    Number.isFinite(ratio) &&
    ratio > 0
    ? ratio
    : undefined;
};

const positionInCardCrop = (focus: number, visible: number) =>
  Math.min(100, Math.max(0, ((focus - visible / 2) / (1 - visible)) * 100));

export function getConcertImagePosition(focus: Concert['imageFocus'], imageRatio?: number) {
  const focusX = normalizeFocus(focus?.x);
  const focusY = normalizeFocus(focus?.y);
  // Center the CT focal point within the 4:3 crop, clamped to the image edges.
  const cardRatio = 4 / 3;
  const positionX =
    imageRatio && imageRatio > cardRatio
      ? positionInCardCrop(focusX, cardRatio / imageRatio)
      : focusX * 100;
  const positionY =
    imageRatio && imageRatio < cardRatio
      ? positionInCardCrop(focusY, imageRatio / cardRatio)
      : focusY * 100;
  return `${positionX}% ${positionY}%`;
}

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
      date.time !== 'Termin folgt' && Number.isFinite(durationMinutes) && durationMinutes > 0
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

const slugIdentity = (slug?: string) => {
  const match = slug?.match(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?-([1-9]\d*)-(\d{4}-\d{2}-\d{2})$/);
  if (!match || !Number.isSafeInteger(Number(match[1])) || !eventDate(match[2])) return undefined;
  return { id: match[1], date: match[2] };
};

export function resolveConcertSlug(concerts: Concert[], requestedSlug?: string) {
  const exact = concerts.find(({ slug }) => slug === requestedSlug);
  if (exact) return { concert: exact };
  const requested = slugIdentity(requestedSlug);
  if (!requested) return undefined;
  // Recurrences share a CT base ID; the calculated occurrence date disambiguates them.
  const candidates = concerts.filter(({ slug }) => slugIdentity(slug)?.id === requested.id);
  const dated = candidates.filter(({ slug }) => slugIdentity(slug)?.date === requested.date);
  const concert =
    dated.length === 1 ? dated[0] : candidates.length === 1 ? candidates[0] : undefined;
  return concert ? { concert, redirectTo: concert.detailsHref } : undefined;
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

export const hasInvalidConcertDateRange = ({ from, to }: ConcertFilters) =>
  Boolean(from && to && from > to);

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
        [
          concert.title,
          concert.subtitle,
          concert.shortDescription,
          concert.longDescription,
          concert.programme,
          concert.programmeNotes,
          concert.performers
        ]
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
