import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_STATUS_ANNOUNCER_LABELS } from '../labels';
import { deriveStatusAnnouncement, deriveVolumeAnnouncement } from '../status';

describe('deriveStatusAnnouncement', () => {
  it('combines confirmed status changes', () => {
    expect(
      deriveStatusAnnouncement(
        {
          paused: true,
          subtitlesShowing: false,
          subtitlesAvailable: true,
          isFullscreen: false,
          isPictureInPicture: false,
          playbackRate: 1,
        },
        {
          paused: false,
          subtitlesShowing: true,
          subtitlesAvailable: true,
          isFullscreen: true,
          isPictureInPicture: true,
          playbackRate: 1.25,
        }
      )
    ).toBe('Playing. Captions on. Fullscreen. Picture in picture. Playback rate 1.25×');
  });

  it('ignores captions changes when captions are unavailable', () => {
    expect(
      deriveStatusAnnouncement(
        { subtitlesShowing: false, subtitlesAvailable: false },
        { subtitlesShowing: true, subtitlesAvailable: false }
      )
    ).toBeNull();
  });
});

describe('deriveVolumeAnnouncement', () => {
  it('formats changed volume and mute state', () => {
    const labels = {
      ...DEFAULT_STATUS_ANNOUNCER_LABELS,
      volumeWithValue: (value: string) => `${value} volume`,
    };

    expect(deriveVolumeAnnouncement({ volume: 0.5, muted: false }, { volume: 0.75, muted: false }, labels)).toBe(
      '75% volume'
    );
    expect(deriveVolumeAnnouncement({ volume: 0.75, muted: false }, { volume: 0.75, muted: true }, labels)).toBe(
      'Muted'
    );
  });

  it('ignores unchanged volume state', () => {
    expect(deriveVolumeAnnouncement({ volume: 0.5, muted: false }, { volume: 0.5, muted: false })).toBeNull();
  });
});
