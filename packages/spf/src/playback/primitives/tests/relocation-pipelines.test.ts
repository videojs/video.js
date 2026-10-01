import { describe, expect, it } from 'vite-plus/test';

import { signal } from '../../../core/signals/primitives';
import { initSegment, mediaSegment, trak } from '../../../media/mp4/tests/synthetic-boxes';
import type { Cue, MaybeResolvedPresentation, MediaContainerData } from '../../../media/types';
import type { DeriveStartMediaTime } from '../derive-start-media-time';
import { relocatingTextPipelines, relocationPipelinesFor } from '../relocation-pipelines';
import type { Frame, StepDeps } from '../segment-load-pipeline';
import type { TextFrame, TextStepDeps } from '../text-segment-load-pipeline';

// A caption-first muxing: the `clcp` traf precedes the media traf, so a
// first-`traf` read would pair the media track's timescale with the caption
// track's baseMediaDecodeTime (300000/6000 = 50s) instead of its own
// (60000/6000 = 10s). Track-id matching is what keeps the origin honest here.
const captionFirstInit = initSegment(
  trak({ handler: 'clcp', trackId: 2, timescale: 30000 }),
  trak({ handler: 'vide', trackId: 1, timescale: 6000 })
);
const captionFirstSegment = mediaSegment(
  { trackId: 2, baseMediaDecodeTime: 300000 }, // captions first
  { trackId: 1, baseMediaDecodeTime: 60000 } // media track second
);

async function* streamOf(bytes: Uint8Array): AsyncIterable<Uint8Array> {
  yield bytes;
}

function makeDeps(): {
  deps: StepDeps;
  slot: ReturnType<typeof signal<Record<string, MediaContainerData> | undefined>>;
} {
  const slot = signal<Record<string, MediaContainerData> | undefined>(undefined);

  return { deps: { state: { mediaContainerData: slot }, context: {}, config: {} }, slot };
}

/**
 * The discover steps at their pipeline positions: `[fetch, discover, dispatch]`. Only the stamp step reads
 * `deriveStartMediaTime`, so the discover steps need none.
 */
function discoverSteps(trackType: 'video' | 'audio') {
  const pipelines = relocationPipelinesFor(trackType)();

  return { readInitTrackInfo: pipelines['append-init'][1]!, readSegmentOrigin: pipelines['append-segment'][1]! };
}

describe('relocationPipelinesFor', () => {
  it('matches the media track by track_id across a muxed init and segment', async () => {
    const { deps, slot } = makeDeps();
    const { readInitTrackInfo, readSegmentOrigin } = discoverSteps('video');
    const signalNotAborted = new AbortController().signal;

    const initFrame = {
      op: { type: 'append-init', meta: { trackId: 'v', language: undefined }, url: 'init.mp4' },
      data: streamOf(captionFirstInit),
    } as unknown as Frame;

    await readInitTrackInfo(initFrame, signalNotAborted, deps);

    // The `vide` track — id 1, timescale 6000 — not the caption track (id 2).
    expect(slot.get()?.video).toEqual({ trackId: 1, timescale: 6000 });

    const segmentFrame = {
      op: { type: 'append-segment', meta: { id: 's0', startTime: 0, duration: 6, trackId: 'v' } },
      data: streamOf(captionFirstSegment),
    } as unknown as Frame;

    await readSegmentOrigin(segmentFrame, signalNotAborted, deps);

    // Track 1's tfdt (60000), never the caption track's (300000).
    const video = slot.get()?.video;

    expect(video?.baseMediaDecodeTime).toBe(60000);
    expect(video!.baseMediaDecodeTime! / video!.timescale!).toBe(10);
  });

  it('leaves the append native when the init has no matching media track', async () => {
    const { deps, slot } = makeDeps();
    const { readInitTrackInfo, readSegmentOrigin } = discoverSteps('audio');
    const signalNotAborted = new AbortController().signal;

    // Video-only muxing: no `soun` track for the audio pipeline to match.
    const initFrame = {
      op: { type: 'append-init', meta: { trackId: 'a', language: undefined }, url: 'init.mp4' },
      data: streamOf(captionFirstInit),
    } as unknown as Frame;

    await readInitTrackInfo(initFrame, signalNotAborted, deps);
    expect(slot.get()?.audio).toBeUndefined();

    // Without a discovered track_id, the segment step no-ops (no origin to relocate by).
    const segmentFrame = {
      op: { type: 'append-segment', meta: { id: 's0', startTime: 0, duration: 6, trackId: 'a' } },
      data: streamOf(captionFirstSegment),
    } as unknown as Frame;

    await readSegmentOrigin(segmentFrame, signalNotAborted, deps);
    expect(slot.get()?.audio?.baseMediaDecodeTime).toBeUndefined();
  });
});

