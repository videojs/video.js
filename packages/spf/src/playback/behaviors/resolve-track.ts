import { defineBehavior } from '../../core/composition/create-composition';
import { createMachineReactor } from '../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal, type Signal, update } from '../../core/signals/primitives';
import { when } from '../../core/signals/when';
import { RecurringRunner, type Reschedule, runOnce, Task } from '../../core/tasks/task';
import { NON_FMP4_CONTAINER_MIMES, parseMediaPlaylist } from '../../media/hls/parse-media-playlist';
import type { ResolveKeyUri } from '../../media/hls/resolve-url';
import type { MaybeResolvedPresentation, PartiallyResolvedTrack, ResolvedTrack } from '../../media/types';
import { deriveStreamType, getMediaPlaylistMetadata, isResolvedPresentation, isResolvedTrack } from '../../media/types';
import type { GetCdnId } from '../../media/utils/cdn';
import { applyContainerMimeType, findTrack, updateTrackInPresentation } from '../../media/utils/tracks';
import { credentialsFetch, type RequestCredentialsPolicy } from '../../network/credentials-fetch';
import { fetchResolvableText as defaultFetchResolvableText, type FetchText } from '../../network/fetch';
import { failoverFetch } from '../primitives/failover-fetch';
import type { GateFirstParse } from '../primitives/gate-first-parse';
import type { ReportUnsupportedTrackConditions } from '../primitives/report-track-conditions';
import { AUDIO_TYPE_CONFIG, TEXT_TYPE_CONFIG, VIDEO_TYPE_CONFIG } from '../primitives/track-types';
import { type ErrorEmitterState, emitError } from './collect-errors';

// ============================================================================
// Specialization helper
//
// `setupTrackResolution` has the same shape as a Behavior `setup` function:
// `({ state, config }) => cleanup`. Each `resolveXTrack` export below calls it
// from inside its own `defineBehavior` setup, supplying its per-type config
// inline. The orchestration — gate on a selection, short-circuit when the
// track is already resolved or missing, schedule the fetch+parse, and patch
// the resolved track back into `state.presentation` — is shared.
// ============================================================================

/**
 * State shape for track resolution. Uses `MaybeResolvedPresentation` so it matches the engine's slot type; resolution
 * narrows internally.
 */
export interface ResolveTrackState {
  presentation?: MaybeResolvedPresentation;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
  selectedTextTrackId?: string;
  failedCdns?: string[];
}

type SelectedTrackKey = 'selectedVideoTrackId' | 'selectedAudioTrackId' | 'selectedTextTrackId';

type ResolveTrackStateMap<K extends SelectedTrackKey> = {
  presentation: Signal<ResolveTrackState['presentation']>;
} & { [P in K]: ReadonlySignal<ResolveTrackState[P]> };

/**
 * The playlist fetch each `resolve*` behavior installs: the default text fetch carrying the engine's request
 * credentials, failover-decorated over that so a failed credentialed request still trips the selected track's CDN.
 */
function playlistFetch<K extends SelectedTrackKey>(
  state: ResolveTrackStateMap<K>,
  config: { selectedKey: K; getCdnId?: GetCdnId; requestCredentials?: RequestCredentialsPolicy }
): FetchText {
  return failoverFetch(credentialsFetch(defaultFetchResolvableText, config.requestCredentials), state, config);
}

/**
 * Sibling-owned A/V selection signals, present at runtime iff a sibling behavior owns them. Deliberately not in the
 * typed slice / `stateKeys` (declaring them would force every composition to carry both selections); read only to build
 * the injected first-parse gate's selection context.
 */
type SiblingSelectionSignals = {
  selectedVideoTrackId?: ReadonlySignal<ResolveTrackState['selectedVideoTrackId']>;
  selectedAudioTrackId?: ReadonlySignal<ResolveTrackState['selectedAudioTrackId']>;
};

interface TrackResolutionConfig<K extends SelectedTrackKey> {
  selectedKey: K;
  findTrackToResolve: (
    presentation: MaybeResolvedPresentation,
    trackId: string
  ) => PartiallyResolvedTrack | ResolvedTrack | undefined;
  /** Fetch a track's media-playlist text — already failover-decorated by the behavior. */
  fetchResolvableText?: FetchText;
  /** Holds a track's first parse until its placement inputs settle (live anchor); absent → parse immediately. */
  gateFirstParse?: GateFirstParse;
  /** Live re-run policy for the `RecurringRunner`; absent → resolve once (VOD). */
  reschedule?: Reschedule<ResolvedTrack>;
  /** Report conditions found in the parsed playlist (see `primitives/report-track-conditions`); absent → report nothing. */
  reportUnsupportedTrackConditions?: ReportUnsupportedTrackConditions;
  /** `EXT-X-KEY` URI handling; absent → `parseMediaPlaylist`'s default. */
  resolveKeyUri?: ResolveKeyUri;
}

