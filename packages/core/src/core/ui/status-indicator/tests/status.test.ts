import { describe, expect, it } from 'vite-plus/test';

import type { MediaSnapshot } from '../../input-action';
import { deriveStatus, getStatusIndicatorDisplayValue } from '../status';

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

describe('deriveStatus', () => {
  it('derives playback status from the expected next state', () => {
    expect(deriveStatus({ action: 'togglePaused' }, SNAPSHOT)).toMatchObject({
      status: 'pause',
      label: 'Paused',
    });

    expect(deriveStatus({ action: 'togglePaused' }, { ...SNAPSHOT, paused: true })).toMatchObject({
      status: 'play',
      label: 'Playing',
    });
  });

  it('derives volume status and value', () => {
    expect(deriveStatus({ action: 'volumeStep', value: 0.3 }, SNAPSHOT)).toMatchObject({
      status: 'volume-high',
      label: 'Volume',
      value: '80%',
      volumeLevel: 'high',
    });
  });

  it('derives captions, fullscreen, and picture-in-picture statuses', () => {
    expect(deriveStatus({ action: 'toggleSubtitles' }, SNAPSHOT)?.status).toBe('captions-on');
    expect(deriveStatus({ action: 'toggleSubtitles' }, { ...SNAPSHOT, subtitlesAvailable: false })).toBeNull();
    expect(deriveStatus({ action: 'toggleFullscreen' }, SNAPSHOT)?.status).toBe('fullscreen');
    expect(deriveStatus({ action: 'toggleFullscreen' }, { ...SNAPSHOT, isFullscreen: true })?.status).toBe(
      'exit-fullscreen'
    );
    expect(deriveStatus({ action: 'togglePictureInPicture' }, SNAPSHOT)?.status).toBe('pip');
    expect(deriveStatus({ action: 'togglePictureInPicture' }, { ...SNAPSHOT, isPictureInPicture: true })?.status).toBe(
      'exit-pip'
    );
  });

  it('does not derive status or values for seek and unsupported actions', () => {
    expect(deriveStatus({ action: 'seekStep', value: 10 }, SNAPSHOT)).toBeNull();
    expect(deriveStatus({ action: 'seekToPercent', value: 50 }, SNAPSHOT)).toBeNull();
    expect(deriveStatus({ action: 'speedUp' }, SNAPSHOT)).toBeNull();
  });
});

describe('getStatusIndicatorDisplayValue', () => {
  it('uses the label when no value is available', () => {
    expect(getStatusIndicatorDisplayValue({ label: 'Paused', value: null })).toBe('Paused');
  });
});
