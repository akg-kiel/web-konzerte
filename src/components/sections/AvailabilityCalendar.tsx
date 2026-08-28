import { de } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';

import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [error, setError] = useState(false);
  const endMonth = useMemo(
    () => (today ? new Date(today.getFullYear() + 1, today.getMonth() + 1, 0) : undefined),
    [today]
  );

  useEffect(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    setToday(date);
  }, []);

  useEffect(() => {
    if (!today || !endMonth) return;
    const from = dateKey(new Date(today.getFullYear(), today.getMonth(), 1));
    const to = dateKey(endMonth);
    fetch(`/api/availability?from=${from}&to=${to}`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ statuses: Record<string, AvailabilityStatus> }>;
      })
      .then(({ statuses: result }) => setStatuses(result))
      .catch(() => setError(true));
  }, [endMonth, today]);

  const statusFor = (date: Date): AvailabilityStatus => statuses[dateKey(date)] ?? 'unknown';
  const selectedStatus = selected ? statusFor(selected) : undefined;

  if (!today || !endMonth)
    return (
      <p className="rounded-lg border border-white/10 bg-slate-mist/20 p-6 font-body text-sm/6 text-role-on/70">
        Verfügbarkeitskalender wird geladen …
      </p>
    );

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

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-mist/20 p-2 sm:p-4">
        <Calendar
          mode="single"
          locale={de}
          selected={selected}
          onSelect={setSelected}
          startMonth={today}
          endMonth={endMonth}
          disabled={(date) => date < today}
          components={{
            DayButton: (props) => (
              <CalendarDayButton
                {...props}
                aria-label={`${props.day.date.toLocaleDateString('de-DE')}: ${labels[statusFor(props.day.date)]}`}
              />
            )
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
          className="mx-auto w-full max-w-sm bg-transparent text-on-surface"
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

      <div>
        <Label
          className="mb-2 block font-body text-xs/4 font-semibold uppercase tracking-widest text-role-on/70"
          htmlFor="preferred-date"
        >
          Wunschdatum <span className="text-secondary">*</span>
        </Label>
        <Input
          className="h-auto rounded-none border-0 border-b border-white/30 bg-transparent px-0 py-4 font-body text-base/6 text-on-surface focus-visible:ring-secondary"
          id="preferred-date"
          name="Wunschdatum"
          type="date"
          min={dateKey(today)}
          max={dateKey(endMonth)}
          value={selected ? dateKey(selected) : ''}
          onChange={(event) =>
            setSelected(event.target.value ? parseDate(event.target.value) : undefined)
          }
          required
        />
      </div>

      <p className="min-h-6 font-body text-sm/6 text-role-on/70" aria-live="polite">
        {error
          ? 'Die ChurchTools-Belegung konnte nicht geladen werden. Bitte fragen Sie Ihren Termin trotzdem unverbindlich an.'
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
