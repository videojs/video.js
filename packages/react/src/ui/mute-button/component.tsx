'use client';

import { MuteButtonCore, MuteButtonDataAttrs } from '@videojs/core';
import { selectVolume } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface MuteButtonProps extends UIComponentProps<'button', MuteButtonCore.State>, MuteButtonCore.Props {}

/** A button that toggles mute state. */
export const MuteButton = createMediaButton<MuteButtonCore, MuteButtonProps>({
  displayName: 'MuteButton',
  core: MuteButtonCore,
  stateAttrMap: MuteButtonDataAttrs,
  selector: selectVolume,
  action: (core, state) => core.toggle(state),
  hotkeyAction: 'toggleMuted',
  isSupported: (state) => !state.hidden,
});

export namespace MuteButton {
  export type Props = MuteButtonProps;
  export type State = MuteButtonCore.State;
}
