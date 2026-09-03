import * as React from 'react';
import type { CalendarDate } from '@internationalized/date';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  I18nProvider,
  type CalendarProps as AriaCalendarProps
} from 'react-aria-components';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DateStatus {
  className: string;
  label: string;
}

export interface CalendarProps extends Omit<
  AriaCalendarProps<CalendarDate>,
  'children' | 'className'
> {
  className?: string;
  getDateStatus?: (date: CalendarDate) => DateStatus | undefined;
  locale?: string;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    { 'aria-label': ariaLabel = 'Kalender', className, getDateStatus, locale = 'de-DE', ...props },
    ref
  ) => (
    <I18nProvider locale={locale}>
      <AriaCalendar
        ref={ref}
        aria-label={ariaLabel}
        className={cn('w-full font-body text-on-surface', className)}
        {...props}
      >
        <header className="relative flex h-11 items-center justify-center px-11">
          <Button
            aria-label="Vorheriger Monat"
            className="absolute left-0 size-11 p-0"
            slot="previous"
            variant="ghost"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <CalendarHeading className="text-center text-sm font-medium" />
          <Button
            aria-label="Nächster Monat"
            className="absolute right-0 size-11 p-0"
            slot="next"
            variant="ghost"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </header>

        <CalendarGrid className="w-full border-separate border-spacing-y-1" weekdayStyle="short">
          <CalendarGridHeader>
            {(day) => (
              <CalendarHeaderCell className="h-10 select-none text-center text-xs font-normal text-muted-foreground">
                {day}
              </CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => {
              const status = getDateStatus?.(date);

              return (
                <AriaCalendarCell
                  date={date}
                  className={({
                    isDisabled,
                    isFocusVisible,
                    isOutsideMonth,
                    isOutsideVisibleRange,
                    isSelected,
                    isToday
                  }) =>
                    cn(
                      'relative flex h-11 min-w-10 items-center justify-center rounded-md text-sm outline-none transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isToday && !isSelected && 'bg-accent text-accent-foreground',
                      isSelected && 'bg-primary text-primary-foreground',
                      isOutsideMonth && 'text-muted-foreground opacity-60',
                      isDisabled && 'pointer-events-none opacity-40',
                      isOutsideVisibleRange && 'invisible',
                      isFocusVisible && 'z-10 ring-2 ring-ring ring-offset-2 ring-offset-background'
                    )
                  }
                >
                  {({ formattedDate }) => (
                    <>
                      <span>{formattedDate}</span>
                      {status && (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute bottom-1 h-1.5 w-1.5 rounded-full',
                              status.className
                            )}
                          />
                          <span className="sr-only">, {status.label}</span>
                        </>
                      )}
                    </>
                  )}
                </AriaCalendarCell>
              );
            }}
          </CalendarGridBody>
        </CalendarGrid>
      </AriaCalendar>
    </I18nProvider>
  )
);
Calendar.displayName = 'Calendar';

export { Calendar };
