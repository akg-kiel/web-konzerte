import * as React from 'react';
import { X } from 'lucide-react';
import {
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps
} from 'react-aria-components';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SearchFieldProps extends Omit<AriaSearchFieldProps, 'children' | 'className'> {
  className?: string;
  inputClassName?: string;
  label: React.ReactNode;
  labelClassName?: string;
  placeholder?: string;
}

const SearchField = React.forwardRef<HTMLDivElement, SearchFieldProps>(
  ({ className, inputClassName, label, labelClassName, placeholder, ...props }, ref) => (
    <AriaSearchField ref={ref} className={`group ${className ?? ''}`} {...props}>
      <Label className={labelClassName}>{label}</Label>
      <div className="relative mt-2">
        <Input className={inputClassName} placeholder={placeholder} />
        <Button
          aria-label="Suche leeren"
          className="absolute inset-y-0 right-0 h-auto w-11 bg-transparent p-0 text-role-on/60 hover:bg-transparent hover:text-secondary group-data-[empty]:hidden"
          slot="clear"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </AriaSearchField>
  )
);
SearchField.displayName = 'SearchField';

export { SearchField };
