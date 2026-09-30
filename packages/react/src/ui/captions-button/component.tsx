'use client';

import { CaptionsButtonCore, CaptionsButtonDataAttrs } from '@videojs/core';
import { selectTextTrack } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface CaptionsButtonProps
  extends UIComponentProps<'button', CaptionsButtonCore.State>, CaptionsButtonCore.Props {}

/** A button that toggles captions. */
export const CaptionsButton = createMediaButton<CaptionsButtonCore, CaptionsButtonProps>({
  displayName: 'CaptionsButton',
  core: CaptionsButtonCore,
  stateAttrMap: CaptionsButtonDataAttrs,
  selector: selectTextTrack,
  action: (core, state) => core.toggle(state),
  hotkeyAction: 'toggleSubtitles',
  isSupported: (state) => !state.hidden,
});

export namespace CaptionsButton {
  export type Props = CaptionsButtonProps;
  export type State = CaptionsButtonCore.State;
}
