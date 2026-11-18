import type { SliderInput } from '@videojs/core';
import { createState, type State } from '@videojs/store';
import { type Throttled, throttle } from '@videojs/utils/function';
import { clamp } from '@videojs/utils/number';

/** Matches the DOM slider: movement under this many points is a press, not a drag. */
const DRAG_THRESHOLD = 3;

export interface SliderGestureOptions {
  /** Leading+trailing throttle (ms) for `onValueChange` while dragging. `0` fires on every move. */
  changeThrottle?: number | undefined;
  /** Fires as the value changes during a drag. */
  onValueChange?: ((percent: number) => void) | undefined;
  /** Fires once when the touch ends, with the final position. */
  onValueCommit?: ((percent: number) => void) | undefined;
  /** Fires once the touch moves past the drag threshold. */
  onDragStart?: (() => void) | undefined;
  /** Fires when a drag that started ends or is cancelled. */
  onDragEnd?: (() => void) | undefined;
}

export interface SliderGesture {
  /** Pointer and drag state for `SliderCore.setInput`. */
  readonly input: State<SliderInput>;
  /** Track length in points, from the track's `onLayout`. */
  setTrackSize(size: number): void;
  /** A touch began at `position` points from the track start. */
  press(position: number): void;
  /** The touch moved to `position` points from the track start. */
  move(position: number): void;
  /** The touch ended. Commits the last position. */
  release(): void;
  /** End the touch without committing, such as on unmount. The gesture stays usable afterwards. */
  cancel(): void;
}

/**
 * The slider's touch state machine without a view: positions in, `SliderInput` and value callbacks out.
 *
 * The DOM equivalent is `createSlider` in `@videojs/core/dom`, which reads pointer events and element rects directly.
 * This one takes track-relative positions so the react-native binding only has to translate responder events, and so it
 * can be tested without a renderer. Keyboard stepping has no counterpart here; assistive-technology increments go
 * through the binding's accessibility actions instead.
 */
export function createSliderGesture(options: SliderGestureOptions): SliderGesture {
  const input = createState<SliderInput>({
    pointerPercent: 0,
    dragPercent: 0,
    dragging: false,
    pointing: false,
    focused: false,
  });

  const changeThrottle = options.changeThrottle ?? 0;
  const throttledChange: Throttled<[number]> | null =
    changeThrottle > 0
      ? throttle((percent: number) => options.onValueChange?.(percent), changeThrottle, { leading: true })
      : null;

  let trackSize = 0;
  let pressed = false;
  let pressPosition = 0;
  let lastPercent = 0;

  function toPercent(position: number): number {
    return trackSize > 0 ? clamp((position / trackSize) * 100, 0, 100) : 0;
  }

  function fireChange(percent: number): void {
    if (throttledChange) throttledChange(percent);
    else options.onValueChange?.(percent);
  }

  function end(commit: boolean): void {
    if (!pressed) return;

    const wasDragging = input.current.dragging;

    throttledChange?.cancel();
    pressed = false;

    // A drag already seeked along the way; the commit lands the exact release position.
    if (commit) options.onValueCommit?.(lastPercent);

    input.patch({ dragging: false, pointing: false });

    if (wasDragging) options.onDragEnd?.();
  }

  return {
    input,

    setTrackSize(size) {
      trackSize = size;
    },

    press(position) {
      const percent = toPercent(position);

      pressed = true;
      pressPosition = position;
      lastPercent = percent;

      input.patch({ pointerPercent: percent, dragPercent: percent, pointing: true });
    },

    move(position) {
      if (!pressed) return;

      const dragging = input.current.dragging;
      if (!dragging && Math.abs(position - pressPosition) < DRAG_THRESHOLD) return;

      const percent = toPercent(position);

      lastPercent = percent;
      input.patch({ pointerPercent: percent, dragPercent: percent, dragging: true });

      if (!dragging) options.onDragStart?.();

      fireChange(percent);
    },

    release() {
      end(true);
    },

    cancel() {
      end(false);
    },
  };
}
