import { expect, test } from 'vite-plus/test';
import { baseService } from 'astro/assets';

import { getRuntimeImage, resolveConcertImage } from './images.server.ts';
import {
  getConcertState,
  getProgrammeExpiry,
  getProgrammeResults,
  splitConcerts
} from './concerts.ts';
import { getConcerts } from './churchtools.server.ts';

test('Konzertprogramm: Mapping, Filter, Bilder und Cache', async () => {
  const site = new URL('https://example.org/');
  const programmeFor = (concerts, params) =>
    getProgrammeResults(concerts, site, new URL(`/programm/?${new URLSearchParams(params)}`, site));

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
    expect(result.error).toBe(false);
    expect(result.concerts.length).toBe(1);
    expect(result.concerts[0].programme).toBe('Bach und Brahms');
    expect(result.concerts[0].performers).toBe('Testchor');
    expect('price' in result.concerts[0]).toBe(false);
    expect(result.concerts[0].ticketUrl).toBe(undefined);
    expect(result.concerts[0].location).toBe(undefined);
    expect(result.concerts[0].durationMinutes).toBe(undefined);
    expect(result.concerts[0].endIso).toBe(undefined);
    expect(result.concerts[0].imagePosition).toBe('25% 75%');
    expect(result.concerts[0].image).toBe(imageUrl);
    expect(result.concerts[0].imageAspectRatio).toBe(undefined);
    expect(result.concerts[0].slug).toMatch(/-42-2027-08-06$/);
    await getConcerts();
    expect(fetchCalls).toBe(1);

    const staleHeaders = new Headers(cachedResponse.headers);
    staleHeaders.set('x-akg-cached-at', String(Date.now() - 301_000));
    cachedResponse = new Response(await cachedResponse.text(), { headers: staleHeaders });
    globalThis.fetch = async () => {
      fetchCalls += 1;
      return new Response(null, { status: 503 });
    };
    expect((await getConcerts()).error).toBe(false);
    expect(fetchCalls).toBe(2);

    console.error = () => {};
    expect((await getConcerts({ CHURCHTOOLS_BASE_URL: 'http://example.org' })).error).toBe(true);
    expect((await getConcerts({ CHURCHTOOLS_CALENDAR_IDS: ' ' })).error).toBe(true);
    expect(fetchCalls).toBe(2);

    expect(splitConcerts(result.concerts, new Date('2027-08-07')).archiveConcerts.length).toBe(1);
    expect(getConcertState(result.concerts[0], new Date(result.concerts[0].date.iso))).toBe('past');
    expect(getConcertState(result.concerts[0], new Date('2027-08-01'))).toBe(
      'upcoming-without-ticket'
    );
    expect(
      getConcertState(
        { ...result.concerts[0], ticketUrl: 'https://example.org/tickets' },
        new Date('2027-08-01')
      )
    ).toBe('upcoming-with-ticket');

    const nearStart = new Date('2027-08-06T17:29:30Z');
    expect(getProgrammeExpiry(result.concerts, nearStart)).toBe(Date.parse('2027-08-06T17:30:00Z'));
    expect(getProgrammeExpiry([], nearStart)).toBe(nearStart.getTime() + 300_000);
    for (const [endIso, boundary] of [
      ['2027-03-27T23:00:00Z', '2027-03-28T22:00:00Z'],
      ['2027-10-30T22:00:00Z', '2027-10-31T23:00:00Z']
    ]) {
      const concert = {
        ...result.concerts[0],
        endIso,
        date: { ...result.concerts[0].date, timeKnown: false, time: 'Uhrzeit unbekannt' }
      };
      const before = new Date(Date.parse(boundary) - 1);
      expect(
        getProgrammeExpiry([concert], before),
        'Expire at the next Berlin civil day, including DST'
      ).toBe(Date.parse(boundary));
      const after = new Date(boundary);
      expect(getProgrammeExpiry([concert], after)).toBe(after.getTime() + 300_000);
    }
    expect(
      getProgrammeExpiry(
        [{ ...result.concerts[0], endIso: '2027-08-06T18:30:00Z' }],
        new Date('2027-08-06T18:29:59Z')
      ),
      'Known timed ends, rather than starts, invalidate the prepared views'
    ).toBe(Date.parse('2027-08-06T18:30:00Z'));

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
    expect(
      programmeFor([midnightConcert], { from: '2027-07-01', to: '2027-07-01' }).matchCount
    ).toBe(1);
    expect(
      programmeFor(concerts, {
        q: 'TESTCHOR',
        season: '2027/28',
        from: '2027-08-01',
        to: '2027-12-31'
      }).pageConcerts.map(({ slug }) => slug)
    ).toStrictEqual([result.concerts[0].slug]);

    const reversed = programmeFor(concerts, { from: '2028-02-01', to: '2028-01-01' });
    expect(reversed.rangeError).toBeTruthy();
    expect(reversed.matchCount).toBe(0);
    expect(reversed.pageConcerts).toStrictEqual([]);
    expect(reversed.hasResultView).toBe(true);
    expect(reversed.emptyMessage).toBeTruthy();
    expect(programmeFor(concerts, { from: '2028-01-01', to: '2028-02-01' }).rangeError).toBe(
      undefined
    );

    globalThis.fetch = calendarFetch;
    cachedResponse = undefined;
    imageUrl = 'https://akg-kiel.church.tools/images/30637/hash?foo=bar&w=50';
    imageAspectRatio = 0.7085;
    const imageConcert = (await getConcerts()).concerts[0];
    expect(imageConcert.image).toBe(
      'https://akg-kiel.church.tools/images/30637/hash?foo=bar&w=1200&fit=max&h=0'
    );
    expect(imageConcert.imageAspectRatio).toBe(0.7085);
    expect(imageConcert.imagePosition).toBe('25% 100%');
    cachedResponse = undefined;
    focusY = 0.20299;
    expect((await getConcerts()).concerts[0].imagePosition).toBe('25% 0%');
    cachedResponse = undefined;
    focusY = 0.35;
    expect(
      Math.round(Number.parseFloat((await getConcerts()).concerts[0].imagePosition.split(' ')[1]))
    ).toBe(18);
    cachedResponse = undefined;
    focusY = 0.75;
    imageAspectRatio = 1.5;
    expect((await getConcerts()).concerts[0].imagePosition).toBe('0% 75%');

    for (const ratio of [undefined, 0.7085, 1.5]) {
      imageAspectRatio = ratio;
      for (const focus of ['Infinity', '-Infinity', 'NaN', 'invalid', '', ' ', undefined]) {
        cachedResponse = undefined;
        focusX = focus;
        focusY = focus;
        const concert = (await getConcerts()).concerts[0];
        expect(concert.imagePosition).toBe('50% 50%');
        expect(concert.imageFocus).toStrictEqual({ x: 0.5, y: 0.5 });
      }
      for (const [x, y, expected] of [
        [-10, 10, '0% 100%'],
        ['10', '-10', '100% 0%']
      ]) {
        cachedResponse = undefined;
        focusX = x;
        focusY = y;
        expect((await getConcerts()).concerts[0].imagePosition).toBe(expected);
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
      expect(concert.imageAspectRatio).toBe(1451 / 2048);
      expect(Math.round(Number.parseFloat(concert.imagePosition.split(' ')[1]))).toBe(18);
      globalThis.fetch = async () => {
        throw new Error('Valid intrinsic dimensions must not trigger image inference');
      };
      expect(await resolveConcertImage(concert)).toBe(concert);
      globalThis.fetch = calendarFetch;
    }

    const originalAstroAsset = globalThis.astroAsset;
    try {
      globalThis.astroAsset = {
        imageService: {
          ...baseService,
          transform() {
            throw new Error('Posters must not be compiled');
          },
          getURL({ src, width, height }) {
            return `/_image/?href=${encodeURIComponent(typeof src === 'string' ? src : src.src)}&w=${width}&h=${height}`;
          }
        },
        addStaticImage() {
          throw new Error('Posters must not register build-time transforms');
        }
      };
      globalThis.fetch = async () => {
        throw new Error('Rendering a poster must not download it');
      };
      for (const src of [
        'https://akg-kiel.church.tools/images/missing-poster.jpg',
        { src: '/_astro/fallback.jpg', width: 1600, height: 1200, format: 'jpg' }
      ]) {
        const image = await getRuntimeImage(
          {
            src,
            alt: 'Concert poster',
            width: 960,
            height: 720,
            widths: [480, 720, 960],
            format: 'webp',
            quality: 80
          },
          {}
        );
        expect(image.src).toMatch(/^\/_image\//);
        expect(image.srcset.split(', ').length).toBe(3);
        for (const width of [480, 720, 960]) {
          expect(image.srcset.includes(`&w=${width}&h=${(width * 3) / 4} ${width}w`)).toBeTruthy();
        }
        expect(image.attributes.alt).toBe('Concert poster');
      }
    } finally {
      if (originalAstroAsset === undefined) delete globalThis.astroAsset;
      else globalThis.astroAsset = originalAstroAsset;
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
      expect((await getConcerts()).concerts[0].imageAspectRatio).toBe(undefined);
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
      expect(request.url).toBe(imageConcert.image);
      expect(options.redirect).toBe('manual');
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
      expect(unresolved.imageAspectRatio).toBe(undefined);
      expect(unresolved.imagePosition).toBe('25% 35%');
      globalThis.fetch = imageFetch;
      const resolved = await resolveConcertImage(unresolved);
      expect(resolved.image).toBe(imageConcert.image);
      expect(resolved.imageAspectRatio).toBe(0.7);
      expect(Math.round(Number.parseFloat(resolved.imagePosition.split(' ')[1]))).toBe(18);
      expect(unresolved.imageAspectRatio).toBe(undefined);
      expect(await resolveConcertImage(resolved)).toBe(resolved);
      globalThis.fetch = calendarFetch;
    }
    expect(imageFetchCalls).toBe(6);

    cachedResponse = undefined;
    const unresolved = (await getConcerts()).concerts[0];
    for (const invalidBytes of [Buffer.from('not an image'), Buffer.alloc(24)]) {
      posterBytes = invalidBytes;
      globalThis.fetch = imageFetch;
      const failed = await resolveConcertImage(unresolved);
      expect(failed.image).toBe(undefined);
      expect(failed.imagePosition).toBe('50% 50%');
      expect(failed.title).toBe(unresolved.title);
    }
    for (const dimensionOffset of [16, 20]) {
      posterBytes = Buffer.from(portraitHeader);
      posterBytes.writeUInt32BE(0, dimensionOffset);
      globalThis.fetch = imageFetch;
      expect((await resolveConcertImage(unresolved)).image).toBe(undefined);
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
      expect((await resolveConcertImage(unresolved)).image).toBe(undefined);
    }

    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    let deadlineCleared = false;
    try {
      globalThis.fetch = () => new Promise(() => {});
      globalThis.setTimeout = (callback, milliseconds) => {
        expect(milliseconds).toBe(3000);
        queueMicrotask(callback);
        return 42;
      };
      globalThis.clearTimeout = (deadline) => {
        expect(deadline).toBe(42);
        deadlineCleared = true;
      };
      const timedOut = await resolveConcertImage(unresolved);
      expect(timedOut.image).toBe(undefined);
      expect(timedOut.imagePosition).toBe('50% 50%');
      expect(timedOut.title).toBe(unresolved.title);
      expect(deadlineCleared).toBe(true);
    } finally {
      globalThis.setTimeout = originalSetTimeout;
      globalThis.clearTimeout = originalClearTimeout;
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
      expect(foreignConcert.image).toBe(foreignImage);
      globalThis.fetch = async () => {
        throw new Error('Foreign images must not trigger inference');
      };
      expect(await resolveConcertImage(foreignConcert)).toBe(foreignConcert);
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
      expect((await getConcerts()).concerts[0].image).toBe(undefined);
    }
    imageUrl = 'https://example.org/concert.jpg';
    cachedResponse = undefined;
    description =
      '---Kurzbeschreibung\nEin Abend für alle.\n---Langbeschreibung\nErster Absatz.\n\nZweiter Absatz.\n---Program\nHaydn';
    const described = (await getConcerts()).concerts[0];
    expect(described.shortDescription).toBe('Ein Abend für alle.');
    expect(described.longDescription).toBe('Erster Absatz.\n\nZweiter Absatz.');
    expect(described.programme).toBe('Haydn');
    for (const search of ['Abend', 'Zweiter']) {
      expect(programmeFor([described], { q: search }).matchCount).toBe(1);
    }
    for (const heading of ['---Program', '---Programm']) {
      cachedResponse = undefined;
      description = `Interne Notiz\r\n${heading}\r\nHaydn\r\n\r\nDvořák\r\n---Untertitel\r\nMusik, die Brücken baut\r\n---Intern\r\nNicht veröffentlichen`;
      const {
        concerts: [concert]
      } = await getConcerts();
      expect(concert.programme).toBe('Haydn\n\nDvořák');
      expect(concert.subtitle).toBe('Musik, die Brücken baut');
      expect(JSON.stringify(concert).includes('Nicht veröffentlichen')).toBe(false);
      expect(programmeFor([concert], { q: 'Brücken' }).matchCount).toBe(1);
    }
    cachedResponse = undefined;
    description = '---Program\n\n---Untertitel\n---Kurzbeschreibung\n---Langbeschreibung\n';
    const empty = await getConcerts();
    expect(empty.concerts[0].programme).toBe(undefined);
    expect(empty.concerts[0].subtitle).toBe(undefined);
    expect(empty.concerts[0].shortDescription).toBe(undefined);
    expect(empty.concerts[0].longDescription).toBe(undefined);
    expect(empty.concerts[0].accessibility).toBe(undefined);
    expect(empty.concerts[0].admission).toBe(undefined);
    expect(empty.concerts[0].intermission).toBe(undefined);

    description = '---Einlass\n19:00 Uhr\n---Ort\nNikolaikirche\n---Pause\nMit Pause';
    endDate = '2027-08-06T19:00:00Z';
    cachedResponse = undefined;
    const details = (await getConcerts()).concerts[0];
    expect(details.admission).toBe('19:00 Uhr');
    expect(details.location).toBe('Nikolaikirche');
    expect(details.durationMinutes).toBe(90);
    expect(details.intermission).toBe('Mit Pause');

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
      expect((await getConcerts()).concerts[0].intermission).toBe(expected);
    }
    for (const end of [undefined, 'invalid', startDate, '2027-08-06T16:00:00Z']) {
      cachedResponse = undefined;
      endDate = end;
      expect((await getConcerts()).concerts[0].durationMinutes).toBe(undefined);
    }
    cachedResponse = undefined;
    startDate = '2027-08-06T23:30:00Z';
    endDate = '2027-08-07T01:00:00Z';
    expect((await getConcerts()).concerts[0].durationMinutes).toBe(90);
    cachedResponse = undefined;
    allDay = true;
    expect((await getConcerts()).concerts[0].durationMinutes).toBe(undefined);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
    else delete globalThis.caches;
  }
});
