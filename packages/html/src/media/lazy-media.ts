import {
  applyPreferPlayback,
  findLazyMedia,
  type LazyMediaMatcher,
  type LazyMediaSource,
  type PreferPlaybackTarget,
  resolveLazySource,
} from '@videojs/media';
import { nativeHlsSupport } from '@videojs/utils/dom';

/** A media element `<lazy-video>` or `<lazy-audio>` can render: which sources it plays, and the element that plays them. */
export interface LazyMediaDefinition extends LazyMediaMatcher {
  /** Tag name of the element that plays the source. */
  tag: string;
  /** Registers the element once a source needs it. Leave it out for built-in or already registered elements. */
  load?: (() => Promise<unknown>) | undefined;
  /** Whether the element takes `preferPlayback` on its `source`, as `<hlsjs-video>` and `<mux-video>` do. */
  preferPlayback?: boolean | undefined;
}

const HTMLElementBase = globalThis.HTMLElement ?? class {};

// Attributes that configure the lazy element itself, or identify it in the page, rather than the media it renders.
const OWN_ATTRIBUTES: ReadonlySet<string> = new Set([
  'id',
  'class',
  'style',
  'slot',
  'part',
  'type',
  'prefer-playback',
]);

/**
 * A lazy media element class that chooses from `medias`, tried in order.
 *
 * @internal
 */
export function createLazyMediaElement(medias: readonly LazyMediaDefinition[]): typeof LazyMediaElement {
  return class extends LazyMediaElement {
    protected override readonly medias = medias;
  };
}

const LAZY_MEDIA_DOCS_URL = 'https://videojs.org/docs/framework/html/reference/components/lazy-video';

/**
 * Base for `<lazy-video>` and `<lazy-audio>`: resolves `src` to a media element, loads the module that registers it,
 * and renders it as a child with this element's attributes. The child registers itself with the player, as it would if
 * it were written in the page.
 *
 * @experimental
 */
