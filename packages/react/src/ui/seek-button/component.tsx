'use client';

import { SeekButtonCore, SeekButtonDataAttrs } from '@videojs/core';
import { selectTime } from '@videojs/core/dom';

import type { UIComponentProps } from '../../utils/types';
import { createMediaButton } from '../create-media-button';

export interface SeekButtonProps extends UIComponentProps<'button', SeekButtonCore.State>, SeekButtonCore.Props {}

/**
 * A button that seeks forward or backward by a configurable number of seconds.
 *
 * @example
 *   ```tsx
 *   <SeekButton seconds={-10} />
 *
 *   <SeekButton
 *   seconds={30}
 *   render={(props, state) => (
 *   <button {...props}>
 *   {state.direction === 'backward' ? <RewindIcon /> : <FastForwardIcon />}
 *   </button>
 *   )}
 *   />
 *   ```;
 */
export const SeekButton = createMediaButton<SeekButtonCore, SeekButtonProps>({
  displayName: 'SeekButton',
  core: SeekButtonCore,
  stateAttrMap: SeekButtonDataAttrs,
  selector: selectTime,
  action: (core, state) => core.seek(state),
  hotkeyAction: 'seekStep',
  hotkeyValue: (props) => (typeof props.seconds === 'number' ? props.seconds : SeekButtonCore.defaultProps.seconds),
});

export namespace SeekButton {
  export type Props = SeekButtonProps;
  export type State = SeekButtonCore.State;
}
