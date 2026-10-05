import type { Concert } from './concerts.ts';

// CT templates use bracketed instructions. Keep those out of public facts.
export const factualText = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || /\[[\s\S]*?\]|\{\{[\s\S]*?\}\}/.test(value)) return undefined;
  // eslint-disable-next-line no-control-regex -- Remove non-printing source controls, preserving line breaks.
  const text = value.replaceAll(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  return text.trim() || undefined;
};

export const safeUrl = (value: unknown, base?: URL): string | undefined => {
  const text = factualText(value);
  // eslint-disable-next-line no-control-regex -- Reject embedded whitespace/control characters in URLs.
  if (!text || /[\u0000-\u0020\u007f]/.test(text)) return undefined;
  try {
    const url = new URL(text, base);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};

const berlinDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export function eventDate(value: unknown, timeUnknown = false): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/
  );
  if (!match || !Number.isFinite(Date.parse(value))) return undefined;
  const [, day, hour, minute, second, zone] = match;
  if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) return undefined;
  if (hour && (Number(hour) > 23 || Number(minute) > 59 || Number(second ?? 0) > 59))
    return undefined;
  if (zone && zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))
    return undefined;
  return timeUnknown && hour ? berlinDate.format(new Date(value)) : value;
}

const summary = (concert: Concert) =>
  [concert.shortDescription, concert.subtitle, concert.programme, concert.longDescription]
    .map(factualText)
    .find(Boolean)
    ?.replaceAll(/\s+/g, ' ');

const metadataKey = (concert: Concert) =>
  `${factualText(concert.title) ?? 'Konzert'} am ${concert.date.display} | ${factualText(concert.location) ?? ''}`;

export function getConcertMetadata(concert: Concert, concerts: Concert[] = [concert]) {
  const duplicates = concerts
    .filter((item) => metadataKey(item) === metadataKey(concert))
    .map(({ slug }) => slug)
    .sort();
  const suffix = duplicates.length > 1 ? ` · Termin ${duplicates.indexOf(concert.slug) + 1}` : '';
  const name = factualText(concert.title) ?? 'Konzert';
  const location = factualText(concert.location);
  return {
    title: `${name} am ${concert.date.display}${suffix} | ${location ?? 'Kieler Konzertkirche'}`,
    description: `${name} am ${concert.date.display}${suffix}. ${location ? `Ort: ${location}.` : 'Veranstaltungsort noch nicht angegeben.'}${summary(concert) ? ` ${summary(concert)}` : ''}`
  };
}

export const concertAddressLabel = (concert: Concert) =>
  [concert.address?.street, [concert.address?.zip, concert.address?.city].filter(Boolean).join(' ')]
    .map(factualText)
    .filter(Boolean)
    .join(', ');

export function getConcertLocationHref(concert: Concert) {
  const location = factualText(concert.location);
  if (!location) return undefined;
  const city = factualText(concert.address?.city);
  if (
    /^(?:konzertkirche\s+)?petruskirche(?:\s+kiel(?:-wik)?)?$/i.test(location) &&
    (!city || /^Kiel(?:-Wik)?$/i.test(city))
  )
    return '/besuch-planen/#anfahrt';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([location, concertAddressLabel(concert)].filter(Boolean).join(', '))}`;
}

// Free-form lists do not establish whether a name is a person or an ensemble.
// Only explicit source labels become typed entities; the same text stays visible.
const entities = (value: unknown, performer = false) => {
  const lines = factualText(value)
    ?.split(/\r?\n/)
    .filter((line) => line.trim());
  const types: Record<string, string> = {
    Person: 'Person',
    Organisation: 'Organization',
    ...(performer ? { Ensemble: 'PerformingGroup' } : {})
  };
  const result = lines?.map((line) => {
    const match = line.trim().match(/^(Person|Organisation|Ensemble):\s*(.+)$/);
    return match && types[match[1]]
      ? { '@type': types[match[1]], name: match[2].trim() }
      : undefined;
  });
  return result?.length && result.every(Boolean) ? result : undefined;
};

export function getConcertEvent(concert: Concert, siteUrl: URL, isPast = false) {
  const name = factualText(concert.title);
  const timeUnknown = concert.date.time === 'Termin folgt';
  const startDate = eventDate(concert.date.iso, timeUnknown);
  if (!name || !startDate) return undefined;
  const end = eventDate(concert.endIso, timeUnknown);
  const endDate = end && Date.parse(end) >= Date.parse(startDate) ? end : undefined;
  const location = factualText(concert.location);
  const address = concert.address;
  const streetAddress = factualText(address?.street);
  const postalCode = factualText(address?.zip);
  const addressLocality = factualText(address?.city);
  const image = safeUrl(concert.image);
  const ticketUrl = !isPast ? safeUrl(concert.ticketUrl) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    url: safeUrl(concert.detailsHref, siteUrl),
    startDate,
    endDate,
    description: summary(concert),
    location: location
      ? {
          '@type': 'Place',
          name: location,
          address:
            streetAddress || postalCode || addressLocality
              ? {
                  '@type': 'PostalAddress',
                  streetAddress,
                  postalCode,
                  addressLocality
                }
              : undefined
        }
      : undefined,
    image: image?.startsWith('https:') ? image : undefined,
    performer: entities(concert.performers, true),
    organizer: entities(concert.organizer),
    offers: ticketUrl ? { '@type': 'Offer', url: ticketUrl } : undefined
  };
}

export const serializeEvent = (event: ReturnType<typeof getConcertEvent>) =>
  event
    ? JSON.stringify(event)
        .replaceAll('<', '\\u003c')
        .replaceAll('\u2028', '\\u2028')
        .replaceAll('\u2029', '\\u2029')
    : undefined;
