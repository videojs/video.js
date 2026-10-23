/**
 * Non-zero-PTS relocation pipelines — the config-supplied, loader-facing half of the `establishStartMediaTime` behavior
 * (`../behaviors/establish-start-media-time`). The reactor there owns the lifecycle and the `derive` coordination seam;
 * this file supplies the `messagePipelines` the segment/text loaders run to _fill and act on_ that behavior's state.
 * It's the relocation analog of `track-switching`'s config-supplied constraint/rule chain — a pluggable strategy handed
 * to the machinery via config, not applied inline — supplied to the loaders rather than applied by the behavior, so the
 * two coordinate through the shared `mediaContainerData` / `startMediaTime` slots alone, never by import.
 *
 * DOM-free: it composes the loader vocabularies (`segment-load-pipeline`, `text-segment-load-pipeline`) through their
 * structural sink seams and shifts cues via the structural `Cue` type, so it names no `SourceBuffer`,
 * `TextTracksActor`, or `VTTCue`. The A/V pipeline is a plain `messagePipelines` array:
 *
 * - `discover` — init `track_id` + `mdhd` timescale for the buffered media track, then that same track's `tfdt`
 *   baseMediaDecodeTime, matched by `track_id` so a muxed segment reads the media track's origin, not the first `traf`
 *   — writes `state.mediaContainerData`.
 * - `stamp` — reads that track's derived origin back and relocates via `timestampOffset = −startMediaTime`. Steps read
 *   composition `state` from their call-time `deps` (no closures, no context).
 *
 * The text half (`relocatingTextPipelines`) is the same idea for the text-segment loader: a `resolveWithMetadata →
 * relocateCues → dispatchCues` pipeline that shifts cues onto the same 0-based timeline, reading the primary A/V
 * track's `startMediaTime` (the reactor's consumed value) via `deps`.
 */
import type { StateSignals } from '../../core/composition/define-behavior';
import { effect } from '../../core/signals/effect';
import { peek, type Signal, update } from '../../core/signals/primitives';
import { findMediaTrack, type MediaHandlerType, readBaseMediaDecodeTime } from '../../media/mp4/timestamp-origin';
import { resolveVttSegmentMetadata, type TextSegmentMetadata } from '../../media/text/resolve-vtt-metadata';
import type { Cue, MaybeResolvedPresentation, MediaContainerData } from '../../media/types';
import { findTrackById, getTracksByType } from '../../media/utils/tracks';
import type { DeriveStartMediaTime } from './derive-start-media-time';
import { peekHead } from './head-peek';
import { dispatchStep, fetchStep, type LoadStep, type MessagePipelines, type StepDeps } from './segment-load-pipeline';
import {
  dispatchCuesStep,
  type TextFrame,
  type TextLoadStep,
  type TextStepDeps,
  textStepWiring,
} from './text-segment-load-pipeline';

/** The composition slots these steps read — the view asserted from the opaque `deps.state`. */
interface RelocationSlots {
  presentation?: MaybeResolvedPresentation;
  mediaContainerData?: Record<string, MediaContainerData>;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
}

type ContainerSlot = Signal<Record<string, MediaContainerData> | undefined>;

/** Assert the relocation state view from the opaque step deps — this module knows the slots the composition provides. */
function relocationState(deps: StepDeps): StateSignals<RelocationSlots> {
  return deps.state as unknown as StateSignals<RelocationSlots>;
}

function containerSlot(deps: StepDeps): ContainerSlot {
  return relocationState(deps).mediaContainerData;
}

/** Synchronous RMW of the per-type entry — disjoint keys across producers, so no lost update. */
function writeContainer(slot: ContainerSlot, trackType: string, patch: Partial<MediaContainerData>): void {
  update(slot, (current) => ({ ...current, [trackType]: { ...current?.[trackType], ...patch } }));
}

/**
 * Resolve once `read()` returns a number. Shared by the A/V stamp (waits for the `derive`d origin — immediate for
 * per-type, the shared-`min` barrier for coordinated) and the text step (waits for the primary A/V origin). No bound:
 * for fMP4 the origin always establishes.
 */
function awaitDefined(read: () => number | undefined): Promise<number> {
  return new Promise((resolve) => {
    let stop: (() => void) | undefined;

    stop = effect(() => {
      const value = read();

      if (value !== undefined) {
        stop?.();
        resolve(value);
      }
    });
  });
}

