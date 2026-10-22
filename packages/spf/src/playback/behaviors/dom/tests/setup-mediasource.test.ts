import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals } from '../../../../core/composition/define-behavior';
import { signal } from '../../../../core/signals/primitives';
import { attachMediaSourceAsSourceElement } from '../../../../media/dom/mse/mediasource-setup';
import type { Presentation } from '../../../../media/types';
import { setupAirPlay } from '../airplay';
import { type MediaSourceContext, type MediaSourceState, setupMediaSource } from '../setup-mediasource';

// Mock createMediaSource and attachMediaSource while keeping
// waitForMediaSourceOpen real — the real implementation drives off the
// EventTarget-backed mock MediaSource below, so tests can dispatch
// sourceopen / sourceended to control the wait.
vi.mock('../../../../media/dom/mse/mediasource-setup', async () => {
  const actual = await vi.importActual<typeof import('../../../../media/dom/mse/mediasource-setup')>(
    '../../../../media/dom/mse/mediasource-setup'
  );

  return {
    ...actual,
    createMediaSource: vi.fn(),
    attachMediaSource: vi.fn(),
  };
});

function makeMediaSource({ readyState = 'open' as MediaSource['readyState'] } = {}) {
  const target = new EventTarget();

  return Object.create(MediaSource.prototype, {
    readyState: { value: readyState, writable: true },
    addEventListener: { value: target.addEventListener.bind(target) },
    removeEventListener: { value: target.removeEventListener.bind(target) },
    dispatchEvent: { value: target.dispatchEvent.bind(target) },
  }) as MediaSource;
}

function transitionMediaSource(mediaSource: MediaSource, readyState: MediaSource['readyState'], eventType: string) {
  (mediaSource as MediaSource & { readyState: MediaSource['readyState'] }).readyState = readyState;
  mediaSource.dispatchEvent(new Event(eventType));
}

function makeResolvedPresentation(overrides: Partial<Presentation> = {}): Presentation {
  return {
    url: 'https://example.com/video.m3u8',
    id: 'presentation-1',
    selectionSets: [],
    ...overrides,
  } as Presentation;
}

function makeState(initial: MediaSourceState & { loadingSuspended?: boolean } = {}) {
  return {
    presentation: signal<MediaSourceState['presentation']>(initial.presentation),
    // Observed, never declared — present here to simulate a composition
    // where a feature behavior (e.g. setupAirPlay) declares the key.
    loadingSuspended: signal<boolean | undefined>(initial.loadingSuspended),
  };
}

/** A media element whose `currentTime`/`paused` tests can stage for snapshot assertions. */
function makeVideo(currentTime = 0, opts: { paused?: boolean } = {}): HTMLMediaElement {
  const video = document.createElement('video');

  Object.defineProperty(video, 'currentTime', { value: currentTime, writable: true });
  Object.defineProperty(video, 'paused', { value: opts.paused ?? true, writable: true });
  return video;
}

function makeContext(initial: MediaSourceContext = {}): ContextSignals<MediaSourceContext> {
  return {
    mediaElement: signal<HTMLMediaElement | undefined>(initial.mediaElement),
    mediaSource: signal<MediaSource | undefined>(initial.mediaSource),
  };
}

function setupSetupMediaSource(
  initialState: MediaSourceState & { loadingSuspended?: boolean } = {},
  initialContext: MediaSourceContext = {}
) {
  const state = makeState(initialState);
  const context = makeContext(initialContext);
  const reactor = setupMediaSource.setup({ state, context });

  return { state, context, reactor };
}

