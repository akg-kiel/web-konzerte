import assert from 'node:assert/strict';

import {
  CONCERTS_PER_PAGE,
  cacheProgramme,
  filterConcerts,
  getConcertFilters,
  getConcertSeason,
  getConcertState,
  getConcerts,
  hasInvalidConcertDateRange,
  paginateConcerts,
  splitConcerts
} from '../src/data/concerts.ts';

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');
let cachedResponse;
let fetchCalls = 0;
Object.defineProperty(globalThis, 'caches', {
  configurable: true,
  value: {
    default: {
      match: async () => cachedResponse?.clone(),
      put: async (_key, response) => {
        cachedResponse = response.clone();
      }
    }
  }
});
let startDate = '2027-08-06T17:30:00Z';
let endDate = 'invalid';
let allDay = false;
let imageUrl = 'https://example.org/concert.jpg';
let description =
  'Programm: Bach und Brahms\nMitwirkende: Testchor\nPreis: Eintritt frei\nAnsprechpartner: Nicht veröffentlichen';
const calendarFetch = async () => {
  fetchCalls += 1;
  return new Response(
    JSON.stringify({
      data: [
        {
          appointment: {
            base: {
              id: 42,
              title: 'Testkonzert',
              description,
              allDay,
              image: {
                imageUrl,
                imageOption: { focus: { x: 0.25, y: 0.75 } }
              },
              link: 'javascript:alert(1)',
              address: {}
            },
            calculated: { startDate, endDate }
          }
        }
      ]
    }),
    { headers: { 'content-type': 'application/json' } }
  );
};

globalThis.fetch = calendarFetch;

