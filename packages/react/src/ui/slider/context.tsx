'use client';

import type { SliderInput, SliderState, StateAttrMap } from '@videojs/core';
import type { SliderThumbProps } from '@videojs/core/dom';
import type { State } from '@videojs/store';
import type { ProviderProps, RefCallback } from 'react';
import { createContext, useContext, useSyncExternalStore } from 'react';

export interface SliderContextValue {
  state: SliderState;
  /** Pointer position converted to the value domain (not 0–100 percent). */
  pointerValue: number;
  input?: State<SliderInput> | undefined;
  getPointerValue?: ((percent: number) => number) | undefined;
  thumbRef: RefCallback<HTMLElement>;
  thumbProps: SliderThumbProps;
  stateAttrMap: StateAttrMap<SliderState>;
  getAttrs: (state: SliderState) => object;
  formatValue?: ((value: number, type: 'current' | 'pointer') => string) | undefined;
}

const SliderContext = createContext<SliderContextValue | null>(null);

type SliderProviderProps = ProviderProps<SliderContextValue>;

export function SliderProvider({ value, children }: SliderProviderProps) {
  return <SliderContext.Provider value={value}>{children}</SliderContext.Provider>;
}

export function useSliderContext(): SliderContextValue {
  const ctx = useContext(SliderContext);
  if (!ctx) throw new Error('Slider compound components must be used within a Slider.Root');

  return ctx;
}

export function useSliderPointerValue(enabled = true): number {
  const context = useSliderContext();
  const percent = useSyncExternalStore(
    (onChange) => context.input?.subscribe(onChange) ?? (() => {}),
    () => (enabled ? (context.input?.current.pointerPercent ?? null) : null),
    () => (enabled ? (context.input?.current.pointerPercent ?? null) : null)
  );

  return percent === null ? context.pointerValue : (context.getPointerValue?.(percent) ?? context.pointerValue);
}
