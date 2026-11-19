import { parseDate, toZoned } from '@internationalized/date';

import { parseIsoDate } from '../../lib/dates.ts';
import { getCanonicalUrl } from '../../lib/seo.ts';
import { eventDate, normalizeFocus } from './content.ts';

export type ConcertVariant = 'home' | 'programme' | 'archive';
export type ConcertState = 'past' | 'upcoming-with-ticket' | 'upcoming-without-ticket';

export const CONCERTS_PER_PAGE = 18;

export interface ConcertDate {
  iso: string;
  timeKnown: boolean;
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

const berlinDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

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
  const end = new Date(concert.endIso ?? concert.date.iso);
  // An unknown time does not establish that the concert ended at midnight.
  const past = concert.date.timeKnown
    ? end <= now
    : berlinDate.format(end) < berlinDate.format(now);
  if (past) return 'past';
  return concert.ticketUrl ? 'upcoming-with-ticket' : 'upcoming-without-ticket';
}

export function getProgrammeExpiry(concerts: Concert[], now = new Date()) {
  let expires = now.getTime() + 300_000;
  const today = berlinDate.format(now);
  let endsToday = false;
  for (const concert of concerts) {
    const end = new Date(concert.endIso ?? concert.date.iso);
    if (!concert.date.timeKnown) {
      endsToday ||= berlinDate.format(end) === today;
    } else if (end.getTime() > now.getTime()) {
      expires = Math.min(expires, end.getTime());
    }
  }
  if (endsToday) {
    const midnight = toZoned(parseDate(today), 'Europe/Berlin').add({ days: 1 }).toDate().getTime();
    expires = Math.min(expires, midnight);
  }
  return expires;
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
  from: string;
  to: string;
}

function getConcertFilters(params: URLSearchParams): ConcertFilters {
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  return {
    search: (params.get('q') ?? '').trim().slice(0, 100),
    from: Number.isFinite(parseIsoDate(from)) ? from : '',
    to: Number.isFinite(parseIsoDate(to)) ? to : ''
  };
}

export function getProgrammeResults(concerts: Concert[], site: URL, url: URL) {
  const filters = getConcertFilters(url.searchParams);
  const rangeError =
    filters.from && filters.to && filters.from > filters.to
      ? 'Das Startdatum muss vor dem Enddatum liegen.'
      : undefined;
  const filtered = rangeError ? [] : filterConcerts(concerts, filters);
  const pagination = paginateConcerts(filtered, url.searchParams);
  const hasFilters = Object.values(filters).some(Boolean);

  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (pagination.page > 1) params.set('page', String(pagination.page));
  const query = params.toString();

  return {
    ...pagination,
    filters,
    matchCount: filtered.length,
    rangeError,
    hasResultView: Boolean(rangeError || hasFilters || pagination.page > 1),
    emptyMessage: rangeError
      ? 'Korrigieren Sie den ausgewählten Zeitraum.'
      : hasFilters
        ? 'Für diese Filter wurden keine Konzerte gefunden. Ändern Sie die Suche oder setzen Sie die Filter zurück.'
        : undefined,
    canonicalUrl: getCanonicalUrl(site, url.pathname + (query ? `?${query}` : '')),
    // Raw filter keys (including ignored legacy seasons) still prevent indexing.
    noindex:
      ['q', 'season', 'from', 'to'].some((key) => url.searchParams.has(key)) ||
      (url.searchParams.has('page') && url.searchParams.get('page') !== String(pagination.page)) ||
      url.searchParams.getAll('page').length > 1
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

function filterConcerts(concerts: Concert[], filters: ConcertFilters) {
  const query = filters.search.toLocaleLowerCase('de-DE');
  return concerts.filter((concert) => {
    const date = getConcertDate(concert);
    return (
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
