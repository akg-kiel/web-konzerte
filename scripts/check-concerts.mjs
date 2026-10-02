import assert from 'node:assert/strict';

import { resolveConcertImage } from '../src/data/concert-images.ts';
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
let imageAspectRatio;
let imageWidth;
let imageHeight;
let focusX = 0.25;
let focusY = 0.75;
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
                imageMetadata: {
                  aspectRatio: imageAspectRatio,
                  width: imageWidth,
                  height: imageHeight
                },
                imageOption: { focus: { x: focusX, y: focusY } }
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
  assert.equal(result.concerts[0].imageAspectRatio, undefined);
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
  cachedResponse = undefined;
  imageUrl = 'https://akg-kiel.church.tools/images/30637/hash?foo=bar&w=50';
  imageAspectRatio = 0.7085;
  const imageConcert = (await getConcerts()).concerts[0];
  assert.equal(
    imageConcert.image,
    'https://akg-kiel.church.tools/images/30637/hash?foo=bar&w=1200&fit=max&h=0'
  );
  assert.equal(imageConcert.imageAspectRatio, 0.7085);
  assert.equal(imageConcert.imagePosition, '25% 100%');
  cachedResponse = undefined;
  focusY = 0.20299;
  assert.equal((await getConcerts()).concerts[0].imagePosition, '25% 0%');
  cachedResponse = undefined;
  focusY = 0.35;
  assert.equal(
    Math.round(Number.parseFloat((await getConcerts()).concerts[0].imagePosition.split(' ')[1])),
    18
  );
  cachedResponse = undefined;
  focusY = 0.75;
  imageAspectRatio = 1.5;
  assert.equal((await getConcerts()).concerts[0].imagePosition, '0% 75%');

  for (const ratio of [undefined, 0.7085, 1.5]) {
    imageAspectRatio = ratio;
    for (const focus of ['Infinity', '-Infinity', 'NaN', 'invalid', '', ' ', undefined]) {
      cachedResponse = undefined;
      focusX = focus;
      focusY = focus;
      const concert = (await getConcerts()).concerts[0];
      assert.equal(concert.imagePosition, '50% 50%');
      assert.deepEqual(concert.imageFocus, { x: 0.5, y: 0.5 });
    }
    for (const [x, y, expected] of [
      [-10, 10, '0% 100%'],
      ['10', '-10', '100% 0%']
    ]) {
      cachedResponse = undefined;
      focusX = x;
      focusY = y;
      assert.equal((await getConcerts()).concerts[0].imagePosition, expected);
    }
  }
  focusX = 0.25;
  focusY = 0.35;
  imageWidth = 1451;
  imageHeight = 2048;
  for (const ratio of [undefined, 0, -1, 0.2, 4.1, 'invalid', '0.7085']) {
    cachedResponse = undefined;
    imageAspectRatio = ratio;
    const concert = (await getConcerts()).concerts[0];
    assert.equal(concert.imageAspectRatio, 1451 / 2048);
    assert.equal(Math.round(Number.parseFloat(concert.imagePosition.split(' ')[1])), 18);
    globalThis.fetch = async () => {
      throw new Error('Valid intrinsic dimensions must not trigger image inference');
    };
    assert.equal(await resolveConcertImage(concert), concert);
    globalThis.fetch = calendarFetch;
  }

  imageAspectRatio = undefined;
  for (const [width, height] of [
    [0, 2048],
    [-1, 2048],
    [1451, 0],
    [1451, -1],
    ['1451', 2048],
    [1451, '2048'],
    [Infinity, 2048],
    [1451.5, 2048],
    [1e-300, 2048],
    [1451, 1e-300],
    [1e100, 2048],
    [1451, NaN],
    [undefined, undefined]
  ]) {
    cachedResponse = undefined;
    imageWidth = width;
    imageHeight = height;
    assert.equal((await getConcerts()).concerts[0].imageAspectRatio, undefined);
  }

  // A PNG's initial IHDR bytes are sufficient for Astro's streaming dimension probe.
  const portraitHeader = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000002bc000003e80806000000',
    'hex'
  );
  let posterBytes = portraitHeader;
  let imageFetchCalls = 0;
  const imageFetch = async (request, options) => {
    imageFetchCalls += 1;
    assert.equal(request.url, imageConcert.image);
    assert.equal(options.redirect, 'manual');
    const response = new Response(posterBytes);
    Object.defineProperty(response, 'url', { value: request.url });
    return response;
  };
  imageWidth = undefined;
  imageHeight = undefined;
  for (const ratio of [undefined, 0, -1, 0.2, 4.1, 'invalid']) {
    cachedResponse = undefined;
    imageAspectRatio = ratio;
    const unresolved = (await getConcerts()).concerts[0];
    assert.equal(unresolved.imageAspectRatio, undefined);
    assert.equal(unresolved.imagePosition, '25% 35%');
    globalThis.fetch = imageFetch;
    const resolved = await resolveConcertImage(unresolved);
    assert.equal(resolved.image, imageConcert.image);
    assert.equal(resolved.imageAspectRatio, 0.7);
    assert.equal(Math.round(Number.parseFloat(resolved.imagePosition.split(' ')[1])), 18);
    assert.equal(unresolved.imageAspectRatio, undefined);
    assert.equal(await resolveConcertImage(resolved), resolved);
    globalThis.fetch = calendarFetch;
  }
  assert.equal(imageFetchCalls, 6);

  cachedResponse = undefined;
  const unresolved = (await getConcerts()).concerts[0];
  for (const invalidBytes of [Buffer.from('not an image'), Buffer.alloc(24)]) {
    posterBytes = invalidBytes;
    globalThis.fetch = imageFetch;
    const failed = await resolveConcertImage(unresolved);
    assert.equal(failed.image, undefined);
    assert.equal(failed.imagePosition, '50% 50%');
    assert.equal(failed.title, unresolved.title);
  }
  for (const dimensionOffset of [16, 20]) {
    posterBytes = Buffer.from(portraitHeader);
    posterBytes.writeUInt32BE(0, dimensionOffset);
    globalThis.fetch = imageFetch;
    assert.equal((await resolveConcertImage(unresolved)).image, undefined);
  }
  for (const failure of [
    async () => {
      throw new Error('Offline');
    },
    async () => new Response(null, { status: 503 }),
    async () =>
      new Response(null, { status: 302, headers: { Location: 'https://example.org/poster.png' } })
  ]) {
    globalThis.fetch = failure;
    assert.equal((await resolveConcertImage(unresolved)).image, undefined);
  }

  globalThis.fetch = calendarFetch;
  for (const foreignImage of [
    'https://example.org/concert.jpg?fit=crop&w=50',
    'https://other.church.tools/images/30637/hash?w=50',
    'https://akg-kiel.church.tools.example.org/images/30637/hash?w=50'
  ]) {
    cachedResponse = undefined;
    imageUrl = foreignImage;
    const foreignConcert = (await getConcerts()).concerts[0];
    assert.equal(foreignConcert.image, foreignImage);
    globalThis.fetch = async () => {
      throw new Error('Foreign images must not trigger inference');
    };
    assert.equal(await resolveConcertImage(foreignConcert), foreignConcert);
    globalThis.fetch = calendarFetch;
  }
  for (const unsafeImage of [
    'http://example.org/concert.jpg',
    'javascript:alert(1)',
    'data:image/png;base64,AA==',
    'invalid'
  ]) {
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
