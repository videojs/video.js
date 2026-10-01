import type { MediaControlsState } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { ControlsCore } from '../core';

describe('ControlsCore', () => {
  describe('getState', () => {
    it('returns null without controls state in auto mode', () => {
      expect(new ControlsCore().getState()).toBeNull();
    });

    it('stays visible without controls state in always mode', () => {
      expect(new ControlsCore({ visibility: 'always' }).getState()).toEqual({
        visible: true,
        userActive: true,
      });
    });

    it('keeps controls visible without overriding user activity in always mode', () => {
      const core = new ControlsCore({ visibility: 'always' });

      core.setMedia(createControlsState({ controlsVisible: false, userActive: false }));

      expect(core.getState()).toEqual({ visible: true, userActive: false });
    });

    it('projects visible and userActive independently', () => {
      const core = new ControlsCore();

      // All four quadrants of the 2x2 boolean matrix
      core.setMedia(createControlsState({ controlsVisible: true, userActive: true }));
      expect(core.getState()).toEqual({
        visible: true,
        userActive: true,
      });

      core.setMedia(createControlsState({ controlsVisible: true, userActive: false }));
      expect(core.getState()).toEqual({
        visible: true,
        userActive: false,
      });

      core.setMedia(createControlsState({ controlsVisible: false, userActive: true }));
      expect(core.getState()).toEqual({
        visible: false,
        userActive: true,
      });

      core.setMedia(createControlsState({ controlsVisible: false, userActive: false }));
      expect(core.getState()).toEqual({
        visible: false,
        userActive: false,
      });
    });
  });
});

function createControlsState(overrides: Partial<MediaControlsState> = {}): MediaControlsState {
  return {
    userActive: true,
    controlsVisible: true,
    requestControlsLock: () => () => {},
    toggleControls: () => true,
    ...overrides,
  };
}
