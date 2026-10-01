// Adapted from `media-played-ranges-mixin@0.1.0` from `muxinc/media-elements`,
// ported to TypeScript and reshaped as a class mixin to fit the v10 media-adapter
// architecture.
//
// Source: https://github.com/muxinc/media-elements
// License: MIT

import { isNumber } from '@videojs/utils/predicate';
import type { Constructor, MixinReturn } from '@videojs/utils/types';

import type { TimeRangeLike } from '../../core/types';

/** @internal */
export interface PlayedRange {
  start: number;
  end: number;
}

/**
 * Surface a media adapter must expose for played-range tracking.
 *
 * @internal
 */
export interface MediaPlayedRangesHost extends EventTarget {
  currentTime: number;
  paused: boolean;
}

/** Public surface contributed by {@link MediaPlayedRangesMixin}. */
export interface MediaPlayedRangesAPI {
  /** `TimeRanges`-like view of the ranges the user has actually played. */
  readonly played: TimeRangeLike;
  destroy(): void;
}

/**
 * Mixin that tracks played ranges for media adapters lacking a native `HTMLMediaElement.played` (e.g. iframe-based
 * embeds like Vimeo).
 *
 * Listens for standard media events the host dispatches on itself (`play`, `pause`, `ended`, `timeupdate`, `seeking`,
 * `seeked`) and derives a `TimeRanges`-like `played` value from the host's `currentTime` / `paused`.
 *
 * @example
 *   class VimeoAdapter extends MediaPlayedRangesMixin(EventTarget) { ... }
 *
 * @internal
 */
export function MediaPlayedRangesMixin<Base extends Constructor<EventTarget & { destroy?(): void }>>(
  BaseClass: Base
): MixinReturn<Base, MediaPlayedRangesAPI> {
  class MediaPlayedRanges extends BaseClass {
    #playedRanges: PlayedRange[] = [];
    #currentPlayedRange: PlayedRange | null = null;
    #rangeEpsilon = 0.5;
    #disconnect = new AbortController();

    constructor(...args: any[]) {
      super(...args);

      const options = { signal: this.#disconnect.signal };

      this.addEventListener('play', () => this.#onPlaybackStart(this.#currentTime), options);
      this.addEventListener('pause', () => this.#onPlaybackStop(this.#currentTime), options);
      this.addEventListener('ended', () => this.#onPlaybackStop(this.#currentTime), options);
      this.addEventListener('timeupdate', () => this.#onPlaybackProgress(this.#currentTime), options);
      this.addEventListener('seeking', () => this.#commitCurrentRange(), options);
      this.addEventListener('seeked', () => this.#onSeeked(this.#currentTime), options);
    }

    /** The host (subclass) supplies `currentTime` / `paused`. */
    get #host(): MediaPlayedRangesHost {
      return this as unknown as MediaPlayedRangesHost;
    }

    get #currentTime(): number {
      return this.#host.currentTime;
    }

    get played(): TimeRangeLike {
      const time = this.#currentTime;

      if (!this.#host.paused && !this.#currentPlayedRange && isNumber(time)) {
        this.#currentPlayedRange = { start: time, end: time };
      }

      this.#onPlaybackProgress(time);

      if (this.#currentPlayedRange && isNumber(time)) {
        this.#addPlayedRange(this.#currentPlayedRange.start, this.#currentPlayedRange.end);
      }

      if (!this.#playedRanges.length) {
        return createTimeRanges([[0, 0]]);
      }

      return createTimeRanges(this.#playedRanges.map((r) => [r.start, r.end]));
    }

    destroy(): void {
      this.#disconnect.abort();
      super.destroy?.();
    }

    #onPlaybackStart(time: number): void {
      const t = isNumber(time) ? time : this.#currentTime;

      if (!this.#currentPlayedRange) {
        this.#currentPlayedRange = { start: t, end: t };
      }
    }

    #onPlaybackProgress(time: number): void {
      if (this.#currentPlayedRange && isNumber(time) && time > this.#currentPlayedRange.end) {
        this.#currentPlayedRange.end = time;
      }
    }

    #onSeeked(time: number): void {
      const t = isNumber(time) ? time : this.#currentTime;

      this.#currentPlayedRange = { start: t, end: t };
    }

    #onPlaybackStop(time: number): void {
      const t = isNumber(time) ? time : this.#currentTime;

      this.#commitCurrentRange(t);
    }

    #commitCurrentRange(time?: number): void {
      if (!this.#currentPlayedRange) return;

      if (isNumber(time)) {
        this.#currentPlayedRange.end = time;
      }

      const { start, end } = this.#currentPlayedRange;

      this.#currentPlayedRange = null;
      this.#addPlayedRange(start, end);
    }

    #addPlayedRange(start: number, end: number): void {
      if (start >= end) return;

      const allRanges: PlayedRange[] = [...this.#playedRanges, { start, end }];

      allRanges.sort((a, b) => a.start - b.start);
      const merged: PlayedRange[] = [];

      for (const range of allRanges) {
        const last = merged.length ? merged[merged.length - 1] : null;

        if (!last) {
          merged.push({ ...range });
          continue;
        }

        if (range.start <= last.end + this.#rangeEpsilon) {
          last.start = Math.min(last.start, range.start);
          last.end = Math.max(last.end, range.end);
        } else {
          merged.push({ ...range });
        }
      }

      this.#playedRanges = merged;
    }
  }

  return MediaPlayedRanges as unknown as MixinReturn<Base, MediaPlayedRangesAPI>;
}

function createTimeRanges(ranges: number[][]): TimeRangeLike {
  Object.defineProperties(ranges, {
    start: { value: (i: number) => ranges[i]?.[0] ?? 0 },
    end: { value: (i: number) => ranges[i]?.[1] ?? 0 },
  });
  return ranges as unknown as TimeRangeLike;
}
