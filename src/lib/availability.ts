export type AvailabilityStatus = 'available' | 'coordination' | 'occupied' | 'unknown';

export interface BookingSlot {
  group: 'venue' | 'secondary';
  statusId: number;
  startDate: string;
  endDate: string;
}

export const parseIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : NaN;
};

const rank: Record<AvailabilityStatus, number> = {
  available: 1,
  coordination: 2,
  occupied: 3,
  unknown: 4
};

const localDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const daysBetween = (from: string, to: string) => {
  const days: string[] = [];
  for (
    let date = new Date(`${from}T00:00:00Z`);
    date <= new Date(`${to}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1)
  )
    days.push(date.toISOString().slice(0, 10));
  return days;
};

export function classifyAvailability(
  from: string,
  to: string,
  bookings: BookingSlot[],
  reliableThrough: string,
  bufferHours = 12
): Record<string, AvailabilityStatus> {
  const statuses = Object.fromEntries(
    daysBetween(from, to).map((day) => [day, day <= reliableThrough ? 'available' : 'unknown'])
  ) as Record<string, AvailabilityStatus>;

  const mark = (start: number, end: number, status: AvailabilityStatus) => {
    const last = end - 1;
    if (!Number.isFinite(start) || !Number.isFinite(last) || last < start) return;
    const points = [start, last];
    for (let point = Math.ceil(start / 3_600_000) * 3_600_000; point <= last; point += 3_600_000)
      points.push(point);
    for (const point of points) {
      const day = localDate.format(point);
      if (day in statuses && rank[status] > rank[statuses[day]]) statuses[day] = status;
    }
  };

  const buffer = (Number.isFinite(bufferHours) && bufferHours >= 0 ? bufferHours : 12) * 3_600_000;
  for (const booking of bookings) {
    const start = Date.parse(booking.startDate);
    const end = Date.parse(booking.endDate);
    if (booking.group === 'venue') {
      mark(start - buffer, end + buffer, 'coordination');
      if (booking.statusId === 2) mark(start, end, 'occupied');
    } else {
      mark(start, end, 'coordination');
    }
  }

  return statuses;
}
