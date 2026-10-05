import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getConcerts, getConcertState, resolveConcertSlug } from '../src/data/concerts.ts';
import {
  concertAddressLabel,
  eventDate,
  factualText,
  getConcertEvent,
  getConcertLocationHref,
  getConcertMetadata,
  safeUrl,
  serializeEvent
} from '../src/data/concert-seo.ts';

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
  assert.equal(error, false);
  assert.equal(concert.detailsHref, '/programm/maybebop-1-2027-08-06/');
  assert.equal(concert.location, 'Petruskirche Kiel');
  assert.deepEqual(concert.address, {
    street: address.street,
    zip: address.zip,
    city: address.city
  });
  assert.equal(concertAddressLabel(concert), 'Weimarer Straße 1, 24106 Kiel');
  assert.equal(getConcertLocationHref(concert), '/besuch-planen/#anfahrt');
  assert.match(
    getConcertLocationHref({ ...concert, location: 'Petruskirche', address: { city: 'Hamburg' } }),
    /query=Petruskirche%2C%20Hamburg$/
  );
  const metadata = getConcertMetadata(concert);
  assert.match(metadata.title, /MAYBEBOP am 6\. August 2027.*19:30 Uhr.*Petruskirche Kiel/);
  assert.match(metadata.description, /Ein Konzertabend\./);
  const event = getConcertEvent(concert, site);
  assert.deepEqual(JSON.parse(serializeEvent(event)), {
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
  assert.equal(getConcertEvent(concert, site, true).offers, undefined);

  assert.deepEqual(resolveConcertSlug([concert], concert.slug), { concert });
  const renamed = resolveConcertSlug([concert], 'old-name-1-2027-08-06');
  assert.equal(renamed.concert, concert);
  assert.equal(renamed.redirectTo, concert.detailsHref);
  assert.equal(
    resolveConcertSlug([concert], renamed.redirectTo.split('/')[2]).redirectTo,
    undefined
  );
  const rescheduled = {
    ...concert,
    slug: 'maybebop-1-2027-08-08',
    detailsHref: '/programm/maybebop-1-2027-08-08/'
  };
  assert.equal(resolveConcertSlug([rescheduled], concert.slug).redirectTo, rescheduled.detailsHref);
  const recurring = [concert, rescheduled];
  assert.equal(resolveConcertSlug(recurring, 'old-name-1-2027-08-08').concert, rescheduled);
  assert.equal(resolveConcertSlug(recurring, 'old-name-1-2027-08-09'), undefined);
  assert.equal(
    resolveConcertSlug(
      [concert, { ...concert, slug: 'other-name-1-2027-08-06' }],
      'old-name-1-2027-08-06'
    ),
    undefined
  );
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
    assert.equal(resolveConcertSlug([concert], invalid), undefined);
  }
  assert.equal(resolveConcertSlug([], concert.slug), undefined);
  rows = [
    row(0, '', null),
    row(-1, '', null),
    row(1.5, '', null),
    row('1', '', null),
    row(Number.MAX_SAFE_INTEGER + 1, '', null)
  ];
  assert.equal((await getConcerts()).concerts.length, 0);
  for (const field of ['price', 'priceCurrency', 'availability', 'validFrom'])
    assert.equal(field in event.offers, false);

  const repeated = [
    concert,
    { ...concert, slug: 'maybebop-2-2027-08-06' },
    {
      ...concert,
      slug: 'maybebop-3-2027-08-07',
      date: { ...concert.date, display: '7. August 2027 • 19:30 Uhr', iso: '2027-08-07T17:30:00Z' }
    }
  ];
  for (const field of ['title', 'description']) {
    assert.equal(
      new Set(repeated.map((item) => getConcertMetadata(item, repeated)[field])).size,
      3
    );
    assert.deepEqual(
      repeated.map((item) => getConcertMetadata(item, repeated)[field]),
      repeated.map((item) => getConcertMetadata(item, [...repeated].reverse())[field])
    );
  }
  assert.notEqual(
    getConcertMetadata(concert).title,
    getConcertMetadata({ ...concert, location: 'Nikolaikirche' }).title
  );

  // Never graft Petruskirche's CT address onto an explicitly different venue.
  rows = [
    row(2, '---Ort\nNikolaikirche', address),
    row(3, '', address),
    row(4, '---Ort\nNikolaikirche', { street: 'Weimarer Straße 1', city: 'Kiel' })
  ];
  const { concerts: venues } = await getConcerts();
  assert.equal(venues[0].address, undefined);
  assert.equal(getConcertEvent(venues[0], site).location.address, undefined);
  assert.match(getConcertLocationHref(venues[0]), /query=Nikolaikirche$/);
  assert.equal(venues[1].location, 'Petruskirche Kiel');
  assert.deepEqual(venues[1].address, concert.address);
  assert.equal(venues[2].address, undefined);
  rows = [
    row(5, '---Ort\nNikolaikirche', { name: 'Nikolaikirche', street: 'Alter Markt', city: 'Kiel' })
  ];
  const alternate = (await getConcerts()).concerts[0];
  assert.match(
    getConcertLocationHref(alternate),
    /query=Nikolaikirche%2C%20Alter%20Markt%2C%20Kiel$/
  );
  assert.equal(getConcertEvent(alternate, site).location.address.streetAddress, 'Alter Markt');

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
    'location',
    'address'
  ])
    assert.equal(template[field], undefined);
  const sparse = getConcertEvent({ ...template, image: undefined, ticketUrl: undefined }, site);
  for (const field of ['description', 'location', 'performer', 'organizer', 'image', 'offers'])
    assert.equal(sparse[field], undefined);
  assert.equal(getConcertLocationHref(template), undefined);
  assert.match(getConcertMetadata(template).description, /Veranstaltungsort noch nicht angegeben/);
  assert.doesNotMatch(JSON.stringify(sparse), /Petruskirche|HH:MM|Vorschautext/);
  assert.equal(
    getConcertEvent({ ...concert, performers: 'Solistin – Sopran', organizer: 'Unbestätigt' }, site)
      .performer,
    undefined
  );
  assert.equal(
    getConcertEvent({ ...concert, organizer: 'Unbestätigt' }, site).organizer,
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
    assert.equal(eventDate(invalid), undefined);
  assert.equal(eventDate('2028-02-29'), '2028-02-29');
  assert.equal(eventDate('2027-08-06T19:30+02:00'), '2027-08-06T19:30+02:00');
  assert.equal(eventDate('2027-08-06T23:30:00Z', true), '2027-08-07');
  rows = [
    row(6, '', null, '2027-08-06', '2027-08-06', true),
    row(7, '', null, '2027-08-06T22:30:00Z', '2027-08-07T22:30:00Z', true),
    row(8, '', null, '2027-02-30'),
    row(9, '', null, '2027-08-06T17:30:00Z', '2027-08-06T16:00:00Z')
  ];
  const dates = (await getConcerts()).concerts;
  assert.equal(dates.length, 3);
  assert.equal(dates[0].date.time, 'Termin folgt');
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
  assert.equal(unknownTime.date.time, 'Termin folgt');
  assert.equal(unknownTime.durationMinutes, undefined);
  assert.equal(unknownTime.shortDescription, undefined);
  assert.deepEqual(unknownTime.address, { street: undefined, zip: undefined, city: 'Kiel' });
  assert.equal(getConcertEvent(unknownTime, site).endDate, '2027-08-07');
  assert.equal(getConcertEvent(dates[0], site).startDate, '2027-08-06');
  assert.equal(getConcertEvent(dates[0], site).endDate, '2027-08-06');
  assert.equal(getConcertState(dates[0], new Date('2027-08-06T20:00:00Z')), 'upcoming-with-ticket');
  assert.equal(getConcertState(dates[0], new Date('2027-08-06T22:00:00Z')), 'past');
  assert.equal(getConcertState(dates[2], new Date('2027-08-08T20:00:00Z')), 'upcoming-with-ticket');
  assert.equal(getConcertState(dates[2], new Date('2027-08-08T22:00:00Z')), 'past');
  assert.equal(dates[1].endIso, undefined);
  assert.equal(getConcertEvent(dates[2], site).startDate, '2027-08-07');
  assert.equal(getConcertEvent(dates[2], site).endDate, '2027-08-08');
  assert.equal(
    getConcertEvent({ ...concert, date: { ...concert.date, iso: 'invalid' } }, site),
    undefined
  );
  assert.equal(
    getConcertEvent({ ...concert, endIso: '2027-08-05T00:00:00Z' }, site).endDate,
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
    assert.equal(safeUrl(invalid), undefined);
    const unsafe = getConcertEvent(
      { ...concert, image: invalid, ticketUrl: invalid, detailsHref: invalid },
      site
    );
    assert.equal(unsafe.image, undefined);
    assert.equal(unsafe.offers, undefined);
    assert.equal(unsafe.url, undefined);
  }
  assert.equal(
    getConcertEvent({ ...concert, image: 'http://example.org/image.jpg' }, site).image,
    undefined
  );
  assert.equal(factualText(123), undefined);
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
  assert.doesNotMatch(serialized, /<\/script|<script|\u2028|\u2029/);
  assert.equal(JSON.parse(serialized).name, injection);
  assert.equal(JSON.parse(serialized).performer[0].name, '</script><script>alert("x")</script>');
  assert.equal(serializeEvent(undefined), undefined);

  const page = await readFile(
    new URL('../src/pages/programm/[slug].astro', import.meta.url),
    'utf8'
  );
  assert.match(page, /getConcertMetadata\(concert, result\.concerts\)/);
  assert.match(page, /set:html=\{eventSchema\}/);
  assert.match(page, /href=\{locationHref\}/);
  assert.match(page, /href="\/besuch-planen\/#anfahrt"/);
  assert.match(page, /isPast \? '\/programm\/archiv\/' : '\/programm\/'/);
  assert.match(page, /href="\/programm\/"/);
  assert.match(page, /result\.error \? 503 : 404/);
  assert.match(page, /resolveConcertSlug\(result\.concerts, Astro\.params\.slug\)/);
  assert.match(page, /Astro\.redirect\(resolved\.redirectTo, 301\)/);
  assert.match(page, /href=\{posterUrl\}/);
  assert.match(page, /<h1 id="concert-title"/);
  assert.match(page, /canonicalUrl=\{canonicalUrl\}/);
  console.log('Concert SEO regressions passed (offline).');
} finally {
  globalThis.fetch = originalFetch;
}
