'use client';

import { PlaybackRateButtonCore, PlaybackRateButtonDataAttrs } from '@videojs/core';
import { selectPlaybackRate } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface PlaybackRateButtonProps
  extends UIComponentProps<'button', PlaybackRateButtonCore.State>, PlaybackRateButtonCore.Props {}

/**
 * A button that cycles through playback rates.
 *
 * @example
 *   ```tsx
 *   <PlaybackRateButton />
 *
 *   <PlaybackRateButton
 *   render={(props, state) => (
 *   <button {...props}>
 *   {state.rate}&times;
 *   </button>
 *   )}
 *   />
 *   ```;
 */
export const PlaybackRateButton = createMediaButton<PlaybackRateButtonCore, PlaybackRateButtonProps>({
  displayName: 'PlaybackRateButton',
  core: PlaybackRateButtonCore,
  stateAttrMap: PlaybackRateButtonDataAttrs,
  selector: selectPlaybackRate,
  action: (core, state) => core.cycle(state),
  hotkeyAction: 'speedUp',
});

export namespace PlaybackRateButton {
  export type Props = PlaybackRateButtonProps;
  export type State = PlaybackRateButtonCore.State;
}
