import { describe, expect, it, vi } from 'vite-plus/test';

import { collectUnhandledRejections } from '../../tests/test-helpers';
import type { GestureActionContext } from '../actions';
import { resolveGestureAction } from '../actions';

describe('resolveGestureAction', () => {
  it('returns a resolver for override actions', () => {
    expect(resolveGestureAction('togglePaused')).toBeTypeOf('function');
    expect(resolveGestureAction('seekStep')).toBeTypeOf('function');
    expect(resolveGestureAction('volumeStep')).toBeTypeOf('function');
    expect(resolveGestureAction('speedUp')).toBeTypeOf('function');
    expect(resolveGestureAction('speedDown')).toBeTypeOf('function');
  });

  it('returns a resolver for toggle actions', () => {
    expect(resolveGestureAction('toggleMuted')).toBeTypeOf('function');
    expect(resolveGestureAction('toggleFullscreen')).toBeTypeOf('function');
    expect(resolveGestureAction('toggleSubtitles')).toBeTypeOf('function');
    expect(resolveGestureAction('togglePictureInPicture')).toBeTypeOf('function');
    expect(resolveGestureAction('toggleControls')).toBeTypeOf('function');
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

describe('togglePaused', () => {
  it('calls play() when paused', () => {
    const play = vi.fn();
    const pause = vi.fn();

    resolveGestureAction('togglePaused')!(
      ctx({ paused: true, ended: false, started: false, waiting: false, play, pause })
    );
    expect(play).toHaveBeenCalledOnce();
    expect(pause).not.toHaveBeenCalled();
  });

  it('calls pause() when playing', () => {
    const play = vi.fn();
    const pause = vi.fn();

    resolveGestureAction('togglePaused')!(
      ctx({ paused: false, ended: false, started: true, waiting: false, play, pause })
    );
    expect(pause).toHaveBeenCalledOnce();
    expect(play).not.toHaveBeenCalled();
  });
});

describe('toggleMuted', () => {
  it('mutes when unmuted', () => {
    const setMuted = vi.fn();

    resolveGestureAction('toggleMuted')!(ctx({ volume: 0.5, muted: false, setMuted }));

    expect(setMuted).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('unmutes when muted', () => {
    const setMuted = vi.fn();

    resolveGestureAction('toggleMuted')!(ctx({ volume: 0.5, muted: true, setMuted }));

    expect(setMuted).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('unmutes when volume is 0', () => {
    const setMuted = vi.fn();

    resolveGestureAction('toggleMuted')!(ctx({ volume: 0, muted: false, setMuted }));

    expect(setMuted).toHaveBeenCalledExactlyOnceWith(false);
  });
});

describe('toggleFullscreen', () => {
  it('calls requestFullscreen() when not fullscreen', () => {
    const requestFullscreen = vi.fn();
    const exitFullscreen = vi.fn();

    resolveGestureAction('toggleFullscreen')!(ctx({ isFullscreen: false, requestFullscreen, exitFullscreen }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(exitFullscreen).not.toHaveBeenCalled();
  });

  it('calls exitFullscreen() when fullscreen', () => {
    const requestFullscreen = vi.fn();
    const exitFullscreen = vi.fn();

    resolveGestureAction('toggleFullscreen')!(ctx({ isFullscreen: true, requestFullscreen, exitFullscreen }));

    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen).not.toHaveBeenCalled();
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

describe('togglePictureInPicture', () => {
  it('calls requestPictureInPicture() when not in PiP', () => {
    const requestPictureInPicture = vi.fn();
    const exitPictureInPicture = vi.fn();

    resolveGestureAction('togglePictureInPicture')!(
      ctx({ isPictureInPicture: false, requestPictureInPicture, exitPictureInPicture })
    );

    expect(requestPictureInPicture).toHaveBeenCalledOnce();
    expect(exitPictureInPicture).not.toHaveBeenCalled();
  });

  it('calls exitPictureInPicture() when in PiP', () => {
    const requestPictureInPicture = vi.fn();
    const exitPictureInPicture = vi.fn();

    resolveGestureAction('togglePictureInPicture')!(
      ctx({ isPictureInPicture: true, requestPictureInPicture, exitPictureInPicture })
    );

    expect(exitPictureInPicture).toHaveBeenCalledOnce();
    expect(requestPictureInPicture).not.toHaveBeenCalled();
  });
});

describe('seekStep', () => {
  it('seeks by value offset', () => {
    const seek = vi.fn();

    resolveGestureAction('seekStep')!(ctx({ currentTime: 10, duration: 60, seeking: false, seek }, 5));
    expect(seek).toHaveBeenCalledWith(15);
  });

  it('uses the default without value', () => {
    const seek = vi.fn();

    resolveGestureAction('seekStep')!(ctx({ currentTime: 10, duration: 60, seeking: false, seek }));
    expect(seek).toHaveBeenCalledWith(20);
  });

  it('seeks before the time range is known', () => {
    const seek = vi.fn();

    resolveGestureAction('seekStep')!(ctx({ currentTime: 0, duration: 0, seeking: false, seek }, 5));
    expect(seek).toHaveBeenCalledWith(5);
  });
});

describe('volumeStep', () => {
  it('uses the default without value', () => {
    const setVolume = vi.fn();

    resolveGestureAction('volumeStep')!(
      ctx({ volume: 0.5, muted: false, volumeAvailability: 'available', setVolume, setMuted: vi.fn() })
    );
    expect(setVolume).toHaveBeenCalledWith(0.55);
  });

  it('adjusts volume by value offset', () => {
    const setVolume = vi.fn();

    resolveGestureAction('volumeStep')!(
      ctx({ volume: 0.5, muted: false, volumeAvailability: 'available', setVolume, setMuted: vi.fn() }, 0.1)
    );
    expect(setVolume).toHaveBeenCalledWith(0.6);
  });
});

describe('speedUp', () => {
  it('cycles to next playback rate', () => {
    const setPlaybackRate = vi.fn();

    resolveGestureAction('speedUp')!(ctx({ playbackRates: [0.5, 1, 1.5, 2], playbackRate: 1, setPlaybackRate }));
    expect(setPlaybackRate).toHaveBeenCalledWith(1.5);
  });

  it('wraps to first rate at end', () => {
    const setPlaybackRate = vi.fn();

    resolveGestureAction('speedUp')!(ctx({ playbackRates: [0.5, 1, 2], playbackRate: 2, setPlaybackRate }));
    expect(setPlaybackRate).toHaveBeenCalledWith(0.5);
  });
});

describe('speedDown', () => {
  it('cycles to previous playback rate', () => {
    const setPlaybackRate = vi.fn();

    resolveGestureAction('speedDown')!(ctx({ playbackRates: [0.5, 1, 1.5, 2], playbackRate: 1.5, setPlaybackRate }));
    expect(setPlaybackRate).toHaveBeenCalledWith(1);
  });

  it('wraps to last rate at beginning', () => {
    const setPlaybackRate = vi.fn();

    resolveGestureAction('speedDown')!(ctx({ playbackRates: [0.5, 1, 2], playbackRate: 0.5, setPlaybackRate }));
    expect(setPlaybackRate).toHaveBeenCalledWith(2);
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
