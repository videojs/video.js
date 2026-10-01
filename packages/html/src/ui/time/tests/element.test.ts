import type { AnyPlayerStore } from '@videojs/core/dom';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { ContextProvider } from '@videojs/element/context';
import type { MediaBufferState, MediaTimeState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { formatTimeAsPhrase } from '@videojs/utils/time';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaI18nProviderElement } from '../../../i18n';
import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { TimeElement } from '../element';

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

type TimeState = MediaTimeState & MediaBufferState;

function createTimeStore(overrides: Partial<TimeState> = {}): AnyPlayerStore {
  return createStore<unknown>()<TimeState>({
    name: 'time',
    state: () => ({
      currentTime: 90,
      duration: 300,
      seeking: false,
      seek: vi.fn(),
      buffered: [],
      seekable: [],
      ...overrides,
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  store: AnyPlayerStore = createTimeStore();

  readonly #provider = new ContextProvider(this, { context: playerContext });

  setStore(store: AnyPlayerStore): void {
    this.store = store;
    this.#provider.setValue(store);
  }

  clearStore(): void {
    this.#provider.setValue(undefined as unknown as AnyPlayerStore);
  }

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }
}

defineElement('test-time-player', TestPlayerProviderElement);
defineElement(MediaI18nProviderElement.tagName, MediaI18nProviderElement);

async function setup(props: Partial<TimeElement> = {}, locale?: string, state?: Partial<TimeState>) {
  const provider = document.createElement('test-time-player') as TestPlayerProviderElement;
  const time = createElement(TimeElement);

  if (state) provider.store = createTimeStore(state);

  Object.assign(time, props);

  if (locale) {
    const i18n = new MediaI18nProviderElement();

    i18n.setAttribute('lang', locale);
    i18n.append(provider);
    document.body.append(i18n);
  } else {
    document.body.append(provider);
  }

  provider.append(time);
  await time.updateComplete;
  await waitForAssertion(() => expect(time.textContent).toBeTruthy());

  return { provider, time };
}

afterEach(() => {
  resetI18nRegistry();
  document.body.innerHTML = '';
});

describe('TimeElement', () => {
  it('is unavailable when the time range is unknown', async () => {
    const { time } = await setup({}, undefined, { duration: 0, seekable: [] });

    expect(time.hasAttribute('data-unavailable')).toBe(true);
    expect(time.hasAttribute('data-disabled')).toBe(false);
    expect(time.getAttribute('aria-label')).toBe('Media not loaded, unknown time.');
    expect(time.hasAttribute('datetime')).toBe(false);
  });

  it('is enabled when a seekable range is available', async () => {
    const { time } = await setup({}, undefined, { duration: 0, seekable: [[10, 120]] });

    expect(time.hasAttribute('data-unavailable')).toBe(false);
  });

  it('removes unavailable toggles from the tab order', async () => {
    const { time } = await setup({ toggle: true }, undefined, { duration: 0, seekable: [] });

    expect(time.hasAttribute('data-disabled')).toBe(true);
    expect(time.hasAttribute('data-unavailable')).toBe(false);
    expect(time.getAttribute('role')).toBe('button');
    expect(time.getAttribute('aria-disabled')).toBe('true');
    expect(time.getAttribute('tabindex')).toBe('-1');

    time.click();
    await time.updateComplete;

    expect(time.getAttribute('data-type')).toBe('current');
  });

  it('switches between unavailable and disabled attributes with toggle', async () => {
    const { time } = await setup({}, undefined, { duration: 0, seekable: [] });

    time.toggle = true;
    await time.updateComplete;

    expect(time.hasAttribute('data-disabled')).toBe(true);
    expect(time.hasAttribute('data-unavailable')).toBe(false);
    expect(time.getAttribute('aria-disabled')).toBe('true');

    time.toggle = false;
    await time.updateComplete;

    expect(time.hasAttribute('data-disabled')).toBe(false);
    expect(time.hasAttribute('data-unavailable')).toBe(true);
    expect(time.hasAttribute('aria-disabled')).toBe(false);
  });

  it('reflects toggle from the attribute', async () => {
    const { time } = await setup();

    time.setAttribute('toggle', '');
    await time.updateComplete;

    expect(time.toggle).toBe(true);
  });

  it('toggles current time to remaining time on click', async () => {
    const { time } = await setup({ toggle: true });

    expect(time.getAttribute('role')).toBe('button');
    expect(time.getAttribute('tabindex')).toBe('0');
    expect(time.getAttribute('aria-label')).toBe('Show remaining time, 1 minute, 30 seconds elapsed.');
    expect(time.getAttribute('aria-description')).toBe('Toggle between elapsed and remaining time.');

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
    expect(time.getAttribute('aria-label')).toBe('Show elapsed time, 3 minutes, 30 seconds remaining.');

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
    expect(time.getAttribute('aria-label')).toBe('Show remaining time, 1 minute, 30 seconds elapsed.');
  });

  it('includes zero in the toggle label', async () => {
    const { time } = await setup({ toggle: true }, undefined, { currentTime: 0 });

    expect(time.getAttribute('aria-label')).toBe('Show remaining time, 0 seconds elapsed.');
  });

  it('formats toggle labels with the active locale', async () => {
    registerI18n('fr', {
      'time.showRemaining': 'Afficher restant, {duration}.',
      'time.elapsedSuffix': '{duration} écoulé',
      'time.durationSuffix': '{duration} durée',
    });

    const { time } = await setup({ toggle: true }, 'fr');

    expect(time.getAttribute('aria-label')).toBe(
      `Afficher restant, ${formatTimeAsPhrase(90, { locale: 'fr' })} écoulé.`
    );

    time.type = 'duration';
    await time.updateComplete;

    expect(time.getAttribute('aria-label')).toBe(
      `Afficher restant, ${formatTimeAsPhrase(300, { locale: 'fr' })} durée.`
    );
  });

  it('formats digital time with locale digits', async () => {
    const { time } = await setup({}, 'fa');

    expect(time.textContent).toBe('۱:۳۰');
  });

  it('renders an authored negative sign outside the accessible time value', async () => {
    const { time } = await setup({ type: 'remaining' });

    time.setAttribute('negative-sign', '−');
    await time.updateComplete;
    const sign = time.querySelector('span')!;

    expect(time.textContent).toBe('−3:30');
    expect(sign.textContent).toBe('−');
    expect(sign.hidden).toBe(false);
    expect(sign.getAttribute('aria-hidden')).toBe('true');
    expect(time.lastChild?.textContent).toBe('3:30');
  });

  it('exposes static time semantics', async () => {
    const { time } = await setup();

    expect(time.getAttribute('role')).toBe('time');
    expect(time.getAttribute('datetime')).toBe('PT1M30S');
    expect(time.querySelector('button')).toBeNull();
  });

  it('does not toggle before media state is available', async () => {
    const provider = document.createElement('test-time-player') as TestPlayerProviderElement;
    const time = createElement(TimeElement);

    time.toggle = true;
    document.body.append(time);
    await time.updateComplete;

    time.click();

    document.body.append(provider);
    provider.append(time);
    await time.updateComplete;
    await waitForAssertion(() => expect(time.textContent).toBeTruthy());

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
  });

  it('toggles remaining time to duration on click', async () => {
    const { time } = await setup({ toggle: true, type: 'remaining' });

    expect(time.getAttribute('aria-label')).toBe('Show duration, 3 minutes, 30 seconds remaining.');
    expect(time.getAttribute('aria-description')).toBe('Toggle between duration and remaining time.');

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('5:00');
    expect(time.getAttribute('data-type')).toBe('duration');
    expect(time.getAttribute('aria-label')).toBe('Show remaining time, 5 minutes duration.');

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
  });

  it('toggles with Enter and Space', async () => {
    const { time } = await setup({ toggle: true });

    time.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');

    time.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await time.updateComplete;

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
  });

  it('does not toggle on repeated keydown events', async () => {
    const { time } = await setup({ toggle: true });

    time.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await time.updateComplete;

    time.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }));
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
  });

  it('does not cancel keyboard events when toggle is turned off', async () => {
    const { time } = await setup({ toggle: true });

    time.toggle = false;
    await time.updateComplete;

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

    expect(time.dispatchEvent(event)).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('clears toggle attributes when media state is unavailable', async () => {
    const { provider, time } = await setup({ toggle: true });

    expect(time.getAttribute('role')).toBe('button');
    expect(time.getAttribute('tabindex')).toBe('0');
    expect(time.hasAttribute('aria-label')).toBe(true);
    expect(time.hasAttribute('aria-description')).toBe(true);
    expect(time.getAttribute('data-type')).toBe('current');

    provider.clearStore();
    time.requestUpdate();
    await time.updateComplete;

    expect(time.hasAttribute('role')).toBe(false);
    expect(time.hasAttribute('tabindex')).toBe(false);
    expect(time.hasAttribute('aria-label')).toBe(false);
    expect(time.hasAttribute('aria-description')).toBe(false);
    expect(time.hasAttribute('data-type')).toBe(false);
  });

  it('changing type resets the default display mode', async () => {
    const { time } = await setup({ toggle: true });

    time.click();
    await time.updateComplete;

    time.type = 'duration';
    await time.updateComplete;

    expect(time.textContent).toBe('5:00');
    expect(time.getAttribute('data-type')).toBe('duration');

    time.type = 'remaining';
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
  });

  it('resets to the default type when toggle is turned off', async () => {
    const { time } = await setup({ toggle: true });

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');

    time.toggle = false;
    await time.updateComplete;

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');

    time.toggle = true;
    await time.updateComplete;

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
  });

  it('toggles after toggle is enabled later', async () => {
    const { time } = await setup();

    time.toggle = true;
    await time.updateComplete;

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
  });

  it('toggles duration to remaining time on click', async () => {
    const { time } = await setup({ toggle: true, type: 'duration' });

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');

    time.click();
    await time.updateComplete;

    expect(time.textContent).toBe('5:00');
    expect(time.getAttribute('data-type')).toBe('duration');
  });
});
