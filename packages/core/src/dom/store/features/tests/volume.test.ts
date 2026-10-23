import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { volumeFeature } from '../volume';

/** Shaped like an embed adapter: takes any level, with no native element the player can reach. */
class TestEmbed extends EventTarget {
  volume = 1;
  muted = false;
}

/** Makes media elements ignore `volume` writes, as iOS Safari does. */
function lockVolume() {
  vi.spyOn(HTMLMediaElement.prototype, 'volume', 'set').mockImplementation(() => {});
}

describe('volumeFeature', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attach', () => {
    it('syncs volume state on attach', () => {
      const video = createMockVideo({
        volume: 0.8,
        muted: false,
      });

      const store = createStore<PlayerTarget>()(volumeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.volume).toBe(0.8);
      expect(store.state.muted).toBe(false);
    });

    it('sets volumeAvailability on attach', () => {
      const video = createMockVideo({});
      const store = createStore<PlayerTarget>()(volumeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.volumeAvailability).toBe('available');
      expect(store.state.mutedAvailability).toBe('available');
    });

    it('reports volume unsupported on a native video where the browser locks volume', () => {
      lockVolume();

      const store = createStore<PlayerTarget>()(volumeFeature);

      store.attach({ media: createMockVideo({}), container: null });

      expect(store.state.volumeAvailability).toBe('unsupported');
      expect(store.state.mutedAvailability).toBe('available');
    });

    it('reports volume unsupported on an embed where the browser locks volume', () => {
      // The embed's setter takes a level, but its player plays through a media element in the iframe.
      lockVolume();

      const store = createStore<PlayerTarget>()(volumeFeature);

      store.attach({ media: new TestEmbed() as unknown as HTMLVideoElement, container: null });

      expect(store.state.volumeAvailability).toBe('unsupported');
      expect(store.state.mutedAvailability).toBe('available');
    });

    it('reports mute available on media that has no volume level', () => {
      // An embed that takes a mute command but offers no way to set a level.
      // Reading one availability for both would hide a mute button that works.
      const media = {
        muted: false,
        addEventListener() {},
        removeEventListener() {},
      };
      const store = createStore<PlayerTarget>()(volumeFeature);

      store.attach({
        media: media as unknown as HTMLVideoElement,
        container: null,
      });

      expect(store.state.mutedAvailability).toBe('available');
      expect(store.state.volumeAvailability).toBe('unavailable');
    });

    it('reports both unavailable on media that has neither', () => {
      // Spotify: the embed takes no volume or mute command and reports neither.
      const media = { addEventListener() {}, removeEventListener() {} };
      const store = createStore<PlayerTarget>()(volumeFeature);

      store.attach({
        media: media as unknown as HTMLVideoElement,
        container: null,
      });

      expect(store.state.mutedAvailability).toBe('unavailable');
      expect(store.state.volumeAvailability).toBe('unavailable');
    });

    it('updates on volumechange event', () => {
      const video = createMockVideo({ volume: 1, muted: false });

      const store = createStore<PlayerTarget>()(volumeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.volume).toBe(1);

      // Update mock volume
      video.volume = 0.5;
      video.muted = true;
      video.dispatchEvent(new Event('volumechange'));

      expect(store.state.volume).toBe(0.5);
      expect(store.state.muted).toBe(true);
    });
  });

  describe('actions', () => {
    describe('setVolume', () => {
      it('sets volume on target', async () => {
        const video = createMockVideo({ muted: false, volume: 0.5 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        const result = await store.setVolume(0.7);

        expect(video.volume).toBe(0.7);
        expect(store.state.volume).toBe(0.7);
        expect(video.muted).toBe(false);
        expect(store.state.muted).toBe(false);
        expect(result).toBe(0.7);
      });

      it('clamps volume to min 0', async () => {
        const video = createMockVideo({});
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        await store.setVolume(-0.5);

        expect(video.volume).toBe(0);
      });

      it('clamps volume to max 1', async () => {
        const video = createMockVideo({});
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        await store.setVolume(1.5);

        expect(video.volume).toBe(1);
      });

      it('unmutes when setting volume above 0 while muted', async () => {
        const video = createMockVideo({ muted: true, volume: 0.5 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        await store.setVolume(0.7);

        expect(video.volume).toBe(0.7);
        expect(video.muted).toBe(false);
        expect(store.state.muted).toBe(false);
      });

      it('leaves an embed level alone, but still unmutes, where the browser locks volume', () => {
        lockVolume();

        const embed = Object.assign(new TestEmbed(), { muted: true });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: embed as unknown as HTMLVideoElement, container: null });

        expect(store.setVolume(0.5)).toBe(1);
        expect(embed.volume).toBe(1);
        expect(embed.muted).toBe(false);
        expect(store.state.volume).toBe(1);
      });

      it('does not unmute when setting volume to 0', async () => {
        const video = createMockVideo({ muted: true, volume: 0.5 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        await store.setVolume(0);

        expect(video.volume).toBe(0);
        expect(video.muted).toBe(true);
      });
    });

    describe('setMuted', () => {
      it('publishes the new muted value without waiting for volumechange', () => {
        const video = createMockVideo({ muted: false, volume: 0 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        // Registered first, so the store's own `volumechange` listener never runs.
        video.addEventListener('volumechange', (event) => event.stopImmediatePropagation());
        store.attach({ media: video, container: null });

        store.setMuted(true);
        expect(store.state.muted).toBe(true);

        store.setMuted(false);
        expect(store.state.muted).toBe(false);
        expect(store.state.volume).toBe(video.volume);
      });

      it('mutes when unmuted with volume > 0', async () => {
        const video = createMockVideo({ muted: false, volume: 0.8 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        const result = await store.setMuted(true);

        expect(video.muted).toBe(true);
        expect(video.volume).toBe(0.8);
        expect(result).toBe(true);
      });

      it('unmutes when muted with volume > 0', async () => {
        const video = createMockVideo({ muted: true, volume: 0.6 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        const result = await store.setMuted(false);

        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.6);
        expect(result).toBe(false);
      });

      it('restores volume to 0.25 when unmuting at volume 0', async () => {
        const video = createMockVideo({ muted: true, volume: 0 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        await store.setMuted(false);

        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.25);
      });

      it('unmutes and restores volume when volume is 0 and not muted', async () => {
        const video = createMockVideo({ muted: false, volume: 0 });
        const store = createStore<PlayerTarget>()(volumeFeature);

        store.attach({ media: video, container: null });

        const result = await store.setMuted(false);

        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.25);
        expect(result).toBe(false);
      });
    });
  });
});
