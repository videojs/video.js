import type { AnyPlayerStore } from '@videojs/core/dom';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { ContextProvider } from '@videojs/element/context';
import type { MediaTextTrackState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaI18nProviderElement } from '../../../i18n/provider-element';
import { playerContext } from '../../../player/context';
import { MenuElement } from '../../menu/element';
import { MenuRadioItemElement } from '../../menu/radio-item';
import { UIElement } from '../../ui-element';
import { CaptionsRadioGroupElement } from '../element';

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

function createTextTrackStore({
  textTrackList = [{ id: 'captions', kind: 'captions', label: '', language: '', mode: 'disabled' }],
  subtitlesShowing = false,
  selectSubtitlesTrack = vi.fn(),
}: {
  textTrackList?: MediaTextTrackState['textTrackList'] | undefined;
  subtitlesShowing?: boolean | undefined;
  selectSubtitlesTrack?: MediaTextTrackState['selectSubtitlesTrack'] | undefined;
} = {}): AnyPlayerStore {
  return createStore<unknown>()<MediaTextTrackState>({
    name: 'textTrack',
    state: () => ({
      chaptersCues: [],
      thumbnailsTrack: null,
      textTrackList,
      subtitlesShowing,
      toggleSubtitles: vi.fn(),
      selectSubtitlesTrack,
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  readonly #provider = new ContextProvider(this, { context: playerContext });

  setStore(store: AnyPlayerStore): void {
    this.#provider.setValue(store);
  }
}

defineElement(MenuElement.tagName, MenuElement);
defineElement(MenuRadioItemElement.tagName, MenuRadioItemElement);
defineElement(CaptionsRadioGroupElement.tagName, CaptionsRadioGroupElement);
defineElement(MediaI18nProviderElement.tagName, MediaI18nProviderElement);
defineElement('test-captions-radio-player', TestPlayerProviderElement);

function setup(locale: string, storeOptions?: Parameters<typeof createTextTrackStore>[0]) {
  const i18n = new MediaI18nProviderElement();
  const provider = document.createElement('test-captions-radio-player') as TestPlayerProviderElement;
  const menu = document.createElement(MenuElement.tagName) as MenuElement;
  const options = document.createElement(CaptionsRadioGroupElement.tagName) as CaptionsRadioGroupElement;

  i18n.setAttribute('lang', locale);
  provider.setStore(createTextTrackStore(storeOptions));
  menu.append(options);
  provider.append(menu);
  i18n.append(provider);
  document.body.append(i18n);

  return { menu, options };
}

afterEach(() => {
  resetI18nRegistry();
  document.body.innerHTML = '';
});

describe('CaptionsRadioGroupElement', () => {
  it('uses the stable core group label for aria-label', async () => {
    const { options } = setup('en');

    await options.updateComplete;
    expect(options.getAttribute('aria-label')).toBe('Captions');

    const enabled = setup('en', { subtitlesShowing: true }).options;

    await enabled.updateComplete;
    expect(enabled.getAttribute('aria-label')).toBe('Captions');
  });

  it('preserves authored accessible names', async () => {
    const explicit = setup('en').options;

    explicit.setAttribute('aria-label', 'Subtitle tracks');

    const labelled = setup('en').options;

    labelled.setAttribute('aria-labelledby', 'captions-heading');

    await Promise.all([explicit.updateComplete, labelled.updateComplete]);

    expect(explicit.getAttribute('aria-label')).toBe('Subtitle tracks');
    expect(labelled.getAttribute('aria-labelledby')).toBe('captions-heading');
    expect(labelled.hasAttribute('aria-label')).toBe(false);
  });

  it('refreshes translated items when registry strings load for the active locale', async () => {
    const { menu, options } = setup('x-test-captions');

    await options.updateComplete;

    registerI18n('x-test-captions', { 'menu.captions': 'Legendes', 'menu.off': 'Desactive' });

    await waitForAssertion(() => {
      const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

      expect(items.map((item) => item.textContent)).toEqual(['Desactive', 'Legendes']);
    });
  });

  it('uses a custom track formatter', async () => {
    const { menu, options } = setup('en', {
      textTrackList: [{ id: 'es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' }],
    });

    options.formatTrack = (track) => `${track.language.toUpperCase()} subtitles`;
    options.requestUpdate();

    await options.updateComplete;

    const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    expect(items.map((item) => item.textContent)).toEqual(['Off', 'ES subtitles']);
  });

  it('applies group disabled semantics when captions are unavailable', async () => {
    const { menu, options } = setup('en', { textTrackList: [] });

    await options.updateComplete;

    const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    expect(options.getAttribute('aria-disabled')).toBe('true');
    expect(options.hidden).toBe(true);
    expect(options.hasAttribute('data-hidden')).toBe(true);
    expect(items.map((item) => item.disabled)).toEqual([true]);
  });

  it('selects a captions option by normalized value', async () => {
    const selectSubtitlesTrack = vi.fn();
    const { options } = setup('en', {
      textTrackList: [{ id: 'es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' }],
      selectSubtitlesTrack,
    });

    await options.updateComplete;
    options.dispatchEvent(new CustomEvent('value-change', { detail: { value: 'es' } }));

    expect(selectSubtitlesTrack).toHaveBeenCalledWith('es');
  });
});
