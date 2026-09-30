'use client';

import type { SliderState } from '@videojs/core';

import type { UIComponentProps } from '../../utils/types';
import { createContextPart } from '../create-context-part';
import { useSliderContext } from './context';

export interface SliderFillProps extends UIComponentProps<'div', SliderState> {}

/** Displays the filled portion from start to the current value. */
export const SliderFill = createContextPart<SliderFillProps, SliderState>({
  displayName: 'SliderFill',
  tag: 'div',
  useContext: useSliderContext,
});

export namespace SliderFill {
  export type Props = SliderFillProps;
}
