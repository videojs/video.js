/**
 * Establish the presentation's coordinate origin — the `startTime` / `startMediaTime` / `startDate` triple — once per
 * source, so every track lands on one 0-based presentation timeline. One establishment unit with an internal order: the
 * wall-clock **anchor** settles (live PDT sources), gated parses align to it, then `startMediaTime` latches — see
 * `internal/design/spf/live-presentation-timeline-model.md`.
 *
 * The two coordinate stamps it owns:
 *
 * - **`startDate` (wall-clock anchor).** The designated _reference track_ (selected video, else audio) resolves first;
 *   its parser-computed `startDate` — PDT at presentation-0 — is frozen as the anchor and stamped onto every other
 *   track that lacks one, so their first parses place via `placeOnAnchor` (the pre-applied-anchor path in
 *   `parse-media-playlist`) and later-selected renditions resolve already aligned. Ordering is enforced by
 *   {@link gateFirstParseOnAnchor}, which `resolve-track` awaits through its injected gate seam. Absent PDT (ordinary
 *   VOD), no anchor is stamped and local-from-0 placement is already correct.
 * - **`startMediaTime` (decode origin).** Runs the injected {@link DeriveStartMediaTime} seam over the transient
 *   `mediaContainerData` slot (owned here; `inactive` clears it per source) and stamps the settled value onto the model
 *   until `established`. The byte-level discover/stamp steps that fill the slot are a separate, config
 *   `messagePipelines` array (`primitives/relocation-pipelines`); the two coordinate only through the shared
 *   `state.mediaContainerData` slot, never by import. See `internal/design/spf/presentation-timeline-model.md`.
 *
 * DOM-free reactor; sticky per source (`inactive → monitoring → established`).
 */
import type { Behavior } from '../../core/composition/define-behavior';
import { createMachineReactor, type Reactor } from '../../core/reactors/create-machine-reactor';
import { type ReadonlySignal, type Signal, update } from '../../core/signals/primitives';
import {
  isResolvedPresentation,
  isResolvedTrack,
  type MaybeResolvedPresentation,
  type MediaContainerData,
  type Presentation,
} from '../../media/types';
import { findTrackById } from '../../media/utils/tracks';
import type { DeriveStartMediaTime, DeriveStartMediaTimeContext } from '../primitives/derive-start-media-time';
import type { GateFirstParse, GateFirstParseContext } from '../primitives/gate-first-parse';

export type { DeriveStartMediaTime, DeriveStartMediaTimeContext, GateFirstParse, GateFirstParseContext };

// ============================================================================
// STATE / CONFIG
// ============================================================================

export interface EstablishStartMediaTimeState {
  presentation?: MaybeResolvedPresentation;
  /**
   * Transient origin-establishment data, keyed by **track type** (`'video'` / `'audio'`) — per spec one init+media pair
   * per type suffices, and ABR rungs of a type share the origin. Filled by the discover steps across appends, reset per
   * source. Never the model — the churn stays here; only the settled `startMediaTime` reaches `Track`.
   */
  mediaContainerData?: Record<string, MediaContainerData>;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
}

/**
 * A single type's own media-timeline origin: `baseMediaDecodeTime/timescale − segmentStartTime` (the `segmentStartTime`
 * term makes it the stream origin even when the first loaded segment isn't the 0th). `undefined` until timescale +
 * baseMediaDecodeTime + segmentStartTime are all present.
 */
function ownOrigin(data: MediaContainerData | undefined): number | undefined {
  const { timescale, baseMediaDecodeTime, segmentStartTime } = data ?? {};

  return timescale != null && baseMediaDecodeTime != null && segmentStartTime != null
    ? baseMediaDecodeTime / timescale - segmentStartTime
    : undefined;
}

