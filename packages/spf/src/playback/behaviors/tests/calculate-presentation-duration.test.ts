import { describe, expect, it, vi } from 'vite-plus/test';

import type { StateSignals } from '../../../core/composition/create-composition';
import { signal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation, Presentation } from '../../../media/types';
import {
  calculatePresentationDuration,
  type PresentationDurationResolver,
  type PresentationDurationState,
} from '../calculate-presentation-duration';

function makeState(initial: PresentationDurationState = {}): StateSignals<PresentationDurationState> {
  // Tests stand up signals for all three state slots — though
  // calculatePresentationDuration only declares `presentation` in its
  // stateKeys (the other two are read defensively as optional fields
  // contributed by other behaviors at composition time). The tests
  // exercise the defensive read path by providing the optional signals
  // directly.
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    selectedVideoTrackId: signal<string | undefined>(initial.selectedVideoTrackId),
    selectedAudioTrackId: signal<string | undefined>(initial.selectedAudioTrackId),
  };
}

function setupDuration(
  state: StateSignals<PresentationDurationState>,
  resolveDuration: PresentationDurationResolver
): () => void {
  // calculatePresentationDuration uses a manual Behavior<> literal, so the
  // public setup signature requires `context` even though the behavior
  // doesn't consume it. Cleanup widens to BehaviorCleanup; cast for
  // callable ergonomics.
  return calculatePresentationDuration.setup({
    state,
    context: {},
    config: { resolveDuration },
  }) as () => void;
}

const mockPresentation = (overrides: Partial<Presentation> = {}): Presentation =>
  ({
    id: 'pres-1',
    url: 'http://example.com/playlist.m3u8',
    startTime: 0,
    selectionSets: [],
    ...overrides,
  }) as Presentation;

describe('calculatePresentationDuration', () => {
  it('writes the duration the resolver returns', async () => {
    const state = makeState();
    const resolveDuration: PresentationDurationResolver = () => 120.5;

    const cleanup = setupDuration(state, resolveDuration);

    state.presentation.set(mockPresentation());

    await vi.waitFor(() => {
      expect(state.presentation.get()?.duration).toBe(120.5);
    });

    cleanup();
  });

  it('writes Infinity for a live resolver (MSE spec)', async () => {
    const state = makeState();
    const resolveDuration: PresentationDurationResolver = () => Number.POSITIVE_INFINITY;

    const cleanup = setupDuration(state, resolveDuration);

    state.presentation.set(mockPresentation());

    await vi.waitFor(() => {
      expect(state.presentation.get()?.duration).toBe(Number.POSITIVE_INFINITY);
    });

    cleanup();
  });

  it('passes the snapshotted state to the resolver', async () => {
    const state = makeState();
    const resolveDuration = vi.fn<PresentationDurationResolver>(() => 60);

    const cleanup = setupDuration(state, resolveDuration);

    state.presentation.set(mockPresentation());
    state.selectedVideoTrackId.set('video-1');
    state.selectedAudioTrackId.set('audio-1');

    await vi.waitFor(() => {
      expect(state.presentation.get()?.duration).toBe(60);
    });

    const lastCall = resolveDuration.mock.calls.at(-1)?.[0];

    expect(lastCall).toMatchObject({
      selectedVideoTrackId: 'video-1',
      selectedAudioTrackId: 'audio-1',
    });
    expect(lastCall?.presentation?.id).toBe('pres-1');

    cleanup();
  });

  it('does not write when the resolver returns undefined', async () => {
    const original = mockPresentation();
    const state = makeState({ presentation: original });
    const resolveDuration = vi.fn<PresentationDurationResolver>(() => undefined);
    const cleanup = setupDuration(state, resolveDuration);

    try {
      await Promise.resolve();
      expect(resolveDuration).toHaveBeenCalled();
      expect(state.presentation.get()).toBe(original);
    } finally {
      cleanup();
    }
  });

  it('does not write when the resolver returns NaN', async () => {
    const state = makeState();
    const resolveDuration: PresentationDurationResolver = () => Number.NaN;

    const cleanup = setupDuration(state, resolveDuration);

    state.presentation.set(mockPresentation());

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.presentation.get()?.duration).toBeUndefined();

    cleanup();
  });

  it.each([0, -5])('does not write when the resolver returns %s', async (duration) => {
    const original = mockPresentation();
    const state = makeState({ presentation: original });
    const resolveDuration = vi.fn<PresentationDurationResolver>(() => duration);
    const cleanup = setupDuration(state, resolveDuration);

    try {
      await Promise.resolve();
      expect(resolveDuration).toHaveBeenCalled();
      expect(state.presentation.get()).toBe(original);
    } finally {
      cleanup();
    }
  });

  it('does not call the resolver when duration is already set', async () => {
    const state = makeState({ presentation: mockPresentation({ duration: 60 }) });
    const resolveDuration = vi.fn<PresentationDurationResolver>(() => 120);

    const cleanup = setupDuration(state, resolveDuration);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.presentation.get()?.duration).toBe(60);
    expect(resolveDuration).not.toHaveBeenCalled();

    cleanup();
  });
});