describe('relocationPipelinesFor — stamp', () => {
  const notAborted = new AbortController().signal;

  // The stamp is the third append-segment step: [fetch, readSegmentOrigin, stamp, dispatch].
  function stampFor(config: { deriveStartMediaTime?: DeriveStartMediaTime }) {
    const stamp = relocationPipelinesFor('video')()['append-segment'][2]!;
    const mediaContainerData = signal<Record<string, MediaContainerData> | undefined>({
      video: { trackId: 1, timescale: 6000, baseMediaDecodeTime: 60000, segmentStartTime: 0 },
    });
    const deps: StepDeps = { state: { mediaContainerData }, context: {}, config };
    const frame = {
      op: { type: 'append-segment', meta: { id: 's0', startTime: 0, duration: 6, trackId: 'v' } },
    } as unknown as Frame;

    return { run: () => stamp(frame, notAborted, deps), frame };
  }

  it('relocates by the deriveStartMediaTime it reads from the composition config', async () => {
    const { run, frame } = stampFor({ deriveStartMediaTime: () => ({ video: 10 }) });

    await run();

    expect(frame.meta?.timestampOffset).toBe(-10);
  });

  it('leaves the append native when the config carries no deriveStartMediaTime', async () => {
    const { run, frame } = stampFor({});

    await run();

    expect(frame.meta).toBeUndefined();
  });
});

describe('relocatingTextPipelines', () => {
  // relocateCues is the middle step: [resolveWithMetadata, relocateCues, dispatchCues].
  const relocateCues = relocatingTextPipelines<Cue>()[1]!;
  const notAborted = new AbortController().signal;

  // Apple-style map: local 0 → MPEGTS 900000 (10s) ⇒ mapCorrection = 10.
  const appleMap = { timestampMap: { mpegts: 900000, local: 0 } };

  const presWithVideo = (startMediaTime: number | undefined): MaybeResolvedPresentation =>
    ({
      selectionSets: [{ type: 'video', switchingSets: [{ tracks: [{ id: 'v', type: 'video', startMediaTime }] }] }],
    }) as unknown as MaybeResolvedPresentation;

  const presTextOnly = (): MaybeResolvedPresentation =>
    ({
      selectionSets: [{ type: 'text', switchingSets: [{ tracks: [{ id: 't', type: 'text' }] }] }],
    }) as unknown as MaybeResolvedPresentation;

  const makeState = (presentation: MaybeResolvedPresentation) => ({
    presentation: signal<MaybeResolvedPresentation | undefined>(presentation),
    selectedVideoTrackId: signal<string | undefined>(undefined),
    selectedAudioTrackId: signal<string | undefined>(undefined),
  });

  const cue = (startTime: number, endTime: number): Cue => ({ startTime, endTime, text: 'x' }) as unknown as Cue;

  it('waits for the selected A/V origin instead of shifting cues by the full map correction', async () => {
    // A/V exists but nothing selected yet — the race. Must WAIT, not resolve with 0
    // (which would shift every cue by the full +10s mapCorrection).
    const state = makeState(presWithVideo(undefined));
    const deps = { state, context: {}, config: {} } as unknown as TextStepDeps;
    const c = cue(5, 6);
    const frame = { cues: [c], metadata: appleMap } as unknown as TextFrame<Cue>;

    let completed = false;
    const done = Promise.resolve(relocateCues(frame, notAborted, deps)).then(() => {
      completed = true;
    });

    await Promise.resolve();
    expect(completed).toBe(false);
    expect(c.startTime).toBe(5);

    state.selectedVideoTrackId.set('v');
    await Promise.resolve();
    expect(completed).toBe(false);
    expect(c.startTime).toBe(5);

    state.presentation.set(presWithVideo(8));
    await done;

    expect(completed).toBe(true);
    expect(c.startTime).toBe(7);
    expect(c.endTime).toBe(8);
  });

  it('relocates a genuinely text-only source by offset 0 without hanging', async () => {
    // No A/V tracks ⇒ no origin will ever come; resolve immediately with startMediaTime 0.
    const state = makeState(presTextOnly());
    const deps = { state, context: {}, config: {} } as unknown as TextStepDeps;
    const c = cue(5, 6);
    const frame = { cues: [c], metadata: appleMap } as unknown as TextFrame<Cue>;

    await relocateCues(frame, notAborted, deps);

    // delta = mapCorrection(10) − 0 = 10.
    expect(c.startTime).toBe(15);
    expect(c.endTime).toBe(16);
  });
});
