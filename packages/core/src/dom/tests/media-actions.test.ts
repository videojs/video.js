import { describe, expect, it, vi } from 'vite-plus/test';

import { DEFAULT_SEEK_STEP, DEFAULT_VOLUME_STEP } from '../../core/ui/constants';
import { getMediaInputActionValue, MEDIA_INPUT_ACTION_OVERRIDES, type MediaInputActionContext } from '../media-actions';
import { collectUnhandledRejections } from './test-helpers';

/** A refused request, counted by hand; see {@link collectUnhandledRejections} for why it is not a `vi.fn`. */
function rejecting() {
  const request = () => {
    request.calls++;
    return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
  };

  request.calls = 0;

  return request;
}

function mockStore(state: Record<string, unknown>) {
  // SAFETY: the resolvers under test read only the state keys each test supplies.
  return { state } as unknown as MediaInputActionContext['store'];
}

describe('getMediaInputActionValue', () => {
  it('defaults forward and backward seek steps', () => {
    expect(getMediaInputActionValue('seekStep', 'ArrowRight')).toBe(DEFAULT_SEEK_STEP);
    expect(getMediaInputActionValue('seekStep', 'ArrowLeft')).toBe(-DEFAULT_SEEK_STEP);
    expect(getMediaInputActionValue('seekStep', 'l')).toBe(DEFAULT_SEEK_STEP);
    expect(getMediaInputActionValue('seekStep', 'j')).toBe(-DEFAULT_SEEK_STEP);
  });

  it('defaults volume steps', () => {
    expect(getMediaInputActionValue('volumeStep', 'ArrowUp')).toBe(DEFAULT_VOLUME_STEP / 100);
    expect(getMediaInputActionValue('volumeStep', 'ArrowDown')).toBe(-DEFAULT_VOLUME_STEP / 100);
  });

  it('preserves explicit values', () => {
    expect(getMediaInputActionValue('volumeStep', 'ArrowDown', 0.1)).toBe(0.1);
  });

  it('does not default other actions', () => {
    expect(getMediaInputActionValue('togglePaused', 'Space')).toBeUndefined();
  });
});

describe('MEDIA_INPUT_ACTION_OVERRIDES', () => {
  it.each([true, false])('togglePaused changes playback when paused=%s', (paused) => {
    const play = vi.fn();
    const pause = vi.fn();
    const store = mockStore({ paused, play, pause });

    MEDIA_INPUT_ACTION_OVERRIDES.togglePaused({ store });

    expect(paused ? play : pause).toHaveBeenCalledOnce();
    expect(paused ? pause : play).not.toHaveBeenCalled();
  });

  it.each([
    [false, 0.5, true],
    [true, 0.5, false],
    [false, 0, false],
  ])('toggleMuted changes muted=%s at volume=%s to %s', (muted, volume, expected) => {
    const setMuted = vi.fn();
    const store = mockStore({ muted, volume, setMuted });

    MEDIA_INPUT_ACTION_OVERRIDES.toggleMuted({ store });

    expect(setMuted).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it.each([
    ['toggleFullscreen', 'isFullscreen', 'requestFullscreen', 'exitFullscreen'],
    ['togglePictureInPicture', 'isPictureInPicture', 'requestPictureInPicture', 'exitPictureInPicture'],
  ] as const)('%s requests and exits the platform mode', (action, flag, requestName, exitName) => {
    const request = vi.fn();
    const exit = vi.fn();

    MEDIA_INPUT_ACTION_OVERRIDES[action]({
      store: mockStore({ [flag]: false, [requestName]: request, [exitName]: exit }),
    });
    expect(request).toHaveBeenCalledOnce();
    expect(exit).not.toHaveBeenCalled();

    MEDIA_INPUT_ACTION_OVERRIDES[action]({
      store: mockStore({ [flag]: true, [requestName]: request, [exitName]: exit }),
    });
    expect(request).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledOnce();
  });

  it.each([
    { currentTime: 10, duration: 60, value: 5, key: undefined, expected: 15 },
    { currentTime: 10, duration: 60, value: -5, key: undefined, expected: 5 },
    { currentTime: 10, duration: 60, value: undefined, key: undefined, expected: 20 },
    { currentTime: 20, duration: 100, value: undefined, key: 'ArrowLeft', expected: 10 },
    { currentTime: 0, duration: 0, value: 5, key: undefined, expected: 5 },
  ])(
    'seekStep forwards $expected for value=$value key=$key duration=$duration',
    ({ currentTime, duration, value, key, expected }) => {
      const seek = vi.fn();
      const store = mockStore({ currentTime, duration, seeking: false, seek });

      MEDIA_INPUT_ACTION_OVERRIDES.seekStep({ store, value, key });

      expect(seek).toHaveBeenCalledExactlyOnceWith(expected);
    }
  );

  it.each([
    { value: undefined, key: undefined, expected: 0.55 },
    { value: undefined, key: 'ArrowDown', expected: 0.45 },
    { value: 0.1, key: undefined, expected: 0.6 },
    { value: 0.05, key: undefined, expected: 0.55 },
    { value: -0.05, key: undefined, expected: 0.45 },
  ])('volumeStep forwards $expected for value=$value key=$key', ({ value, key, expected }) => {
    const setVolume = vi.fn();
    const store = mockStore({ volume: 0.5, muted: false, setVolume });

    MEDIA_INPUT_ACTION_OVERRIDES.volumeStep({ store, value, key });

    expect(setVolume).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it.each([
    ['speedUp', 1, 1.5],
    ['speedUp', 2, 0.5],
    ['speedDown', 1.5, 1],
    ['speedDown', 0.5, 2],
  ] as const)('%s steps or wraps from %s to %s', (action, playbackRate, expected) => {
    const setPlaybackRate = vi.fn();
    const store = mockStore({ playbackRates: [0.5, 1, 1.5, 2], playbackRate, setPlaybackRate });

    MEDIA_INPUT_ACTION_OVERRIDES[action]({ store });

    expect(setPlaybackRate).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it('handles a refused play() from togglePaused', async () => {
    const play = rejecting();
    const store = mockStore({ paused: true, play, pause: vi.fn() });

    const reasons = await collectUnhandledRejections(() => MEDIA_INPUT_ACTION_OVERRIDES.togglePaused({ store }));

    expect(play.calls).toBe(1);
    expect(reasons).toEqual([]);
  });

  it('handles a refused fullscreen request from toggleFullscreen', async () => {
    const requestFullscreen = rejecting();
    const store = mockStore({ isFullscreen: false, requestFullscreen, exitFullscreen: vi.fn() });

    const reasons = await collectUnhandledRejections(() => MEDIA_INPUT_ACTION_OVERRIDES.toggleFullscreen({ store }));

    expect(requestFullscreen.calls).toBe(1);
    expect(reasons).toEqual([]);
  });

  it('handles a refused picture-in-picture request from togglePictureInPicture', async () => {
    const requestPictureInPicture = rejecting();
    const store = mockStore({ isPictureInPicture: false, requestPictureInPicture, exitPictureInPicture: vi.fn() });

    const reasons = await collectUnhandledRejections(() =>
      MEDIA_INPUT_ACTION_OVERRIDES.togglePictureInPicture({ store })
    );

    expect(requestPictureInPicture.calls).toBe(1);
    expect(reasons).toEqual([]);
  });
});
