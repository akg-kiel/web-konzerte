import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem as AriaListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  type ButtonProps as AriaButtonProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type SelectProps as AriaSelectProps
} from 'react-aria-components';

import { cn } from '@/lib/utils';

const Select = AriaSelect;
export type SelectProps<T extends object = object> = AriaSelectProps<T>;

interface SelectTriggerProps extends Omit<AriaButtonProps, 'children' | 'className'> {
  children?: React.ReactNode;
  className?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <AriaButton
      ref={ref}
      className={cn(
        'flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
    </AriaButton>
  )
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

function SelectContent({ children, className }: SelectContentProps) {
  return (
    <Popover
      className={cn(
        'z-50 min-w-[var(--trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-panel',
        className
      )}
    >
      <ListBox className="max-h-72 overflow-y-auto p-1 outline-none">{children}</ListBox>
    </Popover>
  );
}

interface SelectItemProps extends Omit<AriaListBoxItemProps, 'children' | 'className'> {
  children: React.ReactNode;
  className?: string;
}

const textFromChildren = (children: React.ReactNode) =>
  React.Children.toArray(children)
    .filter(
      (child): child is number | string => typeof child === 'number' || typeof child === 'string'
    )
    .join('');

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, textValue, ...props }, ref) => (
    <AriaListBoxItem
      ref={ref}
      textValue={textValue ?? textFromChildren(children)}
      className={({ isDisabled, isFocused }) =>
        cn(
          'relative flex min-h-11 w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none',
          isFocused && 'bg-accent text-accent-foreground',
          isDisabled && 'pointer-events-none opacity-50',
          className
        )
      }
      {...props}
    >
      {({ isSelected }) => (
        <>
          <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
            {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
          </span>
          {children}
        </>
      )}
    </AriaListBoxItem>
  )
);
SelectItem.displayName = 'SelectItem';

interface SelectValueProps {
  className?: string;
}

function SelectValue({ className }: SelectValueProps) {
  return (
    <AriaSelectValue className={className}>{({ selectedText }) => selectedText}</AriaSelectValue>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
