import {
  backgroundFeatures,
  type ExtensionPlayer,
  features,
  metadataFeature,
  type PlayerExtension,
  type PlayerTarget,
  type PopupGroup,
  videoFeatures,
  volumeFeature,
} from '@videojs/core/dom';
import { ContextConsumer } from '@videojs/element/context';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerExtensionElement } from '../../extensions/player-extension-element';
import { BackgroundVideo } from '../../media/background-video';
import { MediaAttachMixin } from '../../store/media-attach-mixin';
import { ContainerElement } from '../../ui/container/element';
import { UIElement } from '../../ui/ui-element';
import { createPlayer } from '../create-player';
import { popupGroupContext } from '../popup-group-context';

let tagCounter = 0;

function defineTestElement<Element extends CustomElementConstructor>(Base: Element): string {
  const tagName = `test-player-context-${tagCounter++}`;

  customElements.define(tagName, Base);
  return tagName;
}

describe('createPlayer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns expected exports', () => {
    const result = createPlayer({ features: videoFeatures });

    expect(result.PlayerElement).toBeInstanceOf(Function);
    expect(result.PlayerController).toBeDefined();
    expect(result.playerContext).toBeDefined();
    expect(result).not.toHaveProperty('ProviderMixin');
    expect(result).not.toHaveProperty('context');
    expect(result).not.toHaveProperty('create');
    expect(result).not.toHaveProperty('ContainerMixin');
  });

  it('PlayerElement owns a store instance', () => {
    const { PlayerElement } = createPlayer({ features: videoFeatures });
    const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;

    expect(player.store.attach).toBeInstanceOf(Function);
    expect(player.store.subscribe).toBeInstanceOf(Function);
    expect(player.store.destroy).toBeInstanceOf(Function);
  });

  it('preserves author player layout styles', () => {
    const { PlayerElement } = createPlayer({ features: backgroundFeatures });
    const player = document.createElement(defineTestElement(PlayerElement));

    player.style.display = 'grid';
    document.body.append(player);

    expect(player.style.display).toBe('grid');
  });

  it('scopes popup coordination to container descendants', async () => {
    const { PlayerElement } = createPlayer({ features: videoFeatures });

    class PopupGroupProbe extends UIElement {
      popupGroup: PopupGroup | undefined;

      constructor() {
        super();
        new ContextConsumer(this, {
          context: popupGroupContext,
          callback: (value) => {
            this.popupGroup = value;
          },
        });
      }
    }

    const playerTag = defineTestElement(PlayerElement);
    const containerTag = defineTestElement(ContainerElement);
    const probeTag = defineTestElement(PopupGroupProbe);
    const player = document.createElement(playerTag);
    const container = document.createElement(containerTag);
    const outsideProbe = document.createElement(probeTag) as PopupGroupProbe;
    const insideProbe = document.createElement(probeTag) as PopupGroupProbe;

    container.append(insideProbe);
    player.append(outsideProbe, container);
    document.body.append(player);

    await Promise.all([
      (player as UIElement).updateComplete,
      (container as UIElement).updateComplete,
      outsideProbe.updateComplete,
      insideProbe.updateComplete,
    ]);

    expect(outsideProbe.popupGroup).toBeUndefined();
    expect(insideProbe.popupGroup).toBeDefined();
  });

  it('keeps container registration identity-safe', async () => {
    const { PlayerElement } = createPlayer({ features: backgroundFeatures });
    const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
    const first = document.createElement(defineTestElement(class extends ContainerElement {}));
    const second = document.createElement(defineTestElement(class extends ContainerElement {}));
    const video = document.createElement('video');

    first.append(video);
    player.append(first, second);
    document.body.append(player);

    await vi.waitFor(() => expect(player.store.target?.container).toBe(second));

    second.remove();
    await vi.waitFor(() => expect(player.store.target?.container).toBe(first));

    first.remove();
    await vi.waitFor(() => expect(player.store.target?.container).toBeNull());
  });

  it('upgrades parser-created containers under a connected player', async () => {
    const { PlayerElement } = createPlayer({ features: backgroundFeatures });
    const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
    const containerTag = `test-late-container-${tagCounter++}`;

    player.innerHTML = `<${containerTag}><video></video></${containerTag}>`;
    document.body.append(player);

    expect(() => customElements.define(containerTag, class extends ContainerElement {})).not.toThrow();
    await vi.waitFor(() => expect(player.store.target?.container).toBeInstanceOf(ContainerElement));
  });

  it('keeps custom media registration identity-safe', async () => {
    const { PlayerElement } = createPlayer({ features: backgroundFeatures });
    const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
    const mediaTag = defineTestElement(MediaAttachMixin(HTMLElement));
    const first = document.createElement(mediaTag);
    const second = document.createElement(mediaTag);

    player.append(first, second);
    document.body.append(player);

    await vi.waitFor(() => expect(player.store.target?.media).toBe(second));

    first.remove();
    expect(player.store.target?.media).toBe(second);

    second.remove();
    await vi.waitFor(() => expect(player.store.target).toBeNull());
  });

  it('tracks native media added, removed, and replaced after connection', async () => {
    const { PlayerElement } = createPlayer({ features: backgroundFeatures });
    const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
    const first = document.createElement('video');
    const second = document.createElement('audio');

    document.body.append(player);
    expect(player.store.target).toBeNull();

    player.append(first);
    await vi.waitFor(() => expect(player.store.target?.media).toBe(first));

    first.replaceWith(second);
    await vi.waitFor(() => expect(player.store.target?.media).toBe(second));

    second.remove();
    await vi.waitFor(() => expect(player.store.target).toBeNull());
  });

  describe('*-video and *-audio media', () => {
    class FakeMedia extends HTMLElement {
      paused = true;
      ended = false;
      play(): Promise<void> {
        return Promise.resolve();
      }
      pause(): void {}
    }

    function mediaTag(suffix: 'video' | 'audio'): string {
      return `test-acme-${tagCounter++}-${suffix}`;
    }

    it('prefers a suffix element over native media', async () => {
      const { PlayerElement } = createPlayer({ features: backgroundFeatures });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const tag = mediaTag('video');

      customElements.define(tag, class extends FakeMedia {});

      const media = document.createElement(tag);

      player.append(document.createElement('video'), media);
      document.body.append(player);

      await vi.waitFor(() => expect(player.store.target?.media).toBe(player.querySelector(tag)));
    });

    it('waits for a suffix element to be defined before attaching', async () => {
      const { PlayerElement } = createPlayer({ features: backgroundFeatures });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const tag = mediaTag('audio');

      player.append(document.createElement(tag));
      document.body.append(player);
      await Promise.resolve();

      expect(player.store.target).toBeNull();

      customElements.define(tag, class extends FakeMedia {});

      // jsdom can hand back a new wrapper for an upgraded element, so compare against a fresh lookup.
      await vi.waitFor(() => expect(player.store.target?.media).toBe(player.querySelector(tag)));
    });

    it('skips a suffix element that is not media', async () => {
      const { PlayerElement } = createPlayer({ features: backgroundFeatures });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const tag = mediaTag('video');

      customElements.define(tag, class extends HTMLElement {});

      const wrapper = document.createElement(tag);
      const video = document.createElement('video');

      wrapper.append(video);
      player.append(wrapper);
      document.body.append(player);

      await vi.waitFor(() => expect(player.store.target?.media).toBe(video));
    });

    it('still prefers self-registered media', async () => {
      const { PlayerElement } = createPlayer({ features: backgroundFeatures });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const registered = document.createElement(defineTestElement(MediaAttachMixin(HTMLElement)));
      const tag = mediaTag('video');

      customElements.define(tag, class extends FakeMedia {});
      player.append(document.createElement(tag), registered);
      document.body.append(player);

      await vi.waitFor(() => expect(player.store.target?.media).toBe(registered));
    });
  });

  describe('extensions', () => {
    class MutedExtension implements PlayerExtension {
      attach = vi.fn<(target: PlayerTarget) => void>();
      detach = vi.fn();

      get mediaOverride() {
        return { muted: true };
      }
    }

    class MutedExtensionElement extends PlayerExtensionElement<MutedExtension> {
      get instance() {
        return this.extension;
      }

      protected createExtension() {
        return new MutedExtension();
      }
    }

    /** Declares no `mediaOverride`, like Mux Data. */
    class ObserverExtension implements PlayerExtension {
      connect = vi.fn<(player: ExtensionPlayer) => void>();
      disconnect = vi.fn();
      attach = vi.fn<(target: PlayerTarget) => void>();
      detach = vi.fn();
    }

    class ObserverExtensionElement extends PlayerExtensionElement<ObserverExtension> {
      get instance() {
        return this.extension;
      }

      protected createExtension() {
        return new ObserverExtension();
      }
    }

    const extensionTag = defineTestElement(MutedExtensionElement);
    const observerTag = defineTestElement(ObserverExtensionElement);

    it('attaches extensions to a plain video and routes store reads through their overrides', async () => {
      const { PlayerElement } = createPlayer({ features: [volumeFeature] });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const video = document.createElement('video');
      const extension = document.createElement(extensionTag) as MutedExtensionElement;

      player.append(video, extension);
      document.body.append(player);

      await vi.waitFor(() => expect(player.store.target).not.toBeNull());

      const media = player.store.target?.media as HTMLVideoElement | undefined;

      expect(extension.instance.attach).toHaveBeenCalledWith(expect.objectContaining({ media: video }));
      expect(media).not.toBe(video);
      expect(media).toBeInstanceOf(HTMLVideoElement);
      expect(media?.muted).toBe(true);
      expect(player.store.state.muted).toBe(true);
      expect(video.muted).toBe(false);
    });

    it('re-attaches the store when an extension arrives after the media', async () => {
      const { PlayerElement } = createPlayer({ features: [volumeFeature] });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const video = document.createElement('video');

      player.append(video);
      document.body.append(player);

      await vi.waitFor(() => expect(player.store.target?.media).toBe(video));
      expect(player.store.state.muted).toBe(false);

      const extension = document.createElement(extensionTag) as MutedExtensionElement;

      player.append(extension);

      expect(extension.instance.attach).toHaveBeenCalledTimes(1);
      expect(player.store.target?.media).not.toBe(video);
      expect(player.store.state.muted).toBe(true);

      extension.remove();

      expect(extension.instance.detach).toHaveBeenCalledTimes(1);
      expect(player.store.target?.media).toBe(video);
      expect(player.store.state.muted).toBe(false);
    });

    it('never wraps the media or re-attaches the store for an observer', async () => {
      const { PlayerElement } = createPlayer({ features: [volumeFeature] });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const video = document.createElement('video');

      player.append(video);
      document.body.append(player);

      await vi.waitFor(() => expect(player.store.target?.media).toBe(video));

      const attach = vi.spyOn(player.store, 'attach');
      const extension = document.createElement(observerTag) as ObserverExtensionElement;

      player.append(extension);

      expect(extension.instance.connect).toHaveBeenCalledWith({ initTime: expect.any(Number) });
      expect(extension.instance.attach).toHaveBeenCalledWith(expect.objectContaining({ media: video }));
      expect(player.store.target?.media).toBe(video);

      extension.remove();

      expect(extension.instance.detach).toHaveBeenCalledTimes(1);
      expect(extension.instance.disconnect).toHaveBeenCalledTimes(1);
      expect(attach).not.toHaveBeenCalled();
    });

    it('keeps extensions attached when only the container changes', async () => {
      const { PlayerElement } = createPlayer({ features: backgroundFeatures });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const container = document.createElement(defineTestElement(class extends ContainerElement {}));
      const video = document.createElement('video');
      const extension = document.createElement(observerTag) as ObserverExtensionElement;

      player.append(video, extension);
      document.body.append(player);

      await vi.waitFor(() => expect(player.store.target?.media).toBe(video));

      player.append(container);
      await vi.waitFor(() => expect(player.store.target?.container).toBe(container));

      container.remove();
      await vi.waitFor(() => expect(player.store.target?.container).toBeNull());

      expect(extension.instance.attach).toHaveBeenCalledTimes(1);
      expect(extension.instance.detach).not.toHaveBeenCalled();
    });

    it('moves extensions with the media and detaches them with the store', async () => {
      const { PlayerElement } = createPlayer({ features: backgroundFeatures });
      const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
      const first = document.createElement('video');
      const second = document.createElement('video');
      const extension = document.createElement(extensionTag) as MutedExtensionElement;

      player.append(extension, first);
      document.body.append(player);

      await vi.waitFor(() => expect(extension.instance.attach).toHaveBeenCalledTimes(1));

      first.replaceWith(second);
      await vi.waitFor(() => expect(extension.instance.attach).toHaveBeenCalledTimes(2));

      expect(extension.instance.detach).toHaveBeenCalledTimes(1);
      expect(extension.instance.attach).toHaveBeenLastCalledWith(expect.objectContaining({ media: second }));

      second.remove();
      await vi.waitFor(() => expect(player.store.target).toBeNull());

      expect(extension.instance.detach).toHaveBeenCalledTimes(2);
    });
  });

  it('does not retain disconnected context media as a native fallback', async () => {
    const { PlayerElement } = createPlayer({ features: backgroundFeatures });
    const player = document.createElement(defineTestElement(PlayerElement)) as InstanceType<typeof PlayerElement>;
    const background = document.createElement(defineTestElement(BackgroundVideo));
    const video = document.createElement('video');

    video.slot = 'media';

    background.append(video);
    player.append(background);
    document.body.append(player);

    await vi.waitFor(() => expect(player.store.target?.media).toBe(video));

    background.remove();
    expect(player.store.target).toBeNull();
  });

  it('maps selected feature inputs to reactive properties and attributes', async () => {
    const { PlayerElement } = createPlayer({ features: [metadataFeature] });
    const tagName = 'test-metadata-provider';

    customElements.define(tagName, PlayerElement);

    const player = document.createElement(tagName) as InstanceType<typeof PlayerElement>;

    player.setAttribute('content-title', 'Attribute title');
    document.body.append(player);

    expect(player.contentTitle).toBe('Attribute title');
    expect(player.store.title).toBe('Attribute title');
    expect(PlayerElement.observedAttributes).toContain('content-title');

    player.contentTitle = 'Property title';

    expect(player.contentTitle).toBe('Property title');
    expect(player.getAttribute('content-title')).toBe('Attribute title');

    await player.updateComplete;

    expect(player.store.title).toBe('Property title');

    player.setAttribute('content-title', '');
    await player.updateComplete;
    expect(player.store.title).toBe('');

    player.removeAttribute('content-title');
    await player.updateComplete;
    expect(player.store.title).toBe('');
  });

  it('leaves the element its own `title`, which means the tooltip', async () => {
    const { PlayerElement } = createPlayer({ features: [metadataFeature] });
    const tagName = 'test-title-provider';

    customElements.define(tagName, PlayerElement);

    const player = document.createElement(tagName) as InstanceType<typeof PlayerElement>;

    document.body.append(player);

    // Nothing was installed over the native accessor, so this is still the tooltip.
    expect(Object.getOwnPropertyDescriptor(PlayerElement.prototype, 'title')).toBeUndefined();
    expect(PlayerElement.observedAttributes).not.toContain('title');

    player.title = 'Tooltip';
    await player.updateComplete;

    expect(player.getAttribute('title')).toBe('Tooltip');
    expect(player.store.title).toBe('');
  });

  it('applies orientation lock configuration through attributes and properties', async () => {
    const { PlayerElement } = createPlayer({ features: [features.orientationLock] });
    const tagName = 'test-orientation-lock-player';

    customElements.define(tagName, PlayerElement);

    const player = document.createElement(tagName) as InstanceType<typeof PlayerElement>;

    player.setAttribute('orientation-lock-type', 'portrait');
    document.body.append(player);

    expect(player.store.orientationLockType).toBe('portrait');

    player.orientationLockType = 'natural';
    await player.updateComplete;

    expect(player.store.orientationLockType).toBe('natural');

    player.orientationLockType = undefined;
    await player.updateComplete;

    expect(player.store.orientationLockType).toBe('landscape');

    player.remove();
  });

  it('applies property configuration that shadowed an accessor before connection', async () => {
    const { PlayerElement } = createPlayer({ features: [features.orientationLock] });
    const tagName = `test-shadowed-config-player-${tagCounter++}`;

    customElements.define(tagName, PlayerElement);

    // SAFETY: The tag was registered with PlayerElement immediately above.
    const player = document.createElement(tagName) as InstanceType<typeof PlayerElement>;

    Object.defineProperty(player, 'orientationLockType', {
      value: 'portrait',
      writable: true,
      configurable: true,
      enumerable: true,
    });
    document.body.append(player);

    await vi.waitFor(() => expect(player.store.orientationLockType).toBe('portrait'));

    player.orientationLockType = 'natural';
    await player.updateComplete;

    expect(player.store.orientationLockType).toBe('natural');
  });

  it('leaves config attributes inert when their feature is absent', () => {
    const { PlayerElement } = createPlayer({ features: backgroundFeatures });

    expect(PlayerElement.observedAttributes).not.toContain('content-title');
    expect(PlayerElement.prototype).not.toHaveProperty('contentTitle');
  });
});
