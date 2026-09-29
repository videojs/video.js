import type { MediaFullscreenState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { FullscreenButtonState } from '../core';
import { FullscreenButtonCore } from '../core';

function createMediaState(overrides: Partial<MediaFullscreenState> = {}): MediaFullscreenState {
  return {
    isFullscreen: false,
    fullscreenAvailability: 'available',
    requestFullscreen: vi.fn(async () => {}),
    exitFullscreen: vi.fn(async () => {}),
    ...overrides,
  };
}

function createState(overrides: Partial<FullscreenButtonState> = {}): FullscreenButtonState {
  return {
    fullscreen: false,
    availability: 'available',
    disabled: false,
    hidden: false,
    label: '',
    ...overrides,
  };
}

describe('FullscreenButtonCore', () => {
  it('starts disabled and hidden until availability is known', () => {
    const core = new FullscreenButtonCore();

    expect(core.state.current).toMatchObject({
      availability: 'unavailable',
      disabled: true,
      hidden: true,
    });
  });

  describe('getState', () => {
    it('projects fullscreen and availability', () => {
      const core = new FullscreenButtonCore();
      const media = createMediaState({ isFullscreen: true });

      core.setMedia(media);
      const state = core.getState();

      expect(state.fullscreen).toBe(true);
      expect(state.availability).toBe('available');
      expect(state.disabled).toBe(false);
      expect(state.hidden).toBe(false);
    });

    it('marks disabled and hidden when unsupported', () => {
      const core = new FullscreenButtonCore();

      core.setMedia(createMediaState({ fullscreenAvailability: 'unsupported' }));
      const state = core.getState();

      expect(state.availability).toBe('unsupported');
      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(true);
    });

    it('marks disabled and hidden when unavailable', () => {
      const core = new FullscreenButtonCore();

      core.setMedia(createMediaState({ fullscreenAvailability: 'unavailable' }));
      const state = core.getState();

      expect(state.availability).toBe('unavailable');
      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(true);
    });

    it('marks disabled when the disabled prop is set', () => {
      const core = new FullscreenButtonCore({ disabled: true });

      core.setMedia(createMediaState({ fullscreenAvailability: 'available' }));
      const state = core.getState();

      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(false);
    });
  });

  describe('getLabel', () => {
    it('returns Enter fullscreen when not fullscreen', () => {
      const core = new FullscreenButtonCore();

      expect(core.getLabel(createState({ fullscreen: false }))).toMatchObject({
        key: 'fullscreen.enter',
        text: 'Enter fullscreen',
      });
    });

    it('returns Exit fullscreen when fullscreen', () => {
      const core = new FullscreenButtonCore();

      expect(core.getLabel(createState({ fullscreen: true }))).toMatchObject({
        key: 'fullscreen.exit',
        text: 'Exit fullscreen',
      });
    });

    it('returns custom string label', () => {
      const core = new FullscreenButtonCore({ label: 'Full screen' });

      expect(core.getLabel(createState())).toBe('Full screen');
    });

    it('returns custom function label', () => {
      const core = new FullscreenButtonCore({
        label: (state) => (state.fullscreen ? 'Minimize' : 'Maximize'),
      });

      expect(core.getLabel(createState({ fullscreen: true }))).toBe('Minimize');
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new FullscreenButtonCore();
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-label']).toMatchObject({ key: 'fullscreen.enter', text: 'Enter fullscreen' });
    });

    it('sets aria-disabled when state.disabled is true', () => {
      const core = new FullscreenButtonCore();
      const attrs = core.getAttrs(createState({ disabled: true }));

      expect(attrs['aria-disabled']).toBe('true');
    });

    it('sets the hidden attribute when state.hidden is true', () => {
      const core = new FullscreenButtonCore();
      const attrs = core.getAttrs(createState({ hidden: true }));

      expect(attrs.hidden).toBe('');
    });
  });

  describe('toggle', () => {
    it('calls requestFullscreen when not fullscreen', async () => {
      const core = new FullscreenButtonCore();
      const media = createMediaState({ isFullscreen: false });

      await core.toggle(media);
      expect(media.requestFullscreen).toHaveBeenCalled();
    });

    it('calls exitFullscreen when fullscreen', async () => {
      const core = new FullscreenButtonCore();
      const media = createMediaState({ isFullscreen: true });

      await core.toggle(media);
      expect(media.exitFullscreen).toHaveBeenCalled();
    });

    it('does nothing when the disabled prop is set', async () => {
      const core = new FullscreenButtonCore({ disabled: true });
      const media = createMediaState();

      await core.toggle(media);
      expect(media.requestFullscreen).not.toHaveBeenCalled();
    });

    it('does nothing when unsupported', async () => {
      const core = new FullscreenButtonCore();
      const media = createMediaState({ fullscreenAvailability: 'unsupported' });

      await core.toggle(media);
      expect(media.requestFullscreen).not.toHaveBeenCalled();
    });

    it('propagates errors from requestFullscreen', async () => {
      const core = new FullscreenButtonCore();
      const media = createMediaState({
        requestFullscreen: vi.fn(async () => {
          throw new Error('permission denied');
        }),
      });

      await expect(core.toggle(media)).rejects.toThrow('permission denied');
    });
  });
});
