import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MenuRadioItemElement } from '../../menu/radio-item';
import { setup, waitForAssertion, waitForMenu } from './helpers';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PlaybackRateRadioGroupElement', () => {
  it('renders radio items from the available playback rates', async () => {
    const { menu, options, trigger } = setup({ playbackRates: [1, 1.25, 1.5], playbackRate: 1.25 });

    await waitForMenu(menu, trigger);

    const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    expect(items.map((item) => item.textContent)).toEqual(['1×', '1.25×', '1.5×']);
    await waitForAssertion(() => {
      expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    });
    expect(options.getAttribute('aria-label')).toBe('Playback rate');
    expect(options.getAttribute('data-rate')).toBe('1.25');
  });

  it('sets the selected playback rate', async () => {
    const setPlaybackRate = vi.fn();
    const { menu, trigger } = setup({ setPlaybackRate });

    await waitForMenu(menu, trigger);

    const item = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)].find(
      (candidate) => candidate.value === '2'
    )!;

    item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(setPlaybackRate).toHaveBeenCalledWith(2);
  });

  it('offers the rates from its own rates attribute', async () => {
    const { menu, options, trigger } = setup({ playbackRates: [0.5, 1, 2], playbackRate: 1 });

    options.setAttribute('rates', '1 3');
    await waitForMenu(menu, trigger, options);

    const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    expect(items.map((item) => item.value)).toEqual(['1', '3']);
  });

  it('marks the current rate as custom when the group does not offer it', async () => {
    const { menu, options, setState, trigger } = setup({ playbackRates: [1, 1.5, 2], playbackRate: 1.1 });

    await waitForMenu(menu, trigger, options);

    const custom = () =>
      [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)]
        .filter((item) => item.hasAttribute('data-custom'))
        .map((item) => item.value);

    expect(custom()).toEqual(['1.1']);
    expect(menu.querySelector('[data-custom]')!.getAttribute('aria-label')).toBe('Custom, 1.1×');
    expect(menu.querySelector('[data-rate="1.5"]')!.hasAttribute('aria-label')).toBe(false);

    setState({ playbackRates: [1, 1.1, 1.5, 2] });

    await waitForAssertion(() => expect(custom()).toEqual([]));
  });

  it('keeps focus on the matching item when a rate outside the list rebuilds the items', async () => {
    const { menu, options, setState, trigger } = setup({ playbackRates: [1, 1.5, 2], playbackRate: 1 });

    await waitForMenu(menu, trigger, options);

    const item = (value: string) =>
      [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)].find(
        (candidate) => candidate.value === value
      )!;
    const original = item('1.5');

    original.focus();
    setState({ playbackRate: 1.1 });

    await waitForAssertion(() => {
      expect(original.isConnected).toBe(false);
      expect(document.activeElement).toBe(item('1.5'));
    });
  });

  it('moves focus to the selected rate when the focused item goes away', async () => {
    const { menu, options, setState, trigger } = setup({ playbackRates: [1, 1.5, 2], playbackRate: 1.1 });

    await waitForMenu(menu, trigger, options);

    const items = () => [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    items()
      .find((candidate) => candidate.value === '1.1')!
      .focus();
    setState({ playbackRate: 2 });

    await waitForAssertion(() => {
      expect(items().map((candidate) => candidate.value)).toEqual(['1', '1.5', '2']);
      expect((document.activeElement as MenuRadioItemElement).value).toBe('2');
    });
  });
});
