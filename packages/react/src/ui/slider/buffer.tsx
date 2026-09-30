'use client';

import type { SliderState } from '@videojs/core';

import type { UIComponentProps } from '../../utils/types';
import { createContextPart } from '../create-context-part';
import { useSliderContext } from './context';

export interface SliderBufferProps extends UIComponentProps<'div', SliderState> {}

/** Displays the buffered range on the slider track. */
export const SliderBuffer = createContextPart<SliderBufferProps, SliderState>({
  displayName: 'SliderBuffer',
  tag: 'div',
  useContext: useSliderContext,
});

export namespace SliderBuffer {
  export type Props = SliderBufferProps;
}
