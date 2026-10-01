import { createState, type State } from '@videojs/store';
import { isPointInElement, observeResize } from '@videojs/utils/dom';
import { throttle } from '@videojs/utils/function';
import { clamp, roundToStep } from '@videojs/utils/number';
import { isNull } from '@videojs/utils/predicate';

import type { SliderInput, SliderState } from '../../../core/ui/slider/core';
import { getPercentFromPointerEvent } from '../../utils/pointer';
import type { UIKeyboardEvent, UIPointerEvent } from '../event';

const DRAG_THRESHOLD = 3;

export interface SliderOptions {
  /** Element reference for getBoundingClientRect() and pointer capture. */
  getElement: () => HTMLElement;

  /** Optional thumb element reference for programmatic focus on pointerdown. */
  getThumbElement?: (() => HTMLElement | null) | undefined;

  getOrientation: () => 'horizontal' | 'vertical';
  isDisabled: () => boolean;

  /** Current value as 0–100 percent. Used by keyboard stepping. */
  getPercent: () => number;
  /** Step size as 0–100 percent. Arrow keys. */
  getStepPercent: () => number;
  /** Large step size as 0–100 percent. Page Up/Down, Shift+Arrow. */
  getLargeStepPercent: () => number;

  /**
   * Leading+trailing throttle (ms) for `onValueChange` during drag. When `> 0`, `onValueChange` fires immediately on
   * the first drag move (leading edge), then at most once per window during subsequent moves. `0` (default) disables
   * throttling — `onValueChange` fires on every pointermove.
   */
  changeThrottle?: number | undefined;
  /** Adjust a raw 0–100 percent for thumb alignment. Enables `adjustForAlignment()`. */
  adjustPercent?: ((rawPercent: number, thumbSize: number, trackSize: number) => number) | undefined;
  /** Fires continuously as the value changes (every pointermove during drag, keyboard steps). */
  onValueChange?: ((percent: number) => void) | undefined;
  /** Fires once when the user commits the value (pointer release, keyboard step). */
  onValueCommit?: ((percent: number) => void) | undefined;
  /**
   * Fires on pointer down, before the drag threshold is crossed. Use for work that must span the whole press, such as
   * holding controls visible while the pointer rests on the slider.
   */
  onPressStart?: (() => void) | undefined;
  /** Fires when the press ends, whether or not it became a drag. */
  onPressEnd?: (() => void) | undefined;
  /** Fires once the pointer moves past the drag threshold. */
  onDragStart?: (() => void) | undefined;
  onDragEnd?: (() => void) | undefined;
  /** Called when the root element resizes (e.g. gains layout inside a popover). */
  onResize?: (() => void) | undefined;
}

export interface SliderRootProps {
  onPointerDown: (event: UIPointerEvent) => void;
  onPointerMove: (event: UIPointerEvent) => void;
  onPointerUp: (event: UIPointerEvent) => void;
  onPointerLeave: (event: UIPointerEvent) => void;
  onLostPointerCapture: () => void;
}

export interface SliderRootStyle extends Record<string, string> {
  touchAction: string;
  userSelect: string;
}

