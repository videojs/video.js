'use client';

import { FCastExtension, type FCastSnapshot } from '@videojs/fcast';
import type { ForwardedRef } from 'react';
import { forwardRef, useSyncExternalStore } from 'react';

import { usePlayerContext } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useButton } from '../hooks/use-button';

/** @experimental */
export interface FCastButtonState {
  connection: FCastSnapshot['connection'];
  availability: FCastSnapshot['availability'];
  deviceName?: string | undefined;
  disabled: boolean;
}

/** @experimental */
export interface FCastButtonProps extends UIComponentProps<'button', FCastButtonState> {}

const noop = () => {};
const emptySubscribe = () => noop;

/**
 * FCast control that observes the surrounding player’s opt-in FCast extension.
 *
 * @experimental
 */
export const FCastButton = forwardRef(function FCastButton(
  { disabled, render, className, style, ...elementProps }: FCastButtonProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>
) {
  const { extensions } = usePlayerContext();
  const extension = useSyncExternalStore(
    extensions?.subscribe ?? emptySubscribe,
    () => extensions?.get(FCastExtension),
    () => undefined
  );

  useSyncExternalStore(
    (notify) => {
      extension?.addEventListener('change', notify);
      return () => extension?.removeEventListener('change', notify);
    },
    () => extension?.version ?? 0,
    () => 0
  );

  const snapshot = extension?.snapshot;
  const state: FCastButtonState = {
    connection: snapshot?.connection ?? 'disconnected',
    availability: snapshot?.availability ?? 'unsupported',
    deviceName: snapshot?.deviceName,
    disabled:
      !!disabled ||
      !extension?.enabled ||
      snapshot?.connection === 'connecting' ||
      (snapshot?.connection !== 'connected' && snapshot?.availability !== 'available'),
  };
  const label =
    state.connection === 'connected'
      ? `Disconnect from ${state.deviceName ?? 'FCast'}`
      : state.connection === 'connecting'
        ? 'Connecting to FCast'
        : 'Cast with FCast';

  const { getButtonProps, buttonRef } = useButton({
    displayName: 'FCastButton',
    isDisabled: () => state.disabled,
    onActivate: () => {
      void extension?.toggle().catch((error: unknown) => {
        if (__DEV__) console.error('[FCastButton]', error);
      });
    },
  });

  if (state.availability === 'unsupported' && state.connection !== 'connected') return null;

  return renderElement(
    'button',
    { render, className, style },
    {
      state,
      ref: [forwardedRef, buttonRef],
      props: [
        getButtonProps(),
        {
          'aria-label': label,
          'aria-disabled': state.disabled ? 'true' : undefined,
          'data-fcast-state': state.connection,
          'data-availability': state.availability,
        },
        elementProps,
      ],
    }
  );
});

if (__DEV__) FCastButton.displayName = 'FCastButton';

/** @experimental */
export namespace FCastButton {
  export type Props = FCastButtonProps;
  export type State = FCastButtonState;
}
