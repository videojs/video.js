import { Select as BaseSelect } from '@base-ui/react/select';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import Check from '@/assets/icons/check.svg?react';
import ChevronDown from '@/assets/icons/chevron-down.svg?react';
import { twMerge } from '@/utils/twMerge';

export interface SelectOption<T = string> {
  value: T | null;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T = string> {
  value: T | null;
  onChange: (value: T | null) => void;
  options: SelectOption<T>[];
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/** Base UI select styled like the shadcn/ui select: a compact trigger and a floating, softly shadowed listbox. */
export function Select<T extends string = string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: SelectProps<T>) {
  const selected = options.find((option) => option.value === value);

  return (
    <BaseSelect.Root value={value} onValueChange={onChange} items={options}>
      <BaseSelect.Trigger
        className={twMerge(
          clsx(
            'inline-flex h-9 min-w-0 items-center gap-2 rounded-lg corner-squircle border border-line bg-surface px-3 text-left text-p3 shadow-xs',
            'intent:border-line-strong data-[popup-open]:border-line-strong cursor-pointer select-none'
          ),
          className
        )}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {selected?.icon && (
          <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
            {selected.icon}
          </span>
        )}
        <BaseSelect.Value className="min-w-0 flex-1 truncate" />
        <BaseSelect.Icon className="text-muted flex shrink-0">
          <ChevronDown className="size-4" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50 outline-none">
          <BaseSelect.Popup
            className={clsx(
              'origin-(--transform-origin) overflow-y-auto scrollbar-thin rounded-lg corner-squircle border border-line bg-surface-raised dark:bg-soot p-1 text-p3 shadow-lg',
              'transition duration-150 ease-out starting-style:scale-95 starting-style:opacity-0 ending-style:scale-95 ending-style:opacity-0 ending-style:duration-100',
              'motion-reduce:transition-none'
            )}
            style={
              {
                minWidth: 'var(--anchor-width)',
                maxHeight: 'var(--available-height)',
              } as React.CSSProperties
            }
          >
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={clsx(
                    'relative flex items-center gap-2 rounded-md corner-squircle py-1.5 pr-8 pl-2 outline-none select-none',
                    option.disabled
                      ? 'opacity-50 cursor-default'
                      : 'cursor-pointer data-[highlighted]:bg-surface dark:data-[highlighted]:bg-warm-gray'
                  )}
                >
                  {option.icon && (
                    <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
                      {option.icon}
                    </span>
                  )}
                  <BaseSelect.ItemText className="min-w-0 flex-1 truncate">{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
                    <Check className="size-4" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
