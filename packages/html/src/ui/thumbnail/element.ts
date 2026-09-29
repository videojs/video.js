import {
  mapCuesToThumbnails,
  ThumbnailCore,
  ThumbnailDataAttrs,
  type ThumbnailImage,
  type ThumbnailResizeResult,
} from '@videojs/core';
import type { ThumbnailApi } from '@videojs/core/dom';
import { applyElementProps, applyStateDataAttrs, createThumbnail, selectTextTrack } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import type { MediaTextTrackState } from '@videojs/media';
import { findComposedElement, isHTMLImageElement, listen } from '@videojs/utils/dom';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { UIElement } from '../ui-element';

const SHADOW_CSS = `\
:host {
  display: inline-block;
  overflow: hidden;
}
img,
::slotted(img) {
  display: block;
}`;

/**
 * Image attributes the element fills in from its own properties. Ones already on an image when it is adopted are the
 * author's and are left alone, so an `<img slot="thumbnail" loading="lazy">` keeps its settings inside a skin.
 */
const IMAGE_ATTRIBUTES = ['crossorigin', 'loading', 'fetchpriority'] as const;

type ImageAttribute = (typeof IMAGE_ATTRIBUTES)[number];

/** The image the element draws when none is supplied, reachable from outside as `::part(image)`. */
function createFallbackImage(): HTMLImageElement {
  const img = document.createElement('img');

  img.alt = '';
  img.setAttribute('part', 'image');
  img.setAttribute('aria-hidden', 'true');
  img.setAttribute('decoding', 'async');

  return img;
}

/**
 * `<media-thumbnail>` — resolves and sizes a time-based thumbnail into an image.
 *
 * The element owns `src` and `srcset` on the active image. Left empty, it draws an image of its own in its shadow root.
 * Supply an `<img>` child instead — `<media-thumbnail time="12"><img alt=""></media-thumbnail>` — to compose overlays
 * or loading indicators beside the image the element controls. Any `crossorigin`, `loading`, or `fetchpriority` the
 * child already carries wins over the element's own; the rest are filled in. Inside a skin, an `<img slot="thumbnail">`
 * of yours replaces the one the skin carries.
 */
export class ThumbnailElement extends UIElement {
  static readonly tagName = 'media-thumbnail';

  static override properties = {
    time: { type: Number },
    crossOrigin: { type: String, attribute: 'crossorigin' },
    loading: { type: String },
    fetchPriority: { type: String, attribute: 'fetchpriority' },
  } satisfies PropertyDeclarationMap<Exclude<keyof ThumbnailCore.Props, 'thumbnails'>>;

  time = 0;
  crossOrigin: ThumbnailCore.Props['crossOrigin'];
  loading: ThumbnailCore.Props['loading'];
  fetchPriority: ThumbnailCore.Props['fetchPriority'];

  readonly #core = new ThumbnailCore();
  readonly #shadow = this.attachShadow({ mode: 'open' });
  readonly #fallback = createFallbackImage();
  readonly #children = new MutationObserver(() => this.requestUpdate());
  // An image assigned through a forwarding slot lives outside this subtree, so its
  // attributes are watched on the image itself.
  readonly #imageAttributes = new MutationObserver(() => this.requestUpdate());
  readonly #textTracks = new PlayerController(this, playerContext, selectTextTrack);

  #slots: AbortController | null = null;
  #img: HTMLImageElement | null = null;
  /** Attributes `#img` already carried when adopted, which the author owns. */
  #authored = new Set<ImageAttribute>();
  #thumbnails: ThumbnailImage[] = [];
  #externalThumbnails: ThumbnailImage[] | undefined;
  #lastTextTrack: MediaTextTrackState | undefined;
  #api: ThumbnailApi | null = null;

  constructor() {
    super();

    const style = document.createElement('style');

    style.textContent = SHADOW_CSS;
    this.#shadow.append(style, document.createElement('slot'), this.#fallback);
  }

  /**
   * Set thumbnail images directly, bypassing the automatic `<track>` detection. When set, this takes priority over the
   * text track path.
   */
  get thumbnails(): ThumbnailImage[] | undefined {
    return this.#externalThumbnails;
  }

