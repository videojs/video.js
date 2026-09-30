'use client';

import type { InputAction } from '@videojs/core';
import { createHotkey, isHotkeyToggleAction } from '@videojs/core/dom';
import { useEffect } from 'react';

import { useContainer } from '../../player/context';
import { useLatestRef } from '../../utils/use-latest-ref';

export interface UseHotkeyOptions {
  keys: string;
  onActivate: (event: KeyboardEvent, key: string) => void;
  target?: 'player' | 'document';
  repeatable?: boolean;
  disabled?: boolean;
  action?: InputAction;
  value?: number;
}

/**
 * Registers a keyboard shortcut through the current player's hotkey coordinator.
 *
 * @param options - Shortcut keys, activation callback, scope, repeat behavior, disabled state, and the optional action
 *   name and value reported to input indicators.
 */
export function useHotkey(options: UseHotkeyOptions): void {
  const { keys, action, value, target = 'player', disabled = false } = options;
  const repeatable = options.repeatable ?? !(action && isHotkeyToggleAction(action));
  const container = useContainer();
  const onActivateRef = useLatestRef(options.onActivate);

  useEffect(() => {
    if (!container || !keys || disabled) return;

    return createHotkey(container, {
      keys,
      action,
      value,
      target,
      repeatable,
      disabled,
      onActivate: (event, key) => onActivateRef.current(event, key),
    });
  }, [container, keys, action, value, target, repeatable, disabled]);
}
