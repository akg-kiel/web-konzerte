import assert from 'node:assert/strict';

import { getConcerts, splitConcerts } from '../src/data/concerts.ts';

const originalFetch = globalThis.fetch;
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
globalThis.fetch = async () => {
  fetchCalls += 1;
  return new Response(
    JSON.stringify({
      data: [
        {
          appointment: {
            base: {
              id: 42,
              title: 'Testkonzert',
              description:
                'Programm: Bach und Brahms\nMitwirkende: Testchor\nPreis: Eintritt frei\nAnsprechpartner: Nicht veröffentlichen',
              image: {
                imageUrl: 'https://example.org/concert.jpg',
                imageOption: { focus: { x: 0.25, y: 0.75 } }
              },
              link: 'javascript:alert(1)'
            },
            calculated: { startDate: '2027-08-06T17:30:00Z' }
          }
        }
      ]
    }),
    { headers: { 'content-type': 'application/json' } }
  );
};

try {
  const result = await getConcerts();
  assert.equal(result.error, false);
  assert.equal(result.concerts.length, 1);
  assert.equal(result.concerts[0].programme, 'Bach und Brahms');
  assert.equal('performers' in result.concerts[0], false);
  assert.equal('price' in result.concerts[0], false);
  assert.equal(result.concerts[0].ticketUrl, undefined);
  assert.equal(result.concerts[0].imagePosition, '25% 75%');
  assert.match(result.concerts[0].slug, /-42-2027-08-06$/);
  await getConcerts();
  assert.equal(fetchCalls, 1);
  assert.equal(splitConcerts(result.concerts, new Date('2027-08-07')).archiveConcerts.length, 1);
} finally {
  globalThis.fetch = originalFetch;
  if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
  else delete globalThis.caches;
}
