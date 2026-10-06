'use client';

import type { SliderInput, SliderState } from '@videojs/core';
import {
  createSlider,
  type SliderApi,
  type SliderOptions,
  type SliderRootProps,
  type SliderRootStyle,
  type SliderThumbProps,
  selectControls,
} from '@videojs/core/dom';
import { useSnapshot } from '@videojs/store/react';
import { applyStyles } from '@videojs/utils/dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useOptionalPlayer } from '../../player/context';
import { useDestroy } from '../../utils/use-destroy';
import { useForceRender } from '../../utils/use-force-render';
import { useLatestRef } from '../../utils/use-latest-ref';

export interface UseSliderOptions<State extends SliderState = SliderState> extends Pick<
  SliderOptions,
  | 'getPercent'
  | 'getStepPercent'
  | 'getLargeStepPercent'
  | 'changeThrottle'
  | 'onValueChange'
  | 'onValueCommit'
  | 'onPressStart'
  | 'onPressEnd'
  | 'onDragStart'
  | 'onDragEnd'
> {
  computeState: (input: SliderInput) => State;
  /** Optional fill projection while a seek transition is finishing. */
  getStyleState?: ((state: State) => State) | undefined;
  orientation?: 'horizontal' | 'vertical' | undefined;
  disabled?: boolean | undefined;
  /** Adjust a raw 0–100 percent for thumb alignment. Called for fill and pointer percents. */
  adjustPercent?: ((rawPercent: number, thumbSize: number, trackSize: number) => number) | undefined;
  /** Compute CSS variable map from the (possibly alignment-adjusted) state. */
  getCSSVars: (state: State) => Record<string, string>;
}

export interface UseSliderReturnValue<State extends SliderState = SliderState> {
  state: State;
  input: SliderApi['input'];
  cssVars: Record<string, string>;
  rootRef: React.RefCallback<HTMLElement>;
  thumbRef: React.RefCallback<HTMLElement>;
  rootProps: SliderRootProps;
  rootStyle: SliderRootStyle;
  thumbProps: SliderThumbProps;
}

/**
 * Manages slider input lifecycle for React.
 *
 * Wraps `createSlider()` from `@videojs/core/dom` and subscribes to its input state via `useSnapshot`. Returns split
 * props for the root (pointer events) and thumb (keyboard/focus) elements.
 */
export function useSlider<State extends SliderState = SliderState>(
  options: UseSliderOptions<State>
): UseSliderReturnValue<State> {
  const optionsRef = useLatestRef(options);

  const controls = useOptionalPlayer(selectControls);
  const requestControlsLock = controls?.requestControlsLock;
  const releaseControlsLockRef = useRef<(() => void) | null>(null);

  const releaseControlsLock = useCallback(() => {
    releaseControlsLockRef.current?.();
    releaseControlsLockRef.current = null;
  }, []);

  useEffect(() => releaseControlsLock, [releaseControlsLock]);

  const rootElementRef = useRef<HTMLElement | null>(null);
  const thumbElementRef = useRef<HTMLElement | null>(null);
  const forceRender = useForceRender();

  // Lazy-init the slider handle. Stable across re-renders.
  const [slider] = useState<SliderApi>(() => {
    const stableOptions: SliderOptions = {
      getElement: () => rootElementRef.current!,
      getThumbElement: () => thumbElementRef.current,
      getOrientation: () => optionsRef.current.orientation ?? 'horizontal',
      isDisabled: () => optionsRef.current.disabled ?? false,
      getPercent: () => optionsRef.current.getPercent(),
      getStepPercent: () => optionsRef.current.getStepPercent(),
      getLargeStepPercent: () => optionsRef.current.getLargeStepPercent(),
      changeThrottle: optionsRef.current.changeThrottle,
      adjustPercent: optionsRef.current.adjustPercent,
      onValueChange: (percent) => optionsRef.current.onValueChange?.(percent),
      onValueCommit: (percent) => optionsRef.current.onValueCommit?.(percent),
      onPressStart: () => {
        releaseControlsLockRef.current ??= requestControlsLock?.() ?? null;
        optionsRef.current.onPressStart?.();
      },
      onPressEnd: () => {
        releaseControlsLock();
        optionsRef.current.onPressEnd?.();
      },
      onDragStart: () => optionsRef.current.onDragStart?.(),
      onDragEnd: () => optionsRef.current.onDragEnd?.(),
    };

    return createSlider(stableOptions);
  });

  useDestroy(slider);

  // Percentage changes are rendered directly below. React only needs to
  // re-render when interaction state changes.
  const interaction = useSnapshot(slider.input, ({ dragging, pointing, focused }) => ({
    dragging,
    pointing,
    focused,
  }));
  const input = { ...slider.input.current, ...interaction };

  // Compute derived state from input + caller-provided projection.
  const state = options.computeState(input);

  // Force a synchronous re-render after mount so edge thumb alignment
  // can read DOM measurements from the now-populated element refs.
  useLayoutEffect(() => {
    if (state.thumbAlignment === 'edge' && rootElementRef.current && thumbElementRef.current) {
      forceRender();
    }
  }, [state.thumbAlignment]);

  // Adjust CSS var percents for edge thumb alignment using live DOM measurements.
  const styleState = options.getStyleState?.(state) ?? state;
  const cssVars = options.getCSSVars(slider.adjustForAlignment(styleState));

  const syncStyles = useCallback(
    (element = rootElementRef.current) => {
      if (!element) return;

      const { dragging, pointing } = slider.input.current;
      // Keyboard values come from the controlled state. Applying them here would
      // briefly write the previous value before the caller handles the key.
      if (!dragging && !pointing) return;

      const next = optionsRef.current.computeState(slider.input.current);
      const visual = optionsRef.current.getStyleState?.(next) ?? next;

      applyStyles(element, optionsRef.current.getCSSVars(slider.adjustForAlignment(visual)));
    },
    [slider]
  );

  useLayoutEffect(() => {
    syncStyles();
    return slider.input.subscribe(syncStyles);
  }, [slider, syncStyles]);

  // Ref callbacks for root and thumb elements.
  const rootRef = useCallback(
    (element: HTMLElement | null) => {
      rootElementRef.current = element;
      syncStyles(element);
    },
    [syncStyles]
  );

  const thumbRef = useCallback((element: HTMLElement | null) => {
    thumbElementRef.current = element;
  }, []);

  return {
    state,
    input: slider.input,
    cssVars,
    rootRef,
    thumbRef,
    rootProps: slider.rootProps,
    rootStyle: slider.rootStyle,
    thumbProps: slider.thumbProps,
  };
}

export namespace useSlider {
  export type Options = UseSliderOptions;
  export type ReturnValue = UseSliderReturnValue;
}
