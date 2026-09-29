import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaTextTrackState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { CaptionsButtonElement } from '../element';

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

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

function createTextTrackStore(textTrackList: MediaTextTrackState['textTrackList']): AnyPlayerStore {
  return createStore<unknown>()<MediaTextTrackState>({
    name: 'textTrack',
    state: () => ({
      chaptersCues: [],
      thumbnailsTrack: null,
      textTrackList,
      subtitlesShowing: false,
      toggleSubtitles: vi.fn(),
      selectSubtitlesTrack: vi.fn(),
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  readonly #provider = new ContextProvider(this, { context: playerContext });

  setStore(store: AnyPlayerStore): void {
    this.#provider.setValue(store);
  }
}

defineElement(CaptionsButtonElement.tagName, CaptionsButtonElement);
defineElement('test-captions-button-player', TestPlayerProviderElement);

describe('CaptionsButtonElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('restores the configured command target when captions no longer need a menu', async () => {
    const provider = document.createElement('test-captions-button-player') as TestPlayerProviderElement;
    const button = document.createElement(CaptionsButtonElement.tagName) as CaptionsButtonElement;
    const textTrackList: MediaTextTrackState['textTrackList'] = [
      { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' },
      { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
    ];

    button.commandfor = 'captions-toggle';
    button.menuFor = 'captions-menu';
    provider.setStore(createTextTrackStore(textTrackList));
    provider.append(button);
    document.body.append(provider);

    await button.updateComplete;
    await waitForAssertion(() => {
      expect(button.getAttribute('commandfor')).toBe('captions-menu');
    });

    button.commandfor = 'captions-fallback';
    await button.updateComplete;
    await waitForAssertion(() => {
      expect(button.getAttribute('commandfor')).toBe('captions-menu');
    });

    textTrackList.pop();
    button.requestUpdate();

    await waitForAssertion(() => {
      expect(button.getAttribute('commandfor')).toBe('captions-fallback');
    });
  });

  it('maps the menu-for attribute to menuFor', async () => {
    const button = document.createElement(CaptionsButtonElement.tagName) as CaptionsButtonElement;

    button.setAttribute('menu-for', 'captions-menu');
    document.body.append(button);

    await button.updateComplete;

    expect(button.menuFor).toBe('captions-menu');
  });
});
