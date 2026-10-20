/**
 * MPEG-TS transmux pipelines — the relocation pipelines with a `transmux` step between `fetch` and the relocation
 * discover/stamp steps. A TS segment is buffered whole, demuxed, and rewritten as fMP4 fragments; from there the
 * existing steps read its `tfdt` and relocate it exactly as they would a native fMP4 segment, so the transmuxer never
 * touches timestamps. A segment that doesn't sniff as TS passes through untouched, so a mixed-container source works.
 *
 * TS renditions carry no init segment (`initialization.url === ''`): the `append-init` op dispatches an empty append —
 * the actor still records the track as initialized, which is what planning keys on — and the transmuxer prepends a real
 * `ftyp`/`moov` to the first fragment of each codec configuration (first segment, rendition switch).
 *
 * An audio rendition carried in the video segments (a URI-less `EXT-X-MEDIA`, resolved by
 * `resolveCarriedAudioRenditions`) plans its segments from its carrier variant's playlist, but the audio pipeline
 * fetches each one from the _selected_ video track's playlist instead, so the video and audio loaders request the same
 * URL — and, through the {@link SegmentShare}, make one request of it: the video pipeline publishes every segment it
 * fetches, the audio pipeline takes the published bytes and extracts the AAC from them.
 */
import type { StateSignals } from '../../core/composition/define-behavior';
import { peek, update } from '../../core/signals/primitives';
import { isCarriedAudioTrack } from '../../media/hls/carried-audio';
import type { TransmuxCodec } from '../../media/mpeg-ts/codecs/codec';
import { isTransportStream } from '../../media/mpeg-ts/demux';
import { createTransmuxer, type TransmuxOptions } from '../../media/mpeg-ts/transmux';
import {
  type AddressableObject,
  type MaybeResolvedPresentation,
  type MediaContainerData,
  SEGMENT_TIME_EPSILON,
} from '../../media/types';
import { findResolvedVideoTrack, findTrackById } from '../../media/utils/tracks';
import { relocationStepsFor } from './relocation-pipelines';
import {
  dispatchStep,
  type FetchBytes,
  fetchStep,
  type LoadStep,
  type MessagePipelines,
  type StepDeps,
} from './segment-load-pipeline';
import type { SegmentShare } from './segment-share';

/** How long the audio pipeline waits for the video pipeline to publish a carried segment before fetching it itself. */
const SHARE_WAIT_MS = 1000;

interface TransmuxSlots {
  presentation?: MaybeResolvedPresentation;
  mediaContainerData?: Record<string, MediaContainerData>;
  selectedVideoTrackId?: string;
}

function transmuxState(deps: StepDeps): StateSignals<TransmuxSlots> {
  // SAFETY: the loader threads the composition's state map opaquely; this module names the
  // slots the HLS engines declare (`presentation`, `mediaContainerData`), as relocation does.
  return deps.state as unknown as StateSignals<TransmuxSlots>;
}

/** The loader's own fetch, folded into the threaded config (see `segment-load-pipeline`'s `stepWiring`). */
function loaderFetch(deps: StepDeps): FetchBytes {
  // SAFETY: `createSegmentLoaderActor` folds its `fetch` into the config every step receives.
  return (deps.config as { fetch: FetchBytes }).fetch;
}

async function collect(data: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of data) chunks.push(chunk);

  if (chunks.length === 1) return chunks[0]!;

  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;

  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }

  return out;
}

async function* streamOf(...parts: Uint8Array[]): AsyncIterable<Uint8Array> {
  yield* parts;
}

/** The share key of a segment request: its URL plus any byte range. */
function shareKey({ url, byteRange }: AddressableObject): string {
  return byteRange ? `${url}#${byteRange.start}-${byteRange.end}` : url;
}

/**
 * Which of the pipeline's codecs this SourceBuffer carries this time, from the track's declared codecs: a muxed TS
 * rendition whose audio is demuxed into its own renditions (`AUDIO` group) declares only a video codec, so its in-band
 * audio is dropped rather than appended twice. An undeclared `CODECS` carries every codec the pipeline has.
 */
function transmuxOptionsFor(codecs: readonly TransmuxCodec[], deps: StepDeps, trackId: string): TransmuxOptions {
  const presentation = peek(transmuxState(deps).presentation);
  const track = presentation && findTrackById(presentation, trackId);
  const declared = track && 'codecs' in track ? (track.codecs ?? []) : [];
  const declares = (family: string) => declared.some((codec) => codec.toLowerCase().startsWith(family));
  const resolution =
    track && 'width' in track && track.width && track.height ? { width: track.width, height: track.height } : undefined;

  return {
    codecs: declared.length === 0 ? codecs : codecs.filter((codec) => declares(codec.family)),
    ...(resolution && { resolution }),
  };
}

