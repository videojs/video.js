import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSelector } from '../selector';
import { defineSlice } from '../slice';

const NativeAbortController = globalThis.AbortController;

interface MockMedia {
  volume: number;
}

describe('createSelector', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  const volumeSlice = defineSlice<MockMedia>()({
    name: 'volume',
    state: ({ target }) => ({
      volume: 1,
      muted: false,
      setVolume(value: number) {
        target().volume = value;
        return value;
      },
    }),
  });

  const playbackSlice = defineSlice<MockMedia>()({
    name: 'playback',
    state: () => ({
      paused: true,
      ended: false,
    }),
  });

  it('selects slice state from store state', () => {
    const selectVolume = createSelector(volumeSlice);
    const state = { volume: 0.5, muted: true, setVolume: () => 0.5 };

    const selected = selectVolume(state);

    expect(selected).toEqual({
      volume: 0.5,
      muted: true,
      setVolume: state.setVolume,
    });
  });

  it('returns undefined when slice is not configured', () => {
    const selectVolume = createSelector(volumeSlice);
    const state = { paused: true, ended: false }; // No volume keys

    const selected = selectVolume(state);

    expect(selected).toBeUndefined();
  });

  it('creates separate selectors for different slices', () => {
    const selectVolume = createSelector(volumeSlice);
    const selectPlayback = createSelector(playbackSlice);
    const state = {
      volume: 0.75,
      muted: false,
      setVolume: () => 0.75,
      paused: false,
      ended: false,
    };

    const volume = selectVolume(state);
    const playback = selectPlayback(state);

    expect(volume).toEqual({
      volume: 0.75,
      muted: false,
      setVolume: state.setVolume,
    });
    expect(playback).toEqual({
      paused: false,
      ended: false,
    });
  });

  it('exposes displayName from slice name', () => {
    const selectVolume = createSelector(volumeSlice);

    expect(selectVolume.displayName).toBe('volume');
  });

  it('omits displayName when slice has no name', () => {
    const unnamedSlice = defineSlice<MockMedia>()({
      state: () => ({ paused: true }),
    });
    const selector = createSelector(unnamedSlice);

    expect(selector.displayName).toBeUndefined();
  });

  it('returns undefined for empty-state slice', () => {
    const emptySlice = defineSlice<MockMedia>()({
      name: 'empty',
      state: () => ({}),
    });
    const selector = createSelector(emptySlice);

    expect(selector({})).toBeUndefined();
    expect(selector.displayName).toBe('empty');
  });

  // Runtimes such as Cloudflare Workers throw when I/O-bound objects are created during
  // module evaluation. See https://github.com/videojs/v10/issues/2041.
  it('accepts only slices from defineSlice', () => {
    const literal = { state: () => ({ volume: 1 }) };

    // @ts-expect-error -- a slice is opaque, so a literal with slice members is not one.
    expect(createSelector(literal)({ volume: 0.5 })).toEqual({ volume: 0.5 });
  });

  it('does not construct an AbortController on module evaluation', async () => {
    let constructed = 0;

    class CountingAbortController extends NativeAbortController {
      constructor() {
        super();
        constructed++;
      }
    }

    vi.stubGlobal('AbortController', CountingAbortController);
    vi.resetModules();

    await import('../selector');

    expect(constructed).toBe(0);
  });
});
