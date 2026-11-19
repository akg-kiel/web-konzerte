import {
  endOfMonth,
  parseDate,
  startOfMonth,
  today as getToday,
  type CalendarDate
} from '@internationalized/date';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Calendar } from '@/components/ui/calendar.tsx';
import { DateField } from '@/components/ui/date-field.tsx';
import type { AvailabilityStatus } from './availability.ts';

const labels: Record<AvailabilityStatus, string> = {
  available: 'Anfrage möglich',
  coordination: 'Absprache erforderlich',
  occupied: 'Voraussichtlich belegt',
  unknown: 'Noch nicht geprüft'
};

// Match each legend entry by shape as well as color, including on a selected day.
const markers: Record<AvailabilityStatus, string> = {
  available: 'size-2 rounded-full bg-emerald-400',
  coordination: 'size-2 rotate-45 bg-amber-400',
  occupied: 'h-1 w-3 rounded-full bg-red-400',
  unknown: 'size-2 rounded-full border border-role-muted bg-midnight'
};

type Availability =
  | { state: 'loading' | 'error' }
  | { state: 'ready'; statuses: Record<string, AvailabilityStatus> };

function isStatusMap(value: unknown): value is Record<string, AvailabilityStatus> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (status) => typeof status === 'string' && Object.hasOwn(labels, status)
    )
  );
}

const venueTimeZone = 'Europe/Berlin';
const inputClass =
  'h-auto rounded-none border-0 border-b border-role-on/50 bg-transparent px-0 py-4 font-body text-base/6 text-on-surface focus-within:ring-secondary';
const labelClass =
  'mb-2 block font-body text-xs/4 font-semibold uppercase tracking-widest text-role-on/70';

