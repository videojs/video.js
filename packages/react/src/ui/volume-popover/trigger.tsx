'use client';

import { forwardRef } from 'react';

import { renderElement } from '../../utils/use-render';
import { usePopoverContext } from '../popover/context';
import { PopoverTrigger, type PopoverTriggerProps } from '../popover/trigger';
import { useVolumePopoverContext } from './context';

export interface VolumePopoverTriggerProps extends PopoverTriggerProps {}

/** Opens the volume popup, or renders its mute-button fallback when volume level controls are unavailable. */
export const VolumePopoverTrigger = forwardRef<HTMLButtonElement, VolumePopoverTriggerProps>(
  function VolumePopoverTrigger({ render, className, style, ...elementProps }, forwardedRef) {
    const { state: popoverState } = usePopoverContext();
    const { state } = useVolumePopoverContext();

    if (!state.hidden) {
      return (
        <PopoverTrigger ref={forwardedRef} render={render} className={className} style={style} {...elementProps} />
      );
    }

    return renderElement(
      'button',
      { render, className, style },
      {
        state: popoverState,
        ref: forwardedRef,
        props: [{ type: 'button' as const }, elementProps],
      }
    );
  }
);

export namespace VolumePopoverTrigger {
  export type Props = VolumePopoverTriggerProps;
}