/**
 * Origins below this magnitude (seconds) are treated as `0` — the derive returns `0`, so the presentation is left on
 * its native (~0-based) timeline and no `timestampOffset` is set (the loader stamp no-ops on a derived `0`). Ordinary
 * VOD carries a small nonzero encode origin (audio priming, first-frame CTS, edit lists); relocating by a sub-second
 * amount is pointless, and setting `timestampOffset` at all can ripple edge segments. Relocation targets streams with
 * an intentional large origin (instant clips, bipbop @10s).
 *
 * Absolute basis, not proportional: the DTS-below-zero / ripple risk scales with the origin's absolute size, not with
 * the presentation's duration. Also snaps negatives to `0` — a negative origin would relocate _forward_, which is never
 * the intent.
 */
const NEAR_ZERO_ORIGIN_THRESHOLD = 1;

/** Snap a below-threshold (incl. negative) origin to `0` so it isn't relocated. */
function thresholdOrigin(origin: number): number {
  return origin < NEAR_ZERO_ORIGIN_THRESHOLD ? 0 : origin;
}

/**
 * The **default** — relocate the whole presentation by one shared origin: the `min` across the _selected_ A/V tracks'
 * own origins, denormalized onto every type. This single reduce subsumes the "per-type" and "shared" tiers:
 *
 * - **aligned A/V** — `min` equals each origin (they're equal), so it matches per-type;
 * - **skewed A/V** (e.g. Apple's 44ms audio-lead) — `min` keeps every track's earliest DTS ≥ 0 (relocating by ≤ each own
 *   origin never drives one negative) _and_ preserves the real skew (per-type would flatten it, desyncing A/V);
 * - **single type / muxed** — `min` of the one origin is that origin.
 *
 * Returns `undefined` for every type until all _selected_ types have a complete origin (the shared-`min` barrier).
 * Which types must contribute is read from `ctx` (the selected v/a ids); with no selection context it coordinates
 * across whatever types have data. A shared origin below {@link NEAR_ZERO_ORIGIN_THRESHOLD} is returned as `0` (native
 * — ordinary ~0-PTS VOD isn't relocated).
 */
export const deriveSharedMinStartMediaTime: DeriveStartMediaTime = (containerData, ctx) => {
  const contributingTypes: string[] = [];

  if (ctx.selectedVideoTrackId != null) contributingTypes.push('video');

  if (ctx.selectedAudioTrackId != null) contributingTypes.push('audio');

  const types = contributingTypes.length > 0 ? contributingTypes : Object.keys(containerData);

  const origins = types.map((type) => ownOrigin(containerData[type]));
  // Barrier: not ready until every contributing type has a complete origin.
  if (origins.length === 0 || origins.some((origin) => origin === undefined)) return {};

  const shared = thresholdOrigin(Math.min(...(origins as number[])));
  const out: Record<string, number | undefined> = {};

  for (const type of Object.keys(containerData)) out[type] = shared;

  return out;
};

/**
 * Coordination-axis _off_ — each type relocates by its own origin, independently. Not the default: it flattens real A/V
 * skew (see {@link deriveSharedMinStartMediaTime}). Kept as an opt-in for compositions that know their A/V is aligned
 * and want to skip the shared-`min` barrier (each type stamps as soon as its own origin is discovered).
 *
 * Caution: {@link NEAR_ZERO_ORIGIN_THRESHOLD} applies independently per type here — if two types' origins straddle it,
 * one snaps to `0` and the other doesn't, injecting up to a threshold's worth of A/V offset. Safe for the intended
 * aligned-A/V opt-in; see `internal/design/spf/live-presentation-timeline-model.md` (collision 5).
 */
export const derivePerTypeStartMediaTime: DeriveStartMediaTime = (containerData) => {
  const out: Record<string, number | undefined> = {};

  for (const [type, data] of Object.entries(containerData)) {
    const origin = ownOrigin(data);

    out[type] = origin === undefined ? undefined : thresholdOrigin(origin);
  }

  return out;
};

/**
 * The anchor-source track: the selected video track, falling back to audio (audio-only). Deterministic — never "first
 * resolved", which is race-dependent under concurrent resolves.
 */
