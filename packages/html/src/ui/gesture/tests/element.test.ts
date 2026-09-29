import { DEFAULT_SEEK_STEP } from '@videojs/core';
import { type AnyPlayerStore, getGestureCoordinator } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { containerContext, playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { GestureElement } from '../element';

beforeAll(() => {
  customElements.define('media-gesture', GestureElement);
});

afterEach(() => {
  document.body.innerHTML = '';
});

class TestGestureProvider extends UIElement {
  readonly #store = {
    state: { paused: true, play: vi.fn(), pause: vi.fn() },
    subscribe: () => () => {},
  } as unknown as AnyPlayerStore;
  readonly containerProvider = new ContextProvider(this, {
    context: containerContext,
    initialValue: { container: this, registerContainer: () => () => {} },
  });
  readonly playerProvider = new ContextProvider(this, { context: playerContext, initialValue: this.#store });
}

customElements.define('test-gesture-provider', TestGestureProvider);

describe('GestureElement', () => {
  it('has the correct tag name', () => {
    expect(GestureElement.tagName).toBe('media-gesture');
  });

  it('declares expected properties', () => {
    const props = GestureElement.properties;

    expect(props).toHaveProperty('type');
    expect(props).toHaveProperty('action');
    expect(props).toHaveProperty('value');
    expect(props).toHaveProperty('pointer');
    expect(props).toHaveProperty('region');
    expect(props).toHaveProperty('disabled');
  });

  it('initializes with default property values', () => {
    const el = document.createElement('media-gesture') as GestureElement;

    expect(el.type).toBe('');
    expect(el.action).toBe('');
    expect(el.value).toBeUndefined();
    expect(el.pointer).toBeUndefined();
    expect(el.region).toBeUndefined();
    expect(el.disabled).toBe(false);
  });

  it('is hidden when connected', () => {
    const el = document.createElement('media-gesture') as GestureElement;

    document.body.appendChild(el);
    expect(el.style.display).toBe('none');
  });

  it('does not treat an invalid gesture type as a tap', () => {
    const provider = document.createElement('test-gesture-provider');
    const el = document.createElement('media-gesture') as GestureElement;

    el.type = 'double-tap' as GestureElement['type'];
    el.action = 'togglePaused';
    provider.append(el);
    document.body.append(provider);

    expect(getGestureCoordinator(provider).bindings).toHaveLength(0);
  });

  it('defaults a left seek gesture to the backward step', async () => {
    const provider = document.createElement('test-gesture-provider');
    const el = document.createElement('media-gesture') as GestureElement;

    el.type = 'doubletap';
    el.action = 'seekStep';
    el.region = 'left';
    provider.append(el);
    document.body.append(provider);
    await el.updateComplete;

    expect(getGestureCoordinator(provider).bindings).toEqual([
      expect.objectContaining({ action: 'seekStep', region: 'left', value: -DEFAULT_SEEK_STEP }),
    ]);
  });
});
