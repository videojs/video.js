'use client';

import { VolumePopoverCore, type VolumePopoverState as CoreVolumePopoverState } from '@videojs/core';
import { selectVolume } from '@videojs/core/dom';
import type { MediaVolumeState } from '@videojs/media';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { usePlayer } from '../../player/context';
import { Popover } from '../popover';
import { usePopoverContext } from '../popover/context';
import type { PopoverRootProps } from '../popover/root';
import { VolumePopoverContextProvider } from './context';

const unavailableVolume: MediaVolumeState = {
  volume: 0,
  muted: false,
  volumeAvailability: 'unsupported',
  mutedAvailability: 'unsupported',
  setVolume: () => 0,
  setMuted: () => false,
};

export interface VolumePopoverRootProps extends PopoverRootProps {}

/** Owns the popover interaction lifecycle and provides volume availability to the parts. */
export function VolumePopoverRoot({ children, ...props }: VolumePopoverRootProps): ReactNode {
  return (
    <Popover.Root {...props}>
      <VolumePopoverState {...props}>{children}</VolumePopoverState>
    </Popover.Root>
  );
}

/**
 * Derives the volume-aware state inside the popover context. It subscribes to volume, owns the core, and reads the
 * core's state all in one component: a core mutated in one component and read in another is invisible to React
 * Compiler, which memoised the reading element and left the trigger in its mute-only fallback after volume became
 * available.
 */
function VolumePopoverState({ children, ...props }: VolumePopoverRootProps): ReactNode {
  // React Compiler cannot track state read through the mutable core instance.
  'use no memo';

  const volume = usePlayer(selectVolume);
  const { popover, state: popoverState } = usePopoverContext();
  const [core] = useState(() => new VolumePopoverCore(props));

  core.setProps(props);
  core.setMedia(volume ?? unavailableVolume);
  core.setInput({ active: popoverState.open, status: popoverState.status });
  const state = core.getState();

  useEffect(() => {
    if (state.hidden) popover.close('imperative-action');
  }, [popover, state.hidden]);

  return <VolumePopoverContextProvider value={{ state }}>{children}</VolumePopoverContextProvider>;
}

export namespace VolumePopoverRoot {
  export type Props = VolumePopoverRootProps;
  export type State = CoreVolumePopoverState;
}
