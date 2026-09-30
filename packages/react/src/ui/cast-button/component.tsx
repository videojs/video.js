'use client';

import { CastButtonCore, CastButtonDataAttrs } from '@videojs/core';
import { selectRemotePlayback } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface CastButtonProps extends UIComponentProps<'button', CastButtonCore.State>, CastButtonCore.Props {}

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
  export type State = CastButtonCore.State;
}
