import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { classifyAvailability, parseIsoDate } from '../src/lib/availability.ts';

assert.equal(Number.isFinite(parseIsoDate('2024-02-29')), true);
assert.equal(Number.isNaN(parseIsoDate('2026-02-30')), true);
assert.equal(Number.isNaN(parseIsoDate(['2026-03-29'])), true);

const statuses = classifyAvailability(
  '2027-01-01',
  '2027-01-08',
  [
    {
      group: 'venue',
      statusId: 2,
      startDate: '2027-01-03T10:00:00Z',
      endDate: '2027-01-03T12:00:00Z'
    },
    {
      group: 'secondary',
      statusId: 2,
      startDate: '2027-01-05T10:00:00Z',
      endDate: '2027-01-05T11:00:00Z'
    }
  ],
  '2027-01-07',
  12
);

assert.equal(statuses['2027-01-01'], 'available');
assert.equal(statuses['2027-01-02'], 'coordination');
assert.equal(statuses['2027-01-03'], 'occupied');
assert.equal(statuses['2027-01-04'], 'coordination');
assert.equal(statuses['2027-01-05'], 'coordination');
assert.equal(statuses['2027-01-06'], 'available');
assert.equal(statuses['2027-01-08'], 'unknown');

const invalidBuffer = classifyAvailability(
  '2027-01-03',
  '2027-01-03',
  [
    {
      group: 'venue',
      statusId: 1,
      startDate: '2027-01-03T10:00:00Z',
      endDate: '2027-01-03T11:00:00Z'
    }
  ],
  '2027-01-03',
  -1
);
assert.equal(invalidBuffer['2027-01-03'], 'coordination');

// Exercise the real route with mock server-only bindings and ChurchTools responses.
register(new URL('./check-availability-loader.mjs', import.meta.url));
const { env } = await import('cloudflare:workers');
const { GET } = await import('../src/pages/api/availability.ts');
const { default: AvailabilityCalendar } =
  await import('../src/components/sections/AvailabilityCalendar.tsx');
const fallback = renderToStaticMarkup(createElement(AvailabilityCalendar));
const inputs = fallback.match(/<input[^>]*>/g) ?? [];
assert.equal(inputs.length, 2);
assert(inputs.every((input) => input.includes('type="date"')));
assert(inputs[0].includes('name="Wunschdatum"') && inputs[0].includes('required=""'));
assert(inputs[1].includes('name="Alternativdatum"') && !inputs[1].includes('required=""'));
assert.equal(fallback.includes('clip-path'), false, 'No-JS date inputs must be visible');

const originalFetch = globalThis.fetch;
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');
const originalConsoleError = console.error;
const resourceIds = [4, 15, 21, 16, 18, 19, 20, 39, 22, 23, 24];
const month = new Date();
month.setUTCDate(1);
let from = month.toISOString().slice(0, 10);
month.setUTCMonth(month.getUTCMonth() + 1);
const nextMonth = month.toISOString().slice(0, 7);
month.setUTCMonth(month.getUTCMonth() + 1, 0);
let to = month.toISOString().slice(0, 10);
const currentMonth = from.slice(0, 7);
const row = (day, statusId = 2, zone = 'Z') => ({
  booking: {
    base: { statusId, title: 'Private mock booking', startDate: '2000-01-01T00:00:00Z' },
    calculated: { startDate: `${day}T10:00:00${zone}`, endDate: `${day}T12:00:00${zone}` }
  }
});
const allDayRow = (startDate, endDate = startDate, statusId = 2) => ({
  booking: {
    base: { allDay: true, statusId, startDate: '2000-01-01', endDate: '2000-01-01' },
    calculated: { startDate, endDate }
  }
});
let fixtureBookings;
let filterFixtureBookings = false;
let expectedDaysBefore = 1;
let expectedDaysAfter = 1;
let failure;
const cached = new Map();
let calls = 0;
Object.defineProperty(globalThis, 'caches', {
  configurable: true,
  value: {
    default: {
      match: async (key) => cached.get(key.url)?.clone(),
      put: async (key, response) => {
        cached.set(key.url, response.clone());
      }
    }
  }
});
env.CHURCHTOOLS_TOKEN = 'mock-token';
globalThis.fetch = async (input, options) => {
  calls++;
  assert.equal(options.headers.Authorization, 'Login mock-token');
  const url = new URL(input);
  if (url.pathname === '/api/resource/masterdata')
    return Response.json({ data: { resources: resourceIds.map((id) => ({ id })) } });
  assert.equal(url.pathname, '/api/bookings');
  assert.equal(
    url.searchParams.get('from'),
    new Date(parseIsoDate(from) - expectedDaysBefore * 86_400_000).toISOString().slice(0, 10)
  );
  assert.equal(
    url.searchParams.get('to'),
    new Date(parseIsoDate(to) + expectedDaysAfter * 86_400_000).toISOString().slice(0, 10)
  );
  assert.deepEqual(url.searchParams.getAll('status_ids[]'), ['1', '2']);
  const id = Number(url.searchParams.get('resource_ids[]'));
  assert(resourceIds.includes(id));
  if (failure === 'denied') return new Response(null, { status: 403 });
  if (failure === 'malformed') return Response.json({ data: [{}] });
  if (failure === 'impossible-start') return Response.json({ data: [row('2026-02-30')] });
  if (failure === 'impossible-end')
    return Response.json({
      data: [
        {
          booking: {
            base: { statusId: 2 },
            calculated: { startDate: '2026-02-28T10:00:00Z', endDate: '2026-02-30T12:00:00Z' }
          }
        }
      ]
    });
  if (failure === 'malformed-datetime')
    return Response.json({ data: [row(`${currentMonth}-16`, 2, 'Z trailing')] });
  if (failure === 'missing-data') return Response.json({});
  if (fixtureBookings) {
    const rows = filterFixtureBookings
      ? fixtureBookings.filter(
          ({ booking }) =>
            booking.calculated.startDate.slice(0, 10) <= url.searchParams.get('to') &&
            booking.calculated.endDate.slice(0, 10) >= url.searchParams.get('from')
        )
      : fixtureBookings;
    return Response.json({ data: id === 4 ? rows : [] });
  }
  return Response.json({
    data:
      id === 4
        ? [row(`${currentMonth}-10`), row(`${nextMonth}-10`), row(`${currentMonth}-14`, 1)]
        : id === 15
          ? [row(`${currentMonth}-12`, 2, '+01:00')]
          : []
  });
};
const request = (suffix = '') =>
  GET({
    request: new Request(`https://example.org/api/availability/?from=${from}&to=${to}${suffix}`)
  });