/** Engine-config slice each `resolve*` behavior reads to build its failover- decorated playlist fetch. */
interface ResolveTrackConfig {
  /** CDN-id derivation for the failover trip; defaults to origin-based `getCdnId`. */
  getCdnId?: GetCdnId;
  /** First-parse placement gate (see `primitives/gate-first-parse`); absent → parse immediately. */
  gateFirstParse?: GateFirstParse;
  /** Live media-playlist re-run policy; absent → resolve once. */
  reschedule?: Reschedule<ResolvedTrack>;
  /** Playlist-derived condition reporting (see `primitives/report-track-conditions`). */
  reportUnsupportedTrackConditions?: ReportUnsupportedTrackConditions;
  /** `EXT-X-KEY` URI handling; absent → `parseMediaPlaylist`'s default. */
  resolveKeyUri?: ResolveKeyUri;
  /** The `credentials` mode media-playlist requests are made with; absent → the platform default. */
  requestCredentials?: RequestCredentialsPolicy;
}

function setupTrackResolution<K extends SelectedTrackKey>({
  state,
  config,
}: {
  // Widened with the optional `errors` slot: reporting writes through it without
  // the behavior declaring ownership, and no-ops when `collectErrors` isn't
  // composed. Same contract as `failedCdns` / `failoverFetch`.
  state: ResolveTrackStateMap<K> & ErrorEmitterState;
  config: TrackResolutionConfig<K>;
}) {
  const {
    selectedKey,
    findTrackToResolve,
    fetchResolvableText = defaultFetchResolvableText,
    gateFirstParse,
    reschedule,
    reportUnsupportedTrackConditions,
    resolveKeyUri,
  } = config;

  // Recurrence lives in the runner: with a `reschedule` (live) it re-runs the
  // task until the policy stops; `runOnce` (VOD) runs it exactly once. Single-
  // slot — a selection change re-schedules (abort-and-replace).
  const runner = new RecurringRunner<ResolvedTrack>(reschedule ?? runOnce);

  // Reactor states model the FSM the previous effect-based body was
  // hand-rolling. 'presentation-resolved' is entered when the
  // presentation is fully parsed (has a Ham id + selectionSets); leaving
  // it (presentation cleared or reset to an unresolved value) aborts all
  // in-flight tasks via the entry-cleanup. Most URL changes go through
  // 'presentation-unresolved' naturally (set undefined → set new partial
  // → re-parse), so the common case is covered by state-exit alone; the
  // task body's commit-time id check covers the pathological
  // resolved→resolved-without-unresolved transition.
  const derivedStateSignal = computed(() =>
    isResolvedPresentation(state.presentation.get())
      ? ('presentation-resolved' as const)
      : ('presentation-unresolved' as const)
  );

  return createMachineReactor({
    initial: 'presentation-unresolved',
    monitor: () => derivedStateSignal.get(),
    states: {
      'presentation-unresolved': {},
      'presentation-resolved': {
        // `entry` runs on state entry; the function it returns is the
        // state-exit cleanup. Returning `() => runner.abortAll()` binds
        // abort-of-in-flight-resolutions to leaving 'presentation-resolved'
        // (presentation cleared/reset, or behavior destroyed) —
        // source-change cancellation expressed structurally through the
        // state machine.
        entry: () => () => runner.abortAll(),
        effects: [
          () => {
            // The reactor's state transitions handle relevant presentation
            // changes (presentation-resolved ↔ presentation-unresolved);
            // within 'presentation-resolved' we peek (untracked read) so
            // internal updates (segments added by sibling tasks, or by this
            // behavior's own reload cycles) don't re-fire the effect.
            const presentation = peek(state.presentation);
            const trackId = state[selectedKey].get();
            if (!presentation || !trackId) return;

            const track = findTrackToResolve(presentation, trackId);
            // Skip a complete or missing track; a resolved-but-incomplete (live)
            // window still reloads — its window may have slid past the playhead.
            if (!track || (isResolvedTrack(track) && Number.isFinite(track.duration))) return;

            // Abort (selection/source change) settles quietly; a genuine resolve
            // failure rejects — swallowed for now (TODO: surface to state).
            const scheduled = runner.schedule(
              // NOTE: This can/maybe will be pulled into a per-use case factory (e.g. something like createResolveTrackTask(track, context, config)),
              // likely eventually passed down via config or a new "definitions" argument (CJP).
              //
              // Re-runs (clones) on each reload, so the body re-reads the live
              // snapshot (via `trackId`) rather than capturing the gate-time
              // `track` — a reload carries the prior window's timeline forward.
              new Task(
                async (signal) => {
                  const snapshot = peek(state.presentation);
                  const current = snapshot ? findTrackToResolve(snapshot, trackId) : undefined;
                  if (!current) throw new Error('resolve-track: selected track not found');

                  // `fetchResolvableText` is the behavior's failover-decorated
                  // fetch: it trips the CDN on a failed fetch (network error or
                  // non-OK status). A parse failure is a content issue, not a
                  // CDN-availability one, so it doesn't trip. The run-time
                  // `current` supplies only the playlist URL (stable across the
                  // fetch).
                  const text = await fetchResolvableText(current, { signal });

                  // Hold placement — never the fetch — until this track's
                  // first-parse placement inputs settle (for live, the
                  // wall-clock anchor; see `primitives/gate-first-parse`).
                  // First parses only — a reload's window is already on the
                  // established timeline. Aborting rejects the wait, so a
                  // source change can't strand a gated task.
                  if (gateFirstParse && !isResolvedTrack(current)) {
                    const { selectedVideoTrackId, selectedAudioTrackId } = state as SiblingSelectionSignals;

                    await when(
                      () =>
                        gateFirstParse(
                          state.presentation.get(),
                          {
                            selectedVideoTrackId: selectedVideoTrackId?.get(),
                            selectedAudioTrackId: selectedAudioTrackId?.get(),
                          },
                          trackId
                        ),
                      { signal }
                    );
                  }

                  // Re-read `previous` after the awaits: a concurrent write
                  // during them — notably the establishment reactor stamping
                  // the anchor `startDate` onto this track's shell — must feed
                  // the parse, not be clobbered (anchoring is establish-once;
                  // parsing the pre-fetch snapshot would strand the track off
                  // the anchor for good). Correctness rests on a
                  // run-to-completion invariant: NOTHING may yield (await)
                  // between this re-read and the write below, so no writer can
                  // interleave. `parseMediaPlaylist` is synchronous — keep it
                  // that way, or move the read into the updater.
                  const live = peek(state.presentation);
                  const previous = live ? findTrackToResolve(live, trackId) : undefined;
                  if (!previous) throw new Error('resolve-track: selected track not found');

                  const mediaTrack = parseMediaPlaylist(text, previous, { resolveKeyUri });

                  // Report what the parse revealed about this rendition, before
                  // committing it. Causes only — one unplayable rendition doesn't
                  // make the source unplayable, so the verdict stays with
                  // track-switching's empty-candidate branch. The reporter gets
                  // the whole config alongside the track, so an extended one
                  // reads its own props off it rather than closing over them.
                  if (reportUnsupportedTrackConditions) {
                    for (const condition of reportUnsupportedTrackConditions(mediaTrack as ResolvedTrack, config)) {
                      emitError(state, condition);
                    }
                  }

                  // Updater handles undefined inputs by returning current
                  // unchanged; isResolvedPresentation narrows for the patch.
                  // State-exit on resolving→unresolved fires runner.abortAll
                  // before any URL change settles, and per the Fetch spec the
                  // signal abort cancels in-flight body reads — so by the
                  // time we reach this point the presentation we resolved
                  // against is the live one.
                  update(state.presentation, (current) => {
                    if (!isResolvedPresentation(current)) return current;

                    const patched = updateTrackInPresentation(current, mediaTrack);
                    // Container is uniform within a type (an ABR ladder shares
                    // its container), so a detected non-fMP4 rendition (TS,
                    // raw AAC) implies every rendition of *this* type matches —
                    // relabel them all from one resolved playlist instead of
                    // fetching each. Scoped to this track's own type: never cross
                    // audio↔video (mixed-container sources exist, e.g. muxed-TS
                    // video + raw-.aac audio), which also keeps per-type
                    // resolutions' writes disjoint (no race).
                    const relabeled = NON_FMP4_CONTAINER_MIMES.has(mediaTrack.mimeType)
                      ? applyContainerMimeType(patched, mediaTrack.type, mediaTrack.mimeType)
                      : patched;

                    // Stream nature (live vs on-demand), rewritten from whichever
                    // track just parsed — every type's resolve and every live
                    // reload takes this path. Idempotent in practice rather than
                    // by construction: `PLAYLIST-TYPE` is a per-source constant
                    // that a source's renditions agree on, so each write lands
                    // the same value. Renditions that disagreed would make the
                    // winner resolve-order-dependent.
                    return { ...relabeled, streamType: deriveStreamType(getMediaPlaylistMetadata(mediaTrack)) };
                  });
                  return mediaTrack;
                },
                { id: track.id }
              )
            );

            scheduled.catch(() => {});
          },
        ],
      },
    },
  });
}