try {
  const result = await getConcerts();
  assert.equal(result.error, false);
  assert.equal(result.concerts.length, 1);
  assert.equal(result.concerts[0].programme, 'Bach und Brahms');
  assert.equal(result.concerts[0].performers, 'Testchor');
  assert.equal('price' in result.concerts[0], false);
  assert.equal(result.concerts[0].ticketUrl, undefined);
  assert.equal(result.concerts[0].location, undefined);
  assert.equal(result.concerts[0].durationMinutes, undefined);
  assert.equal(result.concerts[0].endIso, undefined);
  assert.equal(result.concerts[0].imagePosition, '25% 75%');
  assert.equal(result.concerts[0].image, imageUrl);
  assert.match(result.concerts[0].slug, /-42-2027-08-06$/);
  await getConcerts();
  assert.equal(fetchCalls, 1);

  const staleHeaders = new Headers(cachedResponse.headers);
  staleHeaders.set('x-akg-cached-at', String(Date.now() - 301_000));
  cachedResponse = new Response(await cachedResponse.text(), { headers: staleHeaders });
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(null, { status: 503 });
  };
  assert.equal((await getConcerts()).error, false);
  assert.equal(fetchCalls, 2);

  console.error = () => {};
  assert.equal((await getConcerts({ CHURCHTOOLS_BASE_URL: 'http://example.org' })).error, true);
  assert.equal((await getConcerts({ CHURCHTOOLS_CALENDAR_IDS: ' ' })).error, true);
  assert.equal(fetchCalls, 2);

  const response = { headers: new Headers() };
  cacheProgramme(response);
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=0');
  assert.equal(
    response.headers.get('Cloudflare-CDN-Cache-Control'),
    'public, max-age=300, stale-if-error=86400'
  );
  assert.equal(splitConcerts(result.concerts, new Date('2027-08-07')).archiveConcerts.length, 1);
  assert.equal(getConcertState(result.concerts[0], new Date(result.concerts[0].date.iso)), 'past');
  assert.equal(getConcertState(result.concerts[0], new Date('2027-08-07')), 'past');
  assert.equal(
    getConcertState(result.concerts[0], new Date('2027-08-01')),
    'upcoming-without-ticket'
  );
  assert.equal(
    getConcertState(
      { ...result.concerts[0], ticketUrl: 'https://example.org/tickets' },
      new Date('2027-08-01')
    ),
    'upcoming-with-ticket'
  );

  const concerts = [
    result.concerts[0],
    {
      ...result.concerts[0],
      slug: 'mozart-2028',
      title: 'Mozart-Abend',
      performers: 'Orchester Kiel',
      date: { ...result.concerts[0].date, iso: '2028-02-10T18:00:00Z' }
    },
    {
      ...result.concerts[0],
      slug: 'chor-2028',
      performers: 'Testchor',
      date: { ...result.concerts[0].date, iso: '2028-08-10T18:00:00Z' }
    }
  ];
  const midnightConcert = {
    ...result.concerts[0],
    date: { ...result.concerts[0].date, iso: '2027-06-30T22:30:00Z' }
  };
  assert.equal(getConcertSeason(midnightConcert), '2027/28');
  assert.equal(
    filterConcerts([midnightConcert], {
      search: '',
      season: '',
      from: '2027-07-01',
      to: '2027-07-01'
    }).length,
    1
  );
  assert.deepEqual(
    filterConcerts(concerts, { search: '', season: '2027/28', from: '', to: '' }).map(
      ({ slug }) => slug
    ),
    [result.concerts[0].slug, 'mozart-2028']
  );
  assert.deepEqual(
    filterConcerts(
      concerts,
      getConcertFilters(
        new URLSearchParams({
          q: 'TESTCHOR',
          season: '2027/28',
          from: '2027-08-01',
          to: '2027-12-31'
        })
      )
    ).map(({ slug }) => slug),
    [result.concerts[0].slug]
  );

  assert.equal(
    hasInvalidConcertDateRange({ search: '', season: '', from: '2028-02-01', to: '2028-01-01' }),
    true
  );
  assert.equal(
    hasInvalidConcertDateRange({ search: '', season: '', from: '2028-01-01', to: '2028-02-01' }),
    false
  );

  const manyConcerts = Array.from({ length: CONCERTS_PER_PAGE * 2 + 1 }, (_, index) => ({
    ...result.concerts[0],
    slug: `concert-${index}`
  }));
  const secondPage = paginateConcerts(manyConcerts, new URLSearchParams({ page: '2', q: 'chor' }));
  assert.equal(secondPage.page, 2);
  assert.equal(secondPage.pageCount, 3);
  assert.equal(secondPage.pageConcerts.length, CONCERTS_PER_PAGE);
  assert.equal(secondPage.pageConcerts[0].slug, `concert-${CONCERTS_PER_PAGE}`);
  const lastPage = paginateConcerts(manyConcerts, new URLSearchParams({ page: '999' }));
  assert.equal(lastPage.page, 3);
  assert.equal(lastPage.pageConcerts.length, 1);

  globalThis.fetch = calendarFetch;
  for (const unsafeImage of ['http://example.org/concert.jpg', 'javascript:alert(1)', 'invalid']) {
    cachedResponse = undefined;
    imageUrl = unsafeImage;
    assert.equal((await getConcerts()).concerts[0].image, undefined);
  }
  imageUrl = 'https://example.org/concert.jpg';
  cachedResponse = undefined;
  description =
    '---Kurzbeschreibung\nEin Abend für alle.\n---Langbeschreibung\nErster Absatz.\n\nZweiter Absatz.\n---Program\nHaydn';
  const described = (await getConcerts()).concerts[0];
  assert.equal(described.shortDescription, 'Ein Abend für alle.');
  assert.equal(described.longDescription, 'Erster Absatz.\n\nZweiter Absatz.');
  assert.equal(described.programme, 'Haydn');
  for (const search of ['Abend', 'Zweiter']) {
    assert.equal(filterConcerts([described], { search, season: '', from: '', to: '' }).length, 1);
  }
  for (const heading of ['---Program', '---Programm']) {
    cachedResponse = undefined;
    description = `Interne Notiz\r\n${heading}\r\nHaydn\r\n\r\nDvořák\r\n---Untertitel\r\nMusik, die Brücken baut\r\n---Intern\r\nNicht veröffentlichen`;
    const {
      concerts: [concert]
    } = await getConcerts();
    assert.equal(concert.programme, 'Haydn\n\nDvořák');
    assert.equal(concert.subtitle, 'Musik, die Brücken baut');
    assert.equal(JSON.stringify(concert).includes('Nicht veröffentlichen'), false);
    assert.equal(
      filterConcerts([concert], { search: 'Brücken', season: '', from: '', to: '' }).length,
      1
    );
  }
  cachedResponse = undefined;
  description = '---Program\n\n---Untertitel\n---Kurzbeschreibung\n---Langbeschreibung\n';
  const empty = await getConcerts();
  assert.equal(empty.concerts[0].programme, undefined);
  assert.equal(empty.concerts[0].subtitle, undefined);
  assert.equal(empty.concerts[0].shortDescription, undefined);
  assert.equal(empty.concerts[0].longDescription, undefined);
  assert.equal(empty.concerts[0].accessibility, undefined);
  assert.equal(empty.concerts[0].admission, undefined);
  assert.equal(empty.concerts[0].intermission, undefined);

  description = '---Einlass\n19:00 Uhr\n---Ort\nNikolaikirche\n---Pause\nMit Pause';
  endDate = '2027-08-06T19:00:00Z';
  cachedResponse = undefined;
  const details = (await getConcerts()).concerts[0];
  assert.equal(details.admission, '19:00 Uhr');
  assert.equal(details.location, 'Nikolaikirche');
  assert.equal(details.durationMinutes, 90);
  assert.equal(details.intermission, 'Mit Pause');

  for (const [value, expected] of [
    ['true', 'Mit Pause'],
    ['false', 'Ohne Pause'],
    ['TRUE', 'Mit Pause'],
    ['False', 'Ohne Pause'],
    ['ja', 'Mit Pause'],
    ['nein', 'Ohne Pause'],
    ['Ohne Pause', 'Ohne Pause'],
    ['', undefined],
    ['unbekannt', undefined]
  ]) {
    cachedResponse = undefined;
    description = `---Pause\n${value}`;
    assert.equal((await getConcerts()).concerts[0].intermission, expected);
  }
  for (const end of [undefined, 'invalid', startDate, '2027-08-06T16:00:00Z']) {
    cachedResponse = undefined;
    endDate = end;
    assert.equal((await getConcerts()).concerts[0].durationMinutes, undefined);
  }
  cachedResponse = undefined;
  startDate = '2027-08-06T23:30:00Z';
  endDate = '2027-08-07T01:00:00Z';
  assert.equal((await getConcerts()).concerts[0].durationMinutes, 90);
  cachedResponse = undefined;
  allDay = true;
  assert.equal((await getConcerts()).concerts[0].durationMinutes, undefined);
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
  else delete globalThis.caches;
}
