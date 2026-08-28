import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

import { classifyAvailability, parseIsoDate, type BookingSlot } from '../../lib/availability';

export const prerender = false;

const resources: Array<{ id: number; group: BookingSlot['group'] }> = [
  { id: 4, group: 'venue' },
  ...[15, 21, 16, 18, 19, 20, 39, 22, 23, 24].map((id) => ({
    id,
    group: 'secondary' as const
  }))
];
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const fromTime = parseIsoDate(from);
  const toTime = parseIsoDate(to);
  if (
    !Number.isFinite(fromTime) ||
    !Number.isFinite(toTime) ||
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
    return Response.json({ error: 'Verfügbarkeit derzeit nicht abrufbar' }, { status: 503 });

  try {
    if (new URL(baseUrl).protocol !== 'https:')
      throw new Error('CHURCHTOOLS_BASE_URL must use HTTPS');
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
          bookingUrl.searchParams.set('from', from);
          bookingUrl.searchParams.set('to', to);
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
              base?: { statusId?: number; startDate?: string; endDate?: string };
              calculated?: { startDate?: string; endDate?: string };
            }>;
          };
          return (payload.data ?? []).flatMap((booking): BookingSlot[] => {
            const startDate = booking.calculated?.startDate ?? booking.base?.startDate;
            const endDate = booking.calculated?.endDate ?? booking.base?.endDate;
            const statusId = Number(booking.base?.statusId);
            return startDate && endDate && (statusId === 1 || statusId === 2)
              ? [
                  {
                    group,
                    statusId,
                    startDate,
                    endDate
                  }
                ]
              : [];
          });
        })
      )
    ).flat();

    const reliableDate = new Date();
    reliableDate.setUTCDate(reliableDate.getUTCDate() + 365);
    const configuredBuffer = Number(env.CHURCHTOOLS_EVENT_BUFFER_HOURS ?? 12);
    const statuses = classifyAvailability(
      from,
      to,
      bookings,
      reliableDate.toISOString().slice(0, 10),
      Number.isFinite(configuredBuffer) ? configuredBuffer : 12
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
