import type { MediaPlaybackState } from '@videojs/media';
import { flush } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { BufferingIndicatorCore } from '../core';

function createMediaState(overrides: Partial<MediaPlaybackState> = {}): MediaPlaybackState {
  return {
    paused: true,
    ended: false,
    started: false,
    waiting: false,
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    ...overrides,
  };
}

describe('BufferingIndicatorCore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('update', () => {
    it('visible is false when not waiting', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: false, paused: false }));

      expect(core.state.current.visible).toBe(false);
    });

    it('visible is false when waiting but paused', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: true, paused: true }));

      expect(core.state.current.visible).toBe(false);
    });

    it('visible is false immediately when waiting and not paused (before delay)', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: true, paused: false }));

      expect(core.state.current.visible).toBe(false);
    });

    it('visible becomes true after default delay elapses', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: true, paused: false }));
      vi.advanceTimersByTime(500);

      expect(core.state.current.visible).toBe(true);
    });

    it('visible stays false if waiting ends before delay', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: true, paused: false }));
      vi.advanceTimersByTime(300);

      core.update(createMediaState({ waiting: false, paused: false }));

      expect(core.state.current.visible).toBe(false);

      // Even after more time, still not visible
      vi.advanceTimersByTime(500);
      expect(core.state.current.visible).toBe(false);
    });

    it('resets timer when waiting toggles off and on within delay', () => {
      const core = new BufferingIndicatorCore();
      const waiting = createMediaState({ waiting: true, paused: false });
      const notWaiting = createMediaState({ waiting: false, paused: false });

      core.update(waiting);
      vi.advanceTimersByTime(300);

      // Stop waiting (cancels timer)
      core.update(notWaiting);

      // Start waiting again (new timer)
      core.update(waiting);
      vi.advanceTimersByTime(300);

      // Only 300ms into the new timer, not yet visible
      expect(core.state.current.visible).toBe(false);

      // Full 500ms from second start
      vi.advanceTimersByTime(200);
      expect(core.state.current.visible).toBe(true);
    });

    it('immediately hides when waiting ends while visible', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: true, paused: false }));
      vi.advanceTimersByTime(500);
      expect(core.state.current.visible).toBe(true);

      core.update(createMediaState({ waiting: false, paused: false }));
      expect(core.state.current.visible).toBe(false);
    });

    it('immediately hides when paused while visible', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: true, paused: false }));
      vi.advanceTimersByTime(500);
      expect(core.state.current.visible).toBe(true);

      core.update(createMediaState({ waiting: true, paused: true }));
      expect(core.state.current.visible).toBe(false);
    });

    it('is idempotent — repeated calls with same state do not restart timer', () => {
      const core = new BufferingIndicatorCore();
      const media = createMediaState({ waiting: true, paused: false });

      core.update(media);
      vi.advanceTimersByTime(300);

      // Same state again — should NOT restart timer
      core.update(media);
      vi.advanceTimersByTime(200);

      // 500ms total from first call — timer should fire
      expect(core.state.current.visible).toBe(true);
    });
  });

  describe('custom delay', () => {
    it('respects a custom delay value', () => {
      const core = new BufferingIndicatorCore();

      core.setProps({ delay: 1000 });

      core.update(createMediaState({ waiting: true, paused: false }));
      vi.advanceTimersByTime(500);
      expect(core.state.current.visible).toBe(false);

      vi.advanceTimersByTime(500);
      expect(core.state.current.visible).toBe(true);
    });

    it('respects delay: 0 for immediate visibility', () => {
      const core = new BufferingIndicatorCore();

      core.setProps({ delay: 0 });

      core.update(createMediaState({ waiting: true, paused: false }));
      vi.advanceTimersByTime(0);

      expect(core.state.current.visible).toBe(true);
    });

    it('does not apply new delay to an already running timer', () => {
      const core = new BufferingIndicatorCore();

      core.update(createMediaState({ waiting: true, paused: false }));
      vi.advanceTimersByTime(300);

      core.setProps({ delay: 1000 });
      vi.advanceTimersByTime(200);

      // Original 500ms timer fires
      expect(core.state.current.visible).toBe(true);
    });
  });

  describe('state.subscribe', () => {
    it('notifies subscribers when visible becomes true', () => {
      const core = new BufferingIndicatorCore();
      const callback = vi.fn();

      core.state.subscribe(callback);

      core.update(createMediaState({ waiting: true, paused: false }));
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      flush();

      expect(callback).toHaveBeenCalledOnce();
    });
  });
});