export interface SliderThumbProps {
  onKeyDownCapture: (event: UIKeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export interface SliderApi {
  input: State<SliderInput>;
  rootProps: SliderRootProps;
  rootStyle: SliderRootStyle;
  thumbProps: SliderThumbProps;
  /**
   * Adjust `fillPercent` and `pointerPercent` for edge thumb alignment using live DOM measurements from the root/thumb
   * elements. No-op when `adjustPercent` was not provided or `thumbAlignment` is not `'edge'`.
   */
  adjustForAlignment: <S extends SliderState>(state: S) => S;
  destroy: () => void;
}

/** @internal */
export function createSlider(options: SliderOptions): SliderApi {
  const input = createState<SliderInput>({
    pointerPercent: 0,
    dragPercent: 0,
    dragging: false,
    pointing: false,
    focused: false,
  });

  const abort = new AbortController();
  const changeThrottleMs = options.changeThrottle ?? 0;

  let isPointerDown = false,
    cachedRect: DOMRect | null = null,
    capturedPointerId: number | null = null,
    pointerDownX = 0,
    pointerDownY = 0,
    lastDragPercent = 0,
    lastKeyPercent: number | null = null,
    committedOnRelease = false,
    pointingOnRelease = false;

  const throttledChange =
    changeThrottleMs > 0
      ? throttle((percent: number) => options.onValueChange?.(percent), changeThrottleMs, { leading: true })
      : null;

  /** Fire `onValueChange` — throttled during drag when `changeThrottle > 0`. */
  function fireChange(percent: number, duringDrag: boolean): void {
    if (duringDrag && throttledChange) {
      throttledChange(percent);
    } else {
      options.onValueChange?.(percent);
    }
  }

  function releaseCapture(): void {
    if (isNull(capturedPointerId)) return;

    const id = capturedPointerId;

    capturedPointerId = null;

    try {
      options.getElement().releasePointerCapture(id);
    } catch {
      // Pointer may already have been released by the browser (e.g., after pointerup).
    }
  }

  function endDrag(): void {
    if (!isPointerDown) return;

    const pointing = committedOnRelease && pointingOnRelease;
    const wasDragging = input.current.dragging;

    // Fire a final commit if pointerup didn't already handle it.
    if (!committedOnRelease) {
      options.onValueCommit?.(lastDragPercent);
    }

    isPointerDown = false;
    input.patch({ dragging: false, pointing });

    if (wasDragging) options.onDragEnd?.();

    options.onPressEnd?.();

    committedOnRelease = false;
    pointingOnRelease = false;
    cleanup();
  }

  function cleanup() {
    throttledChange?.cancel();
    capturedPointerId = null;
    cachedRect = null;
  }

  // --- Root props ---
  const rootProps: SliderRootProps = {
    onPointerDown(event) {
      if (options.isDisabled()) return;

      // The slider fully owns pointer interactions — prevent parent gesture
      // coordinators from misinterpreting slider taps as surface gestures.
      event.stopPropagation();

      // Prevent the browser's default mousedown focus behavior. Without this,
      // clicking a non-focusable child (e.g. the track) causes the browser to
      // move focus away from the thumb after our programmatic `focus()` call,
      // which can trigger unrelated `focusout` handlers (e.g. popover close).
      event.preventDefault();

      const el = options.getElement();

      cachedRect = el.getBoundingClientRect();
      committedOnRelease = false;
      pointingOnRelease = false;

      releaseCapture();
      capturedPointerId = event.pointerId;
      el.setPointerCapture(event.pointerId);

      const percent = getPercentFromPointerEvent(event, cachedRect, options.getOrientation());

      isPointerDown = true;
      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
      lastDragPercent = percent;
      lastKeyPercent = percent;
      input.patch({
        pointing: true,
        pointerPercent: percent,
        dragPercent: percent,
      });

      options.onPressStart?.();

      options.onValueChange?.(percent);

      // Focus the thumb for keyboard follow-up and screen reader tracking.
      options.getThumbElement?.()?.focus({
        preventScroll: true,
        focusVisible: false,
      });
    },

    onPointerMove(event) {
      if (options.isDisabled()) return;

      // Pointer is captured — this is a drag move.
      if (!isNull(capturedPointerId)) {
        // Stale drag safety: if buttons === 0 for non-touch, browser lost the pointerup.
        if (event.pointerType !== 'touch' && event.buttons === 0) {
          endDrag();
          return;
        }

        const percent = getPercentFromPointerEvent(event, cachedRect!, options.getOrientation());
        const startingDrag = !input.current.dragging;

        if (startingDrag) {
          const distance = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY);
          if (distance < DRAG_THRESHOLD) return;
        }

        lastDragPercent = percent;
        lastKeyPercent = percent;
        input.patch({
          dragging: true,
          dragPercent: percent,
          pointerPercent: percent,
        });

        if (startingDrag) options.onDragStart?.();

        fireChange(percent, true);

        return;
      }

      // No capture — hover preview.
      const el = options.getElement();
      const rect = el.getBoundingClientRect();
      const percent = getPercentFromPointerEvent(event, rect, options.getOrientation());

      input.patch({ pointing: true, pointerPercent: percent });
    },

    onPointerUp(event) {
      if (options.isDisabled()) return;

      // The slider fully owns pointer interactions — prevent parent gesture
      // coordinators from misinterpreting slider taps as surface gestures.
      event.stopPropagation();

      if (isNull(capturedPointerId)) return;

      const percent = getPercentFromPointerEvent(event, cachedRect!, options.getOrientation());

      pointingOnRelease = event.pointerType !== 'touch' && isPointInElement(options.getElement(), event);

      // Cancel any pending throttled change before the final unthrottled pair.
      throttledChange?.cancel();
      options.onValueChange?.(percent);
      options.onValueCommit?.(percent);
      committedOnRelease = true;
    },

    onPointerLeave() {
      if (!isNull(capturedPointerId)) return;

      input.patch({ pointing: false });
    },

    onLostPointerCapture() {
      endDrag();
    },
  };

  // --- Thumb props ---
  const thumbProps: SliderThumbProps = {
    // Capture before the player hotkey coordinator handles the same key on the container.
    onKeyDownCapture(event) {
      if (options.isDisabled()) {
        if (event.key !== 'Tab') event.preventDefault();

        return;
      }

      const stepPercent = options.getStepPercent();
      const largeStepPercent = options.getLargeStepPercent();
      const currentPercent = event.repeat && !isNull(lastKeyPercent) ? lastKeyPercent : options.getPercent();

      // Round to nearest step before stepping to prevent drift from pointer drags.
      const rounded = roundToStep(currentPercent, stepPercent, 0);

      const step = event.shiftKey ? largeStepPercent : stepPercent;

      let newPercent: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
          newPercent = rounded + step;
          break;
        case 'ArrowLeft':
          newPercent = rounded - step;
          break;
        case 'ArrowUp':
          newPercent = rounded + step;
          break;
        case 'ArrowDown':
          newPercent = rounded - step;
          break;
        case 'PageUp':
          newPercent = rounded + largeStepPercent;
          break;
        case 'PageDown':
          newPercent = rounded - largeStepPercent;
          break;
        case 'Home':
          newPercent = 0;
          break;
        case 'End':
          newPercent = 100;
          break;
      }

      if (newPercent !== null) {
        event.preventDefault();

        newPercent = clamp(newPercent, 0, 100);
        lastKeyPercent = newPercent;
        input.patch({
          pointerPercent: newPercent,
          dragPercent: newPercent,
          pointing: false,
        });
        options.onValueChange?.(newPercent);
        options.onValueCommit?.(newPercent);
      }
    },

    onFocus() {
      input.patch({ focused: true });
    },

    onBlur() {
      input.patch({ focused: false });
    },
  };

