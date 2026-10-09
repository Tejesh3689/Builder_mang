'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectProps extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  id?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ children, className, id, 'aria-invalid': ariaInvalid, value, defaultValue, onChange, disabled, required, name, ...props }, ref) => {
    
    const handleValueChange = (val: string) => {
      if (onChange) {
        const event = {
          target: { value: val, name },
          currentTarget: { value: val, name },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
    };

    return (
      <SelectPrimitive.Root
        value={value !== undefined ? String(value) : undefined}
        defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
        onValueChange={handleValueChange}
        disabled={disabled}
        required={required}
        name={name}
      >
        <SelectPrimitive.Trigger
          id={id}
          ref={ref}
          aria-invalid={ariaInvalid}
          className={`flex h-10 w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-600 aria-[invalid=true]:ring-red-600 aria-[invalid=true]:bg-red-50 ${className || ''}`}
          {...props}
        >
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1 max-h-64 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]">
              {children}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);
Select.displayName = "Select";

export const SelectOption = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, value, disabled, ...props }, ref) => {
    // Determine the string value. If value is omitted, use the child text (if it's a string).
    const optionValue = value !== undefined ? String(value) : (typeof children === 'string' ? children : '');

    return (
      <SelectPrimitive.Item
        ref={ref}
        value={optionValue}
        disabled={disabled}
        className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-100 focus:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className || ''}`}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className="h-4 w-4" />
          </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
    );
  }
);
SelectOption.displayName = "SelectOption";
