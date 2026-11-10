import { namedNodeMapToObject } from '@videojs/utils/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';
import { getTemplateHTML, getTemplateVideo } from './template';

const HTMLElementBase = globalThis.HTMLElement ?? class {};

// `MediaAttachMixin` is typed as returning its base, so its lifecycle callbacks
// aren't visible for `super` to reach. Method syntax lets subclasses override them.
interface LifecycleElement extends HTMLElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
}

const MediaAttachBase = MediaAttachMixin(HTMLElementBase) as unknown as new () => LifecycleElement;

const PLAYBACK_DEFAULTS = ['muted', 'loop', 'autoplay'] as const;

/** A playback default an element can let authors turn off with a `no*` attribute. */
export type BackgroundVideoOptOut = (typeof PLAYBACK_DEFAULTS)[number];

/**
 * The shadow setup, `src` wiring, and `target` that `<background-video>` and `<hls-background-video>` share. Each
 * subclass supplies its own `src` and declares which playback defaults authors may opt out of.
 *
 * @internal
 */
export abstract class BackgroundVideoBase extends MediaAttachBase {
  static shadowRootOptions = { mode: 'open' as ShadowRootMode };
  static getTemplateHTML = getTemplateHTML;
  /** Defaults that a matching `no*` attribute turns off. Every other default is fixed on. */
  static optOuts: readonly BackgroundVideoOptOut[] = ['muted', 'loop', 'autoplay'];
  /** Host attributes mirrored onto the inner video as they change. */
  static passthroughAttributes: readonly string[] = ['controls', 'controlslist', 'crossorigin', 'preload'];

  static get observedAttributes(): string[] {
    return ['src', ...PLAYBACK_DEFAULTS, ...this.optOuts.map((name) => `no${name}`), ...this.passthroughAttributes];
  }

  constructor() {
    super();

    const ctor = this.constructor as typeof BackgroundVideoBase;

    if (!this.shadowRoot) {
      const attrs: Record<string, string> = {
        ...namedNodeMapToObject(this.attributes),
        playsinline: '',
        disableremoteplayback: '',
        disablepictureinpicture: '',
      };

      for (const name of PLAYBACK_DEFAULTS) {
        if (this.#isDefaultOn(name)) attrs[name] = '';
      }

      this.attachShadow(ctor.shadowRootOptions);
      this.shadowRoot!.innerHTML = ctor.getTemplateHTML(attrs);
    }

    this.syncPlaybackDefaults();
  }

  /**
   * Writes muted, loop, and autoplay onto the inner video as properties. The template's attributes only cover markup
   * parsed with its attributes in place; an element created by script gets its `no*` attributes afterwards, and neither
   * Chrome nor Firefox honor a `muted` attribute set after `document.createElement`.
   */
  protected syncPlaybackDefaults(): void {
    const target = this.target;
    if (!target) return;

    for (const name of PLAYBACK_DEFAULTS) target[name] = this.#isDefaultOn(name);
  }

  /** On unless its `no*` attribute is set and allowed; an explicit attribute such as `muted` wins over its opt-out. */
  #isDefaultOn(name: BackgroundVideoOptOut): boolean {
    const { optOuts } = this.constructor as typeof BackgroundVideoBase;

    return this.hasAttribute(name) || !optOuts.includes(name) || !this.hasAttribute(`no${name}`);
  }

  abstract get src(): string;
  abstract set src(value: string);

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    const { passthroughAttributes } = this.constructor as typeof BackgroundVideoBase;

    if (name === 'src') {
      this.src = newValue ?? '';
    } else if (passthroughAttributes.includes(name)) {
      if (newValue === null) this.target?.removeAttribute(name);
      else this.target?.setAttribute(name, newValue);
    } else {
      this.syncPlaybackDefaults();
    }
  }

  /** The inner `<video>` in the shadow root: what plays, and what `play()` / `pause()` belong on. */
  get target(): HTMLVideoElement | null {
    return getTemplateVideo(this.shadowRoot);
  }
}
