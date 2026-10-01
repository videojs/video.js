import type { MediaPlaybackRateState } from '@videojs/media';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { setup, waitForAssertion, waitForMenu } from '../../playback-rate-radio-group/tests/helpers';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PlaybackRateButtonElement', () => {
  it('renders the current playback rate on the trigger button', async () => {
    const { trigger } = setup({ playbackRate: 2 });

    await trigger.updateComplete;

    expect(trigger.getAttribute('role')).toBe('button');
    expect(trigger.getAttribute('aria-label')).toBe('Playback rate 2');
    expect(trigger.getAttribute('data-rate')).toBe('2');
  });

  it('does not cycle when commandfor is set', async () => {
    const setPlaybackRate = vi.fn();
    const { trigger, store } = setup({ playbackRate: 1, setPlaybackRate });

    await trigger.updateComplete;

    trigger.click();

    expect(setPlaybackRate).not.toHaveBeenCalled();
    expect((store.state as MediaPlaybackRateState).playbackRate).toBe(1);
  });

  it('opens the linked menu on Enter when commandfor is set', async () => {
    const { menu, trigger } = setup();

    await waitForMenu(menu, trigger);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    await waitForAssertion(() => {
      expect(menu.open).toBe(true);
      expect(menu.querySelector('[role="menuitemradio"][aria-checked="true"]')).toBe(document.activeElement);
    });
  });

  it('opens the linked menu on Space when commandfor is set', async () => {
    const { menu, trigger } = setup();

    await waitForMenu(menu, trigger);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    trigger.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));

    await waitForAssertion(() => {
      expect(menu.open).toBe(true);
      expect(menu.querySelector('[role="menuitemradio"][aria-checked="true"]')).toBe(document.activeElement);
    });
  });

  it('disables the trigger when there are no playback rates', async () => {
    const { menu, options, trigger } = setup({ playbackRates: [] });

    await waitForMenu(menu, trigger, options);

    expect(trigger.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not open the linked menu when disabled and clicked', async () => {
    const { menu, trigger } = setup({ playbackRates: [] });

    await waitForMenu(menu, trigger);

    trigger.click();

    expect(menu.open).toBe(false);
  });
});