export class LazyMediaElement extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ['src', 'type', 'prefer-playback'];
  }

  #media: HTMLElement | null = null;
  // The definition `#media` comes from; it trails `#definition` while the next media loads.
  #mediaDefinition: LazyMediaDefinition | null = null;
  // `undefined` until the first resolution, so a first `null` still counts as a change.
  #definition: LazyMediaDefinition | null | undefined = undefined;
  #source: LazyMediaSource | null = null;
  // The `source` last handed to `#media`, so an unchanged one isn't handed over again and reloaded.
  #mediaSource: LazyMediaSource | null = null;
  #token = 0;
  #updateQueued = false;
  #observer: MutationObserver | null = null;

  /** Source URL. Its host or file extension decides which media element plays it. Ignored while `source` is set. */
  get src(): string {
    return this.getAttribute('src') ?? '';
  }

  set src(value: string) {
    this.setAttribute('src', value);
  }

  /**
   * MIME type of the source. Takes precedence over the file extension, so signed or extensionless URLs resolve. Ignored
   * while `source` is set.
   */
  get type(): string {
    return this.getAttribute('type') ?? '';
  }

  set type(value: string) {
    this.setAttribute('type', value);
  }

  /**
   * Structured source, in place of `src` and `type`. Its `src`, `type`, or an id such as a Mux `playbackId` or a Wistia
   * `mediaId` decides which media element plays it, and the media takes the whole object on its `source`. A native
   * `<video>` or `<audio>` takes only its `src`.
   */
  get source(): LazyMediaSource | null {
    return this.#source;
  }

  set source(value: LazyMediaSource | null) {
    if (value === this.#source) return;

    this.#source = value ?? null;
    this.#queueUpdate();
  }

  /**
   * Playback path for HLS: `'native'` uses the browser's own HLS support wherever it has one, and `'mse'` always loads
   * an engine. Unset, HLS plays through an engine wherever there's MSE, and natively only where there's none. Also
   * passed on to the hls.js and Mux media, on their `source`.
   */
  get preferPlayback(): 'native' | 'mse' | undefined {
    const value = this.getAttribute('prefer-playback');

    return value === 'native' || value === 'mse' ? value : undefined;
  }

  set preferPlayback(value: 'native' | 'mse' | undefined) {
    if (value) this.setAttribute('prefer-playback', value);
    else this.removeAttribute('prefer-playback');
  }

  /**
   * The media to choose from, tried in order.
   *
   * @internal
   */
  protected readonly medias: readonly LazyMediaDefinition[] = [];

  constructor() {
    super();

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' }).innerHTML = TEMPLATE;
    }
  }

  connectedCallback(): void {
    this.#observer ??= new MutationObserver((records) => this.#onMutation(records));
    this.#observer.observe(this, { attributes: true });

    if (this.#media) this.#copyAttributes(this.#media);

    this.#queueUpdate();
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect();
  }

  attributeChangedCallback(): void {
    this.#queueUpdate();
  }

  // Coalesced, so `src` and `type` set one after the other, as an upgrade does, resolve together.
  #queueUpdate(): void {
    if (this.#updateQueued) return;

    this.#updateQueued = true;
    queueMicrotask(() => {
      this.#updateQueued = false;
      this.#update();
    });
  }

  #update(): void {
    if (!this.isConnected) return;

    const src = this.#source ? (this.#source.src ?? '') : this.src;
    const source = resolveLazySource(src, {
      type: this.type || undefined,
      preferPlayback: this.#preferPlayback(),
      nativeHls: nativeHlsSupport(),
      source: this.#source,
    });
    const definition = findLazyMedia(this.medias, source);
    // A media that can't tell yet is asked again on the next change.
    if (definition === undefined) return;

    // The same media plays the new source, so it only needs the URL and how to play it. One still loading reads them
    // once created.
    if (definition === this.#definition) {
      if (definition && this.#media && this.#mediaDefinition === definition) this.#syncSource(this.#media, definition);

      return;
    }

    this.#definition = definition;

    if (!definition) {
      this.#token++;
      this.#setMedia(null, null);

      if (__DEV__ && src) {
        console.error(
          `[${this.localName}] No media plays "${src}". If the URL has no file extension, set its MIME type in the ` +
            `\`type\` attribute, or use the media element for it. Supported sources: ${LAZY_MEDIA_DOCS_URL}`
        );
      }

      return;
    }

    void this.#load(definition);
  }

  async #load(definition: LazyMediaDefinition): Promise<void> {
    const token = ++this.#token;

    try {
      await definition.load?.();
    } catch (error) {
      if (__DEV__) console.error(`[${this.localName}] Failed to load <${definition.tag}>.`, error);

      // The previous media would go on playing a source it no longer matches, and a later source for this media should
      // try the load again.
      if (token === this.#token) {
        this.#definition = undefined;
        this.#setMedia(null, null);
      }

      return;
    }

    // A newer source took over while this one loaded.
    if (token !== this.#token) return;

    const media = document.createElement(definition.tag);

    this.#copyAttributes(media);

    // The `muted` attribute only mutes a media element the parser creates; one created by script starts with sound.
    if (this.hasAttribute('muted') && 'muted' in media) media.muted = true;

    // Before the media is connected, so its engine is built for the source and preferred path from the start.
    this.#mediaSource = null;
    this.#syncSource(media, definition);
    this.#setMedia(media, definition);
  }

  #setMedia(next: HTMLElement | null, definition: LazyMediaDefinition | null): void {
    const previous = this.#media;

    // Tracks and sources follow the media they belong to, and wait on this element while there's none.
    const children = (previous ?? this).querySelectorAll(':scope > track, :scope > source');

    if (next) {
      next.append(...children);
      this.append(next);
    } else {
      this.append(...children);
    }

    previous?.remove();
    this.#media = next;
    this.#mediaDefinition = definition;
  }

  #copyAttributes(media: HTMLElement): void {
    for (const { name } of this.attributes) this.#syncAttribute(media, name);

    if (!this.hasAttribute('preload')) this.#syncAttribute(media, 'preload');
  }

  #syncAttribute(media: HTMLElement, name: string): void {
    // `src` reaches the media through `#syncSource`.
    if (OWN_ATTRIBUTES.has(name) || name === 'src') return;

    // The resolved media plays `preload="none"` unless told otherwise.
    const value = this.getAttribute(name) ?? (name === 'preload' ? 'none' : null);

    if (value === null) media.removeAttribute(name);
    else if (media.getAttribute(name) !== value) media.setAttribute(name, value);
  }

  #syncSource(media: HTMLElement, definition: LazyMediaDefinition): void {
    const source = this.#source;

    if (!source) {
      // The media still plays the structured source, whatever its `src` attribute says.
      if (this.#mediaSource) media.removeAttribute('src');

      this.#mediaSource = null;
      this.#setSrc(media, this.getAttribute('src'));
    } else if (!('source' in media)) {
      this.#setSrc(media, source.src ?? null);
    } else if (source !== this.#mediaSource) {
      this.#mediaSource = source;
      media.source = source;
    }

    // SAFETY: a definition marked `preferPlayback` renders an element with a structured `source`.
    if (definition.preferPlayback) {
      applyPreferPlayback(media as unknown as PreferPlaybackTarget, this.#preferPlayback());
    }
  }

  #setSrc(media: HTMLElement, value: string | null): void {
    if (value === null) media.removeAttribute('src');
    else if (media.getAttribute('src') !== value) media.setAttribute('src', value);
  }

  // The attribute wins over a `preferPlayback` given on `source`.
  #preferPlayback(): 'native' | 'mse' | undefined {
    const fromSource = this.#source?.preferPlayback;

    return this.preferPlayback ?? (fromSource === 'native' || fromSource === 'mse' ? fromSource : undefined);
  }

  #onMutation(records: MutationRecord[]): void {
    const media = this.#media;
    if (!media) return;

    // `src` goes through `#update`, which keeps a URL from reaching a media that can't play it.
    for (const { attributeName } of records) {
      if (attributeName !== 'src') this.#syncAttribute(media, attributeName!);
    }
  }
}

// `display: contents` lets the skin lay out the resolved media as though it were the slotted child. The native media
// is styled here because the skin's `::slotted(video)` rule only reaches direct children of the skin. The properties
// match `VideoCSSVars`, spelled out because importing them would put every custom media element in this chunk. Embed
// hosts mark themselves `data-cross-origin-frame` and size to their iframe, so they're stretched to fill the player,
// and the minimum size each sets for standalone use is cleared: TikTok's portrait floor would overflow a landscape
// player and push its frame's centered chrome off center. Without that floor, an embed in a player with no height of
// its own would collapse, so it falls back to 16:9; a sized player sets both dimensions, which overrides the ratio.
const STYLES = /* css */ `
  :host {
    display: contents;
  }

  ::slotted(video),
  ::slotted([data-cross-origin-frame]) {
    display: block;
    width: 100%;
    height: 100%;
  }

  ::slotted([data-cross-origin-frame]) {
    min-width: 0;
    min-height: 0;
    aspect-ratio: 16 / 9;
  }

  ::slotted(video) {
    border-radius: var(--media-video-border-radius);
    object-fit: var(--media-object-fit, contain);
    object-position: var(--media-object-position, center);
  }
`;

const TEMPLATE = `<style>${STYLES}</style><slot></slot>`;
