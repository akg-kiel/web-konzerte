import * as React from 'react';
import type { CalendarDate } from '@internationalized/date';
import {
  DateField as AriaDateField,
  DateInput,
  DateSegment,
  FieldError,
  I18nProvider,
  type DateFieldProps as AriaDateFieldProps
} from 'react-aria-components';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface DateFieldProps extends Omit<
  AriaDateFieldProps<CalendarDate>,
  'children' | 'className'
> {
  className?: string;
  inputClassName?: string;
  label: React.ReactNode;
  labelClassName?: string;
}

const DateField = React.forwardRef<HTMLDivElement, DateFieldProps>(
  ({ className, inputClassName, isRequired, label, labelClassName, ...props }, ref) => (
    <I18nProvider locale="de-DE">
      <AriaDateField
        ref={ref}
        className={className}
        granularity="day"
        isRequired={isRequired}
        validationBehavior="native"
        {...props}
      >
        <Label className={labelClassName}>
          {label}
          {isRequired && (
            <>
              {' '}
              <span aria-hidden="true" className="text-secondary">
                *
              </span>
            </>
          )}
        </Label>
        <DateInput
          className={cn(
            'flex min-h-11 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 md:text-sm',
            inputClassName
          )}
        >
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded-sm px-0.5 outline-none data-[focused]:bg-secondary data-[focused]:text-midnight data-[placeholder]:text-role-on/50"
            />
          )}
        </DateInput>
        <FieldError className="mt-2 block font-body text-sm/6 text-red-300" />
      </AriaDateField>
    </I18nProvider>
  )
);
DateField.displayName = 'DateField';

export { DateField };
