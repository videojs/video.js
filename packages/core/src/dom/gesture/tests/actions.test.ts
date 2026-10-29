import { describe, expect, it, vi } from 'vite-plus/test';

import { collectUnhandledRejections } from '../../tests/test-helpers';
import type { GestureActionContext } from '../actions';
import { resolveGestureAction } from '../actions';

describe('resolveGestureAction', () => {
  it.each([
    ['togglePaused', { paused: true }, 'play', []],
    ['toggleMuted', { volume: 0.5, muted: false }, 'setMuted', [true]],
    ['toggleFullscreen', { isFullscreen: false }, 'requestFullscreen', []],
    ['togglePictureInPicture', { isPictureInPicture: false }, 'requestPictureInPicture', []],
    ['seekStep', { currentTime: 10, duration: 60, seeking: false }, 'seek', [20]],
    ['volumeStep', { volume: 0.5, muted: false }, 'setVolume', [0.55]],
    ['speedUp', { playbackRates: [0.5, 1, 2], playbackRate: 1 }, 'setPlaybackRate', [2]],
    ['speedDown', { playbackRates: [0.5, 1, 2], playbackRate: 1 }, 'setPlaybackRate', [0.5]],
  ] as const)('routes %s to %s', (action, state, method, args) => {
    const activate = vi.fn();

    resolveGestureAction(action)!(ctx({ ...state, [method]: activate }));

    expect(activate).toHaveBeenCalledExactlyOnceWith(...args);
  });

  it('toggles playback from the state the pointer-down found, not what the click started since', () => {
    const play = vi.fn(async () => {});
    const pause = vi.fn();
    const context = ctx({ paused: false, play, pause });

    // Safari's start button plays on the click, before the deferred tap fires.
    resolveGestureAction('togglePaused')!({ ...context, state: { paused: true, play, pause } });

    expect(play).toHaveBeenCalledOnce();
    expect(pause).not.toHaveBeenCalled();
  });

  it('handles a rejection from a store action called by name', async () => {
    let calls = 0;
    // Not a `vi.fn`; see `collectUnhandledRejections`.
    const exitFullscreen = () => {
      calls++;
      return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
    };

    const reasons = await collectUnhandledRejections(() =>
      resolveGestureAction('exitFullscreen')!(ctx({ exitFullscreen }))
    );

    expect(calls).toBe(1);
    expect(reasons).toEqual([]);
  });

  it('always returns a resolver (warns for unknown in __DEV__)', () => {
    const resolver = resolveGestureAction('nonexistent');

    expect(resolver).toBeTypeOf('function');

    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolver!(ctx({}));
    expect(spy).toHaveBeenCalledWith('[vjs-gesture] Unknown action: "nonexistent"');
    spy.mockRestore();
  });
});

describe('startOrToggleControls', () => {
  it('starts playback that has not started, without toggling controls', () => {
    const play = vi.fn();
    const toggleControls = vi.fn();

    resolveGestureAction('startOrToggleControls')!(
      ctx({ paused: true, started: false, play, userActive: true, toggleControls })
    );

    expect(play).toHaveBeenCalledOnce();
    expect(toggleControls).not.toHaveBeenCalled();
  });

  it.each([
    ['playing', { paused: false, started: true }],
    ['paused after playback started', { paused: true, started: true }],
    ['autoplay is pending', { paused: true, started: false, autoplaying: true }],
  ])('toggles controls while %s', (_, state) => {
    const play = vi.fn();
    const pause = vi.fn();
    const toggleControls = vi.fn();

    resolveGestureAction('startOrToggleControls')!(ctx({ ...state, play, pause, userActive: true, toggleControls }));

    expect(toggleControls).toHaveBeenCalledOnce();
    expect(play).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it('starts from the state the pointer-down found', () => {
    const play = vi.fn();
    const toggleControls = vi.fn();
    const context = ctx({ paused: false, started: true, play, userActive: true, toggleControls });

    // A click can start playback before the deferred tap fires.
    resolveGestureAction('startOrToggleControls')!({ ...context, state: { paused: true, started: false, play } });

    expect(play).toHaveBeenCalledOnce();
    expect(toggleControls).not.toHaveBeenCalled();
  });
});

describe('direct store actions', () => {
  it('calls toggleControls on store state', () => {
    const toggleControls = vi.fn();

    resolveGestureAction('toggleControls')!(ctx({ toggleControls }));
    expect(toggleControls).toHaveBeenCalledOnce();
  });

  it('calls toggleSubtitles on store state', () => {
    const toggleSubtitles = vi.fn();

    resolveGestureAction('toggleSubtitles')!(ctx({ toggleSubtitles }));
    expect(toggleSubtitles).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ctx(stateProps: Record<string, unknown>, value?: number): GestureActionContext {
  return {
    store: { state: stateProps } as unknown as GestureActionContext['store'],
    value,
    event: new Event('pointerup') as PointerEvent,
  };
}
