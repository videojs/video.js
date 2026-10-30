import { act, cleanup, renderHook } from '@testing-library/react';
import { defineTextTrack } from '@videojs/core';
import { type PlayerTarget, textCuesFeature, textTrackFeature } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../player/context';
import { useCreateTextTrack } from '../use-create-text-track';

afterEach(cleanup);

const cues = [{ startTime: 0, endTime: 10, value: { question: 'Ready?' } }];

function setup() {
  const video = document.createElement('video');
  const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

  Object.defineProperty(video, 'textTracks', {
    configurable: true,
    value: Object.assign(new EventTarget(), { length: 0 }),
  });
  store.attach({ media: video, container: null });

  const value = { store, media: null, setMedia: vi.fn(), container: null, setContainer: vi.fn() };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PlayerContextProvider value={value as unknown as PlayerContextValue}>{children}</PlayerContextProvider>
  );

  // Store notifications flush in a microtask, so let `act` await them.
  const setSrc = (src: string) =>
    act(async () => {
      Object.defineProperty(video, 'currentSrc', { configurable: true, value: src });
      video.dispatchEvent(new Event('loadstart'));
    });

  return { store, wrapper, setSrc };
}

function appLabels(store: ReturnType<typeof setup>['store']) {
  return store.state.textTrackList.filter(({ source }) => source === 'app').map(({ label }) => label);
}

describe('useCreateTextTrack', () => {
  it('adds the track while mounted', () => {
    const { store, wrapper } = setup();
    const { result, unmount } = renderHook(() => useCreateTextTrack({ kind: 'metadata', label: 'quiz', cues }), {
      wrapper,
    });

    expect(appLabels(store)).toEqual(['quiz']);
    expect(result.current?.id).toBe(store.state.textTrackList[0]!.id);

    unmount();

    expect(appLabels(store)).toEqual([]);
  });

  it('takes a track definition', () => {
    const quizTrack = defineTextTrack<{ question: string }>({ kind: 'metadata', label: 'quiz' });
    const { store, wrapper } = setup();

    renderHook(() => useCreateTextTrack(quizTrack, { cues }), { wrapper });

    expect(store.state.textCues[0]!.cues[0]!.value).toEqual({ question: 'Ready?' });
  });

  it('keeps one track across renders with an inline description', () => {
    const { store, wrapper } = setup();
    const { result, rerender } = renderHook(() => useCreateTextTrack({ kind: 'metadata', label: 'quiz', cues }), {
      wrapper,
    });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(appLabels(store)).toEqual(['quiz']);
  });

  it('keeps the track through a source change', async () => {
    const { store, wrapper, setSrc } = setup();
    const { result } = renderHook(() => useCreateTextTrack({ kind: 'metadata', label: 'quiz', cues }), { wrapper });
    const first = result.current;

    await setSrc('https://example.com/one.mp4');
    await setSrc('https://example.com/two.mp4');

    expect(appLabels(store)).toEqual(['quiz']);
    expect(result.current).toBe(first);
  });

  it('replaces the track when its src or format changes', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );

    const { store, wrapper } = setup();
    const first = () => [];
    const second = () => [];
    const { result, rerender } = renderHook(
      ({ src, format }) => useCreateTextTrack({ kind: 'chapters', label: 'chapters', src, format }),
      { wrapper, initialProps: { src: '/one.json', format: first } }
    );
    const ids = [result.current?.id];

    rerender({ src: '/one.json', format: second });
    ids.push(result.current?.id);
    rerender({ src: '/two.json', format: second });
    ids.push(result.current?.id);

    expect(new Set(ids).size).toBe(3);
    expect(appLabels(store)).toEqual(['chapters']);

    vi.unstubAllGlobals();
  });

  it('does not add the track again after the app removes it', async () => {
    const { store, wrapper } = setup();
    const { result } = renderHook(() => useCreateTextTrack({ kind: 'metadata', label: 'quiz', cues }), { wrapper });

    await act(async () => result.current?.remove());

    expect(appLabels(store)).toEqual([]);
  });
});
