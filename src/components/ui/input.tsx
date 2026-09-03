import * as React from 'react';
import { Input as AriaInput, type InputProps as AriaInputProps } from 'react-aria-components';

import { cn } from '@/lib/utils';

export interface InputProps extends Omit<AriaInputProps, 'className'> {
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <AriaInput
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 md:text-sm',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
