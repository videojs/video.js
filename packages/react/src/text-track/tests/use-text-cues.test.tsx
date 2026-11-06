import { act, cleanup, renderHook } from '@testing-library/react';
import { defineTextTrack } from '@videojs/core';
import { type PlayerTarget, textCuesFeature, textTrackFeature } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../player/context';
import { createPlayerWrapper } from '../../testing/mocks';
import { useActiveTextCues, useTextCues } from '../use-text-cues';
import { useTextTracks } from '../use-text-tracks';

afterEach(cleanup);

interface MockCue {
  startTime: number;
  endTime: number;
  text: string;
}

function createTrack(kind: TextTrackKind, label: string, cues: MockCue[], mode: TextTrackMode = 'hidden') {
  return Object.assign(new EventTarget(), { id: label, kind, label, language: 'en', mode, cues });
}

/** A real store over a video carrying stand-in tracks, since jsdom never populates `textTracks`. */
function setup(tracks: ReturnType<typeof createTrack>[]) {
  const video = document.createElement('video');
  const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

  Object.defineProperty(video, 'textTracks', {
    configurable: true,
    value: Object.assign(new EventTarget(), { length: tracks.length }, tracks),
  });
  Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 0 });
  store.attach({ media: video, container: null });

  const value = { store, media: null, setMedia: vi.fn(), container: null, setContainer: vi.fn() };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PlayerContextProvider value={value as unknown as PlayerContextValue}>{children}</PlayerContextProvider>
  );

  // Store notifications flush in a microtask, so let `act` await them.
  const seek = (time: number) =>
    act(async () => {
      Object.defineProperty(video, 'currentTime', { configurable: true, value: time });
      video.dispatchEvent(new Event('timeupdate'));
    });

  return { store, video, wrapper, seek };
}

describe('useActiveTextCues', () => {
  it('returns the cues active now and re-renders as they change', async () => {
    const { wrapper, seek } = setup([
      createTrack('metadata', 'quiz', [
        { startTime: 0, endTime: 10, text: '{"question":"One?"}' },
        { startTime: 10, endTime: 20, text: '{"question":"Two?"}' },
      ]),
    ]);
    const { result } = renderHook(() => useActiveTextCues({ label: 'quiz' }), { wrapper });

    expect(result.current.map(({ value }) => value)).toEqual([{ question: 'One?' }]);

    await seek(15);

    expect(result.current.map(({ value }) => value)).toEqual([{ question: 'Two?' }]);
  });

  it('keeps the same array while its cues stay the same', async () => {
    const { wrapper, seek } = setup([
      createTrack('metadata', 'quiz', [{ startTime: 0, endTime: 10, text: 'a' }]),
      createTrack('metadata', 'ads', [{ startTime: 5, endTime: 6, text: 'b' }]),
    ]);
    const { result } = renderHook(() => useActiveTextCues({ label: 'quiz' }), { wrapper });
    const before = result.current;

    await seek(5.5);

    expect(result.current).toBe(before);
  });

  it('types cues through a track definition', () => {
    const quizTrack = defineTextTrack<{ question: string }>({ kind: 'metadata', label: 'quiz' });
    const { wrapper } = setup([
      createTrack('metadata', 'quiz', [{ startTime: 0, endTime: 10, text: '{"question":"?"}' }]),
    ]);
    const { result } = renderHook(() => useActiveTextCues(quizTrack), { wrapper });

    expect(result.current[0]?.value?.question).toBe('?');
  });

  it('returns no cues outside a store with the cues feature', () => {
    const store = createStore<PlayerTarget>()(textTrackFeature);
    const value = { store, media: null, setMedia: vi.fn(), container: null, setContainer: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PlayerContextProvider value={value as unknown as PlayerContextValue}>{children}</PlayerContextProvider>
    );

    const { result } = renderHook(() => useActiveTextCues({ kind: 'metadata' }), { wrapper });

    expect(result.current).toEqual([]);
  });
});

describe('useTextCues', () => {
  it('watches tracks the store does not read by default while mounted', () => {
    const { store, wrapper } = setup([
      createTrack('captions', 'English', [{ startTime: 0, endTime: 2, text: 'Hello' }], 'showing'),
    ]);

    expect(store.state.textCues).toEqual([]);

    const { result, unmount } = renderHook(() => useTextCues({ kind: 'captions' }), { wrapper });

    expect(result.current.map(({ text }) => text)).toEqual(['Hello']);

    unmount();

    expect(store.state.textCues).toEqual([]);
  });

  it('keeps one watch across renders with an inline filter', () => {
    const stop = vi.fn();
    const { store, Wrapper } = createPlayerWrapper({ textCues: [] });
    const watchTextCues = vi.fn(() => stop);

    Object.assign(store, { watchTextCues });

    const { rerender, unmount } = renderHook(() => useTextCues({ kind: 'captions' }), { wrapper: Wrapper });

    rerender();
    rerender();

    expect(watchTextCues).toHaveBeenCalledOnce();
    expect(watchTextCues).toHaveBeenCalledWith({ kind: 'captions' });

    unmount();

    expect(stop).toHaveBeenCalledOnce();
  });
});

describe('useTextTracks', () => {
  it('returns the matching tracks', () => {
    const { wrapper } = setup([createTrack('metadata', 'quiz', []), createTrack('chapters', 'chapters', [])]);
    const { result } = renderHook(() => useTextTracks({ kind: 'chapters' }), { wrapper });

    expect(result.current.map(({ label }) => label)).toEqual(['chapters']);
  });
});
