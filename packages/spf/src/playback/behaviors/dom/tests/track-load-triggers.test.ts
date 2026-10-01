import { describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/create-composition';
import { signal } from '../../../../core/signals/primitives';
import { type LoadTriggersContext, type LoadTriggersState, trackLoadTriggers } from '../track-load-triggers';

function makeState(initial: LoadTriggersState = {}): StateSignals<LoadTriggersState> {
  return {
    loadActivated: signal<boolean | undefined>(initial.loadActivated),
    presentation: signal<LoadTriggersState['presentation']>(initial.presentation),
  };
}

function makeContext(initial: LoadTriggersContext = {}): ContextSignals<LoadTriggersContext> {
  return { mediaElement: signal<HTMLMediaElement | undefined>(initial.mediaElement) };
}

function setupTrackLoadTriggers(initialState: LoadTriggersState = {}, initialContext: LoadTriggersContext = {}) {
  const state = makeState(initialState);
  const context = makeContext(initialContext);
  const reactor = trackLoadTriggers.setup({ state, context });

  return { state, context, reactor };
}

/** Creates a video element with controllable `paused`, `seeking`, and `autoplay` state. */
function makeMediaElement({
  paused = true,
  seeking = false,
  autoplay = false,
}: {
  paused?: boolean;
  seeking?: boolean;
  autoplay?: boolean;
} = {}) {
  const el = document.createElement('video');

  el.autoplay = autoplay;
  let pausedFlag = paused;
  let seekingFlag = seeking;

  Object.defineProperty(el, 'paused', { get: () => pausedFlag, configurable: true });
  Object.defineProperty(el, 'seeking', { get: () => seekingFlag, configurable: true });
  return {
    el,
    play() {
      pausedFlag = false;
      el.dispatchEvent(new Event('play'));
    },
    pause() {
      pausedFlag = true;
    },
    seek() {
      seekingFlag = true;
      el.dispatchEvent(new Event('seeking'));
    },
    endSeek() {
      seekingFlag = false;
    },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('trackLoadTriggers', () => {
  it('sets loadActivated to true when mediaElement fires seeking event', async () => {
    const { el, seek } = makeMediaElement();
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    seek();
    await flush();

    expect(state.loadActivated.get()).toBe(true);
    reactor.destroy();
  });

  it('sets loadActivated to true immediately if element is already playing on entry', async () => {
    const { el } = makeMediaElement({ paused: false });
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    await flush();

    expect(state.loadActivated.get()).toBe(true);
    reactor.destroy();
  });

  it('sets loadActivated to true immediately if element is mid-seek on entry', async () => {
    const { el } = makeMediaElement({ paused: true, seeking: true });
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    await flush();

    expect(state.loadActivated.get()).toBe(true);
    reactor.destroy();
  });

  it('sets loadActivated to true immediately if element has autoplay on entry', async () => {
    const { el } = makeMediaElement({ autoplay: true });
    const addEventListenerSpy = vi.spyOn(el, 'addEventListener');
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    await flush();

    // Autoplay commits to loading up front (it can't wait for a `play` event
    // that preload='none' would never let fire), so it activates on entry and
    // never attaches play/seeking listeners.
    expect(state.loadActivated.get()).toBe(true);
    expect(addEventListenerSpy.mock.calls.some(([type]) => type === 'play' || type === 'seeking')).toBe(false);
    reactor.destroy();
  });

  it('preserves pre-existing true write (adapter wrote before setup)', async () => {
    const { el } = makeMediaElement();
    const addEventListenerSpy = vi.spyOn(el, 'addEventListener');
    const { state, reactor } = setupTrackLoadTriggers(
      { loadActivated: true, presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    await flush();

    expect(state.loadActivated.get()).toBe(true);
    // 'monitoring' state never entered — slot is true, deriveState goes
    // directly to 'load-active', so play/seeking listeners aren't attached.
    expect(addEventListenerSpy.mock.calls.some(([type]) => type === 'play' || type === 'seeking')).toBe(false);
    reactor.destroy();
  });

  it('stays true on subsequent pause/play cycles within the same source', async () => {
    const { el, play, pause } = makeMediaElement();
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    pause();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    reactor.destroy();
  });

  it('resets loadActivated to false on direct URL identity change (url_a → url_b)', async () => {
    const { el, play } = makeMediaElement();
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream1.m3u8' } },
      { mediaElement: el }
    );

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    // Direct swap — no `undefined` intermediate. The 'load-active' effects
    // re-fires on URL identity change → cleanup resets slot to false →
    // deriveState returns 'monitoring' → state transitions and re-attaches.
    state.presentation.set({ url: 'http://example.com/stream2.m3u8' });
    await flush();

    expect(state.loadActivated.get()).toBe(false);
    reactor.destroy();
  });

  it('resets loadActivated to false on URL change through undefined', async () => {
    const { el, play, pause } = makeMediaElement();
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream1.m3u8' } },
      { mediaElement: el }
    );

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    pause();
    state.presentation.set(undefined);
    await flush();
    expect(state.loadActivated.get()).toBe(false);

    state.presentation.set({ url: 'http://example.com/stream2.m3u8' });
    await flush();
    expect(state.loadActivated.get()).toBe(false);

    reactor.destroy();
  });

  it('resets loadActivated to false on direct media element identity change', async () => {
    const { el, play } = makeMediaElement();
    const { state, context, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    // Direct swap — no `undefined` intermediate. Same identity-change
    // mechanism as URL swap above.
    context.mediaElement.set(document.createElement('video'));
    await flush();

    expect(state.loadActivated.get()).toBe(false);
    reactor.destroy();
  });

  it('resets loadActivated to false when element is removed', async () => {
    const { el, play } = makeMediaElement();
    const { state, context, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    context.mediaElement.set(undefined);
    await flush();

    expect(state.loadActivated.get()).toBe(false);
    reactor.destroy();
  });

  it('resets loadActivated to false when URL is cleared', async () => {
    const { el, play } = makeMediaElement();
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    state.presentation.set(undefined);
    await flush();

    expect(state.loadActivated.get()).toBe(false);
    reactor.destroy();
  });

  it('re-attaches listeners on element identity change in monitoring state', async () => {
    const { el: el1 } = makeMediaElement();
    const { el: el2, play: play2 } = makeMediaElement();
    const { state, context, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el1 }
    );

    // Stay in 'monitoring' — no trigger fired yet on el1.
    await flush();
    expect(state.loadActivated.get()).toBeFalsy();

    // Swap to el2 while still in 'monitoring' — effects re-fires, listener
    // detaches from el1 and re-attaches to el2.
    context.mediaElement.set(el2);
    await flush();

    play2();
    await flush();

    expect(state.loadActivated.get()).toBe(true);
    reactor.destroy();
  });

  it('does not re-attach listener on unrelated context changes', async () => {
    const { el } = makeMediaElement();
    const addEventListenerSpy = vi.spyOn(el, 'addEventListener');

    const state = makeState({ presentation: { url: 'http://example.com/stream.m3u8' } });
    const context: ContextSignals<LoadTriggersContext> & { videoBuffer: ReturnType<typeof signal<unknown>> } = {
      mediaElement: signal<HTMLMediaElement | undefined>(el),
      videoBuffer: signal<unknown>(undefined),
    };
    const reactor = trackLoadTriggers.setup({ state, context });

    await flush();
    const callsBefore = addEventListenerSpy.mock.calls.length;

    context.videoBuffer.set({});
    await flush();

    expect(addEventListenerSpy.mock.calls.length).toBe(callsBefore);
    reactor.destroy();
  });

  it('stops tracking after destroy', async () => {
    const { el, play } = makeMediaElement();
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream1.m3u8' } },
      { mediaElement: el }
    );

    reactor.destroy();

    play();
    await flush();

    expect(state.loadActivated.get()).toBeFalsy();
  });

  it('resets loadActivated to false on destroy when slot was true', async () => {
    const { el, play } = makeMediaElement();
    const { state, reactor } = setupTrackLoadTriggers(
      { presentation: { url: 'http://example.com/stream.m3u8' } },
      { mediaElement: el }
    );

    play();
    await flush();
    expect(state.loadActivated.get()).toBe(true);

    reactor.destroy();
    expect(state.loadActivated.get()).toBe(false);
  });
});
