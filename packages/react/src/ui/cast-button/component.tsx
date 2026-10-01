'use client';

import {
  CastButtonCore,
  CastButtonDataAttrs,
  type CastButtonProps as CoreCastButtonProps,
  type CastButtonState,
} from '@videojs/core';
import { selectRemotePlayback } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface CastButtonProps extends UIComponentProps<'button', CastButtonState>, CoreCastButtonProps {}

/** A button that toggles casting to a remote device. */
export const CastButton = createMediaButton<CastButtonCore, CastButtonProps>({
  displayName: 'CastButton',
  core: CastButtonCore,
  stateAttrMap: CastButtonDataAttrs,
  selector: selectRemotePlayback,
  action: (core, state) => core.toggle(state),
  isSupported: (state) => !state.hidden,
});

export namespace CastButton {
  export type Props = CastButtonProps;
  export type State = CastButtonState;
}
