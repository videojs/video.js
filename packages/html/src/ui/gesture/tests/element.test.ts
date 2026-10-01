import { type AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { containerContext, playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { GestureElement } from '../element';

beforeAll(() => {
  customElements.define('media-gesture', GestureElement);
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

class TestGestureProvider extends UIElement {
  readonly store = {
    state: {
      paused: true,
      play: vi.fn(),
      pause: vi.fn(),
      currentTime: 30,
      duration: 60,
      seeking: false,
      seek: vi.fn(),
    },
    subscribe: () => () => {},
  };
  readonly containerProvider = new ContextProvider(this, {
    context: containerContext,
    initialValue: { container: this, registerContainer: () => () => {} },
  });
  readonly playerProvider = new ContextProvider(this, {
    context: playerContext,
    initialValue: this.store as unknown as AnyPlayerStore,
  });
}

customElements.define('test-gesture-provider', TestGestureProvider);

function setup() {
  const provider = document.createElement('test-gesture-provider') as TestGestureProvider;

  vi.spyOn(provider, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 300 } as DOMRect);
  return provider;
}

function tap(target: HTMLElement, clientX: number, pointerType = 'touch') {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX, pointerType }));
  vi.advanceTimersByTime(50);
  target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, clientX, pointerType }));
}

describe('GestureElement', () => {
  it('has the correct tag name', () => {
    expect(GestureElement.tagName).toBe('media-gesture');
  });

  it('activates from attributes and updates disabled state', async () => {
    const provider = setup();
    const el = document.createElement('media-gesture') as GestureElement;

    el.setAttribute('type', 'tap');
    el.setAttribute('action', 'seekStep');
    el.setAttribute('value', '5');
    el.setAttribute('region', 'right');
    el.setAttribute('pointer', 'touch');
    provider.append(el);
    document.body.append(provider);
    await el.updateComplete;

    const seek = provider.store.state.seek;

    tap(provider, 250, 'mouse');
    tap(provider, 50);
    expect(seek).not.toHaveBeenCalled();

    tap(provider, 250);
    expect(seek).toHaveBeenCalledExactlyOnceWith(35);

    el.setAttribute('disabled', '');
    await el.updateComplete;
    tap(provider, 250);
    expect(seek).toHaveBeenCalledOnce();

    el.removeAttribute('disabled');
    await el.updateComplete;
    tap(provider, 250);
    expect(seek).toHaveBeenCalledTimes(2);
    expect(seek).toHaveBeenLastCalledWith(35);
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

  it('does not treat an invalid gesture type as a tap', async () => {
    const provider = setup();
    const el = document.createElement('media-gesture') as GestureElement;

    el.type = 'double-tap' as GestureElement['type'];
    el.action = 'togglePaused';
    provider.append(el);
    document.body.append(provider);
    await el.updateComplete;

    tap(provider, 150);
    expect(provider.store.state.play).not.toHaveBeenCalled();

    el.type = 'tap';
    await el.updateComplete;
    tap(provider, 150);
    expect(provider.store.state.play).toHaveBeenCalledOnce();
  });

  it('defaults a left seek gesture to the backward step', async () => {
    const provider = setup();
    const el = document.createElement('media-gesture') as GestureElement;

    el.type = 'doubletap';
    el.action = 'seekStep';
    el.region = 'left';
    provider.append(el);
    document.body.append(provider);
    await el.updateComplete;

    tap(provider, 50);
    vi.advanceTimersByTime(50);
    tap(provider, 50);

    expect(provider.store.state.seek).toHaveBeenCalledExactlyOnceWith(20);
  });
});
