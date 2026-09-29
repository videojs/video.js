import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaVolumeState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { VolumePopoverElement } from '../element';

let tagCounter = 0;

function createVolumeStore(volumeAvailability: MediaVolumeState['volumeAvailability']): AnyPlayerStore {
  return createStore<unknown>()<MediaVolumeState>({
    name: 'volume',
    state: () => ({
      volume: 1,
      muted: false,
      volumeAvailability,
      mutedAvailability: 'available',
      setVolume: vi.fn(),
      setMuted: vi.fn(),
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  store: AnyPlayerStore = createVolumeStore('available');
  readonly #provider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }
}

if (!customElements.get('test-volume-popover-player')) {
  customElements.define('test-volume-popover-player', TestPlayerProviderElement);
}

function createPopover(): VolumePopoverElement {
  const tag = `test-volume-popover-${tagCounter++}`;

  customElements.define(tag, class extends VolumePopoverElement {});
  return document.createElement(tag) as VolumePopoverElement;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VolumePopoverElement', () => {
  it('has the correct tag name', () => {
    expect(VolumePopoverElement.tagName).toBe('media-volume-popover');
  });

  it.each([
    ['available', false],
    ['unavailable', true],
    ['unsupported', true],
  ] as const)('reflects %s volume controls with hidden=%s', async (volumeAvailability, hidden) => {
    const provider = document.createElement('test-volume-popover-player') as TestPlayerProviderElement;

    provider.store = createVolumeStore(volumeAvailability);
    const trigger = document.createElement('button');
    const popover = createPopover();

    document.body.append(provider);
    provider.append(trigger, popover);
    await popover.updateComplete;

    expect(popover.hidden).toBe(hidden);
    expect(popover.hasAttribute('data-hidden')).toBe(hidden);
    expect(popover.getAttribute('data-availability')).toBe(volumeAvailability);
    expect(trigger.getAttribute('commandfor')).toBe(popover.id);
    expect(trigger.hasAttribute('aria-expanded')).toBe(!hidden);
    expect(trigger.hasAttribute('aria-haspopup')).toBe(!hidden);
    expect(trigger.hasAttribute('aria-controls')).toBe(!hidden);
  });
});
