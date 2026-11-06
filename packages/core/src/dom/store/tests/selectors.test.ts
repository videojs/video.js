import { shallowEqual } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import { selectPlayback, selectPlaybackStarted } from '../selectors';

function playbackState(overrides: Record<string, unknown> = {}) {
  return {
    paused: true,
    ended: false,
    started: false,
    waiting: false,
    autoplay: false,
    autoplaying: false,
    play: () => Promise.resolve(),
    pause: () => {},
    ...overrides,
  };
}

describe('selectPlaybackStarted', () => {
  it('returns undefined without the playback feature', () => {
    expect(selectPlaybackStarted({})).toBeUndefined();
  });

  it('selects only whether playback has started or is autoplaying', () => {
    expect(selectPlaybackStarted(playbackState({ started: true }))).toEqual({ started: true, autoplaying: false });
  });

  it('stays equal across paused and waiting changes', () => {
    const before = selectPlaybackStarted(playbackState({ started: true }));
    const after = selectPlaybackStarted(playbackState({ started: true, paused: false, waiting: true }));

    expect(shallowEqual(before, after)).toBe(true);
    expect(shallowEqual(selectPlayback(playbackState()), selectPlayback(playbackState({ paused: false })))).toBe(false);
  });

  it('shares the playback display name', () => {
    expect(selectPlaybackStarted.displayName).toBe(selectPlayback.displayName);
  });
});
