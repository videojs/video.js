import { describe, expect, it } from 'vite-plus/test';

import type { MediaSnapshot } from '../../input-action';
import { getSeekDirection, getSeekIndicatorDisplayValue } from '../status';

const SNAPSHOT: MediaSnapshot = {
  paused: false,
  volume: 0.5,
  muted: false,
  isFullscreen: false,
  subtitlesShowing: false,
  isPictureInPicture: false,
  currentTime: 30,
  duration: 120,
};

describe('getSeekDirection', () => {
  it('infers seek direction from action details', () => {
    expect(getSeekDirection({ action: 'seekStep', value: -10 }, SNAPSHOT)).toBe('backward');
    expect(getSeekDirection({ action: 'seekToPercent', key: '8' }, SNAPSHOT)).toBe('forward');
  });
});

describe('getSeekIndicatorDisplayValue', () => {
  it('uses current time when no seek-step value is available', () => {
    expect(getSeekIndicatorDisplayValue({ value: null, currentTime: '0:30' })).toBe('0:30');
  });
});