try {
  const response = await request();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.statuses[`${currentMonth}-10`], 'occupied');
  assert.equal(body.statuses[`${nextMonth}-10`], 'occupied');
  assert.equal(body.statuses[`${currentMonth}-12`], 'coordination');
  assert.equal(body.statuses[`${currentMonth}-14`], 'coordination');
  assert.equal(body.statuses[`${currentMonth}-20`], 'available');
  assert.equal(JSON.stringify(body).includes('Private mock booking'), false);
  assert.equal(calls, 12);
  assert.equal((await request()).status, 200);
  assert.equal(calls, 12, 'Successful availability uses cache');
  assert.equal((await request('&probe=1')).status, 200);
  assert.equal(calls, 24, 'Distinct availability URLs use distinct cache entries');
  // Civil booking end dates include the supplied final day; timed ends remain exclusive.
  console.error = () => {};
  env.CHURCHTOOLS_EVENT_BUFFER_HOURS = '0';
  expectedDaysBefore = expectedDaysAfter = 0;
  for (const [start, end, expectedDays] of [
    ['2026-01-14', '2026-01-14', ['2026-01-14']],
    ['2026-07-14', '2026-07-14', ['2026-07-14']],
    ['2026-03-29', '2026-03-29', ['2026-03-29']],
    ['2026-10-25', '2026-10-25', ['2026-10-25']],
    ['2026-03-28', '2026-03-30', ['2026-03-28', '2026-03-29', '2026-03-30']]
  ]) {
    from = new Date(parseIsoDate(start) - 86_400_000).toISOString().slice(0, 10);
    to = new Date(parseIsoDate(end) + 86_400_000).toISOString().slice(0, 10);
    fixtureBookings = [allDayRow(start, end)];
    cached.clear();
    const allDayResponse = await request();
    assert.equal(allDayResponse.status, 200, 'Documented all-day bookings must not fail closed');
    const { statuses: allDayStatuses } = await allDayResponse.json();
    assert.equal(allDayStatuses[from], 'available', 'No spill into the preceding Berlin day');
    assert.equal(allDayStatuses[to], 'available', 'No spill into the following Berlin day');
    for (const day of expectedDays) assert.equal(allDayStatuses[day], 'occupied');
  }
  from = '2026-10-13';
  to = '2026-10-17';
  fixtureBookings = [allDayRow('2026-10-15', '2026-10-15', 1)];
  cached.clear();
  assert.equal((await (await request()).json()).statuses['2026-10-15'], 'coordination');
  env.CHURCHTOOLS_EVENT_BUFFER_HOURS = '12';
  expectedDaysBefore = expectedDaysAfter = 1;
  fixtureBookings = [allDayRow('2026-10-15')];
  cached.clear();
  const buffered = await (await request()).json();
  assert.equal(buffered.statuses['2026-10-14'], 'coordination');
  assert.equal(buffered.statuses['2026-10-15'], 'occupied');
  assert.equal(buffered.statuses['2026-10-16'], 'coordination');
  fixtureBookings = [
    { booking: { base: { statusId: 2, startDate: '2026-10-15', endDate: '2026-10-15' } } }
  ];
  cached.clear();
  assert.equal((await (await request()).json()).statuses['2026-10-15'], 'occupied');
  // The mock CT server excludes bookings outside its queried civil-date window.
  filterFixtureBookings = true;
  for (const [startDate, endDate] of [
    ['2026-11-10T12:00:00+01:00', '2026-11-10T14:00:00+01:00'],
    ['2026-11-12T08:00:00+01:00', '2026-11-12T10:00:00+01:00']
  ]) {
    fixtureBookings = [{ booking: { base: { statusId: 2 }, calculated: { startDate, endDate } } }];
    for (const [start, end] of [
      ['2026-11-11', '2026-11-11'],
      ['2026-11-11', '2026-11-12'],
      ['2026-11-01', '2026-11-30']
    ]) {
      from = start;
      to = end;
      cached.clear();
      const boundaryResponse = await request();
      assert.equal(boundaryResponse.status, 200);
      const { statuses: boundaryStatuses } = await boundaryResponse.json();
      assert.equal(
        boundaryStatuses['2026-11-11'],
        'coordination',
        'Buffer status must not depend on the requested window'
      );
      assert.equal(
        Object.keys(boundaryStatuses).length,
        (parseIsoDate(to) - parseIsoDate(from)) / 86_400_000 + 1,
        'Only requested days may be returned'
      );
    }
  }
  env.CHURCHTOOLS_EVENT_BUFFER_HOURS = '48';
  for (const [day, bookingDay, zone, before, after] of [
    ['2026-03-30', '2026-03-27', '+01:00', 3, 2],
    ['2026-10-26', '2026-10-24', '+02:00', 2, 2]
  ]) {
    from = to = day;
    expectedDaysBefore = before;
    expectedDaysAfter = after;
    fixtureBookings = [
      {
        booking: {
          base: { statusId: 2 },
          calculated: {
            startDate: `${bookingDay}T01:00:00${zone}`,
            endDate: `${bookingDay}T01:30:00${zone}`
          }
        }
      }
    ];
    if (day === '2026-03-30')
      fixtureBookings[0].booking.calculated = {
        startDate: `${bookingDay}T23:00:00${zone}`,
        endDate: `${bookingDay}T23:30:00${zone}`
      };
    cached.clear();
    assert.equal(
      (await (await request()).json()).statuses[day],
      'coordination',
      '48h buffer must follow elapsed hours across DST'
    );
  }
  for (const [start, end, buffer] of [
    ['0000-12-31', '0001-01-01', '12'],
    ['9999-12-31', '9999-12-31', '0'],
    ['0001-01-01', '0001-01-01', '12'],
    ['9999-12-30', '9999-12-30', '48']
  ]) {
    from = start;
    to = end;
    env.CHURCHTOOLS_EVENT_BUFFER_HOURS = buffer;
    cached.clear();
    const previousCalls = calls;
    assert.equal((await request()).status, 400, 'Unrepresentable padded windows must be rejected');
    assert.equal(calls, previousCalls, 'Invalid calendar bounds must not reach ChurchTools');
  }
  filterFixtureBookings = false;
  env.CHURCHTOOLS_EVENT_BUFFER_HOURS = '12';
  expectedDaysBefore = expectedDaysAfter = 1;
  from = '2026-10-13';
  to = '2026-10-17';
  for (const invalid of [
    allDayRow('2026-02-30'),
    allDayRow('2026-10-15', '2026-10-14'),
    allDayRow('2026-10-15', '2026-10-16T12:00:00Z'),
    allDayRow('2026-10-15 trailing'),
    allDayRow(['2026-10-15'], ['2026-10-15']),
    allDayRow(['2026-10-15T10:00:00Z'], ['2026-10-15T12:00:00Z']),
    allDayRow('2026-10-15', '2026-10-15', [3]),
    allDayRow('2026-10-15', '2026-10-15', true),
    allDayRow('2026-10-15', '2026-10-15', '2'),
    {
      booking: {
        base: { statusId: 2, startDate: '2026-10-14T10:00:00Z', endDate: '2026-10-16T12:00:00Z' },
        calculated: { startDate: '2026-10-15T10:00:00Z' }
      }
    }
  ]) {
    fixtureBookings = [invalid];
    cached.clear();
    const invalidResponse = await request();
    assert.equal(invalidResponse.status, 503);
    assert.equal(invalidResponse.headers.get('Cache-Control'), 'no-store');
    assert.equal(cached.size, 0, 'Invalid all-day or partial calculated dates must not be cached');
  }
  fixtureBookings = undefined;
  for (failure of [
    'denied',
    'malformed',
    'impossible-start',
    'impossible-end',
    'malformed-datetime',
    'missing-data'
  ]) {
    cached.clear();
    const failed = await request();
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get('Cache-Control'), 'no-store');
    assert.equal('statuses' in (await failed.json()), false);
    assert.equal(cached.size, 0, 'Upstream failures must not cache fabricated free dates');
  }
  delete env.CHURCHTOOLS_TOKEN;
  const missingCredentials = await request();
  assert.equal(missingCredentials.status, 503);
  assert.equal(missingCredentials.headers.get('Cache-Control'), 'no-store');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
  else delete globalThis.caches;
}