  function adjustForAlignment<S extends SliderState>(state: S): S {
    if (!options.adjustPercent || state.thumbAlignment !== 'edge') return state;

    const rootEl = options.getElement();
    const thumbEl = options.getThumbElement?.();
    if (!thumbEl) return state;

    const isHorizontal = state.orientation === 'horizontal';
    const thumbSize = isHorizontal ? thumbEl.offsetWidth : thumbEl.offsetHeight;
    const trackSize = isHorizontal ? rootEl.offsetWidth : rootEl.offsetHeight;

    const adjusted: S = {
      ...state,
      fillPercent: options.adjustPercent(state.fillPercent, thumbSize, trackSize),
      pointerPercent: options.adjustPercent(state.pointerPercent, thumbSize, trackSize),
    };

    return adjusted;
  }

  let stopObservingResize: (() => void) | null = null;

  if (options.onResize) {
    stopObservingResize = observeResize(options.getElement(), () => options.onResize!());
  }

  const rootStyle: SliderRootStyle = {
    touchAction: 'none',
    userSelect: 'none',
  };

  return {
    input,
    rootProps,
    rootStyle,
    thumbProps,
    adjustForAlignment,
    destroy() {
      if (abort.signal.aborted) return;

      abort.abort();
      stopObservingResize?.();
      releaseCapture();

      cleanup();
    },
  };
}
