import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaTimeState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { SeekButtonElement } from '../element';

class TestTimeProvider extends UIElement {
  readonly seek = vi.fn(async (time: number) => time);
  // SAFETY: The seek button only reads the `time` feature, which this store provides.
  readonly store = createStore<unknown>()<MediaTimeState>({
    name: 'time',
    state: () => ({
      currentTime: 1.1,
      duration: 100,
      seeking: false,
      seek: this.seek,
    }),
  }) as unknown as AnyPlayerStore;
  readonly playerProvider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.playerProvider.setValue(this.store);
    super.connectedCallback();
  }
}

beforeAll(() => {
  customElements.define('test-time-provider', TestTimeProvider);
  customElements.define(SeekButtonElement.tagName, SeekButtonElement);
});

afterEach(() => {
  document.body.innerHTML = '';
});

async function setup(seconds: number | string) {
  // SAFETY: Both tags are registered with these classes in `beforeAll`.
  const provider = document.createElement('test-time-provider') as TestTimeProvider;
  const button = document.createElement(SeekButtonElement.tagName) as SeekButtonElement;

  // Frameworks such as Svelte assign template values to the property, not the attribute.
  Reflect.set(button, 'seconds', seconds);

  document.body.append(provider);
  provider.append(button);
  await button.updateComplete;

  return { provider, button };
}

describe('SeekButtonElement', () => {
  it('seeks forward by a numeric string assigned to seconds', async () => {
    const { provider, button } = await setup('30');

    button.click();

    expect(button.seconds).toBe(30);
    expect(provider.seek).toHaveBeenCalledWith(31.1);
  });

  it('seeks backward by a negative numeric string assigned to seconds', async () => {
    const { provider, button } = await setup('-1');

    button.click();

    expect(button.seconds).toBe(-1);
    expect(provider.seek).toHaveBeenCalledWith(expect.closeTo(0.1));
  });
});
