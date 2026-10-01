'use client';

import {
  AirPlayButtonCore,
  AirPlayButtonDataAttrs,
  type AirPlayButtonProps as CoreAirPlayButtonProps,
  type AirPlayButtonState,
} from '@videojs/core';
import { selectRemotePlayback } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface AirPlayButtonProps extends UIComponentProps<'button', AirPlayButtonState>, CoreAirPlayButtonProps {}

/** A button that toggles AirPlay to a remote device. */
export const AirPlayButton = createMediaButton<AirPlayButtonCore, AirPlayButtonProps>({
  displayName: 'AirPlayButton',
  core: AirPlayButtonCore,
  stateAttrMap: AirPlayButtonDataAttrs,
  selector: selectRemotePlayback,
  action: (core, state) => core.toggle(state),
  isSupported: (state) => !state.hidden,
});

export namespace AirPlayButton {
  export type Props = AirPlayButtonProps;
  export type State = AirPlayButtonState;
}
