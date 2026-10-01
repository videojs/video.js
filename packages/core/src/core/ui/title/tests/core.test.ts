import type { MediaMetadataState } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { TitleCore } from '../core';

function createMediaState(overrides: Partial<MediaMetadataState> = {}): MediaMetadataState {
  return {
    title: 'Big Buck Bunny',
    poster: '',
    ...overrides,
  };
}

describe('TitleCore', () => {
  describe('getState', () => {
    it('is hidden for the empty resolved title', () => {
      const core = new TitleCore();

      const state = core.getState(createMediaState({ title: '' }));

      expect(state).toEqual({ title: '', hidden: true, visible: false });
    });

    it.each([true, false])('reflects controls visibility (%s)', (controlsVisible) => {
      const state = new TitleCore().getState(createMediaState(), { controlsVisible });

      expect(state.visible).toBe(controlsVisible);
      expect(state.hidden).toBe(false);
    });

    it('defaults visibility to false without controls', () => {
      expect(new TitleCore().getState(createMediaState()).visible).toBe(false);
      expect(new TitleCore().getState(createMediaState(), null).visible).toBe(false);
    });

    it('treats a whitespace-only title as a title', () => {
      const core = new TitleCore();

      const state = core.getState(createMediaState({ title: '   ' }));

      expect(state).toEqual({ title: '   ', hidden: false, visible: false });
    });
  });
});
