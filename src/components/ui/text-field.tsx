import * as React from 'react';
import {
  FieldError,
  Text,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps
} from 'react-aria-components';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface TextFieldProps extends Omit<
  AriaTextFieldProps,
  'children' | 'className' | 'placeholder'
> {
  className?: string;
  description?: string;
  inputClassName?: string;
  label: React.ReactNode;
  labelClassName?: string;
  max?: number | string;
  min?: number | string;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
}

const TextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  (
    {
      className,
      description,
      inputClassName,
      isRequired,
      label,
      labelClassName,
      max,
      min,
      multiline,
      placeholder,
      rows,
      ...props
    },
    ref
  ) => (
    <AriaTextField
      ref={ref}
      className={className}
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
      {multiline ? (
        <Textarea
          className={cn(
            'flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 md:text-sm',
            inputClassName
          )}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <Input
          className={cn(
            'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 md:text-sm',
            inputClassName
          )}
          max={max}
          min={min}
          placeholder={placeholder}
        />
      )}
      {description && (
        <Text className="mt-2 block font-body text-sm/6 text-role-on/60" slot="description">
          {description}
        </Text>
      )}
      <FieldError className="mt-2 block font-body text-sm/6 text-red-300" />
    </AriaTextField>
  )
);
TextField.displayName = 'TextField';

export { TextField };
