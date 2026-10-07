'use client';

import { FCastExtension, type FCastExtensionProps, type FCastSnapshot } from '@videojs/fcast';
import type { ForwardedRef } from 'react';
import { forwardRef, useSyncExternalStore } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { usePlayerExtension } from '../../utils/use-player-extension';
import { renderElement } from '../../utils/use-render';
import { useSyncProps } from '../../utils/use-sync-props';
import { useButton } from '../hooks/use-button';

/** @experimental */
export interface FCastButtonState {
  connection: FCastSnapshot['connection'];
  availability: FCastSnapshot['availability'];
  deviceName?: string | undefined;
  disabled: boolean;
}

/** @experimental */
export interface FCastButtonProps extends UIComponentProps<'button', FCastButtonState>, FCastExtensionProps {}

/**
 * FCast control that registers a sender-backed player extension. Place it beside CastButton and AirPlayButton.
 *
 * @experimental
 */
export const FCastButton = forwardRef(function FCastButton(
  props: FCastButtonProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>
) {
  if (!props.sender) return null;

  return <ActiveFCastButton {...props} forwardedRef={forwardedRef} />;
});

function ActiveFCastButton({
  sender,
  src,
  contentType,
  disabled,
  render,
  className,
  style,
  forwardedRef,
  ...elementProps
}: FCastButtonProps & { forwardedRef: ForwardedRef<HTMLButtonElement> }) {
  const extension = usePlayerExtension(FCastExtension);

  useSyncProps(extension, { contentType, src, sender }, FCastExtension.defaultProps);

  useSyncExternalStore(
    (notify) => {
      extension.addEventListener('change', notify);
      return () => extension.removeEventListener('change', notify);
    },
    () => extension.version,
    () => 0
  );

  const snapshot = extension.snapshot;
  const state: FCastButtonState = {
    connection: snapshot.connection,
    availability: snapshot.availability,
    deviceName: snapshot.deviceName,
    disabled:
      !!disabled ||
      !extension.enabled ||
      snapshot.connection === 'connecting' ||
      (snapshot.connection !== 'connected' && snapshot.availability !== 'available'),
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
      void extension.toggle().catch((error: unknown) => {
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
}

if (__DEV__) FCastButton.displayName = 'FCastButton';

/** @experimental */
export namespace FCastButton {
  export type Props = FCastButtonProps;
  export type State = FCastButtonState;
}
