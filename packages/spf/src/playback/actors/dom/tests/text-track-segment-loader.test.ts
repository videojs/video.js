import { describe, expect, it, vi } from 'vite-plus/test';

import type { TextTrack } from '../../../../media/types';
import { createTextTrackSegmentLoaderActor } from '../../text-track-segment-loader';
import { createTextTracksActor } from '../text-tracks';

type ResolveVttSegment = (url: string) => Promise<VTTCue[]>;

function createResolveVttSegment(): ReturnType<typeof vi.fn<ResolveVttSegment>> {
  return vi.fn((url: string) => {
    if (url.includes('fail')) {
      return Promise.reject(new Error('Network error'));
    }

    return Promise.resolve([new VTTCue(0, 5, `Cue from ${url}`)]);
  });
}

function makeMediaElement(trackIds: string[]): HTMLMediaElement {
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

function makeResolvedTextTrack(id: string, segmentUrls: string[]): TextTrack {
  return {
    type: 'text',
    id,
    url: 'https://example.com/text.m3u8',
    mimeType: 'text/vtt',
    bandwidth: 0,
    groupId: 'subs',
    label: 'English',
    kind: 'subtitles',
    language: 'en',
    startTime: 0,
    duration: segmentUrls.length * 10,
    segments: segmentUrls.map((url, i) => ({
      id: `seg-${i}`,
      url,
      duration: 10,
      startTime: i * 10,
    })),
  };
}

describe('createTextTrackSegmentLoaderActor', () => {
  it('does not fetch when no segments need loading', async () => {
    const resolveVttSegment = createResolveVttSegment();
    const video = makeMediaElement(['track-en']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);
    const track = makeResolvedTextTrack('track-en', []);

    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });

    expect(resolveVttSegment).not.toHaveBeenCalled();

    actor.destroy();
    textTracksActor.destroy();
  });

  it('delegates cue loading to TextTracksActor', async () => {
    const resolveVttSegment = createResolveVttSegment();
    const video = makeMediaElement(['track-en']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);
    const track = makeResolvedTextTrack('track-en', ['https://example.com/seg-0.vtt', 'https://example.com/seg-1.vtt']);

    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });

    await vi.waitFor(() => {
      expect(textTracksActor.snapshot.get().context.segments['track-en']).toHaveLength(2);
    });

    expect(textTracksActor.snapshot.get().context.loaded['track-en']).toHaveLength(2);

    actor.destroy();
    textTracksActor.destroy();
  });

  it('skips already-loaded segments on repeat send()', async () => {
    const resolveVttSegment = createResolveVttSegment();
    const video = makeMediaElement(['track-en']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);
    const track = makeResolvedTextTrack('track-en', ['https://example.com/seg-0.vtt', 'https://example.com/seg-1.vtt']);

    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });
    await vi.waitFor(() => expect(textTracksActor.snapshot.get().context.segments['track-en']).toHaveLength(2));
    expect(resolveVttSegment).toHaveBeenCalledTimes(2);

    // Repeat send — all segments already in TextTracksActor context
    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });
    expect(resolveVttSegment).toHaveBeenCalledTimes(2);

    actor.destroy();
    textTracksActor.destroy();
  });

  it('continues loading remaining segments after a fetch error', async () => {
    const resolveVttSegment = createResolveVttSegment();

    vi.mocked(resolveVttSegment)
      .mockResolvedValueOnce([new VTTCue(0, 5, 'Good')])
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([new VTTCue(20, 25, 'Also good')]);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const video = makeMediaElement(['track-en']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);
    const track = makeResolvedTextTrack('track-en', [
      'https://example.com/seg-0.vtt',
      'https://example.com/fail.vtt',
      'https://example.com/seg-2.vtt',
    ]);

    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });

    // Segments 0 and 2 succeeded; the failed segment is not recorded
    await vi.waitFor(() => expect(textTracksActor.snapshot.get().context.segments['track-en']).toHaveLength(2));
    expect(resolveVttSegment.mock.calls).toEqual([
      ['https://example.com/seg-0.vtt'],
      ['https://example.com/fail.vtt'],
      ['https://example.com/seg-2.vtt'],
    ]);
    expect(textTracksActor.snapshot.get().context.segments['track-en']).toEqual([
      { id: 'seg-0', startTime: 0, duration: 10 },
      { id: 'seg-2', startTime: 20, duration: 10 },
    ]);
    expect(textTracksActor.snapshot.get().context.loaded['track-en']).toMatchObject([
      { startTime: 0, endTime: 5, text: 'Good' },
      { startTime: 20, endTime: 25, text: 'Also good' },
    ]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load text-track segment:', expect.any(Error));

    consoleErrorSpy.mockRestore();
    actor.destroy();
    textTracksActor.destroy();
  });

  it('preempts in-flight work when a new send() arrives', async () => {
    const resolveVttSegment = createResolveVttSegment();

    let resolveSeg0!: (cues: VTTCue[]) => void;

    vi.mocked(resolveVttSegment)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSeg0 = resolve;
          })
      )
      .mockResolvedValue([new VTTCue(0, 5, 'Cue')]);

    const video = makeMediaElement(['track-en', 'track-es']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);

    const track1 = makeResolvedTextTrack('track-en', ['https://example.com/seg-0.vtt']);
    const track2 = makeResolvedTextTrack('track-es', ['https://example.com/seg-1.vtt']);

    // Start loading track1 — paused waiting for seg0
    actor.send({ type: 'load', track: track1, range: { start: 0, end: Infinity } });

    // Wait for the Task to actually start running
    await vi.waitFor(() => expect(resolveVttSegment).toHaveBeenCalledTimes(1));

    // Switch to track2 — preempts track1
    actor.send({ type: 'load', track: track2, range: { start: 0, end: Infinity } });

    // Unblock seg0 — signal is already aborted, so the cue is discarded
    resolveSeg0([]);

    // track-es completes
    await vi.waitFor(() => expect(textTracksActor.snapshot.get().context.segments['track-es']).toHaveLength(1));

    // track-en was preempted — no cues recorded
    expect(textTracksActor.snapshot.get().context.segments['track-en']).toBeUndefined();

    actor.destroy();
    textTracksActor.destroy();
  });

  it('continues in-flight fetch when new send keeps the same segment in the plan', async () => {
    const resolveVttSegment = createResolveVttSegment();

    let resolveSeg0!: (cues: VTTCue[]) => void;

    vi.mocked(resolveVttSegment)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSeg0 = resolve;
          })
      )
      .mockResolvedValue([new VTTCue(0, 5, 'Cue')]);

    const video = makeMediaElement(['track-en']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);
    const track = makeResolvedTextTrack('track-en', [
      'https://example.com/seg-0.vtt',
      'https://example.com/seg-1.vtt',
      'https://example.com/seg-2.vtt',
    ]);

    // First load — starts fetching seg-0 (held pending). seg-1 and seg-2
    // wait in the runner's chain behind it.
    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });
    await vi.waitFor(() => expect(resolveVttSegment).toHaveBeenCalledTimes(1));
    expect(resolveVttSegment).toHaveBeenCalledWith('https://example.com/seg-0.vtt');

    // Second load with the same inputs. seg-0 is in-flight and the new
    // plan still wants it → continue path: abortPending kills the queue,
    // schedules [seg-1, seg-2] anew, but seg-0 keeps fetching.
    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });

    // Crucially: seg-0 was NOT re-fetched. Under the old `abortAll on
    // every send` shape, the in-flight seg-0 would be aborted and
    // re-scheduled, producing a second call to resolveSegment for it.
    expect(resolveVttSegment).toHaveBeenCalledTimes(1);

    // Unblock seg-0 and let the rest play out.
    resolveSeg0([new VTTCue(0, 5, 'seg-0 cue')]);

    await vi.waitFor(() => {
      expect(textTracksActor.snapshot.get().context.segments['track-en']).toHaveLength(3);
    });

    // seg-0 was fetched exactly once across the two sends.
    const seg0Calls = (resolveVttSegment as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url]) => url === 'https://example.com/seg-0.vtt'
    );

    expect(seg0Calls).toHaveLength(1);

    actor.destroy();
    textTracksActor.destroy();
  });

  it('preempts in-flight fetch when new send drops it from the plan (e.g. seek out of window)', async () => {
    const resolveVttSegment = createResolveVttSegment();

    let resolveSeg0!: (cues: VTTCue[]) => void;

    vi.mocked(resolveVttSegment)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSeg0 = resolve;
          })
      )
      .mockResolvedValue([new VTTCue(0, 5, 'Cue')]);

    const video = makeMediaElement(['track-en']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);
    // Six segments at 10s each; default forward window is 30s, so a
    // currentTime jump from 0 → 40 drops seg-0..seg-2 from the plan and
    // keeps seg-4..seg-5 (window [40, 70)).
    const track = makeResolvedTextTrack('track-en', [
      'https://example.com/seg-0.vtt',
      'https://example.com/seg-1.vtt',
      'https://example.com/seg-2.vtt',
      'https://example.com/seg-3.vtt',
      'https://example.com/seg-4.vtt',
      'https://example.com/seg-5.vtt',
    ]);

    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });
    await vi.waitFor(() => expect(resolveVttSegment).toHaveBeenCalledTimes(1));
    expect(resolveVttSegment).toHaveBeenCalledWith('https://example.com/seg-0.vtt');

    // Seek — seg-0 is no longer in the forward window. Preempt:
    // abortAll the in-flight + queue, schedule the new plan from scratch.
    actor.send({ type: 'load', track, range: { start: 40, end: Infinity } });

    // Unblock the original seg-0 fetch. Its signal is aborted, so the
    // cues are discarded.
    resolveSeg0([new VTTCue(0, 5, 'should be discarded')]);

    await vi.waitFor(() => {
      const segs = textTracksActor.snapshot.get().context.segments['track-en'] ?? [];
      const ids = segs.map((s) => s.id);

      expect(ids).toContain('seg-4');
    });

    const ids = (textTracksActor.snapshot.get().context.segments['track-en'] ?? []).map((s) => s.id);

    // seg-0 was preempted — its cues didn't land.
    expect(ids).not.toContain('seg-0');

    actor.destroy();
    textTracksActor.destroy();
  });

  it('does not schedule work after destroy()', async () => {
    const resolveVttSegment = createResolveVttSegment();
    const video = makeMediaElement(['track-en']);
    const textTracksActor = createTextTracksActor(video);
    const actor = createTextTrackSegmentLoaderActor(textTracksActor, resolveVttSegment);
    const track = makeResolvedTextTrack('track-en', ['https://example.com/seg-0.vtt']);

    actor.destroy();
    actor.send({ type: 'load', track, range: { start: 0, end: Infinity } });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(resolveVttSegment).not.toHaveBeenCalled();

    textTracksActor.destroy();
  });
});
