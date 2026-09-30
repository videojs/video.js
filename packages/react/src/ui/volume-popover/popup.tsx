'use client';

import { VolumePopoverDataAttrs } from '@videojs/core';
import { getStateDataAttrs } from '@videojs/core/dom';
import { forwardRef } from 'react';

import { PopoverPopup, type PopoverPopupProps } from '../popover/popup';
import { useVolumePopoverContext } from './context';

export interface VolumePopoverPopupProps extends PopoverPopupProps {}

/** Positioned volume content. Omitted when volume level controls are unavailable. */
export const VolumePopoverPopup = forwardRef<HTMLDivElement, VolumePopoverPopupProps>(
  function VolumePopoverPopup(props, forwardedRef) {
    const { state } = useVolumePopoverContext();
    if (state.hidden) return null;

    return <PopoverPopup ref={forwardedRef} {...getStateDataAttrs(state, VolumePopoverDataAttrs)} {...props} />;
  }
);

export namespace VolumePopoverPopup {
  export type Props = VolumePopoverPopupProps;
}
