import { useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { SearchField } from '@/components/ui/search-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import type { ConcertFilters as FilterValues } from '@/data/concerts';

interface Props {
  action: string;
  anchor: string;
  filters: FilterValues;
  matchCount: number;
  rangeError?: string;
  seasons: string[];
  totalCount: number;
}

const allSeasons = '__all';
const inputClass =
  'min-h-12 w-full rounded-sm border border-white/20 bg-midnight/60 px-4 py-3 font-body text-base text-white outline-none transition placeholder:text-role-on/60 focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/40';
const labelClass = 'font-body text-sm/6 font-semibold text-role-on/80';

export default function ConcertFilters({
  action,
  anchor,
  filters,
  matchCount,
  rangeError,
  seasons,
  totalCount
}: Props) {
  const [selectedKey, setSelectedKey] = useState(filters.season || allSeasons);
  const season = selectedKey === allSeasons ? '' : String(selectedKey);
  const hasFilters = Boolean(filters.search || filters.season || filters.from || filters.to);

  return (
    <div className="mt-10 border-t border-white/10 pt-8">
      <Form action={`${action}#${anchor}`} method="get" role="search" aria-label="Konzerte filtern">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SearchField
            className="xl:col-span-2"
            defaultValue={filters.search}
            inputClassName={`${inputClass} pr-12`}
            label="Suche"
            labelClassName={labelClass}
            maxLength={100}
            name="q"
            placeholder="Titel, Programm oder Mitwirkende"
          />

          <div>
            <Select
              value={selectedKey}
              onChange={(key) => setSelectedKey(key == null ? allSeasons : String(key))}
            >
              <Label className={labelClass}>Saison</Label>
              <SelectTrigger className={`${inputClass} mt-2`} id="concert-season">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/20 bg-midnight text-role-on">
                <SelectItem id={allSeasons}>Alle Saisons</SelectItem>
                {seasons.map((value) => (
                  <SelectItem id={value} key={value}>
                    Saison {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input name="season" type="hidden" value={season} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              aria-describedby={rangeError ? 'concert-date-error' : undefined}
              defaultValue={filters.from}
              inputClassName={`${inputClass} mt-2`}
              isInvalid={Boolean(rangeError)}
              label="Von"
              labelClassName={labelClass}
              name="from"
              type="date"
            />
            <TextField
              aria-describedby={rangeError ? 'concert-date-error' : undefined}
              defaultValue={filters.to}
              inputClassName={`${inputClass} mt-2`}
              isInvalid={Boolean(rangeError)}
              label="Bis"
              labelClassName={labelClass}
              name="to"
              type="date"
            />
          </div>
        </div>

        {rangeError && (
          <p id="concert-date-error" className="mt-4 font-body text-sm/6 text-red-300" role="alert">
            {rangeError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button
            className="min-h-12 rounded-sm bg-secondary px-6 py-3 font-body text-xs/4 font-semibold uppercase tracking-widest text-midnight hover:bg-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            type="submit"
          >
            Filtern
          </Button>
          {hasFilters && (
            <ButtonLink
              className="min-h-12 bg-transparent px-0 font-body text-xs/4 font-semibold uppercase tracking-widest text-secondary hover:bg-transparent hover:text-champagne focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary"
              href={`${action}#${anchor}`}
              variant="ghost"
            >
              Filter zurücksetzen
            </ButtonLink>
          )}
          <p className="ml-auto font-body text-sm/6 text-role-on/70" aria-live="polite">
            {matchCount} {matchCount === 1 ? 'Konzert' : 'Konzerte'} gefunden
            {matchCount !== totalCount && ` (von ${totalCount})`}
          </p>
        </div>
      </Form>
    </div>
  );
}