export default function AvailabilityCalendar() {
  const today = useMemo(() => getToday(venueTimeZone), []);
  const [hydrated, setHydrated] = useState(false);
  const [availability, setAvailability] = useState<Availability>({ state: 'loading' });
  const [selected, setSelected] = useState<CalendarDate | null>(null);
  const [alternative, setAlternative] = useState<CalendarDate | null>(null);
  const [focused, setFocused] = useState(today);
  const desiredInputRef = useRef<HTMLInputElement>(null);
  const alternativeInputRef = useRef<HTMLInputElement>(null);
  const endDate = useMemo(() => endOfMonth(today.add({ years: 1 })), [today]);

  useEffect(() => {
    const nativeDate = (value = '') => {
      try {
        return value ? parseDate(value) : null;
      } catch {
        return null;
      }
    };
    const desiredDate = nativeDate(desiredInputRef.current?.value);
    if (desiredDate) {
      setSelected(desiredDate);
      setFocused(desiredDate);
    }
    setAlternative(nativeDate(alternativeInputRef.current?.value));
    setHydrated(true);
    let mounted = true;
    const controller = new AbortController();
    const form = desiredInputRef.current?.form;
    const resetDates = (event: Event) => {
      // React Aria restores hydrated initial values; clear after its reset listeners.
      queueMicrotask(() => {
        if (event.defaultPrevented || !mounted) return;
        setSelected(null);
        setAlternative(null);
        setFocused(today);
      });
    };
    form?.addEventListener('reset', resetDates);
    const from = startOfMonth(today).toString();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    fetch(`/api/availability?from=${from}&to=${endDate}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (
          !result ||
          typeof result !== 'object' ||
          !('statuses' in result) ||
          !isStatusMap(result.statuses)
        )
          throw new Error();
        if (mounted) setAvailability({ state: 'ready', statuses: result.statuses });
      })
      .catch(() => {
        if (mounted) setAvailability({ state: 'error' });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      controller.abort();
      form?.removeEventListener('reset', resetDates);
    };
  }, [endDate, today]);

  const statusFor = (date: CalendarDate): AvailabilityStatus | undefined =>
    availability.state === 'ready'
      ? (availability.statuses[date.toString()] ?? 'unknown')
      : undefined;
  const selectedStatus = selected ? statusFor(selected) : undefined;
  const selectDate = (date: CalendarDate | null) => {
    setSelected(date);
    if (date) setFocused(date);
  };

  if (!hydrated)
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <label className={labelClass}>
            Wunschdatum *
            <input
              ref={desiredInputRef}
              className={`mt-2 block w-full ${inputClass}`}
              max={endDate.toString()}
              min={today.toString()}
              name="Wunschdatum"
              required
              type="date"
            />
          </label>
          <label className={labelClass}>
            Alternativdatum
            <input
              ref={alternativeInputRef}
              className={`mt-2 block w-full ${inputClass}`}
              max={endDate.toString()}
              min={today.toString()}
              name="Alternativdatum"
              type="date"
            />
          </label>
        </div>
        <p className="font-body text-sm/6 text-role-on/70">
          Die endgültige Verfügbarkeit wird nach Ihrer unverbindlichen Anfrage geprüft.
        </p>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <DateField
          inputClassName={inputClass}
          isRequired
          label="Wunschdatum"
          labelClassName={labelClass}
          maxValue={endDate}
          minValue={today}
          name="Wunschdatum"
          value={selected}
          onChange={selectDate}
        />
        <DateField
          inputClassName={inputClass}
          label="Alternativdatum"
          labelClassName={labelClass}
          maxValue={endDate}
          minValue={today}
          name="Alternativdatum"
          value={alternative}
          onChange={setAlternative}
        />
      </div>

      <div>
        <p className="mb-2 font-body text-xs/4 font-semibold uppercase tracking-widest text-secondary">
          Verfügbarkeit am Wunschtermin
        </p>
        <p role="status" className="max-w-prose font-body text-base/7 text-role-on">
          {availability.state === 'error'
            ? 'Die Belegung lässt sich zurzeit nicht anzeigen. Sie können Ihr Wunschdatum trotzdem eingeben oder im Kalender auswählen.'
            : availability.state === 'loading'
              ? 'Die Belegung wird geladen. Sie können Ihr Wunschdatum schon eingeben.'
              : selected && selectedStatus
                ? `${selected.toDate(venueTimeZone).toLocaleDateString('de-DE', { timeZone: venueTimeZone })}: ${labels[selectedStatus]}`
                : 'Geben Sie Ihr Wunschdatum ein oder wählen Sie einen Tag im Kalender.'}
        </p>
      </div>

      <div
        className="-mx-6 rounded-lg border border-white/10 bg-slate-mist/20 p-2 sm:mx-0 sm:p-4"
        aria-busy={availability.state === 'loading'}
      >
        <Calendar
          aria-label="Verfügbarkeit auswählen"
          className="mx-auto max-w-sm bg-transparent p-0"
          focusedValue={focused}
          getDateStatus={(date) => {
            const status = statusFor(date);
            return status ? { className: markers[status], label: labels[status] } : undefined;
          }}
          maxValue={endDate}
          minValue={today}
          value={selected}
          onChange={selectDate}
          onFocusChange={setFocused}
        />
      </div>

      {availability.state === 'ready' && (
        <ul className="grid grid-cols-1 gap-2 text-sm/6 sm:grid-cols-2" aria-label="Kalenderstatus">
          {(Object.keys(labels) as AvailabilityStatus[]).map((status) => (
            <li className="flex items-center gap-4 text-role-on/85" key={status}>
              <span className={`shrink-0 ${markers[status]}`} aria-hidden="true" />
              {labels[status]}
            </li>
          ))}
        </ul>
      )}
      <p className="max-w-prose font-body text-sm/6 text-role-on/80">
        Die Vorprüfung berücksichtigt den Kirchenraum sowie Bewirtungs-, Backstage-, Neben- und
        Bürobereiche. Ob Ihr Termin möglich ist, klären wir nach Ihrer Anfrage.
      </p>
    </div>
  );
}
