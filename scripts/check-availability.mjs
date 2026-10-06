import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

import { classifyAvailability, parseIsoDate } from '../src/lib/availability.ts';

assert.equal(Number.isFinite(parseIsoDate('2024-02-29')), true);
assert.equal(Number.isNaN(parseIsoDate('2026-02-30')), true);

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
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'cloudflare:workers')
      return { url: 'test:cloudflare-workers', shortCircuit: true };
    if (specifier.startsWith('@/')) {
      const file = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
      for (const extension of ['.tsx', '.ts'])
        if (existsSync(new URL(file.href + extension)))
          return { url: file.href + extension, shortCircuit: true };
    }
    return nextResolve(
      specifier === '../../lib/availability' ? `${specifier}.ts` : specifier,
      context
    );
  },
  load(url, context, nextLoad) {
    if (url === 'test:cloudflare-workers')
      return { format: 'module', source: 'export const env = {};', shortCircuit: true };
    if (url.endsWith('.tsx'))
      return {
        format: 'module',
        source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX }
        }).outputText,
        shortCircuit: true
      };
    return nextLoad(url, context);
  }
});
const { env } = await import('cloudflare:workers');
const { GET } = await import('../src/pages/api/availability.ts');
const { default: AvailabilityCalendar } =
  await import('../src/components/sections/AvailabilityCalendar.tsx');
hooks.deregister();
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
const from = month.toISOString().slice(0, 10);
month.setUTCMonth(month.getUTCMonth() + 1);
const nextMonth = month.toISOString().slice(0, 7);
month.setUTCMonth(month.getUTCMonth() + 1, 0);
const to = month.toISOString().slice(0, 10);
const currentMonth = from.slice(0, 7);
const row = (day, statusId = 2) => ({
  booking: {
    base: { statusId, title: 'Private mock booking', startDate: '2000-01-01T00:00:00Z' },
    calculated: { startDate: `${day}T10:00:00Z`, endDate: `${day}T12:00:00Z` }
  }
});
let failure;
let cached;
let calls = 0;
Object.defineProperty(globalThis, 'caches', {
  configurable: true,
  value: {
    default: {
      match: async () => cached?.clone(),
      put: async (_key, response) => {
        cached = response.clone();
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
  assert.equal(url.searchParams.get('from'), from);
  assert.equal(url.searchParams.get('to'), to);
  assert.deepEqual(url.searchParams.getAll('status_ids[]'), ['1', '2']);
  const id = Number(url.searchParams.get('resource_ids[]'));
  assert(resourceIds.includes(id));
  if (failure === 'denied') return new Response(null, { status: 403 });
  if (failure === 'malformed') return Response.json({ data: [{}] });
  if (failure === 'missing-data') return Response.json({});
  return Response.json({
    data:
      id === 4
        ? [row(`${currentMonth}-10`), row(`${nextMonth}-10`), row(`${currentMonth}-14`, 1)]
        : id === 15
          ? [row(`${currentMonth}-12`)]
          : []
  });
};
const request = () =>
  GET({ request: new Request(`https://example.org/api/availability/?from=${from}&to=${to}`) });
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
  console.error = () => {};
  for (failure of ['denied', 'malformed', 'missing-data']) {
    cached = undefined;
    const failed = await request();
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get('Cache-Control'), 'no-store');
    assert.equal('statuses' in (await failed.json()), false);
    assert.equal(cached, undefined, 'Upstream failures must not cache fabricated free dates');
  }
  delete env.CHURCHTOOLS_TOKEN;
  assert.equal((await request()).status, 503);
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
  else delete globalThis.caches;
}
