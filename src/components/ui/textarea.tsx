import * as React from 'react';
import {
  TextArea as AriaTextArea,
  type TextAreaProps as AriaTextAreaProps
} from 'react-aria-components';

import { cn } from '@/lib/utils';

export interface TextareaProps extends Omit<AriaTextAreaProps, 'className'> {
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <AriaTextArea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
