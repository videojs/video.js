'use client';

import type { IndicatorLifecycleState, InputActionEvent, MediaSnapshot } from '@videojs/core';
import type { State as StoreState } from '@videojs/store';
import { useState, useSyncExternalStore } from 'react';

import { useDestroy } from '../../utils/use-destroy';
import { useIndicatorVisibility } from './use-indicator-visibility';
import { useInputActionSubscription } from './use-input-action-subscription';
import { type RenderedIndicatorOptions, useRenderedIndicatorState } from './use-rendered-indicator-state';

interface InputIndicatorRootCore<IndicatorState extends IndicatorLifecycleState, Props> {
  readonly state: StoreState<IndicatorState>;
  setProps(props: Props): void;
  destroy(): void;
  close(): void;
  processEvent(event: InputActionEvent, snapshot: MediaSnapshot): boolean;
}

export function useInputIndicatorRoot<IndicatorState extends IndicatorLifecycleState, Props>(
  createCore: () => InputIndicatorRootCore<IndicatorState, Props>,
  props: Props,
  options?: RenderedIndicatorOptions
) {
  const [core] = useState(createCore);

  useDestroy(core);
  core.setProps(props);
  const showIndicator = useIndicatorVisibility(() => core.close());

  useInputActionSubscription((event, snapshot) => {
    if (core.processEvent(event, snapshot)) showIndicator();
  });

  const currentState = useSyncExternalStore(
    (callback) => core.state.subscribe(callback),
    () => core.state.current,
    () => core.state.current
  );

  return useRenderedIndicatorState(currentState, options);
}
