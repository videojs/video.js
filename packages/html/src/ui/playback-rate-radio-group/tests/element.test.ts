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
});
