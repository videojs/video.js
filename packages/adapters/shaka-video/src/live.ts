import type { Constructor } from '@videojs/utils/types';

import type { ShakaEngineHost } from './types';

export function ShakaLiveMixin<Base extends Constructor<ShakaEngineHost>>(BaseClass: Base) {
  class ShakaLive extends (BaseClass as Constructor<ShakaEngineHost>) {
    #targetLiveWindow = Number.NaN;
    #liveEdgeStartOffset: number | undefined;
    #seekToLiveAbort: AbortController | null = null;
    #seekToLivePending = false;

    constructor(...args: any[]) {
      super(...args);

      const { engine } = this;
      if (!engine) return;

      engine.addEventListener('loading', this.#onLoading);
      engine.addEventListener('unloading', this.#onUnloading);
      engine.addEventListener('manifestparsed', this.#derive);
      engine.addEventListener('manifestupdated', this.#derive);
      engine.addEventListener('loaded', this.#onLoaded);
    }

    attach(target: HTMLVideoElement) {
      super.attach(target);
      this.#armSeekToLive();
    }

    detach() {
      this.#disarmSeekToLive();
      super.detach();
    }

    destroy() {
      const { engine } = this;

      engine?.removeEventListener('loading', this.#onLoading);
      engine?.removeEventListener('unloading', this.#onUnloading);
      engine?.removeEventListener('manifestparsed', this.#derive);
      engine?.removeEventListener('manifestupdated', this.#derive);
      engine?.removeEventListener('loaded', this.#onLoaded);

      this.#disarmSeekToLive();
      this.#reset();

      super.destroy();
    }

    get targetLiveWindow() {
      return this.#targetLiveWindow;
    }

    // Derived from the engine's seek range at read time. No cached state, no
    // event — re-read when `seekable`, `targetLiveWindow`, or `streamType`
    // change.
    get liveEdgeStart() {
      if (this.#liveEdgeStartOffset === undefined) return Number.NaN;

      const { engine } = this;
      if (!engine) return Number.NaN;

      const { end } = engine.seekRange();
      if (!Number.isFinite(end)) return Number.NaN;

      return end - this.#liveEdgeStartOffset;
    }

    #onLoading = () => {
      this.#reset();

      // A deferred load's own first `play` set the pending seek and then
      // started this load; arming again would wipe that shot mid-flight.
      if (!this.#seekToLivePending) this.#armSeekToLive();
    };

    #onUnloading = () => this.#reset();

    #onLoaded = () => {
      this.#derive();

      // For deferred loading the manifest only arrives after the first play,
      // so the pending seek resolves here. Either way the shot is spent: a
      // load that came up on-demand has no edge to seek.
      if (!this.#seekToLivePending) return;

      this.#seekToLivePending = false;
      this.#trySeekToLive();
    };

    #derive = () => {
      const { engine } = this;

      if (!engine || !(engine.isLive() || engine.isInProgress())) {
        this.#reset();
        return;
      }

      // The native HLS media reads the manifest's HOLD-BACK, falling back to the
      // HLS spec's three target durations. Shaka resolves its own presentation
      // delay but does not expose it publicly — `getManifest()` warns on every
      // call that its shape is not covered by semver — so the same spec
      // default is derived from the presentation's max segment duration.
      const { maxSegmentDuration } = engine.getStats();

      this.#liveEdgeStartOffset =
        Number.isFinite(maxSegmentDuration) && maxSegmentDuration > 0 ? maxSegmentDuration * 3 : undefined;

      // An in-progress recording keeps growing its window; regular live holds
      // a sliding window of fixed size.
      this.#setTargetLiveWindow(engine.isInProgress() ? Number.POSITIVE_INFINITY : 0);
    };

    #reset() {
      this.#liveEdgeStartOffset = undefined;
      this.#setTargetLiveWindow(Number.NaN);
    }

    #setTargetLiveWindow(value: number) {
      if (Object.is(this.#targetLiveWindow, value)) return;

      this.#targetLiveWindow = value;
      this.dispatchEvent(new Event('targetlivewindowchange'));
    }

    /**
     * Arm a one-shot seek-to-live on the first user-initiated `play`. Skipped when `autoplay` is set, since Shaka
     * positions at the live edge during its own startup sequence and a programmatic seek would race that.
     */
    #armSeekToLive() {
      this.#disarmSeekToLive();

      const target = this.target as HTMLVideoElement | null;
      if (!target || target.autoplay) return;

      this.#seekToLiveAbort = new AbortController();
      target.addEventListener(
        'play',
        () => {
          this.#seekToLivePending = true;
          this.#trySeekToLive();
        },
        { signal: this.#seekToLiveAbort.signal, once: true }
      );
    }

    #disarmSeekToLive() {
      this.#seekToLiveAbort?.abort();
      this.#seekToLiveAbort = null;
      this.#seekToLivePending = false;
    }

    #trySeekToLive() {
      const target = this.target as HTMLVideoElement | null;
      if (!target) return;

      const { liveEdgeStart } = this;
      if (!Number.isFinite(liveEdgeStart)) return;

      if (target.currentTime < liveEdgeStart) {
        target.currentTime = liveEdgeStart;
      }

      this.#seekToLivePending = false;
    }
  }

  return ShakaLive as unknown as Base &
    Constructor<{ readonly liveEdgeStart: number; readonly targetLiveWindow: number }>;
}