// ============================================================================
// Per-helper-per-type configs — defaults that variants spread engine config over
// ============================================================================

const VIDEO_TRACK_RESOLUTION_CONFIG = {
  ...VIDEO_TYPE_CONFIG,
  findTrackToResolve: (presentation: MaybeResolvedPresentation, trackId: string) =>
    findTrack(presentation, 'video', trackId),
} as const;

const AUDIO_TRACK_RESOLUTION_CONFIG = {
  ...AUDIO_TYPE_CONFIG,
  findTrackToResolve: (presentation: MaybeResolvedPresentation, trackId: string) =>
    findTrack(presentation, 'audio', trackId),
} as const;

const TEXT_TRACK_RESOLUTION_CONFIG = {
  ...TEXT_TYPE_CONFIG,
  findTrackToResolve: (presentation: MaybeResolvedPresentation, trackId: string) =>
    findTrack(presentation, 'text', trackId),
} as const;

// ============================================================================
// Specialized exports — one per track type
// ============================================================================

/**
 * Resolve unresolved video tracks. Schedules a fetch task whenever the selected video track is partially resolved,
 * parses the manifest, and writes the resolved track back into `state.presentation`.
 */
export const resolveVideoTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedVideoTrackId'],
  contextKeys: [],
  setup: ({
    state,
    config = {},
  }: {
    state: ResolveTrackStateMap<'selectedVideoTrackId'>;
    config?: ResolveTrackConfig;
  }) => {
    // Engine `config` layers over the per-type defaults (mirrors the other
    // per-type variants, see track-types.ts); `failoverFetch` reads its
    // `selectedKey` + `getCdnId` from the merged result. `fetchResolvableText`
    // is then placed AFTER the spread so the failover-decorated fetch wins —
    // unlike segments, playlists expose no overridable per-type fetch.
    const trackConfig = { ...VIDEO_TRACK_RESOLUTION_CONFIG, ...config };

    return setupTrackResolution({
      state,
      config: { ...trackConfig, fetchResolvableText: playlistFetch(state, trackConfig) },
    });
  },
});

