'use client';

import {
  FullscreenButtonCore,
  FullscreenButtonDataAttrs,
  type FullscreenButtonProps as CoreFullscreenButtonProps,
  type FullscreenButtonState,
} from '@videojs/core';
import { selectFullscreen } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface FullscreenButtonProps
  extends UIComponentProps<'button', FullscreenButtonState>, CoreFullscreenButtonProps {}

/** A button that toggles fullscreen. */
export const FullscreenButton = createMediaButton<FullscreenButtonCore, FullscreenButtonProps>({
  displayName: 'FullscreenButton',
  core: FullscreenButtonCore,
  stateAttrMap: FullscreenButtonDataAttrs,
  selector: selectFullscreen,
  action: (core, state) => core.toggle(state),
  hotkeyAction: 'toggleFullscreen',
  isSupported: (state) => !state.hidden,
  focusContainerOnPointerActivation: true,
});

export namespace FullscreenButton {
  export type Props = FullscreenButtonProps;
  export type State = FullscreenButtonState;
}
