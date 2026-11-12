import type { Media } from '@videojs/media/dom';
import { HlsBackgroundVideoAdapter, type HlsVideoMediaError } from '@videojs/spf/adapters/hls-background-video';

import { BackgroundVideoBase, type BackgroundVideoOptOut } from '../background-video/base';

/**
 * A muted, looping, chrome-less video over the SPF background-video engine.
 *
 * The SPF-backed counterpart to `<background-video>`, which plays its source natively. This one streams HLS through the
 * engine, which pins a single rendition for the session rather than adapting, and drops audio and text handling
 * entirely — the shape an ambient hero video actually wants.
 *
 * Nearer an image than a player, and `src` is the whole surface. Replaces the standalone `mux-background-video`
 * package, whose `audio`, `debug`, `preload`, and `max-resolution` attributes are all deliberately absent. Capping
 * which rendition is fetched is a delivery param on the URL — `?max_resolution=720p` on a Mux stream, for one — which
 * keeps the renditions it excludes out of the manifest rather than merely unpicked; `preload` would have nothing to
 * say, since the engine loads from the moment it has a source. Muted is fixed on: the engine drops audio, so there is
 * nothing to unmute. `noloop` and `noautoplay` opt out as on `<background-video>`, so a page can play the video once,
 * or hold it until it has checked the motion preference.
 *
 * Takes no structured `source` — `src` is an HLS URL, as the package it replaces required. Mux playback-ID identity,
 * poster, and storyboard belong to `<mux-video>`; none of them mean anything without controls to hang them on.
 *
 * Nothing about an unplayable source reaches the inner `<video>` on its own, so `error` on it stays null and the
 * element sits at `readyState 0`. The engine reports each condition and logs it, the Media promotes the fatal one, and
 * this element re-fires it as its own `error` / `'error'` — the one place a consumer holding the element can see a
 * source that never appears.
 *
 * @example
 *   ```html
 *   <hls-background-video src="https://stream.mux.com/PLAYBACK_ID.m3u8?max_resolution=720p">
 *   <img src="https://image.mux.com/PLAYBACK_ID/thumbnail.webp?time=0" alt="" />
 *   </hls-background-video>
 *   ```;
 *
 * @fires error - Fired when a fatal condition is reported. Read `error` for it.
 *
 *   `<mux-background-video>` (`../mux-background-video`) is this element over the MPEG-TS Media, which adds the MPEG-TS
 *   transmux and nothing else to the surface.
 */
// Deliberately not `CustomMediaElement`, matching `<background-video>`: a
// background video needs one property, not the full WHATWG media API.
export class HlsBackgroundVideo extends BackgroundVideoBase {
  static override optOuts: readonly BackgroundVideoOptOut[] = ['loop', 'autoplay'];
  // No `preload`: the engine loads as soon as it has a source, and attaching fixes `preload="auto"`.
  static override passthroughAttributes: readonly string[] = ['controls', 'controlslist', 'crossorigin'];

  /** The Media the element instantiates; a flavor substitutes its own, as `<mux-background-video>` does. */
  static readonly Adapter: new () => HlsBackgroundVideoAdapter = HlsBackgroundVideoAdapter;

  #media = new (this.constructor as typeof HlsBackgroundVideo).Adapter();

  constructor() {
    super();

    const target = this.target;

    if (target) this.#media.attach(target);

    // Attaching fixes loop and autoplay on, so their opt-outs have to be reapplied after it.
    this.syncPlaybackDefaults();

    // Re-fired rather than bridged on demand the way `CustomMediaElement` does
    // it: one listener for the one event this element has, on a Media it owns
    // for its whole life, is less than the machinery to defer it would cost.
    this.#media.addEventListener('error', () => this.dispatchEvent(new Event('error')));
  }

  /** Register the Media (not the inner `<video>`) with the provider. */
  getMediaTarget(): Media | null {
    return this.#media as unknown as Media;
  }

  /**
   * The Media driving the inner `<video>`, matching `adapter` on `CustomMediaElement`. Call `adapter.destroy()` to
   * release the engine after `keep-alive` kept it running past removal.
   */
  get adapter(): HlsBackgroundVideoAdapter {
    return this.#media;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback?.();

    // Only the element's own `keep-alive` counts: an ancestor's `destroy()` can't reach this engine, so inheriting it
    // would leave the engine running with nothing to release it.
    if (this.hasAttribute('keep-alive')) return;

    // Deferred so a synchronous reparent (remove then insert) doesn't tear down
    // the engine, matching `CustomMediaElement`.
    queueMicrotask(() => {
      if (!this.isConnected) this.#media.destroy();
    });
  }

  /** Same element as `target`. */
  get video(): HTMLVideoElement | null {
    return this.target;
  }

  /**
   * What made the current source unplayable, or `null`. An SVTA code rather than a `MediaError` one — 99001 where this
   * player has no pipeline for what the source needs, with the specifics logged. Reset by a new source, and not on the
   * inner `<video>`, which never learns of it.
   */
  get error(): HlsVideoMediaError | null {
    return this.#media.error;
  }

  /** HLS manifest URL. Assigning a new one restarts playback from scratch. */
  override get src(): string {
    return this.#media.src;
  }

  override set src(value: string) {
    this.#media.src = value;
  }
}
