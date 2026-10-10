import {
  type MediaContainer,
  type PlayerExtension,
  PlayerExtensionCoordinator,
  type PlayerFeatureConfig,
  type PlayerStore,
  type PlayerTarget,
  setPlayerConfigValue,
} from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextProvider, ContextRoot } from '@videojs/element/context';
import type { Media } from '@videojs/media/dom';
import { isUndefinedCustomElement } from '@videojs/utils/dom';
import { isNull } from '@videojs/utils/predicate';
import { camelCase, kebabCase } from '@videojs/utils/string';

import type { PlayerElementConstructor } from '../store/types';
import { UIElement } from '../ui/ui-element';
import type { ContainerContext, ExtensionContext, MediaContext, PlayerContext } from './context';

export interface CreatePlayerElementOptions<Store extends PlayerStore> {
  playerContext: PlayerContext<Store>;
  mediaContext: MediaContext;
  containerContext: ContainerContext;
  extensionContext: ExtensionContext;
  factory: () => Store;
  config: PlayerFeatureConfig;
}

/** Marks a descendant that isn't a Video.js media element as the player's media, as media-chrome does. */
const MEDIA_SLOT_SELECTOR = '[slot="media"]';

interface Registration<Value> {
  value: Value;
}

interface ConfigInput {
  property: string;
  attribute: string;
  entry: PlayerFeatureConfig[string];
}

function resolveInputs(config: PlayerFeatureConfig): ConfigInput[] {
  return Object.entries(config).map(([key, entry]) => {
    const declared = entry.html?.attribute;
    const attribute = declared ?? kebabCase(key);

    if (__DEV__ && declared && declared !== kebabCase(declared)) {
      console.warn(`[vjs-html] config html.attribute "${declared}" is not kebab-case and will never match`);
    }

    return { property: camelCase(attribute), attribute, entry };
  });
}

