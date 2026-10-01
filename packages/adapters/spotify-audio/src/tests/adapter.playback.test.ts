import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { SpotifyAdapter } from '../adapter';
import { attachAndLoad, installSpotifyApi } from './spotify-api';

beforeEach(installSpotifyApi);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('SpotifyAdapter', () => {
  it('ignores playback updates after the source is cleared', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    controller.update({ isPaused: false, position: 5_000 });
    expect(media.currentTime).toBe(5);

    media.source = null;
    const events: string[] = [];

    for (const type of [
      'loadedmetadata',
      'loadcomplete',
      'durationchange',
      'timeupdate',
      'play',
      'playing',
      'waiting',
      'pause',
      'ended',
    ]) {
      media.addEventListener(type, () => events.push(type));
    }

    // The paused embed can still deliver snapshots queued before the source was cleared.
    controller.update({ isPaused: true, position: 5_000 });
    controller.update({ isPaused: false, position: 6_000 });

    try {
      expect.soft(media.readyState).toBe(0);
      expect.soft(media.duration).toBeNaN();
      expect.soft(media.currentTime).toBe(0);
      expect.soft(media.paused).toBe(true);
      expect.soft(media.buffered.length).toBe(0);
      expect.soft(media.seekable.length).toBe(0);
      expect.soft(events).toEqual([]);
    } finally {
      media.destroy();
    }
  });
});
