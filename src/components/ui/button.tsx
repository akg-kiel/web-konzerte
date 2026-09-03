import * as React from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps as AriaButtonProps,
  type LinkProps as AriaLinkProps
} from 'react-aria-components';

import { cn } from '@/lib/utils';

const baseClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline'
} as const;

const sizes = {
  default: 'h-11 px-4 py-2',
  sm: 'h-11 rounded-md px-3',
  lg: 'h-12 rounded-md px-8',
  icon: 'size-11'
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

interface VariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className
}: VariantProps = {}) {
  return cn(baseClass, variants[variant], sizes[size], className);
}

export interface ButtonProps extends Omit<AriaButtonProps, 'className'>, VariantProps {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <AriaButton ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
  )
);
Button.displayName = 'Button';

export interface ButtonLinkProps extends Omit<AriaLinkProps, 'className'>, VariantProps {}

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, ...props }, ref) => (
    <AriaLink ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
  )
);
ButtonLink.displayName = 'ButtonLink';

export { Button, ButtonLink };
