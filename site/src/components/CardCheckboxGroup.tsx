import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import Check from '@/assets/icons/check.svg?react';

export interface CardCheckboxOption<T = string> {
  value: T;
  label: string;
  description?: string;
  media: ReactNode;
}

interface CardCheckboxGroupProps<T = string> {
  value: readonly T[];
  onChange: (value: T[]) => void;
  options: readonly CardCheckboxOption<T>[];
  'aria-label': string;
  /** Minimum column width; the grid fills as many columns as fit, like CardRadioGroup. */
  minColumnWidth?: string;
}

/** Multi-select counterpart to CardRadioGroup with the same card and selection treatment. */
export default function CardCheckboxGroup<T extends string = string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  minColumnWidth = '14rem',
}: CardCheckboxGroupProps<T>) {
  return (
    <CheckboxGroup
      value={[...value]}
      // SAFETY: every rendered Checkbox.Root receives an option value of type T, so the group can only report T values.
      onValueChange={(newValue) => onChange(newValue as T[])}
      aria-label={ariaLabel}
      // Every card group on the site is an installation choice.
      data-ph-capture-attribute-location="installation-options"
      className="grid auto-rows-fr gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minColumnWidth}), 1fr))` }}
    >
      {options.map((option) => {
        const isSelected = value.includes(option.value);

        return (
          <Checkbox.Root
            key={option.value}
            value={option.value}
            data-card-value={option.value}
            className={clsx(
              'group relative flex min-w-0 cursor-pointer items-center gap-3 text-left select-none',
              'rounded-xl corner-squircle border bg-surface p-3 ring-1 ring-transparent',
              'transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out',
              'intent:-translate-y-0.5 intent:shadow-md motion-reduce:intent:translate-y-0',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
              isSelected
                ? 'border-accent bg-surface-raised shadow-sm ring-accent'
                : 'border-line intent:border-line-strong'
            )}
          >
            <Checkbox.Indicator className="sr-only" />
            <span
              aria-hidden="true"
              className="corner-squircle border-line bg-surface-raised text-faded-black dark:bg-faded-black dark:text-manila-light flex size-10 shrink-0 items-center justify-center rounded-lg border"
            >
              {option.media}
            </span>
            <span className="min-w-0 flex-1 pr-8">
              <span className="text-p3 block font-semibold">{option.label}</span>
              {option.description && <span className="text-p4 dark:text-muted mt-0.5 block">{option.description}</span>}
            </span>
            <span
              aria-hidden="true"
              className={clsx(
                'absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border',
                'transition-[color,background-color,border-color,opacity,transform] duration-200',
                isSelected
                  ? 'scale-100 border-accent bg-accent text-manila-light opacity-100'
                  : 'scale-75 border-line-strong bg-transparent text-transparent opacity-0 group-intent:opacity-100'
              )}
            >
              <Check className="size-4" />
            </span>
          </Checkbox.Root>
        );
      })}
    </CheckboxGroup>
  );
}
