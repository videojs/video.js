import type { GestureMatchResult, GestureRecognizer } from './gesture';

const DOUBLETAP_WINDOW = 200;

/**
 * Recognizes tap vs doubletap from quick pointer-up events.
 *
 * Stateful recognizer — tracks tap count and doubletap timing. The coordinator handles pointer-down timing (tap
 * threshold) and calls `handleUp()` only for quick taps that passed the threshold check.
 */
export class TapRecognizer implements GestureRecognizer {
  #lastTapTime = 0;
  #tapTimer: ReturnType<typeof setTimeout> | null = null;

  handleUp(matches: GestureMatchResult, event: PointerEvent): void {
    const hasDoubletap = matches.resolve('doubletap').length > 0;

    if (hasDoubletap) {
      const now = Date.now();

      if (now - this.#lastTapTime < DOUBLETAP_WINDOW) {
        // Second tap within window — doubletap.
        this.#clearTimer();
        this.#lastTapTime = 0;
        // Re-resolve at fire time so removed bindings between taps are respected.
        matches.resolve('doubletap')[0]?.onActivate(event);
        return;
      }

      // First tap — defer to allow doubletap window.
      this.#lastTapTime = now;
      this.#clearTimer();
      this.#tapTimer = setTimeout(() => {
        this.#tapTimer = null;
        this.#lastTapTime = 0;
        // Re-resolve at fire time so cleanup between pointerup and timeout is respected.
        matches.resolve('tap')[0]?.onActivate(event);
      }, DOUBLETAP_WINDOW);

      return;
    }

    // No doubletap bindings — fire tap immediately.
    matches.resolve('tap')[0]?.onActivate(event);
  }

  #clearTimer(): void {
    if (this.#tapTimer !== null) {
      clearTimeout(this.#tapTimer);
      this.#tapTimer = null;
    }
  }

  reset(): void {
    this.#clearTimer();
    this.#lastTapTime = 0;
  }
}