export interface TransmuxPipelineOptions {
  /** Shares fetched video segments with the audio pipeline extracting the audio they carry; absent → each fetches. */
  share?: SegmentShare;
}

/**
 * Transmux pipelines for one track type — the TS analog of `relocationPipelinesFor`, carrying `codecs` (the first is
 * the type's own: the one whose track relocation keys on). One transmuxer per actor (built inside the per-actor
 * factory), so fragment numbering and the init-segment memory reset with the source. The relocation stamp reads
 * `deriveStartMediaTime` from the composition config, as in the relocation pipelines.
 */
export function transmuxPipelinesFor(
  trackType: 'video' | 'audio',
  codecs: readonly TransmuxCodec[],
  { share }: TransmuxPipelineOptions = {}
): MessagePipelines {
  const { readInitTrackInfo, readSegmentOrigin, stampStartMediaTime } = relocationStepsFor(trackType);
  const ownFamily = codecs[0]!.family;

  /** Video media fetch: publish the segment to the share while it downloads, for the audio pipeline to take. */
  const fetchVideoSegment: LoadStep = async (frame, signal, deps) => {
    const { op } = frame;
    if (op.type !== 'append-segment' || !share) return fetchStep(frame, signal, deps);

    const bytes = (async () => {
      await fetchStep(frame, signal, deps);
      return collect(frame.data!);
    })();

    share.publish(shareKey(op), bytes);
    frame.data = streamOf(await bytes);
  };

  /**
   * Audio media fetch: a carried rendition's segment is fetched from the selected video track at the same position (the
   * carrier's own when that track hasn't resolved), taken from the share when the video pipeline has it in flight.
   */
  const fetchAudioSegment: LoadStep = async (frame, signal, deps) => {
    const { op } = frame;
    if (op.type !== 'append-segment') return;

    const state = transmuxState(deps);
    const presentation = peek(state.presentation);
    const track = presentation && findTrackById(presentation, op.meta.trackId);
    if (!presentation || !track || !isCarriedAudioTrack(presentation, track)) return fetchStep(frame, signal, deps);

    const video = findResolvedVideoTrack(presentation, state.selectedVideoTrackId && peek(state.selectedVideoTrackId));
    const segment = video?.segments.find((s) => Math.abs(s.startTime - op.meta.startTime) < SEGMENT_TIME_EPSILON);
    const addressable: AddressableObject = segment ?? op;
    const shared = share && (await share.take(shareKey(addressable), SHARE_WAIT_MS));

    if (signal.aborted) return;

    frame.data = shared ? streamOf(shared) : await loaderFetch(deps)(addressable, { signal });
  };

  const fetchSegment = trackType === 'video' ? fetchVideoSegment : fetchAudioSegment;

  return () => {
    const transmux = createTransmuxer(codecs);

    /** Init step: nothing to fetch for a TS rendition; a real init URL takes the fMP4 path. */
    const fetchInit: LoadStep = async (frame, signal, deps) => {
      if (frame.op.type !== 'append-init') return;

      if (frame.op.url === '') {
        frame.data = streamOf(new Uint8Array(0));
        return;
      }

      await fetchStep(frame, signal, deps);
      await readInitTrackInfo(frame, signal, deps);
    };

    /**
     * Media step: buffer the fetched segment, rewrite TS as fMP4, and record the init-segment half of this type's
     * `mediaContainerData` (track id + timescale, what `readInitTrackInfo` reads from a real init) so the relocation
     * discover step that follows can match the fragment's `tfdt`.
     */
    const transmuxStep: LoadStep = async (frame, signal, deps) => {
      const { op } = frame;
      if (op.type !== 'append-segment' || !frame.data) return;

      const bytes = await collect(frame.data);

      if (signal.aborted) return;

      if (!isTransportStream(bytes)) {
        frame.data = streamOf(bytes);
        return;
      }

      const result = transmux(bytes, transmuxOptionsFor(codecs, deps, op.meta.trackId));
      const own = result.tracks[ownFamily];
      const slot = transmuxState(deps).mediaContainerData;

      if (own && peek(slot)?.[trackType]?.timescale === undefined) {
        update(slot, (current) => ({
          ...current,
          [trackType]: { ...current?.[trackType], trackId: own.trackId, timescale: own.timescale },
        }));
      }

      frame.data = result.init ? streamOf(result.init, result.data) : streamOf(result.data);
    };

    return {
      remove: [dispatchStep],
      'append-init': [fetchInit, dispatchStep],
      'append-segment': [fetchSegment, transmuxStep, readSegmentOrigin, stampStartMediaTime, dispatchStep],
    };
  };
}
