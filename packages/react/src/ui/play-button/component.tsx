'use client';

import { PlayButtonCore, PlayButtonDataAttrs } from '@videojs/core';
import { selectPlayback } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface PlayButtonProps extends UIComponentProps<'button', PlayButtonCore.State>, PlayButtonCore.Props {}

/**
 * A button that toggles playback.
 *
 * @example
 *   ```tsx
 *   <PlayButton />
 *
 *   <PlayButton
 *   render={(props, state) => (
 *   <button {...props}>
 *   {state.paused ? <PlayIcon /> : <PauseIcon />}
 *   </button>
 *   )}
 *   />
 *   ```;
 */
export const PlayButton = createMediaButton<PlayButtonCore, PlayButtonProps>({
  displayName: 'PlayButton',
  core: PlayButtonCore,
  stateAttrMap: PlayButtonDataAttrs,
  selector: selectPlayback,
  action: (core, state) => core.toggle(state),
  hotkeyAction: 'togglePaused',
});

export namespace PlayButton {
  export type Props = PlayButtonProps;
  export type State = PlayButtonCore.State;
}
