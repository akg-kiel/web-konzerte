import * as React from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps as AriaButtonProps,
  type LinkProps as AriaLinkProps
} from 'react-aria-components';

import { cn } from '@/lib/utils';

const baseClass =
  'motion-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground'
} as const;

export type ButtonVariant = keyof typeof variants;

interface VariantProps {
  variant?: ButtonVariant;
  className?: string;
}

export function buttonVariants({ variant = 'default', className }: VariantProps = {}) {
  return cn(baseClass, variants[variant], 'h-11 px-4 py-2', className);
}

export interface ButtonProps extends Omit<AriaButtonProps, 'className'>, VariantProps {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <AriaButton ref={ref} className={buttonVariants({ variant, className })} {...props} />
  )
);
Button.displayName = 'Button';

export interface ButtonLinkProps extends Omit<AriaLinkProps, 'className'>, VariantProps {}

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, ...props }, ref) => (
    <AriaLink ref={ref} className={buttonVariants({ variant, className })} {...props} />
  )
);
ButtonLink.displayName = 'ButtonLink';

export { Button, ButtonLink };