  set thumbnails(value: ThumbnailImage[] | undefined) {
    this.#externalThumbnails = value;
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.#api = createThumbnail({
      getContainer: () => this,
      getImg: () => this.#img,
      onStateChange: () => this.requestUpdate(),
    });
    this.#children.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset'],
    });

    // Nodes assigned to a forwarding slot are not children of this subtree, so an image slotted
    // in later never shows up as a mutation. The slot announces it with `slotchange` instead.
    this.#slots = new AbortController();
    listen(this, 'slotchange', () => this.requestUpdate(), { signal: this.#slots.signal });

    // Disconnecting let go of the image, and reconnecting alone schedules no update,
    // so a moved element adopts its image and reapplies the source here.
    this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    this.#adopt(null);
    this.#children.disconnect();
    this.#slots?.abort();
    this.#slots = null;
    this.#api?.destroy();
    this.#api = null;
  }

  override destroyCallback(): void {
    this.#api?.destroy();
    super.destroyCallback();
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const textTrack = this.#textTracks.value;

    // Resolve thumbnails: external prop takes priority over auto <track> path.
    if (this.#externalThumbnails) {
      this.#thumbnails = this.#externalThumbnails;
    } else if (textTrack !== this.#lastTextTrack) {
      this.#lastTextTrack = textTrack;
      const thumbnailsTrack = textTrack?.thumbnailsTrack;

      this.#thumbnails =
        thumbnailsTrack && thumbnailsTrack.cues.length > 0
          ? mapCuesToThumbnails(thumbnailsTrack.cues, thumbnailsTrack.src ?? undefined)
          : [];
    }

    const thumbnail = this.#core.findActiveThumbnail(this.#thumbnails, this.time);
    const img = findComposedElement(this, isHTMLImageElement) ?? this.#fallback;

    this.#adopt(img);
    this.#applyImageAttributes(img, textTrack);

    // Track src changes via the thumbnail API.
    this.#api?.updateSrc(thumbnail?.url);
    this.#applySource(thumbnail?.url);
    this.#api?.connect();

    if (!thumbnail) {
      this.#resetStyles();

      const state = this.#core.getState(false, false, undefined);

      applyElementProps(this, this.#core.getAttrs(state));
      applyStateDataAttrs(this, state, ThumbnailDataAttrs);
      return;
    }

    const api = this.#api;
    const state = this.#core.getState(api?.loading ?? false, api?.error ?? false, thumbnail);

    applyElementProps(this, this.#core.getAttrs(state));
    applyStateDataAttrs(this, state, ThumbnailDataAttrs);

    if (api?.naturalWidth && api.naturalHeight) {
      const constraints = api.readConstraints();
      const result = this.#core.resize(thumbnail, api.naturalWidth, api.naturalHeight, constraints);

      if (result) {
        this.#applyResize(result);
      }
    }
  }

  /**
   * Leaving `crossOrigin` unset means "follow the media element", so thumbnails keep working on a CORS-enabled player
   * without a skin having to thread an attribute through. Only the `<track>` path inherits: `thumbnails` set directly
   * may point at a host that has nothing to do with the media element.
   */
  #inheritedCrossOrigin(textTrack: MediaTextTrackState | undefined): ThumbnailCore.Props['crossOrigin'] {
    return this.#externalThumbnails ? undefined : textTrack?.thumbnailsTrack?.crossOrigin;
  }

  /** Sync image attributes from element properties, leaving the ones the author put on the image alone. */
  #applyImageAttributes(img: HTMLImageElement, textTrack: MediaTextTrackState | undefined): void {
    const props: Partial<Record<ImageAttribute, string | undefined>> = {
      crossorigin: this.#core.resolveCrossOrigin(this.crossOrigin, this.#inheritedCrossOrigin(textTrack)),
      loading: this.loading,
      fetchpriority: this.fetchPriority,
    };

    for (const name of this.#authored) delete props[name];

    applyElementProps(img, props);
  }

  #applyResize(result: ThumbnailResizeResult): void {
    this.style.width = `${result.containerWidth}px`;
    this.style.height = `${result.containerHeight}px`;

    const imgStyle = this.#img?.style;
    if (!imgStyle) return;

    imgStyle.width = `${result.imageWidth}px`;
    imgStyle.height = `${result.imageHeight}px`;
    imgStyle.maxWidth = 'none';
    imgStyle.transform =
      result.offsetX || result.offsetY ? `translate(-${result.offsetX}px, -${result.offsetY}px)` : '';
  }

  #resetStyles(): void {
    this.style.width = '';
    this.style.height = '';

    const imgStyle = this.#img?.style;
    if (!imgStyle) return;

    imgStyle.width = '';
    imgStyle.height = '';
    imgStyle.maxWidth = '';
    imgStyle.transform = '';
  }

  #adopt(next: HTMLImageElement | null): void {
    if (next === this.#img) return;

    const previous = this.#img;

    if (previous) {
      this.#api?.disconnectImg(previous);
      this.#resetStyles();
      previous.removeAttribute('src');
      previous.removeAttribute('srcset');

      for (const name of IMAGE_ATTRIBUTES) {
        if (!this.#authored.has(name)) previous.removeAttribute(name);
      }
    }

    // Ownership is settled once, when an image becomes active: after the first
    // sync the attributes we set would themselves look authored.
    this.#img = next;
    this.#authored = new Set(next ? IMAGE_ATTRIBUTES.filter((name) => next.hasAttribute(name)) : []);
    this.#imageAttributes.disconnect();

    if (next && next !== this.#fallback) {
      this.#imageAttributes.observe(next, { attributes: true, attributeFilter: ['src', 'srcset'] });
    }

    // The fallback only occupies the shadow root while it is the active image,
    // so a supplied image never sits beside a hidden one.
    if (next === this.#fallback) this.#shadow.append(this.#fallback);
    else if (next) this.#fallback.remove();

    // Reset the request even when the next image will receive the same URL. A
    // replacement image is a new download with its own lifecycle.
    this.#api?.updateSrc(undefined);
  }

  #applySource(src: string | undefined): void {
    const img = this.#img;
    if (!img) return;

    // A srcset candidate wins over src, so the root has to clear both parts of
    // the source contract before applying the selected thumbnail URL.
    img.removeAttribute('srcset');

    if (!src) img.removeAttribute('src');
    else if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  }
}
