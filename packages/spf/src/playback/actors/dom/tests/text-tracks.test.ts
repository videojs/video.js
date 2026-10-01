import { describe, expect, it, vi } from 'vite-plus/test';

import { effect } from '../../../../core/signals/effect';
import type { CueSegmentMeta } from '../text-tracks';
import { createTextTracksActor } from '../text-tracks';

function makeUnsettledMediaElement(trackIds: string[]): HTMLMediaElement {
  const video = document.createElement('video');

  for (const id of trackIds) {
    const el = document.createElement('track');

    el.id = id;
    el.kind = 'subtitles';
    video.appendChild(el);
    el.track.mode = 'hidden';
  }

  return video;
}

async function makeMediaElement(trackIds: string[]): Promise<HTMLMediaElement> {
  const video = makeUnsettledMediaElement(trackIds);

  for (const el of video.querySelectorAll('track')) {
    await vi.waitFor(() => expect(el.readyState).toBe(HTMLTrackElement.ERROR));
  }

  return video;
}

function meta(trackId: string, id: string, startTime = 0, duration = 10): CueSegmentMeta {
  return { trackId, id, startTime, duration };
}

describe('createTextTracksActor', () => {
  it('starts with active status and empty context', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);

    expect(actor.snapshot.get().value).toBe('active');
    expect(actor.snapshot.get().context.loaded).toEqual({});
    expect(actor.snapshot.get().context.segments).toEqual({});
  });

  it('adds cues to the correct TextTrack', async () => {
    const video = await makeMediaElement(['track-en', 'track-es']);
    const actor = createTextTracksActor(video);
    const [en, es] = Array.from(video.textTracks);

    try {
      actor.send({ type: 'add-cues', meta: meta('track-es', 'seg-0'), cues: [new VTTCue(1, 3, 'Hola')] });

      expect(Array.from(es!.cues ?? [])).toMatchObject([{ startTime: 1, endTime: 3, text: 'Hola' }]);
      expect(Array.from(en!.cues ?? [])).toEqual([]);

      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 5, 'Cue A')] });
      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-1'), cues: [new VTTCue(5, 10, 'Cue B')] });
      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-2'), cues: [new VTTCue(10, 15, 'Cue C')] });

      expect(Array.from(en!.cues ?? [])).toMatchObject([
        { startTime: 0, endTime: 5, text: 'Cue A' },
        { startTime: 5, endTime: 10, text: 'Cue B' },
        { startTime: 10, endTime: 15, text: 'Cue C' },
      ]);
      expect(Array.from(es!.cues ?? [])).toMatchObject([{ startTime: 1, endTime: 3, text: 'Hola' }]);
    } finally {
      actor.destroy();
    }
  });

  it('preserves cues sent before a srcless native track settles', async () => {
    const video = document.createElement('video');
    const el = document.createElement('track');

    el.id = 'track-en';
    el.kind = 'subtitles';
    video.appendChild(el);
    document.body.appendChild(video);
    el.track.mode = 'showing';

    const actor = createTextTracksActor(video);

    try {
      expect(el.hasAttribute('src')).toBe(false);
      expect(el.readyState).toBe(HTMLTrackElement.NONE);

      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'Hello')] });

      await vi.waitFor(() => expect(el.readyState).toBe(HTMLTrackElement.ERROR));

      // SAFETY: This slot only contains the VTTCue sent to the actor above.
      expect(Array.from(el.track.cues ?? [], (cue) => (cue as VTTCue).text)).toEqual(['Hello']);
      expect(actor.snapshot.get().context.segments['track-en']).toEqual([{ id: 'seg-0', startTime: 0, duration: 10 }]);
    } finally {
      actor.destroy();
      video.remove();
    }
  });

  it('records added cues in snapshot context', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);
    const textTrack = Array.from(video.textTracks).find((t) => t.id === 'track-en')!;

    textTrack.mode = 'hidden';

    actor.send({
      type: 'add-cues',
      meta: meta('track-en', 'seg-0'),
      cues: [new VTTCue(0, 2, 'Hello'), new VTTCue(2, 4, 'World')],
    });

    const loaded = actor.snapshot.get().context.loaded['track-en'];

    expect(loaded).toHaveLength(2);
    expect(loaded![0]).toMatchObject({ startTime: 0, endTime: 2, text: 'Hello' });
    expect(loaded![1]).toMatchObject({ startTime: 2, endTime: 4, text: 'World' });
  });

  it('records segment in snapshot context', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);
    const textTrack = Array.from(video.textTracks).find((t) => t.id === 'track-en')!;

    textTrack.mode = 'hidden';

    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0', 0, 10), cues: [new VTTCue(0, 2, 'Hello')] });
    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-1', 10, 10), cues: [new VTTCue(2, 4, 'World')] });

    expect(actor.snapshot.get().context.segments['track-en']).toEqual([
      { id: 'seg-0', startTime: 0, duration: 10 },
      { id: 'seg-1', startTime: 10, duration: 10 },
    ]);
  });

  it('deduplicates cues by startTime + endTime + text', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);
    const textTrack = Array.from(video.textTracks).find((t) => t.id === 'track-en')!;

    textTrack.mode = 'hidden';

    actor.send({
      type: 'add-cues',
      meta: meta('track-en', 'seg-0', 0, 10),
      cues: [new VTTCue(0, 8, 'Unique to seg 0'), new VTTCue(8, 12, 'Boundary cue')],
    });
    actor.send({
      type: 'add-cues',
      meta: meta('track-en', 'seg-1', 10, 10),
      cues: [new VTTCue(8, 12, 'Boundary cue'), new VTTCue(12, 20, 'Unique to seg 1')],
    });

    const expected = [
      { startTime: 0, endTime: 8, text: 'Unique to seg 0' },
      { startTime: 8, endTime: 12, text: 'Boundary cue' },
      { startTime: 12, endTime: 20, text: 'Unique to seg 1' },
    ];

    expect(Array.from(textTrack.cues ?? [])).toMatchObject(expected);
    expect(actor.snapshot.get().context.loaded['track-en']).toMatchObject(expected);
    expect(actor.snapshot.get().context.segments['track-en']).toEqual([
      { id: 'seg-0', startTime: 0, duration: 10 },
      { id: 'seg-1', startTime: 10, duration: 10 },
    ]);
  });

  it('does not update snapshot when both cues and segment are already recorded', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);
    const textTrack = Array.from(video.textTracks).find((t) => t.id === 'track-en')!;

    textTrack.mode = 'hidden';

    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'Hello')] });
    const snapshotAfterFirst = actor.snapshot.get();

    expect(snapshotAfterFirst.context.segments['track-en']).toEqual([{ id: 'seg-0', startTime: 0, duration: 10 }]);

    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'Hello')] });

    expect(actor.snapshot.get()).toBe(snapshotAfterFirst);
    expect(actor.snapshot.get().context.segments['track-en']).toEqual([{ id: 'seg-0', startTime: 0, duration: 10 }]);
  });

  it('does not deduplicate cues with different text at the same time range', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);
    const textTrack = Array.from(video.textTracks).find((t) => t.id === 'track-en')!;

    textTrack.mode = 'hidden';

    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0', 0, 10), cues: [new VTTCue(0, 2, 'Hello')] });
    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-1', 10, 10), cues: [new VTTCue(0, 2, 'Hola')] });

    expect(Array.from(textTrack.cues ?? [])).toMatchObject([
      { startTime: 0, endTime: 2, text: 'Hello' },
      { startTime: 0, endTime: 2, text: 'Hola' },
    ]);
  });

  it('tracks cues and segments independently per track ID', async () => {
    const video = await makeMediaElement(['track-en', 'track-es']);
    const actor = createTextTracksActor(video);

    for (const t of Array.from(video.textTracks)) t.mode = 'hidden';

    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'Hello')] });
    actor.send({
      type: 'add-cues',
      meta: meta('track-es', 'seg-0'),
      cues: [new VTTCue(0, 2, 'Hola'), new VTTCue(2, 4, 'Mundo')],
    });

    expect(actor.snapshot.get().context.loaded['track-en']).toHaveLength(1);
    expect(actor.snapshot.get().context.loaded['track-es']).toHaveLength(2);
    expect(actor.snapshot.get().context.segments['track-en']).toEqual([{ id: 'seg-0', startTime: 0, duration: 10 }]);
    expect(actor.snapshot.get().context.segments['track-es']).toEqual([{ id: 'seg-0', startTime: 0, duration: 10 }]);
  });

  it('is a no-op when trackId is not found in textTracks', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);

    actor.send({ type: 'add-cues', meta: meta('nonexistent', 'seg-0'), cues: [new VTTCue(0, 2, 'Hello')] });

    expect(actor.snapshot.get().context.loaded).toEqual({});
    expect(actor.snapshot.get().context.segments).toEqual({});
  });

  it('releases pending settlement listeners on destroy()', async () => {
    const video = makeUnsettledMediaElement(['track-en']);
    const el = video.querySelector('track')!;
    const add = vi.spyOn(el, 'addEventListener');
    const remove = vi.spyOn(el, 'removeEventListener');
    const actor = createTextTracksActor(video);

    try {
      expect(el.readyState).toBe(HTMLTrackElement.NONE);

      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'Hello')] });
      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-1'), cues: [new VTTCue(2, 4, 'World')] });

      expect(add.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(['load', 'error']));

      actor.destroy();

      expect(actor.snapshot.get().value).toBe('destroyed');

      for (const [type, listener, options] of add.mock.calls) {
        expect(remove).toHaveBeenCalledWith(type, listener, options);
      }

      await vi.waitFor(() => expect(el.readyState).toBe(HTMLTrackElement.ERROR));

      expect(Array.from(el.track.cues ?? [])).toEqual([]);
      expect(actor.snapshot.get().context.loaded).toEqual({});
      expect(actor.snapshot.get().context.segments).toEqual({});
    } finally {
      actor.destroy();
      add.mockRestore();
      remove.mockRestore();
    }
  });

  it('ignores send() after destroy()', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);
    const textTrack = Array.from(video.textTracks).find((t) => t.id === 'track-en')!;

    textTrack.mode = 'hidden';

    actor.destroy();
    actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'Hello')] });

    expect(textTrack.cues?.length ?? 0).toBe(0);
    expect(actor.snapshot.get().context.loaded).toEqual({});
    expect(actor.snapshot.get().context.segments).toEqual({});
  });

  it('cancels pending cues on clear before settlement and accepts reused segment IDs', async () => {
    // The actor's lifecycle is bound to mediaElement, so its cache
    // survives source resets. Without a clear on source reset,
    // `getSegmentsToLoad` (which reads the actor's `segments` snapshot)
    // would treat the new source's segments as already-buffered and
    // skip loading them.
    const video = makeUnsettledMediaElement(['track-en']);
    const el = video.querySelector('track')!;
    const actor = createTextTracksActor(video);

    try {
      expect(el.readyState).toBe(HTMLTrackElement.NONE);

      // Source A resolves cues while native track loading is still pending.
      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'A0')] });
      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-1', 10), cues: [new VTTCue(10, 12, 'A1')] });

      actor.send({ type: 'clear' });

      await vi.waitFor(() => expect(el.readyState).toBe(HTMLTrackElement.ERROR));

      expect(Array.from(el.track.cues ?? [])).toEqual([]);
      expect(actor.snapshot.get().context.loaded).toEqual({});
      expect(actor.snapshot.get().context.segments).toEqual({});

      // Source B can reuse the cancelled segment's ID without stale cues or cache.
      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0'), cues: [new VTTCue(0, 2, 'B0')] });

      expect(Array.from(el.track.cues ?? [])).toMatchObject([{ startTime: 0, endTime: 2, text: 'B0' }]);
      expect(actor.snapshot.get().context.segments['track-en']).toEqual([{ id: 'seg-0', startTime: 0, duration: 10 }]);
      expect(actor.snapshot.get().context.loaded['track-en']).toMatchObject([{ startTime: 0, endTime: 2, text: 'B0' }]);

      actor.send({ type: 'clear' });

      expect(actor.snapshot.get().context.loaded).toEqual({});
      expect(actor.snapshot.get().context.segments).toEqual({});
    } finally {
      actor.destroy();
    }
  });

  it('snapshot is reactive — updates are tracked via signal', async () => {
    const video = await makeMediaElement(['track-en']);
    const actor = createTextTracksActor(video);
    const textTrack = Array.from(video.textTracks).find((t) => t.id === 'track-en')!;

    textTrack.mode = 'hidden';

    const snapshots: ReturnType<typeof actor.snapshot.get>[] = [];

    const stop = effect(() => {
      snapshots.push(actor.snapshot.get());
    });

    try {
      actor.send({ type: 'add-cues', meta: meta('track-en', 'seg-0', 0, 10), cues: [new VTTCue(0, 2, 'Hello')] });

      await vi.waitFor(() => expect(snapshots).toHaveLength(2));

      expect(snapshots[0]!.context.loaded['track-en']).toBeUndefined();
      expect(snapshots[1]!.context.loaded['track-en']).toMatchObject([{ startTime: 0, endTime: 2, text: 'Hello' }]);
      expect(snapshots[0]!.context.segments['track-en']).toBeUndefined();
      expect(snapshots[1]!.context.segments['track-en']).toEqual([{ id: 'seg-0', startTime: 0, duration: 10 }]);
    } finally {
      stop();
      actor.destroy();
    }
  });
});
