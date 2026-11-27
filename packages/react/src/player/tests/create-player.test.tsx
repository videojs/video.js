import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import {
  type ExtensionPlayer,
  features,
  metadataFeature,
  type PlayerExtension,
  type PlayerStore,
  type PlayerTarget,
  volumeFeature,
} from '@videojs/core/dom';
import type { Media } from '@videojs/media';
import { defineSlice } from '@videojs/store';
import { Activity, Component, type ErrorInfo, type ReactNode, StrictMode, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { I18nProvider, useLocale } from '../../i18n';
import { Container } from '../../index';
import { Video } from '../../media/video';
import { useMediaInstance } from '../../utils/use-media-instance';
import { usePlayerExtension } from '../../utils/use-player-extension';
import { useContainer, usePlayerContext } from '../context';
import { createPlayer } from '../create-player';

describe('createPlayer', () => {
  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('lang');
  });

  // Create a mock slice that works with any target
  const mockSlice = defineSlice()({
    state: () => ({
      volume: 1,
      muted: false,
      paused: true,
    }),
  });

  describe('Player', () => {
    it('creates store on mount', () => {
      const { Player, usePlayer } = createPlayer({ features: [mockSlice] });

      let store!: PlayerStore;

      function TestComponent() {
        store = usePlayer();
        return null;
      }

      render(
        <Player>
          <TestComponent />
        </Player>
      );

      expect(store).toBeDefined();
      expect(typeof store.subscribe).toBe('function');
      expect(typeof store.attach).toBe('function');
      expect(typeof store.destroy).toBe('function');
    });

    it('destroys store on unmount', () => {
      vi.useFakeTimers();

      const { Player, usePlayer } = createPlayer({ features: [mockSlice] });

      let store!: PlayerStore;

      function TestComponent() {
        store = usePlayer();
        return null;
      }

      const { unmount } = render(
        <Player>
          <TestComponent />
        </Player>
      );

      const destroySpy = vi.spyOn(store, 'destroy');

      unmount();
      vi.runAllTimers();

      expect(destroySpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('replaces the store when an Activity is shown after hiding destroyed it', () => {
      vi.useFakeTimers();

      const { Player, usePlayer } = createPlayer({ features: [mockSlice] });
      let store!: PlayerStore;

      function TestComponent() {
        store = usePlayer();
        return null;
      }

      function App({ mode }: { mode: 'visible' | 'hidden' }) {
        return (
          <Activity mode={mode}>
            <Player>
              <Video />
              <TestComponent />
            </Player>
          </Activity>
        );
      }

      const { rerender } = render(<App mode="visible" />);
      const originalStore = store;

      rerender(<App mode="hidden" />);
      act(() => vi.runAllTimers());

      expect(originalStore.destroyed).toBe(true);

      rerender(<App mode="visible" />);

      expect(store).not.toBe(originalStore);
      expect(store.destroyed).toBe(false);

      vi.useRealTimers();
    });

    it('seeds current config inputs when replacing a destroyed store', () => {
      vi.useFakeTimers();

      const { Player, usePlayer } = createPlayer({ features: [metadataFeature] });
      let store!: PlayerStore<[typeof metadataFeature]>;

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
      expect(store.title).toBe('Replacement title');

      vi.useRealTimers();
    });

    describe('extensions', () => {
      class MutedExtension implements PlayerExtension {
        static instances: MutedExtension[] = [];
        attach = vi.fn<(target: PlayerTarget) => void>();
        detach = vi.fn();
        destroy = vi.fn();

        constructor() {
          MutedExtension.instances.push(this);
        }

        get mediaOverride() {
          return { muted: true };
        }
      }

      /** Declares no `mediaOverride`, like Mux Data. */
      class ObserverExtension implements PlayerExtension {
        static instances: ObserverExtension[] = [];
        connect = vi.fn<(player: ExtensionPlayer) => void>();
        disconnect = vi.fn();
        attach = vi.fn<(target: PlayerTarget) => void>();
        detach = vi.fn();
        destroy = vi.fn();

        constructor() {
          ObserverExtension.instances.push(this);
        }
      }

      /** An element-less playback adapter, like a Mux adapter detached from its `<video>`. */
      class MediaAdapter extends EventTarget {
        static instances: MediaAdapter[] = [];

        destroy = vi.fn();

        constructor() {
          super();
          MediaAdapter.instances.push(this);
        }
      }

      const MediaAdapterClass = MediaAdapter as unknown as new () => Media & MediaAdapter;

      function Muted() {
        usePlayerExtension(MutedExtension);
        return null;
      }

      function Observer() {
        usePlayerExtension(ObserverExtension);
        return null;
      }

      function Adapter() {
        useMediaInstance(MediaAdapterClass);
        return null;
      }

      afterEach(() => {
        MutedExtension.instances.length = 0;
        ObserverExtension.instances.length = 0;
        MediaAdapter.instances.length = 0;
      });

      it('attaches extensions to a plain video and routes store reads through their overrides', () => {
        const { Player, usePlayer } = createPlayer({ features: [volumeFeature] });
        let store!: PlayerStore<[typeof volumeFeature]>;

        function Consumer() {
          store = usePlayer();
          return null;
        }

        const { container } = render(
          <Player>
            <Video data-testid="video" />
            <Muted />
            <Consumer />
          </Player>
        );

        const video = container.querySelector('video')!;
        const [extension] = MutedExtension.instances;

        expect(extension!.attach).toHaveBeenCalledWith(expect.objectContaining({ media: video }));
        expect(store.target?.media).not.toBe(video);
        expect(store.target?.media).toBeInstanceOf(HTMLVideoElement);
        expect(store.state.muted).toBe(true);
        expect(video.muted).toBe(false);
      });

      it('re-attaches the store when an extension mounts after the media', () => {
        const { Player, usePlayer } = createPlayer({ features: [volumeFeature] });
        let store!: PlayerStore<[typeof volumeFeature]>;

        function Consumer() {
          store = usePlayer();
          return null;
        }

        function App({ cast }: { cast: boolean }) {
          return (
            <Player>
              <Video />
              {cast && <Muted />}
              <Consumer />
            </Player>
          );
        }

        const { container, rerender } = render(<App cast={false} />);
        const video = container.querySelector('video')!;

        expect(store.target?.media).toBe(video);
        expect(store.state.muted).toBe(false);

        rerender(<App cast />);

        const [extension] = MutedExtension.instances;

        expect(extension!.attach).toHaveBeenCalledTimes(1);
        expect(store.target?.media).not.toBe(video);
        expect(store.state.muted).toBe(true);

        rerender(<App cast={false} />);

        expect(extension!.detach).toHaveBeenCalledTimes(1);
        expect(store.target?.media).toBe(video);
        expect(store.state.muted).toBe(false);
      });

      it('never wraps the media or re-attaches the store for an observer', () => {
        const { Player, usePlayer } = createPlayer({ features: [volumeFeature] });
        let store!: PlayerStore<[typeof volumeFeature]>;

        function Consumer() {
          store = usePlayer();
          return null;
        }

        function App({ observe }: { observe: boolean }) {
          return (
            <Player>
              <Video />
              {observe && <Observer />}
              <Consumer />
            </Player>
          );
        }

        const { container, rerender } = render(<App observe={false} />);
        const video = container.querySelector('video')!;
        const attach = vi.spyOn(store, 'attach');

        rerender(<App observe />);

        const [extension] = ObserverExtension.instances;

        expect(extension!.connect).toHaveBeenCalledWith({ initTime: expect.any(Number) });
        expect(extension!.attach).toHaveBeenCalledWith(expect.objectContaining({ media: video }));
        expect(store.target?.media).toBe(video);

        rerender(<App observe={false} />);

        expect(extension!.detach).toHaveBeenCalledTimes(1);
        expect(extension!.disconnect).toHaveBeenCalledTimes(1);
        expect(attach).not.toHaveBeenCalled();
      });

      it('keeps extensions attached when only the container changes', () => {
        const { Player } = createPlayer({ features: [volumeFeature] });
        let setContainer!: (container: HTMLElement | null) => void;

        function Consumer() {
          setContainer = usePlayerContext().setContainer;
          return null;
        }

        render(
          <Player>
            <Video />
            <Observer />
            <Consumer />
          </Player>
        );

        const [extension] = ObserverExtension.instances;

        act(() => setContainer(document.createElement('div')));
        act(() => setContainer(document.createElement('div')));

        expect(extension!.attach).toHaveBeenCalledTimes(1);
        expect(extension!.detach).not.toHaveBeenCalled();
      });

      it('detaches extensions with the store on unmount', () => {
        const { Player } = createPlayer({ features: [volumeFeature] });

        const { unmount } = render(
          <Player>
            <Video />
            <Muted />
          </Player>
        );

        const [extension] = MutedExtension.instances;

        expect(extension!.attach).toHaveBeenCalledTimes(1);

        unmount();

        expect(extension!.detach).toHaveBeenCalledTimes(1);
      });

      it('attaches a remounted extension only to the incoming adapter', () => {
        vi.useFakeTimers();

        const { Player } = createPlayer({ features: [volumeFeature] });

        function App({ version }: { version: number }) {
          return (
            <Player>
              <Adapter key={version} />
              <Observer key={version} />
            </Player>
          );
        }

        const { rerender } = render(<App version={1} />);
        const [firstObserver] = ObserverExtension.instances;

        rerender(<App version={2} />);
        act(() => vi.runAllTimers());

        const [, secondObserver] = ObserverExtension.instances;
        const [firstMedia, secondMedia] = MediaAdapter.instances;

        // The outgoing extension stays attached to the media it knew until it is released.
        expect(firstObserver!.attach).toHaveBeenCalledTimes(1);
        expect(firstObserver!.attach).toHaveBeenCalledWith(expect.objectContaining({ media: firstMedia }));
        expect(firstObserver!.detach).toHaveBeenCalledTimes(1);

        // The remounted extension never attaches to the outgoing, element-less adapter (#9812).
        expect(secondObserver!.attach).toHaveBeenCalledTimes(1);
        expect(secondObserver!.attach).toHaveBeenCalledWith(expect.objectContaining({ media: secondMedia }));

        vi.useRealTimers();
      });

      it('attaches a remounted extension only to the incoming video element', () => {
        const { Player } = createPlayer({ features: [volumeFeature] });

        function App({ version }: { version: number }) {
          return (
            <Player>
              <Video key={version} />
              <Observer key={version} />
            </Player>
          );
        }

        const { container, rerender } = render(<App version={1} />);

        rerender(<App version={2} />);

        const video = container.querySelector('video')!;
        const [, secondObserver] = ObserverExtension.instances;

        expect(secondObserver!.attach).toHaveBeenCalledTimes(1);
        expect(secondObserver!.attach).toHaveBeenCalledWith(expect.objectContaining({ media: video }));
      });

      it('keeps an extension attached to the same media through StrictMode remounting', () => {
        const { Player } = createPlayer({ features: [volumeFeature] });

        const { container } = render(
          <StrictMode>
            <Player>
              <Video />
              <Observer />
            </Player>
          </StrictMode>
        );

        const video = container.querySelector('video')!;
        const [extension] = ObserverExtension.instances;

        expect(extension!.attach.mock.calls.length).toBeGreaterThan(0);

        for (const [target] of extension!.attach.mock.calls) {
          expect(target.media).toBe(video);
        }
      });

      it('attaches the extension recreated by an Activity reveal to the shown media', () => {
        vi.useFakeTimers();

        const { Player } = createPlayer({ features: [volumeFeature] });

        function App({ mode }: { mode: 'visible' | 'hidden' }) {
          return (
            <Activity mode={mode}>
              <Player>
                <Video />
                <Observer />
              </Player>
            </Activity>
          );
        }

        const { container, rerender } = render(<App mode="visible" />);
        const [firstExtension] = ObserverExtension.instances;

        expect(firstExtension!.attach).toHaveBeenCalledTimes(1);

        rerender(<App mode="hidden" />);
        act(() => vi.runAllTimers());

        expect(firstExtension!.detach).toHaveBeenCalled();

        rerender(<App mode="visible" />);

        const video = container.querySelector('video')!;
        const [, secondExtension] = ObserverExtension.instances;

        expect(secondExtension!.attach).toHaveBeenCalledTimes(1);
        expect(secondExtension!.attach).toHaveBeenCalledWith(expect.objectContaining({ media: video }));

        vi.useRealTimers();
      });

      it('keeps an extension attached when the media ref changes identity', () => {
        const { Player } = createPlayer({ features: [volumeFeature] });
        let forceRender!: () => void;

        function App() {
          const [, setTick] = useState(0);

          forceRender = () => setTick((tick) => tick + 1);

          return (
            <Player>
              <Video ref={() => {}} />
              <Observer />
            </Player>
          );
        }

        render(<App />);

        const [extension] = ObserverExtension.instances;

        expect(extension!.attach).toHaveBeenCalledTimes(1);

        act(() => forceRender());
        act(() => forceRender());

        expect(extension!.attach).toHaveBeenCalledTimes(1);
        expect(extension!.detach).not.toHaveBeenCalled();
      });
    });

    it('survives React StrictMode without StoreError', () => {
      const { Player, usePlayer } = createPlayer({ features: [mockSlice] });

      let store!: PlayerStore;

      function TestComponent() {
        store = usePlayer();
        return null;
      }

      expect(() => {
        render(
          <StrictMode>
            <Player>
              <TestComponent />
            </Player>
          </StrictMode>
        );
      }).not.toThrow();

      expect(store).toBeDefined();
      expect(store.destroyed).toBe(false);
    });

    it('StrictMode: preserves the same store instance and cancels the pending destroy', () => {
      vi.useFakeTimers();

      const { Player, usePlayer } = createPlayer({ features: [mockSlice] });

      // Track every store instance the component sees across all renders.
      const seenStores = new Set<PlayerStore>();
      let currentStore!: PlayerStore;

      function TestComponent() {
        currentStore = usePlayer();
        seenStores.add(currentStore);
        return null;
      }

      render(
        <StrictMode>
          <Player>
            <TestComponent />
          </Player>
        </StrictMode>
      );

      // Flush timers — the deferred destroy was scheduled during StrictMode's
      // simulated cleanup. If it was NOT cancelled by the re-mount effect, the
      // store would be destroyed here.
      vi.runAllTimers();

      // The Activity guard must not have fired: one store instance, not two.
      // (setStore would have been called and produced a second instance.)
      expect(seenStores.size).toBe(1);
      expect(currentStore.destroyed).toBe(false);

      vi.useRealTimers();
    });

    it('uses displayName when provided', () => {
      const { Player } = createPlayer({
        features: [mockSlice],
        displayName: 'VideoPlayer',
      });

      expect(Player.displayName).toBe('VideoPlayer');
    });

    it.each([
      { feature: metadataFeature, prop: 'title', initial: 'Initial title', updated: 'Updated title', cleared: '' },
      {
        feature: features.orientationLock,
        prop: 'orientationLockType',
        initial: 'portrait',
        updated: 'natural',
        cleared: 'landscape',
      },
    ])(
      'seeds $prop for the first render and syncs only changed props after commit',
      ({ feature, prop, initial, updated, cleared }) => {
        const { Player, usePlayer } = createPlayer({ features: [feature] });
        let store!: PlayerStore;

        function Consumer() {
          store = usePlayer();
          return <span>{String(store[prop])}</span>;
        }

        const { rerender } = render(
          <Player {...{ [prop]: initial }}>
            <Consumer />
          </Player>
        );

        expect(screen.getByText(initial)).toBeTruthy();

        rerender(
          <Player {...{ [prop]: updated }}>
            <Consumer />
          </Player>
        );
        expect(store[prop]).toBe(updated);

        rerender(
          <Player>
            <Consumer />
          </Player>
        );
        expect(store[prop]).toBe(cleared);
      }
    );

    it('seeds defaultPlaybackRates and restores the defaults when the prop is removed', () => {
      const { Player, usePlayer } = createPlayer({ features: [features.playbackRate] });
      let store!: PlayerStore;

      function Consumer() {
        store = usePlayer();
        return null;
      }

      const { rerender } = render(
        <Player>
          <Consumer />
        </Player>
      );
      const defaults = store.playbackRates;

      rerender(
        <Player defaultPlaybackRates={[2, 1, 0.5]}>
          <Consumer />
        </Player>
      );
      expect(store.playbackRates).toEqual([2, 1, 0.5]);

      rerender(
        <Player>
          <Consumer />
        </Player>
      );
      expect(store.playbackRates).toEqual(defaults);
    });

    it('seeds config inputs during SSR', () => {
      const { Player, usePlayer } = createPlayer({ features: [metadataFeature] });

      function Consumer() {
        return <span>{usePlayer((state) => state.title)}</span>;
      }

      expect(
        renderToString(
          <Player title="SSR title">
            <Consumer />
          </Player>
        )
      ).toContain('SSR title');
    });

    it('hydrates with the same initial config inputs', async () => {
      const { Player, usePlayer } = createPlayer({ features: [metadataFeature] });

      function Consumer() {
        return <span>{usePlayer((state) => state.title)}</span>;
      }

      const container = document.createElement('div');

      vi.stubGlobal('window', undefined);

      try {
        container.innerHTML = renderToString(
          <Player title="Hydrated title">
            <Consumer />
          </Player>
        );
      } finally {
        vi.unstubAllGlobals();
      }

      const serverSpan = container.querySelector('span');

      expect(serverSpan).not.toBeNull();
      expect(serverSpan?.textContent).toBe('Hydrated title');
      const onRecoverableError = vi.fn();

      const view = render(
        <Player title="Hydrated title">
          <Consumer />
        </Player>,
        { container, hydrate: true, onRecoverableError }
      );

      await act(async () => {});

      expect(container.textContent).toBe('Hydrated title');
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector('span')).toBe(serverSpan);
      view.unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('does not apply config inputs from an abandoned render', () => {
      const { Player, usePlayer } = createPlayer({ features: [metadataFeature] });
      let store!: PlayerStore<[typeof metadataFeature]>;

      class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
        state = { failed: false };

        static getDerivedStateFromError() {
          return { failed: true };
        }

        override componentDidCatch(_error: Error, _info: ErrorInfo) {}

        override render() {
          return this.state.failed ? null : this.props.children;
        }
      }

      function Consumer({ fail = false }: { fail?: boolean }) {
        store = usePlayer();

        if (fail) throw new Error('abandon render');

        return null;
      }

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { rerender } = render(
        <Boundary>
          <Player title="Committed title">
            <Consumer />
          </Player>
        </Boundary>
      );
      const committedStore = store;

      rerender(
        <Boundary>
          <Player title="Abandoned title">
            <Consumer fail />
          </Player>
        </Boundary>
      );

      expect(committedStore.title).toBe('Committed title');
      consoleError.mockRestore();
    });

    it('does not derive a locale without an I18nProvider', async () => {
      document.documentElement.lang = 'de';
      const { Player } = createPlayer({ features: [mockSlice] });

      function Locale() {
        const container = useContainer();
        const locale = useLocale();

        return <span>{container ? locale : 'pending'}</span>;
      }

      render(
        <Player>
          <Container>
            <Locale />
          </Container>
        </Player>
      );

      await waitFor(() => {
        expect(screen.queryByText('en')).not.toBeNull();
      });
    });

    it('inherits an explicit I18nProvider', async () => {
      const { Player } = createPlayer({ features: [mockSlice] });

      function Locale() {
        const container = useContainer();
        const locale = useLocale();

        return <span>{container ? locale : 'pending'}</span>;
      }

      render(
        <I18nProvider locale="de">
          <Player>
            <Container>
              <Locale />
            </Container>
          </Player>
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('de')).not.toBeNull();
      });
    });

    it('provides a stable context value across parent re-renders (fix for #1296)', () => {
      const { Player } = createPlayer({ features: [mockSlice] });

      const receivedValues: unknown[] = [];

      function ContextConsumer() {
        const ctx = usePlayerContext();

        receivedValues.push(ctx);
        return null;
      }

      let forceParentRerender!: () => void;

      function Parent() {
        const [, setTick] = useState(0);

        forceParentRerender = () => setTick((t) => t + 1);
        return (
          <Player>
            <ContextConsumer />
          </Player>
        );
      }

      render(<Parent />);

      const valueAfterMount = receivedValues[receivedValues.length - 1];

      act(() => forceParentRerender());
      act(() => forceParentRerender());
      act(() => forceParentRerender());

      const valueAfterRerenders = receivedValues[receivedValues.length - 1];

      expect(valueAfterRerenders).toBe(valueAfterMount);
    });
  });

  describe('usePlayer', () => {
    it('returns selected state with selector', () => {
      const { Player, usePlayer } = createPlayer({ features: [mockSlice] });

      const wrapper = ({ children }: { children: ReactNode }) => <Player>{children}</Player>;

      const { result } = renderHook(() => usePlayer((state: any) => state.volume), { wrapper });

      expect(result.current).toBe(1);
    });

    it('throws outside Player', () => {
      const { usePlayer } = createPlayer({ features: [mockSlice] });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePlayer());
      }).toThrow('usePlayerContext must be used within a Player');

      consoleSpy.mockRestore();
    });
  });

  describe('full integration', () => {
    it('Player → Container → media attach flow', () => {
      const { Player, usePlayer } = createPlayer({ features: [mockSlice] });
      let store!: PlayerStore;
      let setMedia!: (media: HTMLMediaElement | null) => void;

      function Consumer() {
        store = usePlayer();
        setMedia = usePlayerContext().setMedia;
        return null;
      }

      const { rerender, unmount } = render(
        <Player>
          <Consumer />
        </Player>
      );
      const first = document.createElement('video');

      act(() => setMedia(first));
      expect(store.target).toEqual({ media: first, container: null });

      rerender(
        <Player>
          <Container data-testid="container" />
          <Consumer />
        </Player>
      );
      const container = screen.getByTestId('container');

      expect(store.target).toEqual({ media: first, container });

      const second = document.createElement('video');

      act(() => setMedia(second));
      expect(store.target).toEqual({ media: second, container });

      act(() => setMedia(null));
      expect(store.target).toBeNull();

      act(() => setMedia(first));
      expect(store.target).toEqual({ media: first, container });
      unmount();
      expect(store.target).toBeNull();
      expect(store.destroyed).toBe(false);
    });
  });
});