function referenceTrackId(ctx: GateFirstParseContext): string | undefined {
  return ctx.selectedVideoTrackId ?? ctx.selectedAudioTrackId;
}

/**
 * The live-anchor first-parse gate (the "parses align" step of the establishment order). Open for the reference track
 * itself — its local-from-0 placement _is_ the presentation timeline (presentation-0 = the join point). Every other
 * track holds until the reference's first parse settles the anchor question: no PDT → local placement is already
 * correct, proceed; PDT anchor → hold until the establishment reactor stamps it onto this track, so the parse takes the
 * `placeOnAnchor` path. Establishment is sticky-once, so an unanchored first parse would be permanently misaligned —
 * that's the race this gate closes.
 *
 * Pairs with the {@link establishStartMediaTime} reactor (the stamp that opens the anchored branch); wire both or
 * neither.
 */
export const gateFirstParseOnAnchor: GateFirstParse = (presentation, ctx, trackId) => {
  const referenceId = referenceTrackId(ctx);
  if (referenceId === undefined || referenceId === trackId) return true;

  if (!isResolvedPresentation(presentation)) return false;

  const reference = findTrackById(presentation, referenceId);
  // A dangling reference id can never anchor — don't deadlock on it.
  if (!reference) return true;

  if (!isResolvedTrack(reference)) return false;

  if (reference.startDate === undefined) return true;

  return findTrackById(presentation, trackId)?.startDate !== undefined;
};

export interface EstablishStartMediaTimeConfig {
  /** The reduce seam (coordination knob). Defaults to {@link deriveSharedMinStartMediaTime}. */
  deriveStartMediaTime?: DeriveStartMediaTime;
}

// ============================================================================
// REACTOR (owns the transient slot; derives + consumes onto the model)
// ============================================================================

/**
 * Stamp the frozen wall-clock anchor as `startDate` onto every track that lacks one (idempotent — same reference when
 * nothing moved). Unresolved shells pick it up as the `placeOnAnchor` preset; covering _all_ tracks in one pass means
 * any track selected later — an ABR rung, another audio language, late captions — resolves already anchored. The
 * reference track's own parser-computed `startDate` reads back as the anchor, so it's naturally left untouched.
 */
function stampStartDates(presentation: Presentation, anchor: number): Presentation {
  let changed = false;
  const selectionSets = presentation.selectionSets.map((selectionSet) => ({
    ...selectionSet,
    switchingSets: selectionSet.switchingSets.map((switchingSet) => ({
      ...switchingSet,
      tracks: switchingSet.tracks.map((track) => {
        if (track.startDate !== undefined) return track;

        changed = true;
        return { ...track, startDate: anchor };
      }),
    })),
  }));

  return changed ? ({ ...presentation, selectionSets } as Presentation) : presentation;
}

/** Stamp the derived per-track `startMediaTime` onto the model (idempotent — same reference when nothing moved). */
function stampTracks(presentation: Presentation, startMediaTimes: Record<string, number | undefined>): Presentation {
  let changed = false;
  const selectionSets = presentation.selectionSets.map((selectionSet) => ({
    ...selectionSet,
    switchingSets: selectionSet.switchingSets.map((switchingSet) => ({
      ...switchingSet,
      tracks: switchingSet.tracks.map((track) => {
        const startMediaTime = startMediaTimes[track.type];
        if (startMediaTime === undefined || track.startMediaTime === startMediaTime) return track;

        changed = true;
        return { ...track, startMediaTime };
      }),
    })),
  }));

  return changed ? ({ ...presentation, selectionSets } as Presentation) : presentation;
}

type EstablishFsmState = 'inactive' | 'monitoring' | 'established';

interface EstablishStartMediaTimeDeps {
  state: {
    presentation: Signal<EstablishStartMediaTimeState['presentation']>;
    mediaContainerData: Signal<EstablishStartMediaTimeState['mediaContainerData']>;
    // Optional so the one behavior composes across video-only / audio-only / both,
    // like other cross-track-type behaviors (present at runtime iff a sibling owns it).
    selectedVideoTrackId?: ReadonlySignal<EstablishStartMediaTimeState['selectedVideoTrackId']>;
    selectedAudioTrackId?: ReadonlySignal<EstablishStartMediaTimeState['selectedAudioTrackId']>;
  };
  config?: EstablishStartMediaTimeConfig;
}

