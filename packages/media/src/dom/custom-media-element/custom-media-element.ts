import { namedNodeMapToObject, serializeAttributes } from '@videojs/utils/dom';
import { omit, pick } from '@videojs/utils/object';
import { kebabCase } from '@videojs/utils/string';
import type { Constructor } from '@videojs/utils/types';

/**
 * CSS custom property names for video elements.
 *
 * @internal
 */
export const VideoCSSVars = {
  /** Border radius of the video element. */
  borderRadius: '--media-video-border-radius',
  /** Object fit for the video. */
  objectFit: '--media-object-fit',
  /** Object position for the video. */
  objectPosition: '--media-object-position',
  /** Duration of the caption track transition. */
  captionTrackDuration: '--media-caption-track-duration',
  /** Delay before the caption track transition. */
  captionTrackDelay: '--media-caption-track-delay',
  /** Vertical offset of the caption track. */
  captionTrackY: '--media-caption-track-y',
} as const;

/**
 * CSS custom property names for audio elements.
 *
 * @internal
 */
export const AudioCSSVars = {} as const;

/** Helper function to generate the HTML template for video elements. */
function getVideoTemplateHTML(attrs: Record<string, string>): string {
  return /*html*/ `
    <style>
      :host {
        display: contents;
      }

      video {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: var(${VideoCSSVars.borderRadius});
        object-fit: var(${VideoCSSVars.objectFit}, contain);
        object-position: var(${VideoCSSVars.objectPosition}, center);
      }

      video::-webkit-media-text-track-container {
        transition: translate var(${VideoCSSVars.captionTrackDuration}, 0) ease-out;
        transition-delay: var(${VideoCSSVars.captionTrackDelay}, 0);
        translate: 0 var(${VideoCSSVars.captionTrackY}, 0);
        scale: 0.98;
        z-index: 1;
        font-family: inherit;
      }
    </style>
    <slot name="media">
      <video${serializeAttributes(attrs)}></video>
    </slot>
    <slot></slot>
  `;
}

/** Helper function to generate the HTML template for other elements. */
function getCommonTemplateHTML(tag: string) {
  return (attrs: Record<string, string>) => {
    return /*html*/ `
      <style>
        :host {
          display: inline-flex;
          line-height: 0;
          flex-direction: column;
          justify-content: end;
        }

        ${tag} {
          width: 100%;
        }
      </style>
      <slot name="media">
        <${tag}${serializeAttributes(attrs)}></${tag}>
      </slot>
      <slot></slot>
    `;
  };
}

const excludedProperties = ['attach', 'detach', 'destroy'];

/** How a property declares the content attribute that drives it. */
type PropertyConfig = { type: any; attribute?: string; empty?: unknown };
type PropertyConfigs = Record<string, PropertyConfig>;

/**
 * The content attribute a property is driven by.
 *
 * Attributes HTML already defines are squashed lowercase (`playsInline` -> `playsinline`), while the custom ones are
 * kebab-case (`streamType` -> `stream-type`) and name themselves through `attribute`. Undeclared properties are this
 * library's own, so they take kebab-case too.
 */
function attributeName(prop: string, properties: PropertyConfigs): string {
  const config = properties[prop];

  return config ? (config.attribute ?? prop.toLowerCase()) : kebabCase(prop);
}

/**
 * Whether a property's declared attribute is really another property's.
 *
 * For example: `defaultMuted` declares `attribute: 'muted'`, but `muted` is a property in its own right and owns that
 * attribute, so the alias defers to it.
 */
function isAttributeAlias(prop: string, properties: PropertyConfigs, hostPrototype: object): boolean {
  const { attribute } = properties[prop] ?? {};

  return !!attribute && attribute in hostPrototype;
}

/** Coerce an attribute string to the type the adapter property already holds. */
function propertyValueFor(attrValue: string | null, current: unknown, config?: PropertyConfig): unknown {
  if (typeof current === 'boolean') return attrValue !== null;

  if (typeof current === 'number') return Number(attrValue);

  return attrValue ?? (config && 'empty' in config ? config.empty : '');
}

export interface PlaybackAdapter extends EventTarget {
  attach(target: EventTarget | null): void;
  detach(): void;
  destroy(): void;
  /** Index signature for dynamic property forwarding (includes the adapter's protected `target`). */
  [key: string]: any;
}

export type CustomMediaConstructor<T extends Constructor<PlaybackAdapter>> = Constructor<
  HTMLElement &
    InstanceType<T> & {
      readonly adapter: InstanceType<T>;
      attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    }
> & {
  properties: Record<string, { type: any; attribute?: string; empty?: unknown }>;
  getTemplateHTML: (attrs: Record<string, string>) => string;
  shadowRootOptions: ShadowRootInit;
  readonly observedAttributes: string[];
};

