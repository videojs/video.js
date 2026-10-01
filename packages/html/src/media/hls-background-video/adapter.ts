import type { Media } from '@videojs/media/dom';
import { HlsBackgroundVideoAdapter, type HlsVideoMediaError } from '@videojs/spf/hls-background-video';
import { namedNodeMapToObject } from '@videojs/utils/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';
import { getTemplateHTML } from '../background-video/template';

const HTMLElementBase = globalThis.HTMLElement ?? class {};

// `MediaAttachMixin` is typed as returning its base, so its `disconnectedCallback`
// isn't visible for `super` to reach. `LifecycleElement` declares the lifecycle
// callbacks this element overrides; method syntax lets a subclass override them.
interface LifecycleElement extends HTMLElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
}

const HlsBackgroundVideoBase = MediaAttachMixin(HTMLElementBase) as unknown as new () => LifecycleElement;

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
 * say, since the engine loads from the moment it has a source. And unlike `<background-video>` there are no `nomuted` /
 * `noloop` / `noautoplay` opt-outs: those three are what this element is for, so the adapter fixes them on at attach.
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
 *   `<mux-background-video>` is this element under the name the package it replaces used. Same class, so the tag is a
 *   naming choice and nothing more.
 */
// Deliberately not `CustomMediaElement`, matching `<background-video>`: a
// background video needs one property, not the full WHATWG media API.
export class HlsBackgroundVideo extends HlsBackgroundVideoBase {
  static shadowRootOptions = { mode: 'open' as ShadowRootMode };
  static getTemplateHTML = getTemplateHTML;

  static get observedAttributes(): string[] {
    return ['src'];
  }

  #media = new HlsBackgroundVideoAdapter();

  constructor() {
    super();

    if (!this.shadowRoot) {
      this.attachShadow((this.constructor as typeof HlsBackgroundVideo).shadowRootOptions);

      const attrs = {
        ...namedNodeMapToObject(this.attributes),
        muted: '',
        loop: '',
        autoplay: '',
        playsinline: '',
        disableremoteplayback: '',
        disablepictureinpicture: '',
      };

      this.shadowRoot!.innerHTML = getTemplateHTML(attrs);
    }

    // Neither Chrome nor Firefox honor a `muted` attribute set after
    // `document.createElement`, and autoplay is refused without it. Attaching is
    // what sets the property — along with the rest of the fixed behavior — so
    // nothing here needs to repeat it.
    const video = this.video;

    if (video) this.#media.attach(video);

    // Re-fired rather than bridged on demand the way `CustomMediaElement` does
    // it: one listener for the one event this element has, on a Media it owns
    // for its whole life, is less than the machinery to defer it would cost.
    this.#media.addEventListener('error', () => this.dispatchEvent(new Event('error')));
  }

  /** Register the Media (not the inner `<video>`) with the provider. */
  getMediaTarget(): Media | null {
    return this.#media as unknown as Media;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback?.();

    if (this.hasAttribute('keep-alive')) return;

    // Deferred so a synchronous reparent (remove then insert) doesn't tear down
    // the engine, matching `CustomMediaElement`.
    queueMicrotask(() => {
      if (!this.isConnected) this.#media.destroy();
    });
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    if (name === 'src') this.src = newValue ?? '';
  }

  /** The inner `<video>` the engine renders into. */
  get video(): HTMLVideoElement | null {
    const video = this.shadowRoot?.querySelector('video');

    return video instanceof HTMLVideoElement ? video : null;
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
  get src(): string {
    return this.#media.src;
  }

  set src(value: string) {
    this.#media.src = value;
  }
}
