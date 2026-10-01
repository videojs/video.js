import type { AnyPlayerStore, PlayerTarget } from '@videojs/core/dom';
import { controlsFeature, metadataFeature, playbackFeature, setPlayerConfigValue } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { combine, createStore } from '@videojs/store';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { TitleElement } from '../element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Store notifications are coalesced, so poll rather than awaiting a single update. */
async function waitForAssertion(assertion: () => void): Promise<void> {
  let error: unknown;

  for (let index = 0; index < 10; index++) {
    try {
      assertion();
      return;
    } catch (caught) {
      error = caught;
      await nextFrame();
    }
  }

  throw error;
}

/** Satisfies the pause, seek, and source capabilities `playbackFeature` attaches to. */
class FakeMedia extends EventTarget {
  paused = true;
  ended = false;
  currentTime = 0;
  duration = 100;
  seeking = false;
  src = 'https://example.com/video.mp4';
  currentSrc = 'https://example.com/video.mp4';
  readyState = 4;

  load(): void {}

  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  play(): void {
    this.paused = false;
    this.dispatchEvent(new Event('play'));
  }
}

function createTitleStore() {
  return createStore<PlayerTarget>()(combine(metadataFeature, controlsFeature, playbackFeature));
}

/** A player without the controls feature, like the audio presets. */
function createNoControlsStore() {
  return createStore<PlayerTarget>()(combine(metadataFeature, playbackFeature));
}

/** A player composed of `metadataFeature` alone, like the metadata sandbox. */
function createMetadataOnlyStore() {
  return createStore<PlayerTarget>()(combine(metadataFeature));
}

type TitleStore = ReturnType<typeof createTitleStore>;

const titleConfig = metadataFeature.config!.title;

/** Set the user title the way a provider does, through the feature's own config. */
function setTitle(store: object, value: string | null): void {
  setPlayerConfigValue(store, titleConfig, value);
}

class TestPlayerProviderElement extends UIElement {
  store: AnyPlayerStore = createTitleStore() as unknown as AnyPlayerStore;

  readonly #provider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }
}

defineElement('test-title-player', TestPlayerProviderElement);

async function setup(store?: object) {
  const provider = document.createElement('test-title-player') as TestPlayerProviderElement;

  if (store) provider.store = store as unknown as AnyPlayerStore;

  const title = createElement(TitleElement);

  document.body.append(provider);
  provider.append(title);
  await title.updateComplete;

  return { provider, title };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('TitleElement', () => {
  it('renders empty text and hides when no source supplies a title', async () => {
    const { title } = await setup();

    expect(title.textContent).toBe('');
    expect(title.hidden).toBe(true);
    expect(title.hasAttribute('data-hidden')).toBe(true);
  });

  it('shows once a title resolves and hides again when cleared', async () => {
    const store = createTitleStore();
    const { title } = await setup(store);

    setTitle(store, 'Sintel');
    await waitForAssertion(() => {
      expect(title.hidden).toBe(false);
      expect(title.hasAttribute('data-hidden')).toBe(false);
    });

    setTitle(store, null);
    await waitForAssertion(() => {
      expect(title.hidden).toBe(true);
      expect(title.hasAttribute('data-hidden')).toBe(true);
    });
  });

  it('ignores controls and playback state', async () => {
    const store: TitleStore = createTitleStore();
    const media = new FakeMedia();

    store.attach({ media: media as unknown as PlayerTarget['media'], container: null });

    const { title } = await setup(store);

    setTitle(store, 'Sintel');
    await waitForAssertion(() => expect(title.hidden).toBe(false));

    // Whether the title travels with the controls is a skin composition
    // concern, so neither playing nor hiding the controls touches it here.
    media.play();
    await waitForAssertion(() => {
      expect(store.paused).toBe(false);
      expect(title.hidden).toBe(false);
    });

    store.toggleControls();
    await waitForAssertion(() => {
      expect(store.controlsVisible).toBe(false);
      expect(title.hidden).toBe(false);
    });
  });

  it('renders the title without the controls feature', async () => {
    const store = createNoControlsStore();
    const { title } = await setup(store);

    setTitle(store, 'Sintel');

    await waitForAssertion(() => {
      expect(title.textContent).toBe('Sintel');
      expect(title.hidden).toBe(false);
    });
  });

  it('renders the title without the playback feature', async () => {
    const store = createMetadataOnlyStore();
    const { title } = await setup(store);

    setTitle(store, 'Sintel');

    await waitForAssertion(() => {
      expect(title.textContent).toBe('Sintel');
      expect(title.hidden).toBe(false);
    });
  });

  it('owns its text content across updates', async () => {
    const store = createTitleStore();
    const { title } = await setup(store);

    setTitle(store, 'Sintel');
    await waitForAssertion(() => expect(title.textContent).toBe('Sintel'));

    setTitle(store, 'Big Buck Bunny');
    await waitForAssertion(() => expect(title.textContent).toBe('Big Buck Bunny'));
  });

  it('keeps the same text node when only controls visibility changes', async () => {
    const store: TitleStore = createTitleStore();
    const { title } = await setup(store);

    setTitle(store, 'Sintel');
    await waitForAssertion(() => expect(title.textContent).toBe('Sintel'));

    const textNode = title.firstChild;

    store.toggleControls();
    await waitForAssertion(() => expect(title.hasAttribute('data-visible')).toBe(false));

    expect(title.firstChild).toBe(textNode);
    expect(title.textContent).toBe('Sintel');
  });

  it.each([false, true])('updates title state and reconnects (shadow: %s)', async (shadow) => {
    const store = createStore<PlayerTarget>()(combine(metadataFeature, controlsFeature, playbackFeature));
    const provider = createElement(UIElement);

    new ContextProvider(provider, { context: playerContext, initialValue: store as unknown as AnyPlayerStore });
    const host = createElement(UIElement);
    const root = shadow ? host.attachShadow({ mode: 'open' }) : host;
    const title = createElement(TitleElement);

    root.append(title);
    provider.append(host);
    document.body.append(provider);

    setPlayerConfigValue(store, metadataFeature.config!.title, 'VJS City');
    await waitForAssertion(() => {
      expect(title.textContent).toBe('VJS City');
      expect(title.hidden).toBe(false);
      expect(title.hasAttribute('data-visible')).toBe(true);
    });

    store.toggleControls();
    await waitForAssertion(() => expect(title.hasAttribute('data-visible')).toBe(false));

    setPlayerConfigValue(store, metadataFeature.config!.title, '');
    await waitForAssertion(() => {
      expect(title.hidden).toBe(true);
      expect(title.hasAttribute('data-hidden')).toBe(true);
    });

    host.remove();
    setPlayerConfigValue(store, metadataFeature.config!.title, 'Restored title');
    provider.append(host);
    await waitForAssertion(() => {
      expect(title.textContent).toBe('Restored title');
      expect(title.hidden).toBe(false);
      expect(title.childElementCount).toBe(0);
    });
  });
});
