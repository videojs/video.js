import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { containerContext, playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { StatusAnnouncerElement } from '../element';

afterEach(() => {
  document.body.replaceChildren();
});

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) customElements.define(tagName, Base);
}

function createTestStore(initialState: Record<string, unknown> = {}) {
  let state = initialState;
  const target = {};
  const listeners = new Set<() => void>();
  const store = {
    get state() {
      return state;
    },
    get target() {
      return target;
    },
    subscribe(callback: () => void) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  } as unknown as AnyPlayerStore;

  const setState = (partial: Record<string, unknown>) => {
    state = { ...state, ...partial };

    for (const listener of listeners) listener();
  };

  return { store, setState };
}

class TestStatusAnnouncerPlayerElement extends UIElement {
  readonly #provider = new ContextProvider(this, { context: playerContext });
  readonly #containerProvider = new ContextProvider(this, { context: containerContext });
  #store = createTestStore().store;

  get store(): AnyPlayerStore {
    return this.#store;
  }

  set store(store: AnyPlayerStore) {
    this.#store = store;

    if (this.isConnected) this.#provider.setValue(this.#store);
  }

  override connectedCallback(): void {
    this.#provider.setValue(this.#store);
    this.#containerProvider.setValue({ container: this, registerContainer: () => vi.fn() });
    super.connectedCallback();
  }
}

defineElement(StatusAnnouncerElement.tagName, StatusAnnouncerElement);
defineElement('test-status-announcer-player', TestStatusAnnouncerPlayerElement);

async function renderStatusAnnouncerElement(
  store: AnyPlayerStore,
  markup = '<media-status-announcer></media-status-announcer>'
) {
  const provider = document.createElement('test-status-announcer-player') as TestStatusAnnouncerPlayerElement;

  provider.store = store;
  provider.innerHTML = markup;
  document.body.append(provider);
  await provider.updateComplete;

  return {
    provider,
    announcer: provider.querySelector('media-status-announcer')!,
  };
}

describe('StatusAnnouncerElement', () => {
  it('exposes its standalone tag name', () => {
    expect(StatusAnnouncerElement.tagName).toBe('media-status-announcer');
  });

  it('updates live text from store snapshots', async () => {
    const { store, setState } = createTestStore({ paused: true });
    const { announcer } = await renderStatusAnnouncerElement(store);

    expect(announcer.textContent).toBe('');

    setState({ paused: false });
    await Promise.resolve();
    await (announcer as StatusAnnouncerElement).updateComplete;

    expect(announcer.textContent).toBe('Playing');
  });

  it('replaces live content for repeated announcement labels', async () => {
    vi.useFakeTimers();

    try {
      const { store, setState } = createTestStore({ volume: 0.5, muted: false });
      const { announcer } = await renderStatusAnnouncerElement(store);
      const content = announcer.querySelector('[data-status-announcer-content]')!;

      setState({ volume: 0 });
      await Promise.resolve();
      vi.advanceTimersByTime(200);
      await (announcer as StatusAnnouncerElement).updateComplete;
      const firstContent = content.firstChild;

      setState({ muted: true });
      await Promise.resolve();
      vi.advanceTimersByTime(200);
      await (announcer as StatusAnnouncerElement).updateComplete;

      expect(announcer.textContent).toBe('Muted');
      expect(content.firstChild).not.toBe(firstContent);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the next store snapshot as baseline when the store changes', async () => {
    const first = createTestStore({ paused: false });
    const second = createTestStore({ paused: false });
    const { announcer, provider } = await renderStatusAnnouncerElement(first.store);

    first.setState({ paused: true });
    await Promise.resolve();
    await (announcer as StatusAnnouncerElement).updateComplete;
    expect(announcer.textContent).toBe('Paused');

    provider.store = second.store;
    await Promise.resolve();
    await (announcer as StatusAnnouncerElement).updateComplete;

    expect(announcer.textContent).toBe('');
  });

  it.each([
    {
      name: 'volume changes',
      initialState: { volume: 0.5, muted: false },
      update: async (setState: (partial: Record<string, unknown>) => void) => {
        setState({ volume: 0.75 });
      },
    },
  ])('does not announce $name while a slider inside the player is focused', async ({ initialState, update }) => {
    vi.useFakeTimers();

    try {
      const { store, setState } = createTestStore(initialState);
      const { announcer, provider } = await renderStatusAnnouncerElement(
        store,
        '<button role="slider"></button><media-status-announcer></media-status-announcer>'
      );

      provider.querySelector<HTMLElement>('[role="slider"]')?.focus();
      await update(setState);
      vi.advanceTimersByTime(200);
      await (announcer as StatusAnnouncerElement).updateComplete;

      expect(announcer.textContent).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('announces volume changes when a slider outside the player is focused', async () => {
    vi.useFakeTimers();
    const slider = document.createElement('button');

    slider.setAttribute('role', 'slider');
    document.body.append(slider);
    slider.focus();

    try {
      const { store, setState } = createTestStore({ volume: 0.5, muted: false });
      const { announcer } = await renderStatusAnnouncerElement(store);

      setState({ volume: 0.75 });
      await Promise.resolve();
      vi.advanceTimersByTime(200);
      await Promise.resolve();
      await (announcer as StatusAnnouncerElement).updateComplete;

      expect(announcer.textContent).toBe('Volume 75%');
    } finally {
      vi.useRealTimers();
    }
  });
});
