import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import { twMerge } from '@/utils/twMerge';

export interface SegmentedOption<T = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  'aria-label'?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T = string> {
  value: T | null;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  'aria-label': string;
  className?: string;
  /** The control cannot be used right now; shows a not-allowed cursor. */
  disabled?: boolean;
  /** The control is not ready yet, for example before hydration; shows a wait cursor. */
  pending?: boolean;
  'data-testid'?: string;
}

/**
 * Single-choice segmented control in the style of the Next.js docs router switch: a recessed track with one raised,
 * selected segment. Built on Base UI's toggle group so keyboard and pressed-state semantics come for free.
 */
export default function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  className,
  disabled,
  pending = false,
  'data-testid': dataTestId,
}: SegmentedControlProps<T>) {
  const inactive = disabled || pending;

  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(next) => {
        // Re-pressing the active segment reports an empty selection; a segmented control has no "none" state.
        if (next.length === 0) return;

        // SAFETY: every Toggle receives an option value of type T, so the group can only report those back.
        onChange(next[0] as T);
      }}
      disabled={inactive}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      className={twMerge(
        clsx(
          'grid w-full grid-flow-col auto-cols-fr gap-1 rounded-lg corner-squircle border border-line bg-surface p-1',
          inactive && 'opacity-60'
        ),
        className
      )}
    >
      {options.map((option) => {
        const isPressed = option.value === value;

        return (
          <Toggle
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            aria-label={option['aria-label']}
            className={clsx(
              'flex min-w-0 items-center justify-center gap-2 rounded-md corner-squircle px-3 py-1.5 text-p3 leading-tight whitespace-nowrap select-none',
              pending ? 'cursor-wait' : option.disabled || disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              isPressed
                ? 'bg-surface-raised font-semibold text-faded-black dark:text-manila-light shadow-xs ring-1 ring-line'
                : 'text-muted intent:text-faded-black dark:intent:text-manila-light'
            )}
          >
            {option.icon && (
              <span
                aria-hidden="true"
                className={clsx('inline-flex size-4 shrink-0 items-center justify-center', !isPressed && 'opacity-70')}
              >
                {option.icon}
              </span>
            )}
            <span className="truncate">{option.label}</span>
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}
