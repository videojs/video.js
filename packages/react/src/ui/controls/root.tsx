'use client';

import { ControlsCore, ControlsDataAttrs, type ControlsProps, type ControlsState } from '@videojs/core';
import { logMissingFeature, selectControls } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { usePlayer } from '../../player/context';
import { ControlsContextProvider } from './context';

export interface ControlsRootProps extends ControlsProps {
  children?: ReactNode | undefined;
}

/** Manages controls state and provides it to the compound parts. Does not render an element. */
export function ControlsRoot({
  children,
  visibility = ControlsCore.defaultProps.visibility,
}: ControlsRootProps): ReactNode {
  // React Compiler cannot track state read through the mutable core instance.
  'use no memo';

  const controls = usePlayer(selectControls);
  const [core] = useState(() => new ControlsCore());

  core.setProps({ visibility });
  core.setMedia(controls ?? null);

  const state = core.getState();

  if (!state) {
    if (__DEV__) logMissingFeature('Controls.Root', 'controls');

    return null;
  }

  return (
    <ControlsContextProvider value={{ state, stateAttrMap: ControlsDataAttrs }}>{children}</ControlsContextProvider>
  );
}

export namespace ControlsRoot {
  export type Props = ControlsRootProps;
  export type State = ControlsState;
}
