import { act, cleanup, render } from '@testing-library/react';
import { metadataFeature } from '@videojs/core';
import { Activity, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { ReactNativeMedia } from '../../media/react-native-media';
import { useMediaInstance } from '../../utils/use-media-instance';
import { createPlayer, type NativePlayerStore } from '../create-player';

describe('createPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Player', () => {
    it('replaces the store and media when an Activity is shown after hiding destroyed them', () => {
      const { Player, usePlayer, useMedia } = createPlayer({ features: [] });
      let store!: NativePlayerStore;
      let media!: ReactNativeMedia;
      let seen!: ReactNativeMedia;

      function Consumer() {
        store = usePlayer();
        media = useMedia();
        seen = useMediaInstance(ReactNativeMedia);
        return null;
      }

      function App({ mode }: { mode: 'visible' | 'hidden' }) {
        return (
          <Activity mode={mode}>
            <Player>
              <Consumer />
            </Player>
          </Activity>
        );
      }

      const { rerender } = render(<App mode="visible" />);
      const originalStore = store;
      const originalMedia = media;

      expect(seen).toBe(originalMedia);
      expect(originalStore.destroyed).toBe(false);
      expect(originalMedia.handle).not.toBeNull();

      rerender(<App mode="hidden" />);
      act(() => vi.runAllTimers());

      expect(originalStore.destroyed).toBe(true);
      expect(originalMedia.handle).toBeNull();

      rerender(<App mode="visible" />);

      expect(store).not.toBe(originalStore);
      expect(media).not.toBe(originalMedia);
      expect(seen).toBe(media);
      expect(store.destroyed).toBe(false);
      expect(media.handle).not.toBeNull();
      expect(media.paused).toBe(true);

      void media.play();

      expect(media.paused).toBe(false);
    });

    it('keeps the store and media when an Activity is shown before the deferred destroy fires', () => {
      const { Player, usePlayer, useMedia } = createPlayer({ features: [] });
      let store!: NativePlayerStore;
      let media!: ReactNativeMedia;

      function Consumer() {
        store = usePlayer();
        media = useMedia();
        return null;
      }

      function App({ mode }: { mode: 'visible' | 'hidden' }) {
        return (
          <Activity mode={mode}>
            <Player>
              <Consumer />
            </Player>
          </Activity>
        );
      }

      const { rerender } = render(<App mode="visible" />);
      const originalStore = store;
      const originalMedia = media;

      rerender(<App mode="hidden" />);
      rerender(<App mode="visible" />);
      act(() => vi.runAllTimers());

      expect(store).toBe(originalStore);
      expect(media).toBe(originalMedia);
      expect(store.destroyed).toBe(false);
      expect(media.handle).not.toBeNull();
    });

    it('keeps the same store and media in StrictMode', () => {
      const { Player, usePlayer, useMedia } = createPlayer({ features: [] });
      let store!: NativePlayerStore;
      let media!: ReactNativeMedia;

      function Consumer() {
        store = usePlayer();
        media = useMedia();
        return null;
      }

      render(
        <StrictMode>
          <Player>
            <Consumer />
          </Player>
        </StrictMode>
      );
      act(() => vi.runAllTimers());

      const originalStore = store;
      const originalMedia = media;

      act(() => vi.runAllTimers());

      expect(store).toBe(originalStore);
      expect(media).toBe(originalMedia);
      expect(store.destroyed).toBe(false);
      expect(media.handle).not.toBeNull();
    });

    it('seeds current config inputs when replacing a destroyed store', () => {
      const { Player, usePlayer } = createPlayer({ features: [metadataFeature] });
      let store!: NativePlayerStore<[typeof metadataFeature]>;

      function Consumer() {
        store = usePlayer();
        return null;
      }

      function App({ mode, title }: { mode: 'visible' | 'hidden'; title: string }) {
        return (
          <Activity mode={mode}>
            <Player title={title}>
              <Consumer />
            </Player>
          </Activity>
        );
      }

      const { rerender } = render(<App mode="visible" title="Original title" />);
      const destroyedStore = store;

      rerender(<App mode="hidden" title="Replacement title" />);
      act(() => vi.runAllTimers());
      rerender(<App mode="visible" title="Replacement title" />);

      expect(store).not.toBe(destroyedStore);
      expect(store.destroyed).toBe(false);
      expect(store.title).toBe('Replacement title');
    });
  });
});
