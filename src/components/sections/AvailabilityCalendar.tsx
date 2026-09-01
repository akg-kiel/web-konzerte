import { de } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';

import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
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

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

export default function AvailabilityCalendar() {
  const [today, setToday] = useState<Date>();
  const [statuses, setStatuses] = useState<Record<string, AvailabilityStatus>>({});
  const [selected, setSelected] = useState<Date>();
  const [month, setMonth] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const endMonth = useMemo(
    () => (today ? new Date(today.getFullYear() + 1, today.getMonth() + 1, 0) : undefined),
    [today]
  );

  useEffect(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    setToday(date);
    setMonth(date);
  }, []);

  useEffect(() => {
    if (!today || !endMonth) return;
    const input = document.querySelector<HTMLInputElement>('#preferred-date');
    if (!input) return;
    input.min = dateKey(today);
    input.max = dateKey(endMonth);
    const update = () => {
      const date = input.value && input.validity.valid ? parseDate(input.value) : undefined;
      setSelected(date);
      if (date) setMonth(date);
    };
    update();
    input.addEventListener('input', update);
    return () => input.removeEventListener('input', update);
  }, [endMonth, today]);

  useEffect(() => {
    if (!today || !endMonth) return;
    const from = dateKey(new Date(today.getFullYear(), today.getMonth(), 1));
    const to = dateKey(endMonth);
    setLoading(true);
    setError(false);
    fetch(`/api/availability?from=${from}&to=${to}`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ statuses: Record<string, AvailabilityStatus> }>;
      })
      .then(({ statuses: result }) => setStatuses(result))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [endMonth, today]);

  const statusFor = (date: Date): AvailabilityStatus | undefined =>
    loading || error ? undefined : (statuses[dateKey(date)] ?? 'unknown');
  const selectedStatus = selected ? statusFor(selected) : undefined;
  const selectDate = (date: Date | undefined) => {
    setSelected(date);
    const input = document.querySelector<HTMLInputElement>('#preferred-date');
    if (!input) return;
    input.value = date ? dateKey(date) : '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  if (!today || !endMonth) return null;

  return (
    <div className="space-y-6">
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
          mode="single"
          locale={de}
          selected={selected}
          onSelect={selectDate}
          month={month}
          onMonthChange={setMonth}
          startMonth={today}
          endMonth={endMonth}
          disabled={(date) => date < today}
          components={{
            DayButton: (props) => {
              const status = statusFor(props.day.date);
              const date = props.day.date.toLocaleDateString('de-DE');
              return (
                <CalendarDayButton
                  {...props}
                  aria-label={status ? `${date}: ${labels[status]}` : date}
                />
              );
            }
          }}
          modifiers={{
            available: (date) => statusFor(date) === 'available',
            coordination: (date) => statusFor(date) === 'coordination',
            occupied: (date) => statusFor(date) === 'occupied',
            unknown: (date) => statusFor(date) === 'unknown'
          }}
          modifiersClassNames={{
            available:
              '[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:h-1.5 [&_button]:after:w-1.5 [&_button]:after:rounded-full [&_button]:after:bg-emerald-400',
            coordination:
              '[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:h-1.5 [&_button]:after:w-1.5 [&_button]:after:rounded-full [&_button]:after:bg-amber-400',
            occupied:
              '[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:h-1.5 [&_button]:after:w-1.5 [&_button]:after:rounded-full [&_button]:after:bg-red-400',
            unknown:
              '[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:h-1.5 [&_button]:after:w-1.5 [&_button]:after:rounded-full [&_button]:after:bg-role-muted'
          }}
          className="mx-auto w-full max-w-sm bg-transparent p-0 text-on-surface"
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
              ? `${selected.toLocaleDateString('de-DE')}: ${labels[selectedStatus]}`
              : 'Wählen Sie einen Tag für die unverbindliche Vorprüfung.'}
      </p>
      <p className="rounded-sm border-l-2 border-secondary bg-secondary/5 py-3 pl-4 font-body text-sm/6 text-role-on/75">
        Unverbindliche Vorprüfung, endgültige Bestätigung nach Anfrage.
      </p>
    </div>
  );
}
