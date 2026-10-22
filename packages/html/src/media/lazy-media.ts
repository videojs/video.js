import type { ResolveLazyMediaOptions } from '@videojs/media';
import { prefersNativeHls } from '@videojs/utils/dom';

/**
 * The module that registers each media element a lazy media can resolve to, keyed by its tag name. Built-in elements,
 * such as `video`, have none.
 *
 * @internal
 */
export type LazyMediaDefinitions<Name extends string> = Record<
  Exclude<Name, 'video' | 'audio'>,
  () => Promise<unknown>
>;

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

const LAZY_MEDIA_DOCS_URL = 'https://videojs.org/docs/framework/html/reference/components/lazy-video';

/**
 * Base for `<lazy-video>` and `<lazy-audio>`: resolves `src` to a media element, loads the module that registers it,
 * and renders it as a child with this element's attributes. The child registers itself with the player, as it would if
 * it were written in the page.
 *
 * @internal
 */
export abstract class LazyMediaElement extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ['src', 'type', 'prefer-playback'];
  }

  #media: HTMLElement | null = null;
  // The media `#media` is; it trails `#name` while the next media loads.
  #mediaName: string | null = null;
  // `undefined` until the first resolution, so a first `null` still counts as a change.
  #name: string | null | undefined = undefined;
  #token = 0;
  #updateQueued = false;
  #observer: MutationObserver | null = null;

  /** Source URL. Its host or file extension decides which media element plays it. */
  get src(): string {
    return this.getAttribute('src') ?? '';
  }

  set src(value: string) {
    this.setAttribute('src', value);
  }

  /** MIME type of the source. Takes precedence over the file extension, so signed or extensionless URLs resolve. */
  get type(): string {
    return this.getAttribute('type') ?? '';
  }

  set type(value: string) {
    this.setAttribute('type', value);
  }

  /**
   * Playback path for HLS: `'native'` (default) on Safari and wherever there is no MSE, or `'mse'` to always load an
   * engine.
   */
  get preferPlayback(): 'native' | 'mse' {
    return this.getAttribute('prefer-playback') === 'mse' ? 'mse' : 'native';
  }

  set preferPlayback(value: 'native' | 'mse') {
    this.setAttribute('prefer-playback', value);
  }

  /** @internal */
  protected abstract readonly mediaDefinitions: Partial<Record<string, () => Promise<unknown>>>;

  /** @internal */
  protected abstract resolveMedia(src: string, options: ResolveLazyMediaOptions): string | null | undefined;

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

    const src = this.src;
    const name = this.resolveMedia(src, {
      type: this.type || undefined,
      nativeHls: prefersNativeHls(),
      preferPlayback: this.preferPlayback,
    });

    // The same media plays the new source, so it only needs the URL. One still loading reads it once created.
    if (name === this.#name) {
      if (this.#media && this.#mediaName === name) this.#syncAttribute(this.#media, 'src');

      return;
    }

    this.#name = name;

    if (!name) {
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

    void this.#load(name);
  }

  // The media's name is its tag name.
  async #load(name: string): Promise<void> {
    const token = ++this.#token;

    try {
      await this.mediaDefinitions[name]?.();
    } catch (error) {
      if (__DEV__) console.error(`[${this.localName}] Failed to load <${name}>.`, error);

      return;
    }

    // A newer source took over while this one loaded.
    if (token !== this.#token) return;

    const media = document.createElement(name);

    this.#copyAttributes(media);
    this.#setMedia(media, name);
  }

  #setMedia(next: HTMLElement | null, name: string | null): void {
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
    this.#mediaName = name;
  }

  #copyAttributes(media: HTMLElement): void {
    for (const { name } of this.attributes) this.#syncAttribute(media, name);

    if (!this.hasAttribute('preload')) this.#syncAttribute(media, 'preload');
  }

  #syncAttribute(media: HTMLElement, name: string): void {
    if (OWN_ATTRIBUTES.has(name)) return;

    // The resolved media plays `preload="none"` unless told otherwise.
    const value = this.getAttribute(name) ?? (name === 'preload' ? 'none' : null);

    if (value === null) media.removeAttribute(name);
    else if (media.getAttribute(name) !== value) media.setAttribute(name, value);
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
// hosts mark themselves `data-cross-origin-frame` and size to their iframe, so they're stretched to fill the player.
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

  ::slotted(video) {
    border-radius: var(--media-video-border-radius);
    object-fit: var(--media-object-fit, contain);
    object-position: var(--media-object-position, center);
  }
`;

const TEMPLATE = `<style>${STYLES}</style><slot></slot>`;
