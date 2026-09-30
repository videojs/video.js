'use client';

import { PiPButtonCore, PiPButtonDataAttrs } from '@videojs/core';
import { selectPiP } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface PiPButtonProps extends UIComponentProps<'button', PiPButtonCore.State>, PiPButtonCore.Props {}

/** A button that toggles picture-in-picture. */
export const PiPButton = createMediaButton<PiPButtonCore, PiPButtonProps>({
  displayName: 'PiPButton',
  core: PiPButtonCore,
  stateAttrMap: PiPButtonDataAttrs,
  selector: selectPiP,
  action: (core, state) => core.toggle(state),
  hotkeyAction: 'togglePictureInPicture',
  isSupported: (state) => !state.hidden,
});

export namespace PiPButton {
  export type Props = PiPButtonProps;
  export type State = PiPButtonCore.State;
}