/**
 * Relocation pipelines for one track type — a plain config `messagePipelines`. Keyed by **track type** (`'video'` /
 * `'audio'`), so ABR rungs of a type share the origin (discover skips once the type's value is present). The steps
 * read/write `state.mediaContainerData[trackType]` via their call-time `deps`; the stamp applies the same
 * `deriveStartMediaTime` seam the reactor uses, read from the composition config at call time, so the buffer offset and
 * the model's `startMediaTime` agree. A composition whose config carries no `deriveStartMediaTime` doesn't relocate:
 * the stamp leaves appends native.
 */
export function relocationPipelinesFor(trackType: 'video' | 'audio'): MessagePipelines {
  const handlerType: MediaHandlerType = trackType === 'video' ? 'vide' : 'soun';

  /**
   * Init step: head-peek the buffered media track's `track_id` + `mdhd` timescale into `mediaContainerData[trackType]`.
   * Matching by handler (`vide`/`soun`) skips a muxed `clcp` caption track, and the `track_id` lets `readSegmentOrigin`
   * read _this_ track's `tfdt` rather than the first `traf` in the segment.
   */
  const readInitTrackInfo: LoadStep = async (frame, _signal, deps) => {
    const { op } = frame;
    if (op.type !== 'append-init' || !frame.data) return;

    const slot = containerSlot(deps);
    if (peek(slot)?.[trackType]?.timescale !== undefined) return; // already have it (any rung of this type)

    frame.data = await peekHead(frame.data, (bytes) => {
      const track = findMediaTrack(bytes, handlerType);
      if (track === undefined) return false;

      writeContainer(slot, trackType, { trackId: track.trackId, timescale: track.timescale });
      return true;
    });
  };

  /**
   * Media-segment step: head-peek the `tfdt` baseMediaDecodeTime of the media track's `traf` (matched by the `track_id`
   * discovered from the init), recording the segment's 0-based `startTime` with it — the origin is `bmdt/ts −
   * segmentStartTime`, so the first _loaded_ segment need not be the 0th. Without a discovered `track_id` (non-fMP4 /
   * mock init) there's no media track to relocate, so the step no-ops and the append stays native.
   */
  const readSegmentOrigin: LoadStep = async (frame, _signal, deps) => {
    const { op } = frame;
    if (op.type !== 'append-segment' || !frame.data) return;

    const slot = containerSlot(deps);
    const container = peek(slot)?.[trackType];
    if (container?.baseMediaDecodeTime !== undefined) return; // established

    const { trackId } = container ?? {};
    if (trackId === undefined) return; // init didn't identify a media track — nothing to match

    const segmentStartTime = op.meta.startTime;

    frame.data = await peekHead(frame.data, (bytes) => {
      const baseMediaDecodeTime = readBaseMediaDecodeTime(bytes, trackId);
      if (baseMediaDecodeTime === undefined) return false;

      writeContainer(slot, trackType, { baseMediaDecodeTime, segmentStartTime });
      return true;
    });
  };

  /**
   * Stamp step — tier-agnostic apply. Relocate by the `derive`d `startMediaTime` for this type (`offset =
   * −startMediaTime`). Applies the **same** `derive` the reactor uses, over the shared `mediaContainerData` slot — so
   * the buffer offset matches the model's stamped `startMediaTime`, and it's robust to `established` + late tracks (the
   * slot persists; the model value may not be re-stamped after the reactor goes sticky). Awaited: per-type resolves at
   * once (own origin discovered earlier in this pipeline); shared-`min` waits until every selected A/V origin is in —
   * the barrier, filled by the other type's discover step. A derived `0` (0-PTS / below threshold) leaves the append
   * native — setting `timestampOffset` at all can ripple.
   */
  const stampStartMediaTime: LoadStep = async (frame, signal, deps) => {
    if (frame.op.type !== 'append-segment') return;

    // SAFETY: `config` is the composition config threaded through the loader; `deriveStartMediaTime` is optional on it.
    const derive = (deps.config as { deriveStartMediaTime?: DeriveStartMediaTime }).deriveStartMediaTime;
    if (!derive) return;

    const state = relocationState(deps);
    // Liveness guard: if THIS type's own origin wasn't discovered — `readSegmentOrigin`
    // ran earlier in this pipeline and found no `tfdt` (mock / TS / containerless) — the
    // source isn't relocatable, so leave the append native and DON'T wait. Only a
    // discoverable type awaits the derived origin (which for shared-`min` legitimately
    // blocks on the other selected type — the barrier).
    const own = peek(state.mediaContainerData)?.[trackType];

    if (own?.timescale === undefined || own.baseMediaDecodeTime === undefined || own.segmentStartTime === undefined) {
      return;
    }

    const startMediaTime = await awaitDefined(() => {
      const containerData = state.mediaContainerData.get();
      if (!containerData) return undefined;

      return derive(containerData, {
        selectedVideoTrackId: state.selectedVideoTrackId?.get(),
        selectedAudioTrackId: state.selectedAudioTrackId?.get(),
      })[trackType];
    });
    if (signal.aborted || startMediaTime === 0) return;

    frame.meta = { ...(frame.meta ?? frame.op.meta), timestampOffset: -startMediaTime };
  };

  return () => ({
    remove: [dispatchStep],
    'append-init': [fetchStep, readInitTrackInfo, dispatchStep],
    'append-segment': [fetchStep, readSegmentOrigin, stampStartMediaTime, dispatchStep],
  });
}