/** Resolve unresolved audio tracks. Same shape as `resolveVideoTrack`, narrowed to audio. */
export const resolveAudioTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedAudioTrackId'],
  contextKeys: [],
  setup: ({
    state,
    config = {},
  }: {
    state: ResolveTrackStateMap<'selectedAudioTrackId'>;
    config?: ResolveTrackConfig;
  }) => {
    // Key order is load-bearing — see resolveVideoTrack.
    const trackConfig = { ...AUDIO_TRACK_RESOLUTION_CONFIG, ...config };

    return setupTrackResolution({
      state,
      config: { ...trackConfig, fetchResolvableText: playlistFetch(state, trackConfig) },
    });
  },
});

/** Resolve unresolved text tracks. Same shape as `resolveVideoTrack`, narrowed to text. */
export const resolveTextTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedTextTrackId'],
  contextKeys: [],
  setup: ({
    state,
    config = {},
  }: {
    state: ResolveTrackStateMap<'selectedTextTrackId'>;
    config?: ResolveTrackConfig;
  }) => {
    // Key order is load-bearing — see resolveVideoTrack.
    const trackConfig = { ...TEXT_TRACK_RESOLUTION_CONFIG, ...config };

    return setupTrackResolution({
      state,
      config: { ...trackConfig, fetchResolvableText: playlistFetch(state, trackConfig) },
    });
  },
});
