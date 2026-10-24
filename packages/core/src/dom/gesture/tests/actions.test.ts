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
