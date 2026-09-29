import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type {
  MediaAudioTrackState,
  MediaPlaybackRateState,
  MediaQualityState,
  MediaTextTrackState,
} from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../player/context';
import { AudioTrackRadioGroupElement } from '../../ui/audio-track-radio-group/element';
import { CaptionsRadioGroupElement } from '../../ui/captions-radio-group/element';
import { MenuContentElement } from '../../ui/menu/content';
import { MenuElement } from '../../ui/menu/element';
import { MenuItemElement } from '../../ui/menu/item';
import { MenuRadioGroupElement } from '../../ui/menu/radio-group';
import { MenuRadioItemElement } from '../../ui/menu/radio-item';
import { PlaybackRateRadioGroupElement } from '../../ui/playback-rate-radio-group/element';
import { QualityRadioGroupElement } from '../../ui/quality-radio-group/element';
import { UIElement } from '../../ui/ui-element';

type MenuMediaState = MediaAudioTrackState & MediaPlaybackRateState & MediaQualityState & MediaTextTrackState;

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) customElements.define(tagName, Base);
}

function createMenuStore(overrides: Partial<MenuMediaState> = {}): AnyPlayerStore {
  return createStore<unknown>()<MenuMediaState>({
    name: 'videoMenuComposition',
    state: () => ({
      audioTrackList: [
        { id: '0', kind: 'main', label: 'English', language: 'en', enabled: false },
        { id: '1', kind: 'alternative', label: 'Spanish', language: 'es', enabled: true },
      ],
      selectAudioTrack: vi.fn(),
      playbackRates: [0.5, 1, 1.5, 2],
      playbackRate: 1.5,
      setPlaybackRate: vi.fn(),
      videoRenditionList: [
        { id: '0', height: 1080, selected: false },
        { id: '1', height: 720, selected: true },
      ],
      activeVideoRendition: null,
      selectVideoRendition: vi.fn(),
      chaptersCues: [],
      thumbnailsTrack: null,
      textTrackList: [
        { id: 'captions-en', kind: 'captions', label: 'English', language: 'en', mode: 'showing' },
        { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
      ],
      subtitlesShowing: true,
      toggleSubtitles: vi.fn(),
      selectSubtitlesTrack: vi.fn(),
      ...overrides,
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  store: AnyPlayerStore = createMenuStore();

  readonly #provider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }

  setStore(store: AnyPlayerStore): void {
    this.store = store;
    this.#provider.setValue(store);
  }
}

defineElement(MenuElement.tagName, MenuElement);
defineElement(MenuContentElement.tagName, MenuContentElement);
defineElement(MenuItemElement.tagName, MenuItemElement);
defineElement(MenuRadioGroupElement.tagName, MenuRadioGroupElement);
defineElement(MenuRadioItemElement.tagName, MenuRadioItemElement);
defineElement(QualityRadioGroupElement.tagName, QualityRadioGroupElement);
defineElement(AudioTrackRadioGroupElement.tagName, AudioTrackRadioGroupElement);
defineElement(PlaybackRateRadioGroupElement.tagName, PlaybackRateRadioGroupElement);
defineElement(CaptionsRadioGroupElement.tagName, CaptionsRadioGroupElement);
defineElement('test-video-menu-composition-player', TestPlayerProviderElement);

const groups = {
  quality: QualityRadioGroupElement.tagName,
  audio: AudioTrackRadioGroupElement.tagName,
  speed: PlaybackRateRadioGroupElement.tagName,
  captions: CaptionsRadioGroupElement.tagName,
} as const;

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

function setup(store: AnyPlayerStore): Record<keyof typeof groups, MenuItemElement> {
  const provider = document.createElement('test-video-menu-composition-player') as TestPlayerProviderElement;
  const root = document.createElement(MenuElement.tagName) as MenuElement;
  const content = document.createElement(MenuContentElement.tagName) as MenuContentElement;
  const triggers = {} as Record<keyof typeof groups, MenuItemElement>;

  provider.setStore(store);
  root.open = true;

  for (const [name, groupTag] of Object.entries(groups) as [keyof typeof groups, string][]) {
    const trigger = document.createElement(MenuItemElement.tagName) as MenuItemElement;
    const hint = document.createElement('span');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;
    const group = document.createElement(groupTag);
    const submenuId = `${name}-menu`;

    trigger.setAttribute('commandfor', submenuId);
    hint.dataset.part = 'hint';
    submenu.id = submenuId;
    trigger.append(hint);
    submenu.append(group);
    content.append(trigger);
    root.append(submenu);
    triggers[name] = trigger;
  }

  root.prepend(content);
  provider.append(root);
  document.body.append(provider);

  return triggers;
}

describe('video menu primitive composition', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('projects each domain primitive selected label onto its submenu trigger', async () => {
    const triggers = setup(createMenuStore());

    await waitForAssertion(() => {
      expect(triggers.quality.querySelector('[data-part~="hint"]')?.textContent).toBe('720p');
      expect(triggers.audio.querySelector('[data-part~="hint"]')?.textContent).toBe('Spanish');
      expect(triggers.speed.querySelector('[data-part~="hint"]')?.textContent).toBe('1.5×');
      expect(triggers.captions.querySelector('[data-part~="hint"]')?.textContent).toBe('English');
    });
  });

  it('projects domain availability onto submenu triggers', async () => {
    const triggers = setup(
      createMenuStore({
        audioTrackList: [],
        playbackRates: [],
        videoRenditionList: [],
        textTrackList: [],
        subtitlesShowing: false,
      })
    );

    await waitForAssertion(() => {
      for (const trigger of Object.values(triggers)) {
        expect(trigger.getAttribute('data-availability')).toBe('unavailable');
        expect(trigger.getAttribute('aria-disabled')).toBe('true');
      }
    });
  });
});
