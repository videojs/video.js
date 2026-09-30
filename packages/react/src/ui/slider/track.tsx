'use client';

import type { SliderState } from '@videojs/core';

import type { UIComponentProps } from '../../utils/types';
import { createContextPart } from '../create-context-part';
import { useSliderContext } from './context';

export interface SliderTrackProps extends UIComponentProps<'div', SliderState> {}

/** Contains the slider's visual track and interactive hit zone. */
export const SliderTrack = createContextPart<SliderTrackProps, SliderState>({
  displayName: 'SliderTrack',
  tag: 'div',
  useContext: useSliderContext,
});

export namespace SliderTrack {
  export type Props = SliderTrackProps;
}