/** @internal */
export function CustomMediaElement<T extends Constructor<PlaybackAdapter>>(
  tag: string,
  PlaybackAdapter: T
): CustomMediaConstructor<T> {
  // Embed hosts (iframe) drive an external player rather than a native media
  // element, so attribute changes are not mirrored onto the iframe target and
  // there is no `<track>` / `<source>` syncing.
  const syncTargetAttributes = tag !== 'iframe';
  const mediaHostAttrToProp = new Map<string, string>();
  let isDefined = false;

  class CustomMedia extends (globalThis.HTMLElement ?? class {}) {
    static getTemplateHTML = tag.endsWith('video') ? getVideoTemplateHTML : getCommonTemplateHTML(tag);
    static shadowRootOptions: ShadowRootInit = { mode: 'open' };
    static properties = {
      autoPictureInPicture: { type: Boolean },
      autoplay: { type: Boolean },
      controls: { type: Boolean },
      controlsList: { type: String },
      crossOrigin: { type: String, empty: null },
      defaultMuted: { type: Boolean, attribute: 'muted' },
      disablePictureInPicture: { type: Boolean },
      disableRemotePlayback: { type: Boolean },
      loading: { type: String },
      loop: { type: Boolean },
      playsInline: { type: Boolean },
      poster: { type: String, empty: '' },
      preload: { type: String, empty: null },
      src: { type: String, empty: '' },
      streamType: { type: String, attribute: 'stream-type', empty: 'unknown' },
    };

    static get observedAttributes() {
      // `this` resolves to the subclass, which may override `properties`.
      CustomMedia.#define(this);
      return [
        // Intentionally use `this` so subclasses can override the constructor.
        ...getAttrsFromProps(this.properties),
      ];
    }

    static #define(ctor: typeof CustomMedia) {
      if (isDefined) return;

      isDefined = true;

      const properties = ctor.properties as PropertyConfigs;

      for (
        let proto = PlaybackAdapter.prototype;
        proto && proto !== Object.prototype;
        proto = Object.getPrototypeOf(proto)
      ) {
        for (const prop of Object.getOwnPropertyNames(proto)) {
          if (prop in CustomMedia.prototype || excludedProperties.includes(prop)) continue;

          // An alias keeps reflecting its attribute through the `properties`
          // loop below rather than reaching the adapter.
          if (isAttributeAlias(prop, properties, PlaybackAdapter.prototype)) continue;

          const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
          if (!descriptor) continue;

          const config: PropertyDescriptor = {
            enumerable: true,
            configurable: true,
          };

          if (typeof descriptor.value === 'function') {
            config.value = function (this: CustomMedia, ...args: any[]) {
              return this.#mediaHost[prop](...args);
            };
          } else if (descriptor.get) {
            config.get = function (this: CustomMedia) {
              return this.#mediaHost[prop];
            };

            if (descriptor.set) {
              const attr = attributeName(prop, properties);

              if (ctor.observedAttributes.includes(attr)) {
                mediaHostAttrToProp.set(attr, prop);

                config.set = function (this: CustomMedia, val: any) {
                  if (val === true || val === false || val == null) {
                    this.toggleAttribute(attr, Boolean(val));
                  } else {
                    this.setAttribute(attr, String(val));
                  }
                };
              } else {
                config.set = function (this: CustomMedia, val: any) {
                  this.#mediaHost[prop] = val;
                };
              }
            }
          }

          Object.defineProperty(CustomMedia.prototype, prop, config);
        }
      }

      for (const [prop, { type, attribute }] of Object.entries(properties)) {
        if (prop in CustomMedia.prototype) continue;

        const attr = attribute ?? prop.toLowerCase();

        Object.defineProperty(CustomMedia.prototype, prop, {
          get: function (this: CustomMedia) {
            return type === Boolean ? this.hasAttribute(attr) : this.getAttribute(attr);
          },
          set: function (this: CustomMedia, val: any) {
            if (type === Boolean) {
              this.toggleAttribute(attr, Boolean(val));
            } else {
              this.setAttribute(attr, val);
            }
          },
          enumerable: true,
          configurable: true,
        });
      }
    }

    #mediaHost: PlaybackAdapter;
    #bridgedEventTypes = new Set<string>();
    #childMap = new Map<HTMLTrackElement | HTMLSourceElement, HTMLTrackElement | HTMLSourceElement>();
    #childObserver?: MutationObserver;

    constructor() {
      super();

      if (!this.shadowRoot) {
        const ctor = this.constructor as typeof CustomMedia;

        this.attachShadow(ctor.shadowRootOptions);

        const allowedKeys = getAttrsFromProps(ctor.properties);
        const disallowedKeys = [...mediaHostAttrToProp.keys()];
        const pickedAttrs = pick(namedNodeMapToObject(this.attributes), allowedKeys);
        // Embed templates (iframe) need adapter-bound attrs (e.g. `src`) to build the initial URL.
        const attrs: Record<string, string> = syncTargetAttributes ? omit(pickedAttrs, disallowedKeys) : pickedAttrs;

        if (tag && !attrs.part) attrs.part = tag;

        this.shadowRoot!.innerHTML = ctor.getTemplateHTML(attrs);
      }

      this.#mediaHost = new PlaybackAdapter();
      this.#attachToTarget();

      this.#childObserver = new MutationObserver(this.#syncMediaChildAttribute.bind(this));
      this.shadowRoot!.addEventListener('slotchange', () => {
        this.#attachToTarget();
        this.#syncMediaChildren();
      });

      this.#syncMediaChildren();
    }

    #attachToTarget(): void {
      const target = this.target;
      if (target === this.#mediaHost.target) return;

      if (this.#mediaHost.target) this.#mediaHost.detach();

      this.#mediaHost.attach(target);
    }

    get adapter(): PlaybackAdapter {
      return this.#mediaHost;
    }

    get target(): HTMLElement | null {
      return (
        this.querySelector(':scope > [slot=media]') ??
        this.querySelector(tag) ??
        this.shadowRoot?.querySelector(tag) ??
        null
      );
    }

    connectedCallback() {
      if (tag !== 'iframe') return;

      // Add data attribute for styling and avoiding cross-origin issues. e.g. backdrop-filter
      if (!this.hasAttribute('data-cross-origin-frame')) {
        this.setAttribute('data-cross-origin-frame', '');
      }
    }

    disconnectedCallback() {
      if (this.hasAttribute('keep-alive')) return;

      // Defer so a synchronous reparent (remove + insert) doesn't tear down
      // the adapter and its registered components.
      queueMicrotask(() => {
        if (!this.isConnected) this.#mediaHost.destroy();
      });
    }

    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | ((event: never) => void) | null,
      options?: boolean | AddEventListenerOptions
    ) {
      super.addEventListener(type, listener as EventListener, options);

      if (!this.#bridgedEventTypes.has(type)) {
        this.#bridgedEventTypes.add(type);
        this.#mediaHost.addEventListener(type, this.#bridgeEvent);
      }
    }

    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | ((event: never) => void) | null,
      options?: boolean | EventListenerOptions
    ): void {
      super.removeEventListener(type, listener as EventListener, options);
    }

    #bridgeEvent = (event: Event) => {
      if (!event.composed) {
        this.dispatchEvent(new (event.constructor as typeof Event)(event.type, event));
      }
    };

    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null): void {
      const prop = mediaHostAttrToProp.get(attrName);

      if (prop) {
        if (oldValue !== newValue) {
          const propConfig = (this.constructor as CustomMediaConstructor<T>).properties[prop];

          this.#mediaHost[prop] = propertyValueFor(newValue, this.#mediaHost[prop], propConfig);
        }

        return;
      }

      if (
        !CustomMedia.observedAttributes.includes(attrName) &&
        (this.constructor as typeof CustomMedia).observedAttributes.includes(attrName)
      ) {
        return;
      }

      if (!syncTargetAttributes) return;

      if (newValue === null) {
        this.target?.removeAttribute(attrName);
      } else if (this.target?.getAttribute(attrName) !== newValue) {
        this.target?.setAttribute(attrName, newValue);
      }
    }

    #syncMediaChildren(): void {
      if (tag === 'iframe') return;

      const defaultSlot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
      const mediaChildren = new Set(
        defaultSlot
          ?.assignedElements({ flatten: true })
          .filter((el) => el.localName === 'track' || el.localName === 'source') as (
          | HTMLTrackElement
          | HTMLSourceElement
        )[]
      );

      for (const [el, clone] of this.#childMap) {
        if (!mediaChildren.has(el)) {
          clone.remove();
          this.#childMap.delete(el);
        }
      }

      for (const el of mediaChildren) {
        let clone = this.#childMap.get(el);

        if (!clone) {
          clone = el.cloneNode() as HTMLTrackElement | HTMLSourceElement;
          this.#childMap.set(el, clone);
          this.#childObserver?.observe(el, { attributes: true });
        }

        this.target?.append(clone);
        this.#enableDefaultTrack(clone as HTMLTrackElement);
      }
    }

    #syncMediaChildAttribute(mutations: MutationRecord[]): void {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const { target, attributeName } = mutation;
          const clone = this.#childMap.get(target as HTMLTrackElement | HTMLSourceElement);

          if (clone && attributeName) {
            clone.setAttribute(
              attributeName,
              (target as HTMLTrackElement | HTMLSourceElement).getAttribute(attributeName) ?? ''
            );
            this.#enableDefaultTrack(clone as HTMLTrackElement);
          }
        }
      }
    }

    #enableDefaultTrack(trackEl: HTMLTrackElement): void {
      // Browsers don't honor the `default` attribute if a track is added via JS.
      // Enable default tracks for chapters or metadata.
      if (
        trackEl &&
        trackEl.localName === 'track' &&
        trackEl.default &&
        (trackEl.kind === 'chapters' || trackEl.kind === 'metadata') &&
        trackEl.track.mode === 'disabled'
      ) {
        trackEl.track.mode = 'hidden';
      }
    }
  }

  return CustomMedia as any;
}

function getAttrsFromProps(props: PropertyConfigs): string[] {
  return Object.keys(props).map((prop) => attributeName(prop, props));
}
