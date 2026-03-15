import React, { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ value, onChange, options, placeholder = 'Select...', className = '', disabled = false }, ref) => {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger
          ref={ref}
          disabled={disabled}
          className={`
            flex items-center justify-between w-full
            px-3 py-1.5 text-sm rounded-md border
            bg-white dark:bg-zinc-900 
            text-zinc-900 dark:text-zinc-100
            border-zinc-200 dark:border-zinc-800
            hover:bg-zinc-50 dark:hover:bg-zinc-800/50
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm transition-all
            ${className}
          `}
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
          <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="start"
            sideOffset={4}
            className={`
              z-50 w-auto min-w-[var(--radix-dropdown-menu-trigger-width)]
              p-1 rounded-lg border
              bg-white dark:bg-zinc-900 
              border-zinc-200 dark:border-zinc-800
              shadow-lg
              animate-in fade-in-80 zoom-in-95
            `}
          >
            {options.map((option) => (
              <DropdownMenuPrimitive.Item
                key={option.value}
                onSelect={() => onChange?.(option.value)}
                className={`
                  relative flex w-full cursor-pointer select-none items-center
                  rounded-md py-1.5 pl-8 pr-2 text-sm outline-none
                  text-zinc-700 dark:text-zinc-300
                  hover:bg-zinc-100 dark:hover:bg-zinc-800
                  hover:text-zinc-900 dark:hover:text-zinc-50
                  data-[disabled]:pointer-events-none data-[disabled]:opacity-50
                `}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {value === option.value && <Check className="w-4 h-4" />}
                </span>
                <span>{option.label}</span>
              </DropdownMenuPrimitive.Item>
            ))}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    );
  }
);

Select.displayName = 'Select';