describe('setupMediaSource', () => {
  beforeEach(async () => {
    // resetAllMocks (not clearAllMocks) — clears the mockImplementationOnce
    // queue too, so unconsumed `Once` entries from a prior test don't leak
    // into this one.
    vi.resetAllMocks();
    const { createMediaSource, attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    // Default mock behavior — open MediaSource, no-op detach. Individual
    // tests override as needed.
    vi.mocked(createMediaSource).mockImplementation(() => makeMediaSource());
    vi.mocked(attachMediaSource).mockImplementation(() => ({ url: 'blob:mock', detach: vi.fn() }));
  });

  it('creates and attaches MediaSource when mediaElement and resolved presentation exist', async () => {
    const { createMediaSource, attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const { state, context, reactor } = setupSetupMediaSource();
    const mediaElement = {} as HTMLMediaElement;

    context.mediaElement.set(mediaElement);
    state.presentation.set(makeResolvedPresentation());

    await vi.waitFor(() => {
      expect(createMediaSource).toHaveBeenCalledWith({ preferManaged: true });
      expect(attachMediaSource).toHaveBeenCalledTimes(1);
      expect(vi.mocked(attachMediaSource).mock.calls[0]![1]).toBe(mediaElement);
    });

    reactor.destroy();
  });

  it('publishes context.mediaSource only after sourceopen', async () => {
    const { createMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const closedMediaSource = makeMediaSource({ readyState: 'closed' });

    vi.mocked(createMediaSource).mockImplementation(() => closedMediaSource);

    const { state, context, reactor } = setupSetupMediaSource();

    context.mediaElement.set({} as HTMLMediaElement);
    state.presentation.set(makeResolvedPresentation());

    // Behavior is awaiting sourceopen — context.mediaSource not yet set.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(context.mediaSource.get()).toBeUndefined();

    // MediaSource opens — publish proceeds.
    transitionMediaSource(closedMediaSource, 'open', 'sourceopen');

    await vi.waitFor(() => {
      expect(context.mediaSource.get()).toBe(closedMediaSource);
    });

    reactor.destroy();
  });

  it('does not publish if MediaSource transitions to ended before opening', async () => {
    const { createMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const closedMediaSource = makeMediaSource({ readyState: 'closed' });

    vi.mocked(createMediaSource).mockImplementation(() => closedMediaSource);

    const { state, context, reactor } = setupSetupMediaSource();

    context.mediaElement.set({} as HTMLMediaElement);
    state.presentation.set(makeResolvedPresentation());

    // Race: readyState jumps straight to 'ended' (e.g. premature endOfStream).
    transitionMediaSource(closedMediaSource, 'ended', 'sourceended');

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(context.mediaSource.get()).toBeUndefined();

    reactor.destroy();
  });

  it('does not create MediaSource if mediaElement is missing', async () => {
    const { createMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const { state, reactor } = setupSetupMediaSource();

    state.presentation.set(makeResolvedPresentation());

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createMediaSource).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('does not create MediaSource if presentation is unresolved', async () => {
    const { createMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const { state, context, reactor } = setupSetupMediaSource();

    context.mediaElement.set({} as HTMLMediaElement);
    // Unresolved presentation — has url but no id / selectionSets.
    state.presentation.set({ url: 'https://example.com/video.m3u8' });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createMediaSource).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('detaches and clears context.mediaSource on source unload', async () => {
    const { createMediaSource, attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const mockMediaSource = makeMediaSource();
    const detach = vi.fn();

    vi.mocked(createMediaSource).mockImplementation(() => mockMediaSource);
    vi.mocked(attachMediaSource).mockImplementation(() => ({ url: 'blob:mock', detach }));

    const { state, context, reactor } = setupSetupMediaSource();

    context.mediaElement.set({} as HTMLMediaElement);
    state.presentation.set(makeResolvedPresentation());

    await vi.waitFor(() => {
      expect(context.mediaSource.get()).toBe(mockMediaSource);
    });

    // Source unload — clears presentation.
    state.presentation.set(undefined);

    await vi.waitFor(() => {
      expect(detach).toHaveBeenCalledTimes(1);
      expect(context.mediaSource.get()).toBeUndefined();
    });

    reactor.destroy();
  });

  it('detaches old MediaSource and attaches new one on source replace', async () => {
    const { createMediaSource, attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const firstMediaSource = makeMediaSource();
    const secondMediaSource = makeMediaSource();
    const firstDetach = vi.fn();
    const secondDetach = vi.fn();

    vi.mocked(createMediaSource)
      .mockImplementationOnce(() => firstMediaSource)
      .mockImplementationOnce(() => secondMediaSource);
    vi.mocked(attachMediaSource)
      .mockImplementationOnce(() => ({ url: 'blob:1', detach: firstDetach }))
      .mockImplementationOnce(() => ({ url: 'blob:2', detach: secondDetach }));

    const { state, context, reactor } = setupSetupMediaSource();

    context.mediaElement.set({} as HTMLMediaElement);
    state.presentation.set(makeResolvedPresentation({ url: 'https://example.com/a.m3u8' }));

    await vi.waitFor(() => {
      expect(context.mediaSource.get()).toBe(firstMediaSource);
    });

    // Source replace: resolver routes presentation back through unresolved
    // on URL change, so `setupMediaSource` sees the unresolved intermediate
    // and exits its positive state (firing detach + clear), then re-enters
    // when the new resolved presentation arrives. The two `.set()` calls
    // need to be observed across separate microtask flushes — back-to-back
    // synchronous writes get batched and the watcher only sees the final
    // state, collapsing through the unresolved intermediate.
    state.presentation.set({ url: 'https://example.com/b.m3u8' });
    await vi.waitFor(() => {
      expect(firstDetach).toHaveBeenCalledTimes(1);
      expect(context.mediaSource.get()).toBeUndefined();
    });

    state.presentation.set(makeResolvedPresentation({ url: 'https://example.com/b.m3u8' }));
    await vi.waitFor(() => {
      expect(context.mediaSource.get()).toBe(secondMediaSource);
    });

    reactor.destroy();
  });

  it('detaches and clears context.mediaSource on destroy while attached', async () => {
    const { createMediaSource, attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const mockMediaSource = makeMediaSource();
    const detach = vi.fn();

    vi.mocked(createMediaSource).mockImplementation(() => mockMediaSource);
    vi.mocked(attachMediaSource).mockImplementation(() => ({ url: 'blob:mock', detach }));

    const { state, context, reactor } = setupSetupMediaSource();

    context.mediaElement.set({} as HTMLMediaElement);
    state.presentation.set(makeResolvedPresentation());

    await vi.waitFor(() => {
      expect(context.mediaSource.get()).toBe(mockMediaSource);
    });

    reactor.destroy();

    expect(detach).toHaveBeenCalledTimes(1);
    expect(context.mediaSource.get()).toBeUndefined();
  });

  it('does not re-attach on internal presentation updates', async () => {
    const { createMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    const { state, context, reactor } = setupSetupMediaSource();

    context.mediaElement.set({} as HTMLMediaElement);
    state.presentation.set(makeResolvedPresentation({ duration: 60 }));

    await vi.waitFor(() => {
      expect(createMediaSource).toHaveBeenCalledTimes(1);
    });

    // Internal update — same URL, presentation stays resolved (different
    // object identity, but state machine derives the same state name).
    state.presentation.set(makeResolvedPresentation({ duration: 120 }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createMediaSource).toHaveBeenCalledTimes(1);

    reactor.destroy();
  });

  it('uses the config-supplied attach strategy over the default', async () => {
    const customDetach = vi.fn();
    const customAttach = vi.fn(() => ({ url: 'blob:custom', detach: customDetach }));

    const state = makeState();
    const context = makeContext();
    const reactor = setupMediaSource.setup({ state, context, config: { attachMediaSource: customAttach } });

    context.mediaElement.set(makeVideo());
    state.presentation.set(makeResolvedPresentation());

    await vi.waitFor(() => expect(customAttach).toHaveBeenCalledTimes(1));
    const { attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

    expect(attachMediaSource).not.toHaveBeenCalled();

    reactor.destroy();
    expect(customDetach).toHaveBeenCalled();
  });

  // Regression: `detach`'s reset `load()` used to run synchronously, before
  // `setupAirPlay`'s effect could drop its native-HLS fallback `<source>`.
  // Resource selection then picked that fallback and started native HLS of the
  // manifest being torn down (WebKit only — the fallback exists nowhere else).
  describe('teardown alongside a sibling <source> owner', () => {
    const AIRPLAY_KEY = 'WebKitPlaybackTargetAvailabilityEvent';

    function composeWithAirPlay() {
      (globalThis as unknown as Record<string, unknown>)[AIRPLAY_KEY] = class {};

      const state = {
        presentation: signal<MediaSourceState['presentation']>(undefined),
        disableRemotePlayback: signal<boolean | undefined>(undefined),
        loadingSuspended: signal<boolean | undefined>(undefined),
        startPosition: signal<number | undefined>(undefined),
      };
      const context = makeContext();

      const mediaSourceReactor = setupMediaSource.setup({
        state,
        context,
        config: { attachMediaSource: attachMediaSourceAsSourceElement },
      });
      const airPlayReactor = setupAirPlay.setup({ state, context });

      // Mirrors `createComposition`'s destroy: cleanups are invoked in
      // composition order (setupMediaSource first, since it is composed first
      // in both HLS engines) and only then awaited together.
      const destroy = async () => {
        const results = [mediaSourceReactor.destroy(), airPlayReactor.destroy()];

        await Promise.all(results);
        delete (globalThis as unknown as Record<string, unknown>)[AIRPLAY_KEY];
      };

      return { state, context, destroy };
    }

    interface WebKitVideoLike extends HTMLVideoElement {
      webkitCurrentPlaybackTargetIsWireless: boolean;
    }

    /** A `<video>` WebKit's AirPlay probe recognizes (`'…IsWireless' in media`). */
    function makeAirPlayVideo(): WebKitVideoLike {
      const video = document.createElement('video') as WebKitVideoLike;

      video.webkitCurrentPlaybackTargetIsWireless = false;
      return video;
    }

    /**
     * Composes both behaviors, attaches, and arms detach's reset: waits for both `<source>` children, stages the
     * element as committed to the MSE object URL (real resource selection is async), and records whether the fallback
     * was still in the DOM when the reset `load()` ran.
     */
    async function arrangeAttached() {
      const { createMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

      vi.mocked(createMediaSource).mockImplementation(() => new MediaSource());

      const { state, context, destroy } = composeWithAirPlay();
      const mediaElement = makeAirPlayVideo();

      context.mediaElement.set(mediaElement);
      state.presentation.set(makeResolvedPresentation());

      // Both sources present: the MSE attachment plus AirPlay's fallback.
      await vi.waitFor(() => {
        expect(mediaElement.querySelector('source[type="video/mp4"]')).not.toBeNull();
        expect(mediaElement.querySelector('source[type="application/x-mpegURL"]')).not.toBeNull();
      });

      const mseUrl = mediaElement.querySelector<HTMLSourceElement>('source[type="video/mp4"]')!.src;

      Object.defineProperty(mediaElement, 'currentSrc', { value: mseUrl, configurable: true });

      const seen: { fallbackPresentAtReset?: boolean } = {};
      const load = vi.spyOn(mediaElement, 'load').mockImplementation(() => {
        seen.fallbackPresentAtReset = !!mediaElement.querySelector('source[type="application/x-mpegURL"]');
      });

      return { state, destroy, load, seen };
    }

    it('does not run resource selection while the AirPlay fallback is still in the DOM', async () => {
      const { state, destroy, load, seen } = await arrangeAttached();

      // Source unload with the MediaSource still open. `setupAirPlay` never
      // leaves `'airplay-capable'` here, so only its effect can drop the
      // fallback — the reset has to be queued behind that pass.
      state.presentation.set(undefined);

      await vi.waitFor(() => expect(load).toHaveBeenCalled());
      expect(seen.fallbackPresentAtReset).toBe(false);

      await destroy();
    });

    it('does not run resource selection on destroy either', async () => {
      const { destroy, load, seen } = await arrangeAttached();

      // Behavior destroy, in composition order. `setupMediaSource` tears down
      // first, so its deferred reset must still land behind whichever removes
      // the fallback — `setupAirPlay`'s own state-exit cleanup or the effect
      // pass queued by the slot clear, both of which trail the detach.
      await destroy();

      await vi.waitFor(() => expect(load).toHaveBeenCalled());
      expect(seen.fallbackPresentAtReset).toBe(false);
    });
  });

  describe('sourceclose recovery', () => {
    it('recycles with a fresh MediaSource when the UA closes the attached one', async () => {
      const { createMediaSource, attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

      const first = makeMediaSource();
      const second = makeMediaSource();
      const firstDetach = vi.fn();
      const secondDetach = vi.fn();

      vi.mocked(createMediaSource)
        .mockImplementationOnce(() => first)
        .mockImplementationOnce(() => second);
      vi.mocked(attachMediaSource)
        .mockImplementationOnce(() => ({ url: 'blob:first', detach: firstDetach }))
        .mockImplementationOnce(() => ({ url: 'blob:second', detach: secondDetach }));

      const { state, context, reactor } = setupSetupMediaSource();

      context.mediaElement.set(makeVideo());
      state.presentation.set(makeResolvedPresentation());
      await vi.waitFor(() => expect(context.mediaSource.get()).toBe(first));

      // Safari closes the MMS out from under the engine (AirPlay handoff
      // return, eviction). A closed MediaSource can never reopen — the
      // behavior must detach it and rebuild a fresh one for the same source.
      transitionMediaSource(first, 'closed', 'sourceclose');

      await vi.waitFor(() => {
        // Called (possibly twice — the shared teardown re-runs harmlessly on
        // the state exit that follows the listener).
        expect(firstDetach).toHaveBeenCalled();
        expect(context.mediaSource.get()).toBe(second);
      });

      reactor.destroy();
    });

    it('defers a pending rebuild while loading is suspended, rebuilds on release', async () => {
      const { createMediaSource, attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');

      const first = makeMediaSource();
      const second = makeMediaSource();
      const firstDetach = vi.fn();

      vi.mocked(createMediaSource)
        .mockImplementationOnce(() => first)
        .mockImplementationOnce(() => second);
      vi.mocked(attachMediaSource)
        .mockImplementationOnce(() => ({ url: 'blob:first', detach: firstDetach }))
        .mockImplementationOnce(() => ({ url: 'blob:second', detach: vi.fn() }));

      const { state, context, reactor } = setupSetupMediaSource();

      context.mediaElement.set(makeVideo(12, { paused: false }));
      state.presentation.set(makeResolvedPresentation());
      await vi.waitFor(() => expect(context.mediaSource.get()).toBe(first));

      // AirPlay engaged: setupAirPlay holds `loadingSuspended`; Safari closes
      // the MMS. The corpse detaches right away (the ordinary cascade stops
      // the MSE pipeline), but no rebuild may run while loading is suspended:
      // attaching would load() out from under the receiver.
      state.loadingSuspended.set(true);
      transitionMediaSource(first, 'closed', 'sourceclose');

      await vi.waitFor(() => {
        expect(firstDetach).toHaveBeenCalled();
        expect(context.mediaSource.get()).toBeUndefined();
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(createMediaSource).toHaveBeenCalledTimes(1);

      // Suspension lifts (session ended): the pending rebuild proceeds.
      state.loadingSuspended.set(false);
      await vi.waitFor(() => expect(context.mediaSource.get()).toBe(second));

      reactor.destroy();
    });

    it('never tears down an existing attachment on suspension alone', async () => {
      const { attachMediaSource } = await import('../../../../media/dom/mse/mediasource-setup');
      const detach = vi.fn();

      vi.mocked(attachMediaSource).mockImplementation(() => ({ url: 'blob:mock', detach }));

      const { state, context, reactor } = setupSetupMediaSource();

      context.mediaElement.set(makeVideo());
      state.presentation.set(makeResolvedPresentation());
      await vi.waitFor(() => expect(context.mediaSource.get()).toBeDefined());
      const first = context.mediaSource.get();

      // Suspension rises before the UA closes anything (the engage's rising
      // edge leads `sourceclose`). An existing attachment must survive it —
      // detaching here would load()-reset the element mid-handoff.
      state.loadingSuspended.set(true);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(detach).not.toHaveBeenCalled();
      expect(context.mediaSource.get()).toBe(first);

      reactor.destroy();
    });
  });
});
