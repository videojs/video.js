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
        started: false,
      });
    });

    it('keeps controls visible without overriding user activity in always mode', () => {
      const core = new ControlsCore({ visibility: 'always' });

      core.setMedia(createControlsState({ controlsVisible: false, userActive: false }));

      expect(core.getState()).toEqual({ visible: true, userActive: false, started: false });
    });

    it('projects visible and userActive independently', () => {
      const core = new ControlsCore();

      // All four quadrants of the 2x2 boolean matrix
      core.setMedia(createControlsState({ controlsVisible: true, userActive: true }));
      expect(core.getState()).toEqual({
        visible: true,
        userActive: true,
        started: false,
      });

      core.setMedia(createControlsState({ controlsVisible: true, userActive: false }));
      expect(core.getState()).toEqual({
        visible: true,
        userActive: false,
        started: false,
      });

      core.setMedia(createControlsState({ controlsVisible: false, userActive: true }));
      expect(core.getState()).toEqual({
        visible: false,
        userActive: true,
        started: false,
      });

      core.setMedia(createControlsState({ controlsVisible: false, userActive: false }));
      expect(core.getState()).toEqual({
        visible: false,
        userActive: false,
        started: false,
      });
    });

    it('reports started once playback starts', () => {
      const core = new ControlsCore();

      core.setMedia(createControlsState());
      core.setPlayback({ started: false, autoplaying: false });
      expect(core.getState()?.started).toBe(false);

      core.setPlayback({ started: true, autoplaying: false });
      expect(core.getState()?.started).toBe(true);
    });

    it('reports a pending autoplay as started', () => {
      const core = new ControlsCore();

      core.setMedia(createControlsState());
      core.setPlayback({ started: false, autoplaying: true });

      expect(core.getState()?.started).toBe(true);
    });

    it('reports started without controls state in always mode', () => {
      const core = new ControlsCore({ visibility: 'always' });

      core.setPlayback({ started: true, autoplaying: false });

      expect(core.getState()).toEqual({ visible: true, userActive: true, started: true });
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
