import {
  endOfMonth,
  startOfMonth,
  today as getToday,
  type CalendarDate
} from '@internationalized/date';
import { useEffect, useMemo, useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import { DateField } from '@/components/ui/date-field';
import type { AvailabilityStatus } from '@/lib/availability';

const labels: Record<AvailabilityStatus, string> = {
  available: 'Anfrage möglich',
  coordination: 'Absprache erforderlich',
  occupied: 'Voraussichtlich belegt',
  unknown: 'Noch nicht geprüft'
};

const colors: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-400',
  coordination: 'bg-amber-400',
  occupied: 'bg-red-400',
  unknown: 'bg-role-muted'
};

const venueTimeZone = 'Europe/Berlin';
const inputClass =
  'h-auto rounded-none border-0 border-b border-white/30 bg-transparent px-0 py-4 font-body text-base/6 text-on-surface focus-within:ring-secondary';
const labelClass =
  'mb-2 block font-body text-xs/4 font-semibold uppercase tracking-widest text-role-on/70';

export default function AvailabilityCalendar() {
  const today = useMemo(() => getToday(venueTimeZone), []);
  const [statuses, setStatuses] = useState<Record<string, AvailabilityStatus>>({});
  const [selected, setSelected] = useState<CalendarDate | null>(null);
  const [focused, setFocused] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const endDate = useMemo(() => endOfMonth(today.add({ years: 1 })), [today]);

  useEffect(() => {
    const controller = new AbortController();
    const from = startOfMonth(today).toString();
    setLoading(true);
    setError(false);
    fetch(`/api/availability?from=${from}&to=${endDate}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ statuses: Record<string, AvailabilityStatus> }>;
      })
      .then(({ statuses: result }) => setStatuses(result))
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [endDate, today]);

  const statusFor = (date: CalendarDate): AvailabilityStatus | undefined =>
    loading || error ? undefined : (statuses[date.toString()] ?? 'unknown');
  const selectedStatus = selected ? statusFor(selected) : undefined;
  const selectDate = (date: CalendarDate | null) => {
    setSelected(date);
    if (date) setFocused(date);
  };

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
        />
      </div>

      <div>
        <span className="mb-2 block font-body text-xs/4 font-semibold uppercase tracking-widest text-role-on/70">
          Verfügbarkeit prüfen
        </span>
        <p className="font-body text-sm/6 text-role-on/60">
          Der Status berücksichtigt den Veranstaltungsort sowie Bewirtungs-, Backstage-, Neben- und
          Bürobereiche.
        </p>
      </div>

      <div
        className="relative left-1/2 w-dvw -translate-x-1/2 rounded-lg border border-white/10 bg-slate-mist/20 p-1 sm:static sm:w-auto sm:translate-x-0 sm:p-4"
        aria-busy={loading}
      >
        <Calendar
          aria-label="Verfügbarkeit auswählen"
          className="mx-auto max-w-sm bg-transparent p-0"
          focusedValue={focused}
          getDateStatus={(date) => {
            const status = statusFor(date);
            return status ? { className: colors[status], label: labels[status] } : undefined;
          }}
          maxValue={endDate}
          minValue={today}
          value={selected}
          onChange={selectDate}
          onFocusChange={setFocused}
        />
      </div>

      <ul className="grid grid-cols-1 gap-3 text-sm/6 sm:grid-cols-2" aria-label="Kalenderstatus">
        {(Object.keys(labels) as AvailabilityStatus[]).map((status) => (
          <li className="flex items-center gap-3 text-role-on/70" key={status}>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors[status]}`}
              aria-hidden="true"
            />
            {labels[status]}
          </li>
        ))}
      </ul>

      <p className="min-h-6 font-body text-sm/6 text-role-on/70" aria-live="polite">
        {error
          ? 'Die ChurchTools-Belegung konnte nicht geladen werden. Bitte fragen Sie Ihren Termin trotzdem unverbindlich an.'
          : loading
            ? 'Verfügbarkeiten werden geladen …'
            : selected && selectedStatus
              ? `${selected.toDate(venueTimeZone).toLocaleDateString('de-DE')}: ${labels[selectedStatus]}`
              : 'Wählen Sie einen Tag für die unverbindliche Vorprüfung.'}
      </p>
      <p className="rounded-sm border-l border-secondary bg-secondary/5 py-3 pl-4 font-body text-sm/6 text-role-on/75">
        Unverbindliche Vorprüfung, endgültige Bestätigung nach Anfrage.
      </p>
    </div>
  );
}