/** Creates a configured player element class that owns the store and attach lifecycle. */
export function createPlayerElement<Store extends PlayerStore>(
  options: CreatePlayerElementOptions<Store>
): PlayerElementConstructor<Store>;
export function createPlayerElement<Store extends PlayerStore>(
  options: CreatePlayerElementOptions<Store>
): typeof UIElement {
  const inputs = resolveInputs(options.config);

  class ConfiguredPlayerElement extends UIElement {
    static properties = {
      ...UIElement.properties,
      ...Object.fromEntries(inputs.map(({ property, attribute }) => [property, { type: String, attribute }])),
    } satisfies PropertyDeclarationMap;

    #store: Store | null = options.factory();
    readonly #contextRoot = new ContextRoot();
    #configuredStore: Store | null = null;
    #detach: (() => void) | null = null;
    #connected = false;
    #media: Media | null = null;
    #nativeMedia: HTMLMediaElement | null = null;
    #container: MediaContainer | null = null;
    // The raw target the store is attached to; `store.target.media` may be the extensions' facade over it.
    #attached: PlayerTarget | null = null;
    #mediaRegistrations: Registration<Media>[] = [];
    #containerRegistrations: Registration<MediaContainer>[] = [];
    #observer = new MutationObserver(() => this.#syncNativeMedia());
    #extensions = new PlayerExtensionCoordinator(() => this.#syncExtensions());

    #registerExtension = (extension: PlayerExtension): (() => void) => this.#extensions.register(extension);

    #registerMedia = (media: Media): (() => void) => {
      const registration = { value: media };

      this.#mediaRegistrations.push(registration);
      this.#syncMedia();

      return () => {
        const index = this.#mediaRegistrations.indexOf(registration);
        if (index < 0) return;

        this.#mediaRegistrations.splice(index, 1);
        this.#syncNativeMedia();
        this.#syncMedia();
      };
    };

    #registerContainer = (container: MediaContainer): (() => void) => {
      const registration = { value: container };

      this.#containerRegistrations.push(registration);
      this.#syncContainer();

      return () => {
        const index = this.#containerRegistrations.indexOf(registration);
        if (index < 0) return;

        this.#containerRegistrations.splice(index, 1);
        this.#syncContainer();
      };
    };

    #playerProvider = new ContextProvider(this, {
      context: options.playerContext,
      initialValue: this.store,
    });

    #mediaProvider = new ContextProvider(this, {
      context: options.mediaContext,
      initialValue: { media: this.#media, registerMedia: this.#registerMedia },
    });

    #containerProvider = new ContextProvider(this, {
      context: options.containerContext,
      initialValue: {
        container: this.#container,
        registerContainer: this.#registerContainer,
      },
    });

    constructor() {
      super();
      // Registers itself as a controller on this element; the value never changes, so nothing reads it back.
      new ContextProvider(this, {
        context: options.extensionContext,
        initialValue: { registerExtension: this.#registerExtension },
      });
    }

    get store(): Store {
      if (isNull(this.#store)) {
        this.#store = options.factory();
      }

      return this.#store;
    }

    override connectedCallback(): void {
      this.#connected = true;
      // Retry part subscriptions when their parent is registered later.
      this.#contextRoot.attach(this);
      super.connectedCallback();
      this.#syncInitialConfig();
      this.#playerProvider.setValue(this.store);
      this.#publishMedia();
      this.#publishContainer();
      this.#observer.observe(this, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['slot'],
      });
      queueMicrotask(() => {
        if (this.#connected) this.#syncNativeMedia();
      });
      this.#tryAttach();
    }

    override disconnectedCallback(): void {
      this.#connected = false;
      this.#contextRoot.detach(this);
      this.#observer.disconnect();
      this.#detachStore();
      super.disconnectedCallback();
    }

    override destroyCallback(): void {
      this.#contextRoot.detach(this);
      this.#observer.disconnect();
      this.#detachStore();
      this.#extensions.destroy();
      this.#store?.destroy();
      this.#store = null;
      super.destroyCallback();
    }

    protected override willUpdate(changed: PropertyValues): void {
      super.willUpdate(changed);

      for (const { property, entry } of inputs) {
        if (!changed.has(property)) continue;

        // SAFETY: `resolveInputs` derives properties installed by this class's static property map.
        const configProperty = property as keyof this;

        setPlayerConfigValue(this.store, entry, this[configProperty]);
      }
    }

    #syncMedia(): void {
      const registered = this.#mediaRegistrations.at(-1)?.value ?? null;
      const media = registered ?? this.#nativeMedia;
      if (this.#media === media) return;

      this.#media = media;
      this.#publishMedia();
      this.#tryAttach();
    }

    #syncContainer(): void {
      const container = this.#containerRegistrations.at(-1)?.value ?? null;
      if (this.#container === container) return;

      this.#container = container;
      this.#publishContainer();
      this.#tryAttach();
    }

    #syncNativeMedia(): void {
      const media = this.#findSlottedMedia() ?? this.querySelector<HTMLMediaElement>('video, audio');
      if (this.#nativeMedia === media) return;

      this.#nativeMedia = media;
      this.#syncMedia();
    }

    /** The first descendant with `slot="media"`, once its custom element class (if any) is defined. */
    #findSlottedMedia(): HTMLMediaElement | null {
      // The author slotted this element as media; each feature checks the capabilities it needs before use.
      const slotted = this.querySelector<HTMLMediaElement>(MEDIA_SLOT_SELECTOR);
      if (!slotted) return null;

      // Features check what the media supports once, at attach, so attaching before the upgrade would leave them off.
      if (isUndefinedCustomElement(slotted)) {
        customElements.whenDefined(slotted.localName).then(() => {
          if (this.#connected) this.#syncNativeMedia();
        });

        return null;
      }

      return slotted;
    }

    #publishMedia(): void {
      this.#mediaProvider.setValue({ media: this.#media, registerMedia: this.#registerMedia });
    }

    #publishContainer(): void {
      this.#containerProvider.setValue({
        container: this.#container,
        registerContainer: this.#registerContainer,
      });
    }

    #tryAttach(): void {
      if (!this.#connected || !this.#store) return;

      if (!this.#media) {
        this.#detachStore();
        return;
      }

      const target: PlayerTarget = {
        media: this.#media,
        container: this.#container,
      };

      const hasMediaChanged = this.#attached?.media !== target.media;
      const hasContainerChanged = this.#attached?.container !== target.container;

      if (hasMediaChanged || hasContainerChanged) this.#attach(target);
    }

    /**
     * Extensions attach before the store so their overrides are in place when features first read the media; the store
     * then sees the media through the extensions' facade. Extensions follow the media only, so a container change
     * re-attaches the store but leaves them attached.
     */
    #attach(target: PlayerTarget): void {
      const store = this.#store;
      if (!store) return;

      this.#detach?.();
      this.#attached = target;
      this.#extensions.attach(target);
      this.#detach = store.attach({ media: this.#extensions.getStoreMedia(target.media), container: target.container });
    }

    /**
     * An extension that overrides media members was added or removed. Features hold members read at attach time (such
     * as `remote`), so the store re-attaches to the same target to pick up what the extensions now own. Observers such
     * as analytics never get here. Extensions themselves stay attached.
     */
    #syncExtensions(): void {
      if (this.#attached) this.#attach(this.#attached);
    }

    #detachStore(): void {
      this.#detach?.();
      this.#detach = null;
      this.#extensions.detach();
      this.#attached = null;
    }

    #syncInitialConfig(): void {
      const store = this.store;
      if (this.#configuredStore === store) return;

      for (const { property, entry } of inputs) {
        // SAFETY: `resolveInputs` derives properties installed by this class's static property map.
        const configProperty = property as keyof this;

        setPlayerConfigValue(store, entry, this[configProperty]);
      }

      this.#configuredStore = store;
    }
  }

  return ConfiguredPlayerElement;
}