function establishStartMediaTimeSetup({
  state,
  config = {},
}: EstablishStartMediaTimeDeps): Reactor<EstablishFsmState | 'destroying' | 'destroyed'> {
  const derive = config.deriveStartMediaTime ?? deriveSharedMinStartMediaTime;

  const selectionContext = (): DeriveStartMediaTimeContext => ({
    selectedVideoTrackId: state.selectedVideoTrackId?.get(),
    selectedAudioTrackId: state.selectedAudioTrackId?.get(),
  });

  /** Established once the selected A/V tracks (whichever exist) carry `startMediaTime`. */
  const established = (): boolean => {
    const presentation = state.presentation.get();
    if (!isResolvedPresentation(presentation)) return false;

    const ids = [state.selectedVideoTrackId?.get(), state.selectedAudioTrackId?.get()].filter(
      (id): id is string => id !== undefined
    );

    return ids.length > 0 && ids.every((id) => findTrackById(presentation, id)?.startMediaTime !== undefined);
  };

  return createMachineReactor<EstablishFsmState>({
    initial: 'inactive',
    monitor: () => {
      if (!isResolvedPresentation(state.presentation.get())) return 'inactive';

      return established() ? 'established' : 'monitoring';
    },
    states: {
      // Fresh per source: clear the transient slot so a new source re-discovers.
      inactive: { entry: () => state.mediaContainerData.set(undefined) },
      // The establishment order, as two effects: anchor first, derive second.
      // Both stamps are sticky per source — disabled on entry to `established`,
      // and a new source re-enters through `inactive`.
      monitoring: {
        effects: [
          // Anchor: freeze the wall-clock origin from the reference track's
          // first parse and stamp it onto every other track (the gate's open
          // condition + the `placeOnAnchor` preset for shells). Reads the
          // presentation tracked — it must see the reference resolve — and its
          // own write converges immediately (the stamp is idempotent, so the
          // re-run sets an identical value and stops).
          () => {
            const presentation = state.presentation.get();
            if (!isResolvedPresentation(presentation)) return;

            const referenceId = referenceTrackId(selectionContext());
            const reference = referenceId === undefined ? undefined : findTrackById(presentation, referenceId);
            if (!reference || !isResolvedTrack(reference)) return;

            const anchor = reference.startDate;
            if (anchor === undefined) return;

            update(state.presentation as Signal<MaybeResolvedPresentation>, (current) =>
              stampStartDates(current as Presentation, anchor)
            );
          },
          // Derive: reduce the accumulating container data into per-track startMediaTime
          // and stamp it onto the model. Re-runs as discover fills the slot; the update
          // reads presentation untracked, so no self-loop.
          () => {
            const containerData = state.mediaContainerData.get();
            if (!containerData) return;

            const startMediaTimes = derive(containerData, selectionContext());

            // `current` is always resolved here — the monitor gates `monitoring` on a
            // resolved presentation and transitions before effects re-run — so we cast
            // to `Presentation` rather than re-narrowing.
            update(state.presentation as Signal<MaybeResolvedPresentation>, (current) =>
              stampTracks(current as Presentation, startMediaTimes)
            );
          },
        ],
      },
      established: {},
    },
  });
}

export const establishStartMediaTime: Behavior<
  {
    presentation: Signal<EstablishStartMediaTimeState['presentation']>;
    mediaContainerData: Signal<EstablishStartMediaTimeState['mediaContainerData']>;
  },
  Record<never, never>,
  EstablishStartMediaTimeConfig
> = {
  stateKeys: ['presentation', 'mediaContainerData'],
  contextKeys: [],
  setup: establishStartMediaTimeSetup,
};
