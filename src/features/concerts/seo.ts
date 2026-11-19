import { getCanonicalUrl } from '../../lib/seo.ts';
import { CONCERTS_PER_PAGE, splitConcerts, type Concert } from './concerts.ts';
import { eventDate, factualText, safeUrl, subtitleText } from './content.ts';

const summary = (concert: Concert) =>
  [
    factualText(concert.shortDescription),
    subtitleText(concert.subtitle),
    factualText(concert.programme),
    factualText(concert.longDescription)
  ]
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
  const hasUnconfirmedAddress =
    !city && Boolean(factualText(concert.address?.street) || factualText(concert.address?.zip));
  if (
    /^(?:konzertkirche\s+)?petruskirche(?:\s+kiel(?:-wik)?)?$/i.test(location) &&
    !hasUnconfirmedAddress &&
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
  const timeUnknown = !concert.date.timeKnown;
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

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export function getSitemapResponse(
  site: URL,
  result: { concerts: Concert[]; error: boolean },
  staticPaths: string[],
  now = new Date()
) {
  if (result.error) {
    return new Response('Konzertprogramm derzeit nicht verfügbar.', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
        'Retry-After': '300'
      }
    });
  }
  const paths = [...staticPaths, ...result.concerts.map(({ detailsHref }) => detailsHref)];
  const { programmeConcerts, archiveConcerts } = splitConcerts(result.concerts, now);
  for (const [path, concerts] of [
    ['/programm/', programmeConcerts],
    ['/programm/archiv/', archiveConcerts]
  ] as const) {
    const pageCount = Math.ceil(concerts.length / CONCERTS_PER_PAGE);
    for (let page = 2; page <= pageCount; page++) paths.push(`${path}?page=${page}`);
  }
  const urls = [...new Set(paths.map((path) => getCanonicalUrl(site, path)))];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  const response = new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
  cacheProgramme(response);
  return response;
}

export const cacheProgramme = (response: { headers: Headers }) => {
  response.headers.set('Cache-Control', 'public, max-age=0');
  response.headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=300, stale-if-error=86400');
};
