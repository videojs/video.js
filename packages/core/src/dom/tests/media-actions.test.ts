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
