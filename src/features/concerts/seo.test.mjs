import { expect, test } from 'vite-plus/test';

import { getCanonicalUrl } from '../../lib/seo.ts';
import { getConcerts } from './churchtools.server.ts';
import {
  getConcertState,
  getProgrammeResults,
  resolveConcertSlug,
  splitConcerts
} from './concerts.ts';
import {
  concertAddressLabel,
  getConcertEvent,
  getConcertLocationHref,
  getConcertMetadata,
  getSitemapResponse,
  serializeEvent
} from './seo.ts';
import { eventDate } from './content.ts';

test('Konzertdetails: Metadaten, strukturierte Daten und Weiterleitungen', async () => {
  const site = new URL('https://example.org/');
  const originalFetch = globalThis.fetch;
  let rows = [];
  globalThis.fetch = async () => new Response(JSON.stringify({ data: rows }));
  const row = (
    id,
    description,
    address,
    startDate = '2027-08-06T17:30:00Z',
    endDate = '2027-08-06T19:00:00Z',
    allDay = false
  ) => ({
    appointment: {
      base: {
        id,
        title: 'MAYBEBOP',
        isInternal: false,
        description,
        address,
        allDay,
        image: { imageUrl: 'https://example.org/poster.jpg' },
        link: 'https://example.org/tickets'
      },
      calculated: { startDate, endDate }
    }
  });

  try {
    const address = {
      name: 'Petruskirche Kiel',
      street: 'Weimarer Straße 1',
      zip: '24106',
      city: 'Kiel'
    };
    rows = [
      row(
        1,
        '---Kurzbeschreibung\nEin Konzertabend.\n---Mitwirkende\nEnsemble: MAYBEBOP\nPerson: Beispielname\n---Veranstalter\nOrganisation: Konzertveranstalter\n---Ort\nPetruskirche Kiel',
        address
      )
    ];
    const {
      concerts: [concert],
      error
    } = await getConcerts();
    expect(error).toBe(false);
    expect(concert.detailsHref).toBe('/programm/maybebop-1-2027-08-06/');
    expect(concert.location).toBe('Petruskirche Kiel');
    expect(concert.address).toStrictEqual({
      street: address.street,
      zip: address.zip,
      city: address.city
    });
    expect(concertAddressLabel(concert)).toBe('Weimarer Straße 1, 24106 Kiel');
    expect(getConcertLocationHref(concert)).toBe('/besuch-planen/#anfahrt');
    expect(
      getConcertLocationHref({ ...concert, location: 'Petruskirche', address: { city: 'Hamburg' } })
    ).toMatch(/query=Petruskirche%2C%20Hamburg$/);
    const metadata = getConcertMetadata(concert);
    expect(metadata.title).toMatch(/MAYBEBOP.*6\. August 2027.*19:30.*Petruskirche Kiel/);
    expect(metadata.description).toMatch(/Ein Konzertabend\./);
    const event = getConcertEvent(concert, site);
    expect(JSON.parse(serializeEvent(event))).toStrictEqual({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'MAYBEBOP',
      url: 'https://example.org/programm/maybebop-1-2027-08-06/',
      startDate: '2027-08-06T17:30:00Z',
      endDate: '2027-08-06T19:00:00Z',
      description: 'Ein Konzertabend.',
      location: {
        '@type': 'Place',
        name: 'Petruskirche Kiel',
        address: {
          '@type': 'PostalAddress',
          streetAddress: address.street,
          postalCode: address.zip,
          addressLocality: address.city
        }
      },
      image: 'https://example.org/poster.jpg',
      performer: [
        { '@type': 'PerformingGroup', name: 'MAYBEBOP' },
        { '@type': 'Person', name: 'Beispielname' }
      ],
      organizer: [{ '@type': 'Organization', name: 'Konzertveranstalter' }],
      offers: { '@type': 'Offer', url: 'https://example.org/tickets' }
    });
    expect(getConcertEvent(concert, site, true).offers).toBe(undefined);

    const search = (concerts, q) =>
      getProgrammeResults(
        concerts,
        site,
        new URL(`/programm/?${new URLSearchParams({ q })}`, site)
      );
    for (const [subtitle, expected] of [
      ['  Nativer CT-Untertitel  ', 'Nativer CT-Untertitel'],
      ['Bach [Leipziger Fassung]', 'Bach [Leipziger Fassung]'],
      ['{{Untertitel}}', 'Bisheriger Untertitel'],
      ['', 'Bisheriger Untertitel'],
      [null, 'Bisheriger Untertitel'],
      [undefined, 'Bisheriger Untertitel'],
      ['[Untertitel]', 'Bisheriger Untertitel'],
      [123, 'Bisheriger Untertitel']
    ]) {
      const native = row(11, '---Untertitel\nBisheriger Untertitel', null);
      native.appointment.base.subtitle = subtitle;
      rows = [native];
      const [mapped] = (await getConcerts()).concerts;
      expect(mapped.subtitle).toBe(expected);
      expect(getConcertMetadata(mapped).description).toContain(expected);
      expect(getConcertEvent(mapped, site).description).toBe(expected);
      expect(search([mapped], expected).matchCount).toBe(1);
    }

    const publicRow = row(12, '', null);
    rows = [
      publicRow,
      ...[true, undefined, null, 'false', 'true', 0, 1].map((isInternal, index) => {
        const privateRow = row(900 + index, 'Nicht veröffentlichen', null);
        privateRow.appointment.base.title = 'Interner Bürotermin';
        privateRow.appointment.base.isInternal = isInternal;
        return privateRow;
      })
    ];
    // The read-only CT token can return internal rows; only an explicit false flag is public.
    const publicOnly = await getConcerts({ CHURCHTOOLS_TOKEN: 'mock-read-token' });
    expect(publicOnly.error).toBe(false);
    expect(publicOnly.concerts.map(({ slug }) => slug)).toEqual(['maybebop-12-2027-08-06']);
    expect(search(publicOnly.concerts, 'Büro').matchCount).toBe(0);
    expect(
      resolveConcertSlug(publicOnly.concerts, 'interner-burotermin-900-2027-08-06')
    ).toBeUndefined();
    const [defaultVenue] = publicOnly.concerts;
    expect(defaultVenue).toMatchObject({
      subtitle: undefined,
      location: 'Petruskirche Kiel',
      address: undefined,
      accessibility: undefined,
      organizer: undefined
    });
    expect(getConcertEvent(defaultVenue, site).location.name).toBe('Petruskirche Kiel');
    expect(getConcertMetadata(defaultVenue).description).not.toMatch(/noch nicht angegeben/i);
    for (const location of [
      'Petruskirche',
      'Petruskirche Kiel',
      'Konzertkirche Petruskirche Kiel-Wik'
    ]) {
      expect(getConcertLocationHref({ ...defaultVenue, location })).toBe('/besuch-planen/#anfahrt');
    }

    expect(resolveConcertSlug([concert], concert.slug)).toStrictEqual({ concert });
    const renamed = resolveConcertSlug([concert], 'old-name-1-2027-08-06');
    expect(renamed.concert).toBe(concert);
    expect(renamed.redirectTo).toBe(concert.detailsHref);
    expect(resolveConcertSlug([concert], renamed.redirectTo.split('/')[2]).redirectTo).toBe(
      undefined
    );
    const rescheduled = {
      ...concert,
      slug: 'maybebop-1-2027-08-08',
      detailsHref: '/programm/maybebop-1-2027-08-08/'
    };
    expect(resolveConcertSlug([rescheduled], concert.slug).redirectTo).toBe(
      rescheduled.detailsHref
    );
    const recurring = [concert, rescheduled];
    expect(resolveConcertSlug(recurring, 'old-name-1-2027-08-08').concert).toBe(rescheduled);
    expect(resolveConcertSlug(recurring, 'old-name-1-2027-08-09')).toBe(undefined);
    expect(
      resolveConcertSlug(
        [concert, { ...concert, slug: 'other-name-1-2027-08-06' }],
        'old-name-1-2027-08-06'
      )
    ).toBe(undefined);
    for (const invalid of [
      undefined,
      '',
      'maybebop-kiel-2027',
      'old-name-0-2027-08-06',
      'old-name--1-2027-08-06',
      'old-name-01-2027-08-06',
      'old-name-1.5-2027-08-06',
      'old-name-9007199254740992-2027-08-06',
      'old-name-1-2027-02-30',
      'old-name-1-2027-13-01',
      'old-name-1-2027-8-6',
      'old/name-1-2027-08-06',
      'old-name-999-2027-08-06'
    ]) {
      expect(resolveConcertSlug([concert], invalid)).toBe(undefined);
    }
    expect(resolveConcertSlug([], concert.slug)).toBe(undefined);
    rows = [
      row(0, '', null),
      row(-1, '', null),
      row(1.5, '', null),
      row('1', '', null),
      row(Number.MAX_SAFE_INTEGER + 1, '', null)
    ];
    expect((await getConcerts()).concerts.length).toBe(0);

    const repeated = [
      concert,
      { ...concert, slug: 'maybebop-2-2027-08-06' },
      {
        ...concert,
        slug: 'maybebop-3-2027-08-07',
        date: {
          ...concert.date,
          display: '7. August 2027 • 19:30 Uhr',
          iso: '2027-08-07T17:30:00Z'
        }
      }
    ];
    for (const field of ['title', 'description']) {
      expect(new Set(repeated.map((item) => getConcertMetadata(item, repeated)[field])).size).toBe(
        3
      );
      expect(repeated.map((item) => getConcertMetadata(item, repeated)[field])).toStrictEqual(
        repeated.map((item) => getConcertMetadata(item, [...repeated].reverse())[field])
      );
    }
    expect(getConcertMetadata(concert).title).not.toBe(
      getConcertMetadata({ ...concert, location: 'Nikolaikirche' }).title
    );

    // Never graft Petruskirche's CT address onto an explicitly different venue.
    rows = [
      row(2, '---Ort\nNikolaikirche', address),
      row(3, '', address),
      row(4, '---Ort\nNikolaikirche', { street: 'Weimarer Straße 1', city: 'Kiel' })
    ];
    const { concerts: venues } = await getConcerts();
    expect(venues[0].address).toBe(undefined);
    expect(getConcertEvent(venues[0], site).location.address).toBe(undefined);
    expect(getConcertLocationHref(venues[0])).toMatch(/query=Nikolaikirche$/);
    expect(venues[1].location).toBe('Petruskirche Kiel');
    expect(venues[1].address).toStrictEqual(concert.address);
    expect(venues[2].address).toBe(undefined);
    rows = [
      row(5, '', {
        name: 'Nikolaikirche',
        street: 'Alter Markt',
        city: 'Kiel'
      })
    ];
    const alternate = (await getConcerts()).concerts[0];
    expect(alternate.location).toBe('Nikolaikirche');
    expect(getConcertLocationHref(alternate)).toMatch(
      /query=Nikolaikirche%2C%20Alter%20Markt%2C%20Kiel$/
    );
    expect(getConcertEvent(alternate, site).location.address.streetAddress).toBe('Alter Markt');
    rows = [row(6, '', { name: 'Petruskirche', street: 'Dorfstraße 42', zip: '12345' })];
    const [ambiguousVenue] = (await getConcerts()).concerts;
    expect(ambiguousVenue.location).toBe('Petruskirche');
    expect(ambiguousVenue.address.street).toBe('Dorfstraße 42');
    expect(getConcertLocationHref(ambiguousVenue)).toMatch(
      /query=Petruskirche%2C%20Dorfstra%C3%9Fe%2042%2C%2012345$/
    );

    rows = [
      row(
        49975,
        '---Kurzbeschreibung\n[Kurzer Vorschautext für die Konzertübersicht]\n---Program\n[Ausführliche Beschreibung des Konzerts und des Programms.\nMehrere Absätze sind möglich.]\n---Mitwirkende\n[Namen des Ensembles oder der Mitwirkenden]\n---Einlass\n[HH:MM Uhr]\n---Veranstalter\n[Veranstalter]\n---Ort\n[Ort]',
        null
      )
    ];
    const template = (await getConcerts()).concerts[0];
    for (const field of [
      'shortDescription',
      'programme',
      'performers',
      'admission',
      'organizer',
      'address'
    ])
      expect(template[field]).toBe(undefined);
    const sparse = getConcertEvent({ ...template, image: undefined, ticketUrl: undefined }, site);
    for (const field of ['description', 'performer', 'organizer', 'image', 'offers'])
      expect(sparse[field]).toBe(undefined);
    expect(template.location).toBe('Petruskirche Kiel');
    expect(sparse.location.name).toBe('Petruskirche Kiel');
    expect(getConcertLocationHref(template)).toBe('/besuch-planen/#anfahrt');
    expect(getConcertMetadata(template).description).not.toMatch(/noch nicht angegeben/i);
    expect(JSON.stringify(sparse)).not.toMatch(/HH:MM|Vorschautext/);
    expect(
      getConcertEvent(
        { ...concert, performers: 'Solistin – Sopran', organizer: 'Unbestätigt' },
        site
      ).performer
    ).toBe(undefined);
    expect(getConcertEvent({ ...concert, organizer: 'Unbestätigt' }, site).organizer).toBe(
      undefined
    );

    for (const invalid of [
      '2027-02-30',
      '2027-02-30T12:00:00Z',
      '2027-08-06T24:00:00Z',
      '2027-08-06T12:60:00Z',
      '2027-08-06T12:00:60Z',
      '2027-08-06T12:00:00+25:00',
      '2027-08-06T12:00:00',
      '08/06/2027',
      'invalid',
      null,
      123
    ])
      expect(eventDate(invalid)).toBe(undefined);
    expect(eventDate('2028-02-29')).toBe('2028-02-29');
    expect(eventDate('2027-08-06T19:30+02:00')).toBe('2027-08-06T19:30+02:00');
    expect(eventDate('2027-08-06T23:30:00Z', true)).toBe('2027-08-07');
    rows = [
      row(6, '', null, '2027-08-06', '2027-08-06', true),
      row(7, '', null, '2027-08-06T22:30:00Z', '2027-08-07T22:30:00Z', true),
      row(8, '', null, '2027-02-30'),
      row(9, '', null, '2027-08-06T17:30:00Z', '2027-08-06T16:00:00Z')
    ];
    const dates = (await getConcerts()).concerts;
    expect(dates.length).toBe(3);
    expect(dates[0].date.timeKnown).toBe(false);
    rows = [
      row(
        10,
        123,
        { name: 'Petruskirche Kiel', street: 123, zip: '[PLZ]', city: 'Kiel' },
        '2027-08-06',
        '2027-08-07'
      )
    ];
    const unknownTime = (await getConcerts()).concerts[0];
    expect(unknownTime.date.timeKnown).toBe(false);
    expect(unknownTime.durationMinutes).toBe(undefined);
    expect(unknownTime.shortDescription).toBe(undefined);
    expect(unknownTime.address).toStrictEqual({ street: undefined, zip: undefined, city: 'Kiel' });
    expect(getConcertEvent(unknownTime, site).endDate).toBe('2027-08-07');
    expect(getConcertEvent(dates[0], site).startDate).toBe('2027-08-06');
    expect(getConcertEvent(dates[0], site).endDate).toBe('2027-08-06');
    expect(getConcertState(dates[0], new Date('2027-08-06T20:00:00Z'))).toBe(
      'upcoming-with-ticket'
    );
    expect(getConcertState(dates[0], new Date('2027-08-06T22:00:00Z'))).toBe('past');
    expect(getConcertState(dates[2], new Date('2027-08-08T20:00:00Z'))).toBe(
      'upcoming-with-ticket'
    );
    expect(getConcertState(dates[2], new Date('2027-08-08T22:00:00Z'))).toBe('past');
    expect(dates[1].endIso).toBe(undefined);
    expect(getConcertEvent(dates[2], site).startDate).toBe('2027-08-07');
    expect(getConcertEvent(dates[2], site).endDate).toBe('2027-08-08');
    expect(getConcertEvent({ ...concert, date: { ...concert.date, iso: 'invalid' } }, site)).toBe(
      undefined
    );
    expect(getConcertEvent({ ...concert, endIso: '2027-08-05T00:00:00Z' }, site).endDate).toBe(
      undefined
    );

    for (const invalid of [
      'javascript:alert(1)',
      'data:text/html,evil',
      'https://user:pass@example.org/',
      'https://example.org/\npath',
      'https://example.org/[URL]',
      'http://',
      '',
      {},
      12
    ]) {
      const unsafe = getConcertEvent(
        { ...concert, image: invalid, ticketUrl: invalid, detailsHref: invalid },
        site
      );
      expect(unsafe.image).toBe(undefined);
      expect(unsafe.offers).toBe(undefined);
      expect(unsafe.url).toBe(undefined);
    }
    expect(getConcertEvent({ ...concert, image: 'http://example.org/image.jpg' }, site).image).toBe(
      undefined
    );
    const injection = '</script><script>alert("x")</script>\u2028\u2029End';
    const injected = getConcertEvent(
      {
        ...concert,
        title: injection,
        shortDescription: injection,
        location: injection,
        performers: 'Person: </script><script>alert("x")</script>'
      },
      site
    );
    const serialized = serializeEvent(injected);
    expect(serialized).not.toMatch(/<\/script|<script|\u2028|\u2029/);
    expect(JSON.parse(serialized).name).toBe(injection);
    expect(JSON.parse(serialized).performer[0].name).toBe('</script><script>alert("x")</script>');
    expect(serializeEvent(undefined)).toBeUndefined();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Programmsitemap, Pagination und Fehlerantworten', async () => {
  const site = new URL('https://petruskirche.events/');
  const preview = new URL('https://version-web-konzerte.example.workers.dev/');
  const paths = ['/', '/kontakt/', '/programm/', '/programm/archiv/'];
  const originalFetch = globalThis.fetch;
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  const originalConsoleError = console.error;
  let rows = Array.from({ length: 40 }, (_, index) => ({
    appointment: {
      base: {
        id: index + 1,
        title: `Konzert ${index}`,
        isInternal: false,
        image: { imageUrl: 'https://example.org/poster.jpg' }
      },
      calculated: { startDate: index < 20 ? '2027-08-06T17:30:00Z' : '2020-08-06T17:30:00Z' }
    }
  }));
  for (const [id, isInternal] of [
    [900, true],
    [901, undefined]
  ]) {
    rows.push({
      appointment: {
        base: { id, title: 'Interner Bürotermin', isInternal },
        calculated: { startDate: '2027-08-06T17:30:00Z' }
      }
    });
  }
  let calls = 0;
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: undefined });
  globalThis.fetch = async (url) => {
    expect(String(url)).toMatch(/\/api\/calendars\/3\/appointments\?/);
    calls++;
    return Response.json({ data: rows });
  };
  try {
    const result = await getConcerts();
    expect(calls, 'No sitemap image probes').toBe(1);
    const now = new Date('2026-01-01T00:00:00Z');
    const response = getSitemapResponse(site, result, paths, now);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0');
    expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBe(
      'public, max-age=300, stale-if-error=86400'
    );
    const xml = await response.text();
    expect(result.concerts).toHaveLength(40);
    expect(xml).not.toContain('interner-burotermin');
    const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    expect(new Set(locations).size).toBe(locations.length);
    expect(locations.every((url) => new URL(url).origin === site.origin)).toBeTruthy();
    for (const concert of result.concerts)
      expect(locations.includes(getCanonicalUrl(site, concert.detailsHref))).toBeTruthy();
    expect(locations.includes(`${site}programm/?page=2`)).toBeTruthy();
    expect(locations.includes(`${site}programm/archiv/?page=2`)).toBeTruthy();
    expect(
      !locations.some((url) => /workers\.dev|raum-anfragen|\[slug\]|\/api\//.test(url))
    ).toBeTruthy();
    const duplicate = getSitemapResponse(
      site,
      { ...result, concerts: [...result.concerts, result.concerts[0]] },
      [...paths, paths[0]],
      now
    );
    expect(await duplicate.text()).toBe(xml);
    const escaped = await getSitemapResponse(site, { concerts: [], error: false }, [
      '/a/?x=1&y=2'
    ]).text();
    expect(escaped).toMatch(/x=1&amp;y=2/);

    const { programmeConcerts, archiveConcerts } = splitConcerts(result.concerts, now);
    for (const path of ['/programm/', '/programm/archiv/']) {
      const concerts = path === '/programm/' ? programmeConcerts : archiveConcerts;
      const seoFor = (query) => getProgrammeResults(concerts, site, new URL(path + query, preview));
      const unfiltered = seoFor('');
      expect(unfiltered.matchCount).toBe(concerts.length);
      expect(unfiltered.hasResultView).toBe(false);
      expect(unfiltered.rangeError).toBe(undefined);
      expect(unfiltered.emptyMessage).toBe(undefined);
      expect(unfiltered.noindex).toBe(false);
      expect(seoFor('?page=2').canonicalUrl).toBe(`${site.origin}${path}?page=2`);
      expect(seoFor('?page=2').noindex).toBe(false);
      expect(seoFor('?page=2').pageConcerts).toStrictEqual(concerts.slice(18));
      expect(seoFor('?page=2').hasResultView).toBe(true);
      expect(seoFor('?page=999').canonicalUrl).toBe(`${site.origin}${path}?page=2`);
      expect(seoFor('?page=999').noindex).toBe(true);
      for (const query of [
        '?page=bad',
        '?page=0',
        '?page=-1',
        '?page=1.5',
        '?page=',
        '?page=9007199254740992'
      ]) {
        expect(seoFor(query).canonicalUrl).toBe(`${site.origin}${path}`);
        expect(seoFor(query).noindex).toBe(true);
        expect(seoFor(query).hasResultView).toBe(false);
      }
      const legacySeason = seoFor('?season=2027%2F28&page=2');
      expect(legacySeason.canonicalUrl).toBe(`${site.origin}${path}?page=2`);
      expect(legacySeason.noindex).toBe(true);
      expect(legacySeason.pageConcerts).toStrictEqual(seoFor('?page=2').pageConcerts);
      expect(seoFor('?page=1').canonicalUrl).toBe(`${site.origin}${path}`);
      expect(seoFor('?page=1').noindex).toBe(false);
      expect(seoFor('?page=2&utm_source=test').canonicalUrl).toBe(`${site.origin}${path}?page=2`);
      expect(seoFor('?page=2&page=1').noindex).toBe(true);
      expect(seoFor('?q=Konzert&page=2').canonicalUrl).toBe(
        `${site.origin}${path}?q=Konzert&page=2`
      );
      for (const query of [
        '?q=Konzert',
        '?season=2027%2F28',
        '?from=2027-08-01',
        '?to=bad',
        '?q=',
        '?from=2028-01-01&to=2027-01-01'
      ]) {
        expect(seoFor(query).noindex).toBe(true);
      }
      for (const query of [
        '?q=',
        '?q=%20%20',
        '?season=2027%2F28',
        '?to=bad',
        '?from=2027-02-30'
      ]) {
        const ignored = seoFor(query);
        expect(ignored.filters).toStrictEqual({ search: '', from: '', to: '' });
        expect(ignored.matchCount).toBe(concerts.length);
        expect(ignored.hasResultView).toBe(false);
        expect(ignored.noindex, 'Raw filter keys still prevent indexing').toBe(true);
      }
      const noMatch = seoFor('?q=no-match&page=2');
      expect(noMatch.canonicalUrl).toBe(`${site.origin}${path}?q=no-match`);
      expect(noMatch.noindex).toBe(true);
      expect(noMatch.matchCount).toBe(0);
      expect(noMatch.pageConcerts).toStrictEqual([]);
      expect(noMatch.page).toBe(1);
      expect(noMatch.pageCount).toBe(1);
      expect(noMatch.hasResultView).toBe(true);
      expect(noMatch.rangeError).toBe(undefined);
      expect(noMatch.emptyMessage).toBeTruthy();
    }

    rows.push({
      appointment: {
        base: { id: 100, title: 'Neues Konzert', isInternal: false },
        calculated: { startDate: '2028-08-06T17:30:00Z' }
      }
    });
    const updated = await getConcerts();
    expect(calls).toBe(2);
    expect(await getSitemapResponse(site, updated, paths, now).text()).toMatch(
      /neues-konzert-100-2028-08-06/
    );
    globalThis.fetch = async () => new Response(null, { status: 503 });
    console.error = () => {};
    const failed = getSitemapResponse(site, await getConcerts(), paths, now);
    expect(failed.status).toBe(503);
    expect(failed.headers.get('Cache-Control')).toBe('no-store');
    expect(failed.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
    expect(failed.headers.get('Retry-After')).toBe('300');
    expect(!(await failed.text()).includes('<urlset')).toBeTruthy();
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
    else delete globalThis.caches;
  }
});
