import { parseDate, toCalendarDate, toZoned } from '@internationalized/date';
import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

import { classifyAvailability, parseIsoDate, type BookingSlot } from '../../lib/availability';

export const prerender = false;

const venueTimeZone = 'Europe/Berlin';
const resources: Array<{ id: number; group: BookingSlot['group'] }> = [
  { id: 4, group: 'venue' },
  ...[15, 21, 16, 18, 19, 20, 39, 22, 23, 24].map((id) => ({
    id,
    group: 'secondary' as const
  }))
];

const parseChurchToolsDateTime = (value: string | undefined) => {
  if (typeof value !== 'string') return NaN;
  const match =
    /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
      value
    );
  if (!match || !Number.isFinite(parseIsoDate(match[1]))) return NaN;
  return Date.parse(value);
};
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const fromTime = parseIsoDate(from);
  const toTime = parseIsoDate(to);
  if (
    !Number.isFinite(fromTime) ||
    !Number.isFinite(toTime) ||
    from < '0001-01-01' ||
    to >= '9999-12-31' ||
    toTime < fromTime ||
    toTime - fromTime > 400 * 86_400_000
  )
    return Response.json({ error: 'Ungültiger Zeitraum' }, { status: 400 });

  const edgeCache =
    typeof caches === 'undefined'
      ? undefined
      : (caches as CacheStorage & { default?: Cache }).default;
  const cacheKey = new Request(request.url);
  try {
    const cached = await edgeCache?.match(cacheKey);
    if (cached) return cached;
  } catch (error) {
    console.error('Availability cache read failed:', error);
  }

  const baseUrl = (env.CHURCHTOOLS_BASE_URL ?? 'https://akg-kiel.church.tools').replace(/\/$/, '');
  if (!env.CHURCHTOOLS_TOKEN)
    return Response.json(
      { error: 'Verfügbarkeit derzeit nicht abrufbar' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );

  try {
    if (new URL(baseUrl).protocol !== 'https:')
      throw new Error('CHURCHTOOLS_BASE_URL must use HTTPS');
    const configuredBuffer = Number(env.CHURCHTOOLS_EVENT_BUFFER_HOURS ?? 12);
    const bufferHours =
      Number.isFinite(configuredBuffer) && configuredBuffer >= 0 ? configuredBuffer : 12;
    // Fetch bookings whose buffers overlap the requested Berlin days, including across DST.
    const bookingFrom = toCalendarDate(
      toZoned(parseDate(from), venueTimeZone).subtract({ hours: bufferHours })
    ).toString();
    const bookingTo = toCalendarDate(
      toZoned(parseDate(to).add({ days: 1 }), venueTimeZone)
        .add({ hours: bufferHours })
        .subtract({ milliseconds: 1 })
    ).toString();
    if (
      !Number.isFinite(parseIsoDate(bookingFrom)) ||
      !Number.isFinite(parseIsoDate(bookingTo)) ||
      bookingFrom < '0001-01-01' ||
      bookingFrom > from ||
      bookingTo < to
    )
      return Response.json({ error: 'Ungültiger Zeitraum' }, { status: 400 });
    const headers = { Authorization: `Login ${env.CHURCHTOOLS_TOKEN}` };
    const masterResponse = await fetch(`${baseUrl}/api/resource/masterdata`, {
      headers,
      signal: AbortSignal.timeout(10_000)
    });
    if (!masterResponse.ok) throw new Error(`masterdata ${masterResponse.status}`);
    const master = (await masterResponse.json()) as {
      data?: { resources?: Array<{ id: number }> };
    };
    const visibleIds = new Set((master.data?.resources ?? []).map(({ id }) => id));
    if (resources.some(({ id }) => !visibleIds.has(id)))
      throw new Error('required resources unavailable');

    const bookings = (
      await Promise.all(
        resources.map(async ({ id, group }) => {
          const bookingUrl = new URL('/api/bookings', baseUrl);
          bookingUrl.searchParams.set('from', bookingFrom);
          bookingUrl.searchParams.set('to', bookingTo);
          bookingUrl.searchParams.append('resource_ids[]', String(id));
          bookingUrl.searchParams.append('status_ids[]', '1');
          bookingUrl.searchParams.append('status_ids[]', '2');
          const response = await fetch(bookingUrl, {
            headers,
            signal: AbortSignal.timeout(10_000)
          });
          if (!response.ok) throw new Error(`bookings ${response.status}`);
          const payload = (await response.json()) as {
            data?: Array<{
              booking?: {
                base?: { statusId?: number; startDate?: string; endDate?: string };
                calculated?: { startDate?: string; endDate?: string };
              };
            }>;
          };
          if (!Array.isArray(payload.data)) throw new Error('invalid bookings response');
          return payload.data.flatMap(({ booking }): BookingSlot[] => {
            const dates = booking?.calculated ?? booking?.base;
            const startDate = dates?.startDate;
            const endDate = dates?.endDate;
            // CT's resource view includes the end day; use Berlin midnight boundaries, not 24h.
            const dateOnly =
              Number.isFinite(parseIsoDate(startDate ?? '')) &&
              Number.isFinite(parseIsoDate(endDate ?? ''));
            const startTime = dateOnly
              ? parseDate(startDate!).toDate(venueTimeZone).getTime()
              : parseChurchToolsDateTime(startDate);
            const endTime = dateOnly
              ? parseDate(endDate!).add({ days: 1 }).toDate(venueTimeZone).getTime()
              : parseChurchToolsDateTime(endDate);
            const statusId = booking?.base?.statusId;
            if (
              !Number.isFinite(startTime) ||
              !Number.isFinite(endTime) ||
              endTime <= startTime ||
              ![1, 2, 3].includes(statusId ?? NaN)
            )
              throw new Error('invalid booking');
            return statusId === 1 || statusId === 2
              ? [
                  {
                    group,
                    statusId,
                    startDate: new Date(startTime).toISOString(),
                    endDate: new Date(endTime).toISOString()
                  }
                ]
              : [];
          });
        })
      )
    ).flat();

    const reliableDate = new Date();
    reliableDate.setUTCDate(reliableDate.getUTCDate() + 365);
    const statuses = classifyAvailability(
      from,
      to,
      bookings,
      reliableDate.toISOString().slice(0, 10),
      bufferHours
    );
    const response = Response.json(
      { statuses },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
    try {
      await edgeCache?.put(cacheKey, response.clone());
    } catch (error) {
      console.error('Availability cache write failed:', error);
    }
    return response;
  } catch (error) {
    console.error(
      'ChurchTools availability unavailable:',
      error instanceof Error ? error.message : error
    );
    return Response.json(
      { error: 'Verfügbarkeit derzeit nicht abrufbar' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
};
