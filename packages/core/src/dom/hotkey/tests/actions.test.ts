import { describe, expect, it, vi } from 'vite-plus/test';

import type { HotkeyActionContext } from '../actions';
import { isHotkeyToggleAction, resolveHotkeyAction } from '../actions';

function mockStore(state: Record<string, unknown>) {
  return { state } as HotkeyActionContext['store'];
}

describe('resolveHotkeyAction', () => {
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

    resolveHotkeyAction(action)!({ store: mockStore({ ...state, [method]: activate }), key: '' });

    expect(activate).toHaveBeenCalledExactlyOnceWith(...args);
  });

  it('returns undefined for unknown actions', () => {
    expect(resolveHotkeyAction('nonexistent')).toBeUndefined();
  });

  it('warns in __DEV__ for unknown actions', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resolveHotkeyAction('nonexistent');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0]![0]).toContain('Unknown action');

    spy.mockRestore();
  });
});

describe('isHotkeyToggleAction', () => {
  it('returns true for toggle actions', () => {
    expect(isHotkeyToggleAction('togglePaused')).toBe(true);
    expect(isHotkeyToggleAction('toggleMuted')).toBe(true);
    expect(isHotkeyToggleAction('toggleFullscreen')).toBe(true);
    expect(isHotkeyToggleAction('toggleSubtitles')).toBe(true);
    expect(isHotkeyToggleAction('togglePictureInPicture')).toBe(true);
  });

  it('returns false for non-toggle actions', () => {
    expect(isHotkeyToggleAction('seekStep')).toBe(false);
    expect(isHotkeyToggleAction('volumeStep')).toBe(false);
    expect(isHotkeyToggleAction('speedUp')).toBe(false);
    expect(isHotkeyToggleAction('seekToPercent')).toBe(false);
  });
});

describe('seekToPercent', () => {
  it('seeks to explicit value percentage', () => {
    const seek = vi.fn();
    const store = mockStore({ currentTime: 0, duration: 200, seeking: false, seek });

    resolveHotkeyAction('seekToPercent')!({ store, value: 50, key: '' });

    expect(seek).toHaveBeenCalledWith(100);
  });

  it('derives percentage from digit key', () => {
    const seek = vi.fn();
    const store = mockStore({ currentTime: 0, duration: 200, seeking: false, seek });

    resolveHotkeyAction('seekToPercent')!({ store, key: '3' });

    expect(seek).toHaveBeenCalledWith(60);
  });

  it('uses the seekable end when duration is unknown', () => {
    const seek = vi.fn();
    const store = mockStore({
      currentTime: 0,
      duration: 0,
      seeking: false,
      seek,
      buffered: [],
      seekable: [[10, 120]],
    });

    resolveHotkeyAction('seekToPercent')!({ store, value: 50, key: '' });

    expect(seek).toHaveBeenCalledWith(60);
  });

  it('no-ops for non-digit key without value', () => {
    const seek = vi.fn();
    const store = mockStore({ currentTime: 0, duration: 200, seeking: false, seek });

    resolveHotkeyAction('seekToPercent')!({ store, key: 'k' });

    expect(seek).not.toHaveBeenCalled();
  });

  it('no-ops when duration is 0', () => {
    const seek = vi.fn();
    const store = mockStore({ currentTime: 0, duration: 0, seeking: false, seek });

    resolveHotkeyAction('seekToPercent')!({ store, value: 50, key: '' });

    expect(seek).not.toHaveBeenCalled();
  });
});
