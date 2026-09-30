'use client';

import type { HotkeyProps as CoreHotkeyProps } from '@videojs/core';
import type { AnyPlayerStore } from '@videojs/core/dom';
import { createHotkey, isHotkeyToggleAction, resolveHotkeyAction } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useContainer, usePlayer } from '../../player/context';

export interface HotkeyProps extends CoreHotkeyProps {}

export function Hotkey({ keys, action, value, disabled, target }: HotkeyProps): ReactNode {
  const store = usePlayer() as AnyPlayerStore;
  const container = useContainer();

  useEffect(() => {
    if (!container || !keys || !action || disabled) return;

    const resolver = resolveHotkeyAction(action);
    if (!resolver) return;

    return createHotkey(container, {
      keys,
      action,
      value,
      target,
      disabled,
      repeatable: !isHotkeyToggleAction(action),
      onActivate: (_event, key) => {
        resolver({ store, key, value });
      },
    });
  }, [container, store, keys, action, value, disabled, target]);

  return null;
}

export namespace Hotkey {
  export type Props = HotkeyProps;
}

/** @deprecated Use `HotkeyProps` instead. */
export type MediaHotkeyProps = HotkeyProps;

/** @deprecated Use `Hotkey` instead. */
export const MediaHotkey = Hotkey;
