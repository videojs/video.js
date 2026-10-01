import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { StateSignals } from '../../../core/composition/create-composition';
import { signal } from '../../../core/signals/primitives';
import { parseMultivariantPlaylist } from '../../../media/hls/parse-multivariant';
import type { MaybeResolvedPresentation, Presentation } from '../../../media/types';
import { type PresentationState, resolvePresentation } from '../resolve-presentation';

function makeState(initial: PresentationState = {}): StateSignals<PresentationState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    preload: signal<'auto' | 'metadata' | 'none' | undefined>(initial.preload),
    loadActivated: signal<boolean | undefined>(initial.loadActivated),
  };
}

const baseConfig = { parsePresentation: parseMultivariantPlaylist };

describe('resolvePresentation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves unresolved presentation', async () => {
    const state = makeState({ preload: 'auto' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000
variant2.m3u8`)
    );

    const reactor = resolvePresentation.setup({ state, config: baseConfig });

    state.presentation.set({ url: 'http://example.com/playlist.m3u8' });

    await vi.waitFor(() => {
      const pres = state.presentation.get();

      expect(pres).toBeDefined();
      expect(pres).toHaveProperty('id');
      expect(pres).toHaveProperty('selectionSets');
    });

    const resolved = state.presentation.get() as Presentation;

    expect(resolved.url).toBe('http://example.com/playlist.m3u8');
    expect(resolved.selectionSets).toBeDefined();
    expect(resolved.selectionSets.length).toBeGreaterThan(0);

    const videoSet = resolved.selectionSets.find((s) => s.type === 'video');

    expect(videoSet).toBeDefined();
    expect(videoSet!.switchingSets).toBeDefined();
    expect(videoSet!.switchingSets[0]?.tracks.length).toBeGreaterThan(0);

    reactor.destroy();
  });

  it('fetches once after an earlier reactor is destroyed', async () => {
    const body = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000\nvariant1.m3u8';
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(body));
    const first = resolvePresentation.setup({ state: makeState({ preload: 'auto' }), config: baseConfig });
    const state = makeState({ preload: 'auto' });
    const reactor = resolvePresentation.setup({ state, config: baseConfig });

    // Disposing earlier effects reorders the shared watcher's pending queue.
    first.destroy();
    state.presentation.set({ url: 'http://example.com/playlist.m3u8' });

    await vi.waitFor(() => expect(state.presentation.get()).toHaveProperty('id'));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(fetch).toHaveBeenCalledTimes(1);
    reactor.destroy();
  });

  it('does not trigger resolution when other state fields change', async () => {
    // The new discrete-signals shape eliminates the "any unrelated field
    // change re-runs the effect" footgun by construction — each derived
    // computed only tracks the signals it reads. This test is preserved as
    // a behavioural assertion: only `presentation` triggers fetch.
    const state = makeState({ preload: 'auto' });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
    );

    const reactor = resolvePresentation.setup({ state, config: baseConfig });

    // No URL yet — flipping preload shouldn't trigger fetch.
    state.preload.set('metadata');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchSpy).not.toHaveBeenCalled();

    state.presentation.set({ url: 'http://example.com/playlist.m3u8' });

    await vi.waitFor(() => {
      expect(state.presentation.get()).toHaveProperty('id');
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    fetchSpy.mockClear();

    // Flipping preload after resolution shouldn't re-fetch.
    state.preload.set('auto');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchSpy).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('resolves presentation initialized as unresolved', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
    );

    const state = makeState({
      presentation: { url: 'http://example.com/initial.m3u8' },
      preload: 'auto',
    });

    const reactor = resolvePresentation.setup({ state, config: baseConfig });

    await vi.waitFor(() => {
      const pres = state.presentation.get();

      expect(pres).toHaveProperty('id');
      expect(pres).toHaveProperty('selectionSets');
    });

    const resolved = state.presentation.get() as Presentation;

    expect(resolved.url).toBe('http://example.com/initial.m3u8');
    expect(resolved.selectionSets).toBeDefined();

    reactor.destroy();
  });

  it('does not re-resolve presentation initialized as resolved', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const resolvedPresentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/resolved.m3u8',
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'switching-1',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: 'track-1',
                  url: 'http://example.com/variant1.m3u8',
                  bandwidth: 1000000,
                  mimeType: 'video/mp4',
                  codecs: [],
                },
              ],
            },
          ],
        },
      ],
      startTime: 0,
    };

    const state = makeState({ presentation: resolvedPresentation, preload: 'auto' });

    const reactor = resolvePresentation.setup({ state, config: baseConfig });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.presentation.get()).toBe(resolvedPresentation);

    reactor.destroy();
  });

  it('aborts an unresolved source on replacement and ignores its late response', async () => {
    let release!: (response: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const manifest = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`;
    // Let the old request fulfill after abort to exercise the stale-result guard.
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockReturnValueOnce(pendingResponse)
      .mockResolvedValue(new Response(manifest));
    const state = makeState({
      presentation: { url: 'http://example.com/first.m3u8' },
      preload: 'auto',
    });
    const reactor = resolvePresentation.setup({ state, config: baseConfig });

    try {
      // SAFETY: fetchResolvable always passes a Request to fetch.
      const request = fetchSpy.mock.calls[0]![0] as Request;

      state.presentation.set({ url: 'http://example.com/second.m3u8' });
      await new Promise((resolve) => setTimeout(resolve, 0));
      const abortedOnReplace = request.signal.aborted;

      release(new Response(manifest));
      await vi.waitFor(() => expect(state.presentation.get()).toHaveProperty('id'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect.soft(state.presentation.get()?.url).toBe('http://example.com/second.m3u8');
      expect.soft(abortedOnReplace).toBe(true);
      // SAFETY: fetchResolvable always passes a Request to fetch.
      expect(fetchSpy.mock.calls.map(([input]) => (input as Request).url)).toEqual([
        'http://example.com/first.m3u8',
        'http://example.com/second.m3u8',
      ]);
    } finally {
      reactor.destroy();
    }
  });

  describe('preload policy', () => {
    it('resolves when preload is "metadata"', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
      );

      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
        preload: 'metadata',
      });

      const reactor = resolvePresentation.setup({ state, config: baseConfig });

      await vi.waitFor(() => {
        expect(state.presentation.get()).toHaveProperty('id');
      });

      reactor.destroy();
    });

    it('does not resolve when preload is "none"', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
        preload: 'none',
      });

      const reactor = resolvePresentation.setup({ state, config: baseConfig });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchSpy).not.toHaveBeenCalled();
      // Presentation slot still holds the unresolved input (URL only, no `id`).
      expect(state.presentation.get()?.url).toBe('http://example.com/playlist.m3u8');
      expect(state.presentation.get()).not.toHaveProperty('id');

      reactor.destroy();
    });

    it('resolves when preload is undefined (falls back to defaultPreload "metadata")', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
      );

      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
      });

      const reactor = resolvePresentation.setup({ state, config: baseConfig });

      await vi.waitFor(() => {
        expect(state.presentation.get()).toHaveProperty('id');
      });

      reactor.destroy();
    });
  });

  describe('config.defaultPreload', () => {
    it('does not resolve when state.preload is undefined and defaultPreload is "none"', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
      });

      const reactor = resolvePresentation.setup({ state, config: { ...baseConfig, defaultPreload: 'none' } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(state.presentation.get()?.url).toBe('http://example.com/playlist.m3u8');
      expect(state.presentation.get()).not.toHaveProperty('id');

      reactor.destroy();
    });

    it('resolves when state.preload is undefined and defaultPreload is "auto"', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
      );

      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
      });

      const reactor = resolvePresentation.setup({ state, config: { ...baseConfig, defaultPreload: 'auto' } });

      await vi.waitFor(() => {
        expect(state.presentation.get()).toHaveProperty('id');
      });

      reactor.destroy();
    });

    it('explicit state.preload overrides defaultPreload', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // state.preload explicitly 'none' even though defaultPreload would allow.
      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
        preload: 'none',
      });

      const reactor = resolvePresentation.setup({ state, config: { ...baseConfig, defaultPreload: 'auto' } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchSpy).not.toHaveBeenCalled();

      reactor.destroy();
    });
  });

  describe('loadActivated resolution', () => {
    it('resolves when loadActivated is set to true with preload "none"', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
      );

      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
        preload: 'none',
      });

      const reactor = resolvePresentation.setup({ state, config: baseConfig });

      expect(fetchSpy).not.toHaveBeenCalled();

      state.loadActivated.set(true);

      await vi.waitFor(() => {
        expect(state.presentation.get()).toHaveProperty('id');
      });

      expect(fetchSpy).toHaveBeenCalledOnce();

      reactor.destroy();
    });
  });

  describe('deduplication', () => {
    it('does not trigger multiple fetches for same presentation', async () => {
      let release!: (response: Response) => void;
      const pending = new Promise<Response>((resolve) => {
        release = resolve;
      });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(pending);
      const state = makeState({
        presentation: { url: 'http://example.com/playlist.m3u8' },
        preload: 'auto',
      });
      const reactor = resolvePresentation.setup({ state, config: baseConfig });

      try {
        expect(fetchSpy).toHaveBeenCalledOnce();
        state.preload.set('metadata');
        await Promise.resolve();
        state.loadActivated.set(true);
        await Promise.resolve();
        expect(fetchSpy).toHaveBeenCalledOnce();

        release(
          new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
        );
        await vi.waitFor(() => expect(state.presentation.get()).toHaveProperty('id'));
        expect(fetchSpy).toHaveBeenCalledOnce();
      } finally {
        reactor.destroy();
        release(new Response(''));
      }
    });

    it('allows resolving different presentations sequentially', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () =>
          new Response(`#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1000000
variant1.m3u8`)
      );

      const state = makeState({
        presentation: { url: 'http://example.com/first.m3u8' },
        preload: 'auto',
      });

      const reactor = resolvePresentation.setup({ state, config: baseConfig });

      await vi.waitFor(() => {
        expect(state.presentation.get()).toHaveProperty('id');
      });

      expect(fetchSpy).toHaveBeenCalledOnce();

      state.presentation.set({ url: 'http://example.com/second.m3u8' });

      await vi.waitFor(() => {
        const pres = state.presentation.get() as Presentation;

        expect(pres).toHaveProperty('id');
        expect(pres.url).toBe('http://example.com/second.m3u8');
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);

      reactor.destroy();
    });
  });
});