// ============================================================================
// TEXT (cue relocation)
// ============================================================================

/**
 * Resolve step for the relocation text pipeline. Reuses the injected host resolver (the loader's folded
 * `resolveSegment`, via `textStepWiring`) for cues and fetches the `X-TIMESTAMP-MAP` header in parallel, stashing it on
 * `frame.metadata` for `relocateCuesStep`. Replaces the base `resolveCuesStep` (which fetches cues only) — text's
 * native `<track>` parser discards the header, so the map needs its own raw-bytes fetch.
 */
const resolveWithMetadataStep = async <C extends Cue>(
  frame: TextFrame<C>,
  signal: AbortSignal,
  deps: TextStepDeps
): Promise<void> => {
  const [cues, metadata] = await Promise.all([
    textStepWiring<C>(deps).resolveSegment(frame.op.segment.url),
    resolveVttSegmentMetadata(frame.op.segment.url),
  ]);

  if (signal.aborted) return;

  frame.cues = cues;
  frame.metadata = metadata;
};

/**
 * Relocate step — shifts each cue onto the 0-based presentation timeline: `cueFinal = cueNative − startMediaTime`,
 * where `startMediaTime` is the primary A/V track's origin (selected **video**, else **audio** — the single-anchor
 * rule, and defensive like the reactor's optional selection) and `cueNative` folds in the `X-TIMESTAMP-MAP` correction
 * (`mpegts/90000 − local`) for map-bearing VTT (Apple) or is the absolute cue time (no map, e.g. Mux). Text can resolve
 * before A/V establishes, so the origin is awaited; fMP4 always establishes it (0-PTS → 0), and a text-only source (no
 * A/V selected) simply gets offset 0.
 */
const relocateCuesStep = async <C extends Cue>(
  frame: TextFrame<C>,
  signal: AbortSignal,
  deps: TextStepDeps
): Promise<void> => {
  if (!frame.cues?.length) return;

  const state = deps.state as unknown as StateSignals<RelocationSlots>;
  const startMediaTime = await awaitDefined(() => {
    const presentation = state.presentation.get();
    if (!presentation) return undefined;

    const primaryId = state.selectedVideoTrackId?.get() ?? state.selectedAudioTrackId?.get();

    if (primaryId !== undefined) {
      // A/V selected: use its origin once stamped (undefined until then → keep waiting).
      return findTrackById(presentation, primaryId)?.startMediaTime;
    }

    // No A/V selected. Distinguish "not selected YET" from "text-only source". If the
    // presentation has A/V tracks, one WILL be selected and stamped — wait for it, or the
    // cues get shifted by the full `mapCorrection` (e.g. +10s on Apple X-TIMESTAMP-MAP
    // sources) when text relocation wins the race against A/V selection. Only a genuinely
    // text-only source (no A/V origin ever coming) legitimately relocates by offset 0.
    const hasAv =
      getTracksByType(presentation, 'video').length > 0 || getTracksByType(presentation, 'audio').length > 0;

    return hasAv ? undefined : 0;
  });

  if (signal.aborted) return;

  const { timestampMap } = (frame.metadata as TextSegmentMetadata | undefined) ?? {};
  const mapCorrection = timestampMap ? timestampMap.mpegts / 90000 - timestampMap.local : 0;
  const delta = mapCorrection - startMediaTime;

  if (delta !== 0) {
    for (const cue of frame.cues) {
      cue.startTime += delta;
      cue.endTime += delta;
    }
  }
};

/**
 * Relocation text pipeline — the text analog of `relocationPipelinesFor(type)`. `resolveWithMetadata` (cues +
 * `X-TIMESTAMP-MAP`) → `relocateCues` (shift by the primary A/V origin) → `dispatchCues`.
 */
export const relocatingTextPipelines = <C extends Cue>(): TextLoadStep<C>[] => [
  resolveWithMetadataStep,
  relocateCuesStep,
  dispatchCuesStep,
];
