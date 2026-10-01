'use client';

import {
  BufferingIndicatorCore,
  BufferingIndicatorDataAttrs,
  type BufferingIndicatorProps as CoreBufferingIndicatorProps,
  type BufferingIndicatorState,
} from '@videojs/core';
import { logMissingFeature, selectPlayback } from '@videojs/core/dom';
import type { ForwardedRef } from 'react';
import { forwardRef, useState, useSyncExternalStore } from 'react';

import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { useDestroy } from '../../utils/use-destroy';
import { renderElement } from '../../utils/use-render';

export interface BufferingIndicatorProps
  extends UIComponentProps<'div', BufferingIndicatorState>, CoreBufferingIndicatorProps {}

/**
 * Displays a buffering indicator when media is waiting for data.
 *
 * Visibility is delayed (default 500ms) to avoid flashing on quick buffers.
 *
 * @example
 *   ```tsx
 *   <BufferingIndicator />
 *
 *   <BufferingIndicator delay={1000} />
 *
 *   <BufferingIndicator
 *   render={(props, state) => (
 *   <div {...props}>{state.visible && <Spinner />}</div>
 *   )}
 *   />
 *   ```;
 */
export const BufferingIndicator = forwardRef(function BufferingIndicator(
  componentProps: BufferingIndicatorProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, delay, ...elementProps } = componentProps;

  const playback = usePlayer(selectPlayback);

  const [core] = useState(() => new BufferingIndicatorCore());

  useDestroy(core);
  core.setProps({ delay });

  if (playback) core.update(playback);

  const state = useSyncExternalStore(
    (cb) => core.state.subscribe(cb),
    () => core.state.current,
    () => core.state.current
  );

  if (!playback) {
    if (__DEV__) logMissingFeature('BufferingIndicator', 'playback');

    return null;
  }

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap: BufferingIndicatorDataAttrs,
      ref: [forwardedRef],
      props: [elementProps],
    }
  );
});

export namespace BufferingIndicator {
  export type Props = BufferingIndicatorProps;
  export type State = BufferingIndicatorState;
}
