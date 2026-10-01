/**
 * **Per-type track selection as a rule chain.** While a presentation is resolved, owns that type's
 * `selected{Video,Audio,Text}TrackId` signal: pick a default, react to user intent and algorithmic ranking, and clear
 * it on src unload.
 *
 * Selection runs in two stages. First a **hard-constraints pre-pass** (`applyConstraints`) prunes the unplayable from
 * the candidate set — the failed-CDN constraint (`excludeFailedCdns`, failover cooldown), the capability constraint
 * (`excludeUnplayableTracks`, codec support), and the codec-family sticky constraint (`stickToSelectedCodecs`, no
 * `SourceBuffer.changeType()` — see its note). Then a small ordered chain of rules (`applyRules`) picks among the
 * survivors. Each constraint/rule reads the signals it needs at apply time, so the effect subscribes to exactly what
 * was consulted. The chain runs most authoritative first:
 *
 * 1. **user intent** — a soft filter on `user*TrackSelection`: narrow to the partial-track match; an empty match falls
 *    through to the full set.
 * 2. **codec-family preference** — a soft filter on `preferredCodecs` (`preferCodecFamilies`, default AVC/AAC): on a
 *    mixed-codec source, narrow which family the _initial_ pick — the one the sticky constraint then holds — lands in.
 *    Behind user intent so an explicit initial pick may land anywhere; inert once the constraint narrows to a
 *    non-preferred family.
 * 3. **active CDN** — a soft filter on `cdnPriority` (`preferActiveCdn`): narrow to the highest-priority CDN that still
 *    has tracks; an empty match falls through. Shared by video and audio, so every type stays on one CDN
 *    (`deriveCdnPriority` owns the list). No-op for non-redundant sources.
 * 4. **audio preference** — a soft filter (audio only): narrow to `preferredAudioLanguage` matches, or manifest-default
 *    tracks when the language has no match. Keeps all matching renditions for the bandwidth ranker.
 * 5. **player resolution** — a soft filter on `playerResolution` (`playerResolutionCap`, video only): narrow to the
 *    smallest rendition tier covering the player element, plus everything below it. No-op without a measurement. Ahead
 *    of the ranker but behind the CDN scope, so the cap chooses _within_ a host rather than between hosts.
 * 6. **ranking** — the terminal sort: `rankByBandwidth`, shared by video and audio. Fitting tracks (within the throughput
 *    threshold) first, highest bitrate first; over-throughput tracks after, least-over first. Hysteresis via boosting
 *    the current track's sort weight by `upgradeMargin`.
 *
 * The composer's early-bail (one survivor → stop) is load-bearing: a user selection that narrows to a single track is
 * the pick without the ranker running, so the bandwidth estimate is never read and the effect doesn't re-fire on
 * bandwidth while that choice holds.
 *
 * Lifecycle: `'presentation-unresolved'` ↔ `'presentation-resolved'`. The resolved state owns the signal; its
 * entry-returned cleanup clears it on exit (canonical cleanup-binds-to-setup per `reactors.md`).
 *
 * The pick is the chain's result mapped to a slot value by `resolveSelection` (default: the head,
 * `applyRules(...)[0]`). Each variant supplies its **constraints + rule chain (+ optional resolveSelection)** via
 * config; `setupTrackSwitching` owns only the lifecycle and runs what it's given. Both chains are themselves config: a
 * per-type key pair (`videoConstraints` / `videoRules`, `audioConstraints` / `audioRules`, `textConstraints` /
 * `textRules`) that replaces the whole chain, defaulting to the `DEFAULT_*` constants below. Per type because one
 * engine config reaches every variant. Video and audio default to constraints `[excludeFailedCdns,
 * excludeUnplayableTracks, stickToSelectedCodecs]` then rules `[filterByUserSelection, preferCodecFamilies,
 * preferActiveCdn, rankByBandwidth]` and take the head; video inserts `playerResolutionCap` after the active-CDN scope,
 * audio inserts its language/default preference there. `switchVideoTrack` also accepts ABR tuning config.
 * `switchTextTrack` differs — selection is _optional_ (captions are opt-in / off-able), so it runs
 * `[excludeFailedCdns]` + `[preferActiveCdn]` and supplies a text terminal (`pickResolvedTextTrack`) that resolves
 * standing user intent (`userTextTrackSelection`, incl. `'off'`) and may yield no selection. (The active-CDN _scope_ is
 * the sticky-pick half of multi-CDN; the failed-CDN _constraint_ is the failover half — prune the cooled-down CDN, the
 * scope falls to the next.)
 *
 * When the pre-pass prunes a type that _has_ tracks to empty, the behavior clears the selection (so a now-unplayable
 * pick can't linger and stall) and reports the type's `noSupportedTrackCode`. Which constraint emptied the set is
 * deliberately not consulted — the behavior reads no constraint's state, so the chain stays composable. A type with no
 * tracks at all is left alone; that's a legitimate source shape, not a failure. The late `createSourceBuffer` check
 * stays as the structural backstop.
 */

import { type AnySlotMap, defineBehavior } from '../../core/composition/create-composition';
import { createMachineReactor } from '../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal, type Signal } from '../../core/signals/primitives';
import { DEFAULT_QUALITY_CONFIG, type QualityConfig, resolutionArea } from '../../media/abr/quality-selection';
import { SVTA_NO_SUPPORTED_AUDIO_TRACK, SVTA_NO_SUPPORTED_VIDEO_TRACK } from '../../media/errors';
import type { Resolution } from '../../media/primitives/resolution';
import {
  type AudioSelectionConfig,
  matchesPartialTrack,
  pickTextTrackFromTracks,
  smallestCoveringPixelArea,
  type TextSelectionConfig,
  tracksUnderPixelArea,
} from '../../media/primitives/select-tracks';
import {
  type AudioTrack,
  type CanPlayTrack,
  isResolvedPresentation,
  type MaybeResolvedPresentation,
  type PartiallyResolvedAudioTrack,
  type PartiallyResolvedTextTrack,
  type PartiallyResolvedVideoTrack,
  type TextTrack,
  type VideoTrack,
} from '../../media/types';
import { getCdnId as defaultGetCdnId, type GetCdnId } from '../../media/utils/cdn';
import { getCodecFamilies, getTracksByType } from '../../media/utils/tracks';
import type { BandwidthConfig, BandwidthState } from '../../network/bandwidth-estimator';
import { DEFAULT_BANDWIDTH_CONFIG, getBandwidthEstimate } from '../../network/bandwidth-estimator';
import type { SelectionRule, SelectionRuleDeps } from '../primitives/selection-rules';
import {
  applyConstraints,
  applyRules,
  excludeUnplayableTracks,
  preferCodecFamilies,
  sameCandidateSet,
} from '../primitives/selection-rules';
import { AUDIO_TYPE_CONFIG, TEXT_TYPE_CONFIG, VIDEO_TYPE_CONFIG } from '../primitives/track-types';
import { type ErrorEmitterState, emitError } from './collect-errors';

// ============================================================================
// State + Config
// ============================================================================

/**
 * The slots `setupTrackSwitching` itself owns: the `presentation` gate it reads and the per-type `selected*TrackId` it
 * writes. Rule-only inputs are deliberately absent — `user*TrackSelection` and `bandwidthState` belong to whoever
 * materializes them (the embedder via `shareSignals`, the buffer-actor sampler), and each rule declares the signal it
 * consults as an optional slot on its own deps map, so the behavior never assumes a rule's signal exists.
 */
export interface TrackSwitchingState {
  presentation?: MaybeResolvedPresentation;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
  selectedTextTrackId?: string;
}

interface UserTrackSelections {
  video: Partial<VideoTrack>;
  audio: Partial<AudioTrack>;
  text: Partial<TextTrack> | 'off';
}

/**
 * The user track selections a consumer writes and the track-switching rules read, per track type (all three by
 * default). No behavior declares them, so a composition declares them as inputs with `makeShareSignalsFor`.
 */
export type UserTrackSelectionInputs<T extends keyof UserTrackSelections = keyof UserTrackSelections> = {
  [K in T as `user${Capitalize<K>}TrackSelection`]?: UserTrackSelections[K];
};

/**
 * Config both `switchVideoTrack` and `switchAudioTrack` read — the cross-cutting fields one engine config serves to
 * every variant. Each variant's own config extends this with its chains (and, for video, its ABR tuning).
 */
export interface TrackSwitchingSharedConfig {
  /** Override CDN-id derivation (shared by the CDN scope + failover constraint). */
  getCdnId?: GetCdnId;
  /**
   * Codec capability probe read by the `excludeUnplayableTracks` hard constraint — drops renditions this environment
   * can't decode before selection runs. Injected (rather than imported) so the DOM-free behavior never reaches a DOM
   * API directly; the engine defaults it to the `MediaSource.isTypeSupported`-backed `canPlayTrack`. Absent → no codec
   * filtering (the constraint passes everything through).
   */
  canPlayTrack?: CanPlayTrack;
  /**
   * Codec families (RFC 6381 4CCs, e.g. `'avc1'` / `'hvc1'` / `'mp4a'`) the initial pick prefers on a mixed-codec
   * source, read by the `preferCodecFamilies` scope. With no `SourceBuffer.changeType()`, the initial family is the one
   * `stickToSelectedCodecs` holds for the source's lifetime, so this decides which family that is. Cross-cutting like
   * `getCdnId` — one list serves video and audio (each type's rule matches only the families its tracks carry).
   * Defaults to `DEFAULT_PREFERRED_CODECS` (AVC + AAC); pass `[]` to disable.
   */
  preferredCodecs?: string[];
}

/**
 * Config for `switchVideoTrack`: its chains, plus the ABR tuning read by its ranker rule (`rankByBandwidth`).
 * `quality.safetyMargin` is the bandwidth-headroom multiplier; `quality.upgradeMargin` the hysteresis ratio gating
 * upgrades; `bandwidth` tunes the estimator; `initialBandwidth` is the pre-sample fallback. Defaults:
 * `DEFAULT_QUALITY_CONFIG` (0.85 / 1.15), `DEFAULT_BANDWIDTH_CONFIG`, `DEFAULT_INITIAL_BANDWIDTH` (5 Mbps).
 */
export interface SwitchVideoTrackConfig extends TrackSwitchingSharedConfig {
  /**
   * The hard-constraint pre-pass and rule chain `switchVideoTrack` runs, replacing {@link DEFAULT_VIDEO_CONSTRAINTS} /
   * {@link DEFAULT_VIDEO_RULES} outright — the same whole-chain contract as `selectVideoTrack`'s `videoConstraints` /
   * `videoRules`. Spread the default to extend it: `[...DEFAULT_VIDEO_CONSTRAINTS, excludeRefusedKeySystems]` is how
   * the DRM composition prunes on a slot only it carries. Keyed per type because one engine config reaches every
   * variant.
   */
  videoConstraints?: readonly SwitchVideoTrackRule[];
  videoRules?: readonly SwitchVideoTrackRule[];
  quality?: Partial<QualityConfig>;
  bandwidth?: Partial<BandwidthConfig>;
  initialBandwidth?: number;
}

/**
 * Config for `switchAudioTrack`: its chains over the shared fields. Audio ranks through the same `rankByBandwidth` but
 * carries no ABR tuning — with no audio `bandwidthState` the ranker's tuning is inert, and the ranker always yields a
 * pick.
 */
export interface SwitchAudioTrackConfig extends TrackSwitchingSharedConfig {
  /** `switchAudioTrack`'s chains, replacing {@link DEFAULT_AUDIO_CONSTRAINTS} / {@link DEFAULT_AUDIO_RULES}. */
  audioConstraints?: readonly SwitchAudioTrackRule[];
  audioRules?: readonly SwitchAudioTrackRule[];
}

/** Default initial-bandwidth value before bandwidth measurements arrive. */
export const DEFAULT_INITIAL_BANDWIDTH = 5_000_000;

// ============================================================================
// Specialization helper
//
// `setupTrackSwitching` has the same shape as a Behavior `setup` function:
// `({ state, config }) => Reactor`. Each `switchXTrack` export below calls
// it from inside its own `defineBehavior` setup. Its generics — `S` (selection
// slot key), `T` (candidate track type), `C` (the concrete config the variant
// builds) — all infer from the passed `state` + `config`, so the variants need
// no explicit type arguments. `C extends TrackSwitchingConfig<S, T>` lets the
// variant's richer config (rule-specific fields included) flow through the
// helper untouched; the rules read those fields off their own config views.
//
// -- Design note: why narrow `SelectionKey` / `UserSelectionKey` unions ----
// Goal we did not reach: have callers "fully pass in" the slot keys, with
// the helper enforcing zero internal knowledge of which literals are valid.
// What blocks it: indexing a mapped-type intersection by a generic key.
// When `S extends keyof TrackSwitchingState` (or `string`), TS conservatively
// treats `state[selectionKey]` as the union of every possible match across
// the intersected mapped portions — including the fixed-key signal
// (`presentation`) — and widens to their value-type union.
// The sibling pattern hits the same constraint and answers it the same way:
// `SelectedTrackKey` in `select-tracks.ts` is a hardcoded narrow union for
// the same reason.
//
// Current pick is the narrow-union route because it matches siblings and
// the unions read as documentation ("these are the slots this helper
// manages") rather than restriction. Extending to a new track-switching
// axis is one literal per union.
// --------------------------------------------------------------------------
// ============================================================================

/**
 * Minimum candidate-track shape consumed by the helper and its rules: an `id` (the pick), a `url` (the active-CDN scope
 * derives the CDN from it), an optional `bandwidth` (the ranker's throughput sort), and optional `width`/`height` (the
 * ranker's equal-bitrate tie-break — absent on audio, so audio candidates area-compare equal). Every
 * resolved/partially-resolved video track carries them all; audio tracks omit the dimensions.
 */
type SwitchableTrack = {
  id: string;
  url: string;
  bandwidth?: number;
  width?: number;
  height?: number;
  // Read by the capability constraint to probe codec support. Optional on the
  // minimal shape; every resolved/partially-resolved video & audio candidate
  // carries them, and an absent `mimeType` makes a track unprobeable (kept).
  mimeType?: string;
  codecs?: string[];
};

/**
 * Map the rule chain's surviving candidates to the final selection id, or `undefined` for a deliberate no-selection.
 * Defaults to the chain head (`selectChainHead`) — the always-pick contract video and audio rely on (`applyRules`
 * guarantees a non-empty result, so the head is always there). A variant whose selection is legitimately optional
 * (text: opt-in captions, explicit off) supplies its own picker that may return `undefined`; the helper writes that
 * straight through to the slot, clearing it.
 */
type ResolveSelection<T extends SwitchableTrack, State = unknown, Context = unknown, Config = unknown> = (
  candidates: readonly T[],
  deps: SelectionRuleDeps<State, Context, Config>
) => string | undefined;

type SelectionKey = 'selectedVideoTrackId' | 'selectedAudioTrackId' | 'selectedTextTrackId';
type UserSelectionKey = 'userVideoTrackSelection' | 'userAudioTrackSelection';

// Each mapped value references `P` so TS keeps the per-key dependency and
// resolves `state[selectionKey]` to the right arm. `T` (track type) stays out
// of the state map (it flows through `TrackSwitchingConfig` instead).
//
// Only the behavior's own lifecycle signals are required here: the presentation
// gate and the selection slot it writes. Signals a *rule* reads but the
// behavior doesn't — `user*TrackSelection` (the user-selection filter) and
// `bandwidthState` (the bandwidth ranker) — are NOT here; each rule declares
// the signal it needs as *optional* on its own deps and reads it defensively,
// so the behavior never assumes a rule-only signal exists. Those slots are
// materialized by whoever owns them: `shareSignals` for the consumer-input
// `user*TrackSelection`, the buffer-actor sampler for `bandwidthState`.
export type TrackSwitchingStateMap<S extends SelectionKey> = {
  presentation: ReadonlySignal<TrackSwitchingState['presentation']>;
} & { [P in S]: Signal<TrackSwitchingState[P]> };

/**
 * The lifecycle map plus the _optional_ `errors` slot reporters append to. Owned by `collectErrors`; optional so a
 * composition without it still type-checks and emission no-ops. The behavior reads no constraint's state — see
 * `noSupportedTrackCode`.
 */
type TrackSwitchingReporterStateMap<S extends SelectionKey> = TrackSwitchingStateMap<S> & ErrorEmitterState;

/**
 * Config `setupTrackSwitching` itself reads — its own wiring: which selection slot to write and clear (`selectionKey`),
 * how to enumerate candidate tracks (`getTracks`), the optional **hard-constraints pre-pass** (`constraints`, applied
 * before the chain to prune the unplayable), and the **rule chain** to run (`rules`), and how to map the chain's
 * survivors to the final pick (`resolveSelection`, defaulting to the chain head). Rule-/constraint-specific config is
 * deliberately absent — each declares the fields it reads as _optional_ on its own config view (`UserSelectionConfig`,
 * `BandwidthRankerConfig`), so the behavior never enumerates them. The variant builds the concrete config as this base
 * plus whatever its chain consults; it flows through untouched as the `C` type param on `setupTrackSwitching`.
 */
interface TrackSwitchingConfig<S extends SelectionKey, T extends SwitchableTrack> {
  selectionKey: S;
  getTracks: (presentation: MaybeResolvedPresentation) => readonly T[];
  constraints?: readonly SelectionRule<T, TrackSwitchingStateMap<S>, AnySlotMap, TrackSwitchingConfig<S, T>>[];
  rules: readonly SelectionRule<T, TrackSwitchingStateMap<S>, AnySlotMap, TrackSwitchingConfig<S, T>>[];
  /**
   * Map the chain's surviving candidates to the final selection id. Optional — absent means the chain head
   * (`selectChainHead`), the always-pick path video and audio use. A variant with optional selection (text) supplies
   * one that may return `undefined`.
   */
  resolveSelection?: ResolveSelection<T, TrackSwitchingStateMap<S>, AnySlotMap, TrackSwitchingConfig<S, T>>;
  /**
   * SVTA code to report when this type _has_ tracks but the constraints pruned every one. Per-variant because the
   * condition isn't universally an error: video and audio supply {@link SVTA_NO_SUPPORTED_VIDEO_TRACK} /
   * {@link SVTA_NO_SUPPORTED_AUDIO_TRACK}, while text supplies none — an unavailable subtitle track is a legitimate
   * outcome, not a playback failure. Absent → the selection still clears, nothing is reported.
   */
  noSupportedTrackCode?: number;
}

/**
 * State the user-selection filter reads: the lifecycle map plus an _optional_ user-selection slot (keyed by `U`),
 * holding a partial-track description to match against the candidates (`Partial<T>` — `{ id }`, `{ language }`, `{
 * height }`, …). The slot exists only when the composition provides it (materialized by `shareSignals`); the filter
 * reads it defensively and no-ops when it's absent (no user override).
 */
type UserSelectionStateMap<
  S extends SelectionKey,
  U extends UserSelectionKey,
  T extends SwitchableTrack,
> = TrackSwitchingStateMap<S> & {
  [P in U]?: ReadonlySignal<Partial<T> | undefined>;
};

/**
 * Config the user-selection filter reads: `userSelectionKey` names the state slot holding the user's selection.
 * _Optional_ on the rule's view — the base config doesn't carry it, so an unwired key means "no user selection" and the
 * filter passes through. The variants always supply it.
 */
type UserSelectionConfig<
  S extends SelectionKey,
  U extends UserSelectionKey,
  T extends SwitchableTrack,
> = TrackSwitchingConfig<S, T> & { userSelectionKey?: U };

/**
 * State the bandwidth ranker reads: the lifecycle map plus an _optional_ `bandwidthState`. The signal exists only when
 * the composition includes a bandwidth sampler; the ranker reads it defensively and falls back to `initialBandwidth`
 * (with a debug note) when it's absent.
 */
type BandwidthRankerStateMap<S extends SelectionKey> = TrackSwitchingStateMap<S> & {
  bandwidthState?: ReadonlySignal<BandwidthState | undefined>;
};

/**
 * Config the bandwidth ranker reads: the ABR tuning in `SwitchVideoTrackConfig` (`quality` / `bandwidth` /
 * `initialBandwidth`), all optional with defaults.
 */
type BandwidthRankerConfig<S extends SelectionKey, T extends SwitchableTrack> = TrackSwitchingConfig<S, T> &
  SwitchVideoTrackConfig;

/**
 * State the player-resolution cap reads: TrackSwitchingStateMap plus the _optional_ player measurement, manifested by
 * `trackPlayerResolution`.
 */
type PlayerResolutionCapStateMap<S extends SelectionKey> = TrackSwitchingStateMap<S> & {
  playerResolution?: ReadonlySignal<Resolution | undefined>;
};

/**
 * State the active-CDN scope reads: the lifecycle map plus an _optional_ `cdnPriority` — the manifest-ordered CDN list
 * (most-preferred first). The signal exists only when the composition includes `deriveCdnPriority`, which creates and
 * owns it. The scope reads it defensively and passes through when it's absent (no CDN preference).
 */
type CdnScopeStateMap<S extends SelectionKey> = TrackSwitchingStateMap<S> & {
  cdnPriority?: ReadonlySignal<string[] | undefined>;
};

/**
 * State the failed-CDN constraint reads: the lifecycle map plus an _optional_ `failedCdns` — the CDN ids currently in
 * failover cooldown. The signal exists only when the composition includes a failover monitor (or an external driver);
 * the constraint reads it defensively and excludes nothing when it's absent.
 */
type CdnConstraintStateMap<S extends SelectionKey> = TrackSwitchingStateMap<S> & {
  failedCdns?: ReadonlySignal<string[] | undefined>;
};

/**
 * Config the CDN rules read: the base config plus an _optional_ `getCdnId` override. Both `excludeFailedCdns` and
 * `preferActiveCdn` derive a track's CDN from its URL; the override must be the _same_ one `deriveCdnPriority` and the
 * failover trip use, or the keys stop matching. Optional → defaults to the origin-based `getCdnId`, so the base config
 * (without it) stays assignable.
 */
type CdnRuleConfig<S extends SelectionKey, T extends SwitchableTrack> = TrackSwitchingConfig<S, T> & {
  getCdnId?: GetCdnId;
};

type VideoTrackCandidate = PartiallyResolvedVideoTrack | VideoTrack;
type AudioTrackCandidate = PartiallyResolvedAudioTrack | AudioTrack;
type TextTrackCandidate = PartiallyResolvedTextTrack | TextTrack;

// ----------------------------------------------------------------------------
// Rules — defined outside the behavior closure, parameterized only by their
// deps. Each is generic over the slot keys + track type; the variant's
// concrete keys instantiate it where the chain is assembled.
// ----------------------------------------------------------------------------

/**
 * User intent — a soft filter. Narrows to tracks matching the partial-track selection in `user*TrackSelection`; an
 * empty match falls through (the composer skips it) to the unfiltered set — e.g. a stale id from a previous source.
 */
function filterByUserSelection<S extends SelectionKey, U extends UserSelectionKey, T extends SwitchableTrack>(
  tracks: readonly T[],
  { state, config }: SelectionRuleDeps<UserSelectionStateMap<S, U, T>, AnySlotMap, UserSelectionConfig<S, U, T>>
): readonly T[] {
  const key = config.userSelectionKey;
  if (!key) return tracks;

  const filter = state[key]?.get();

  return filter ? tracks.filter((track) => matchesPartialTrack(track, filter)) : tracks;
}

/**
 * Audio preference — a soft filter. Prefer the configured language, then manifest-default tracks; an empty match falls
 * through to bandwidth ranking. Keep every matching rendition so preference doesn't pin a bitrate.
 */
function preferAudioPolicy<
  T extends SwitchableTrack & Pick<AudioTrack, 'language' | 'default'>,
  State,
  Context,
  Config,
>(tracks: readonly T[], { config }: SelectionRuleDeps<State, Context, Config>): readonly T[] {
  // SAFETY: Both HLS engines declare preferredAudioLanguage as an optional string
  // and forward their config unchanged to the rules.
  const preferredLanguage = (config as AudioSelectionConfig | undefined)?.preferredAudioLanguage;

  if (preferredLanguage) {
    const matches = tracks.filter((track) => track.language === preferredLanguage);
    if (matches.length) return matches;
  }

  return tracks.filter((track) => track.default === true);
}

/**
 * Player-resolution cap — a soft filter, video only. Narrows to the renditions worth delivering at the player element's
 * rendered size, so a small embed doesn't pull segments nobody can perceive. The tighter sibling of
 * `screenResolutionCap`: the element's box, not the screen behind it.
 *
 * The cap is the _smallest tier that still covers the player_, and everything at or below it survives — not "everything
 * at or below the player's area," which under-serves a player falling between two tiers. Take an 800×450 player against
 * a 360p/720p/1080p ladder: only 360p is below it, so capping at the player's area would hold an 800-px-wide box to a
 * 640-px-wide picture. The honest answer is the tier above, 720p, with 360p left in for the ranker.
 * `smallestCoveringPixelArea` picks that cap; `tracksUnderPixelArea` — the same filter `screenResolutionCap` narrows
 * with — applies it.
 *
 * Renditions declaring no width or height compare as area `0` and are never capped out — they can't be judged against
 * the player, and dropping them could strand a source whose renditions all omit it.
 *
 * Runs _after_ `preferActiveCdn`, so it narrows within the host already chosen. Ahead of it, a cap that pruned every
 * rendition of the preferred CDN would leave the scope to fall to the next one with survivors — a size preference
 * silently moving playback to another host. Redundant streams normally mirror the same ladder, which makes that a
 * nonstandard-but-legal mismatch across CDNs rather than an everyday case; the ordering costs nothing either way.
 *
 * Reading `state.playerResolution` through its signal is what subscribes the chain to resizes; `undefined` — no signal
 * composed, or nothing to measure — means "don't cap" rather than a cap of zero, so the chain proceeds unnarrowed.
 */
function playerResolutionCap<S extends SelectionKey, T extends SwitchableTrack>(
  tracks: readonly T[],
  { state }: SelectionRuleDeps<PlayerResolutionCapStateMap<S>, AnySlotMap, TrackSwitchingConfig<S, T>>
): readonly T[] {
  const playerResolution = state.playerResolution?.get();
  if (!playerResolution) return tracks;

  // A player larger than every rendition has no covering tier, so the cap is
  // `undefined` and the filter's unbounded default narrows nothing.
  const cap = smallestCoveringPixelArea(tracks, playerResolution.width * playerResolution.height);

  return tracksUnderPixelArea(tracks, cap);
}

/**
 * Failed-CDN constraint — a _hard_ filter (constraints pre-pass), shared by video and audio. Removes tracks served from
 * a CDN currently in failover cooldown (`failedCdns`, written by the failover monitor). Removed tracks are never
 * attempted; the scope then narrows to the next surviving CDN in `cdnPriority`, and snaps back to the primary once it
 * leaves cooldown.
 *
 * Passes everything through when there's no `failedCdns` signal/value. When it prunes _every_ track (all CDNs cooled
 * down), the empty result is preserved (per `applyConstraints`) — "nothing playable," which clears the selection (no
 * pick); a later CDN recovery refills the candidate set and re-picks.
 */
function excludeFailedCdns<S extends SelectionKey, T extends SwitchableTrack>(
  tracks: readonly T[],
  { state, config }: SelectionRuleDeps<CdnConstraintStateMap<S>, AnySlotMap, CdnRuleConfig<S, T>>
): readonly T[] {
  const failed = state.failedCdns?.get();
  if (!failed?.length) return tracks;

  const getCdnId = config.getCdnId ?? defaultGetCdnId;
  const failedSet = new Set(failed);

  return tracks.filter((track) => !failedSet.has(getCdnId(track.url)));
}

/**
 * Active-CDN scope — a soft filter, shared by video and audio. Narrows to the highest-priority CDN in `cdnPriority`
 * (owned by `deriveCdnPriority`) that still has tracks, so every track type stays on one CDN. A redundant-streams
 * source lists the same renditions on multiple hosts; this keeps the pick on one host rather than letting the ranker
 * drift across them.
 *
 * "Active" is derived, not stored: constraints run before the rule chain, so a failed CDN's tracks are already pruned
 * by the time this runs — "first CDN with survivors" _is_ the active CDN, and it falls through to the next on failover
 * (and snaps back to the primary when it recovers). Content steering reorders `cdnPriority`; this rule just honors the
 * order.
 *
 * Soft-filter semantics: passes through when there's no `cdnPriority` signal/value (no preference) or when nothing
 * matches (`applyRules` skips an empty result). Non-redundant sources have one CDN, so the narrow is a no-op.
 *
 * The CDN-id derivation defaults to origin-based `getCdnId`, overridable via the `getCdnId` config — it must match the
 * one `deriveCdnPriority` used to build `cdnPriority`, or no track's CDN would ever equal an entry.
 */
function preferActiveCdn<S extends SelectionKey, T extends SwitchableTrack>(
  tracks: readonly T[],
  { state, config }: SelectionRuleDeps<CdnScopeStateMap<S>, AnySlotMap, CdnRuleConfig<S, T>>
): readonly T[] {
  const cdnPriority = state.cdnPriority?.get();
  if (!cdnPriority?.length) return tracks;

  const getCdnId = config.getCdnId ?? defaultGetCdnId;

  for (const cdn of cdnPriority) {
    const tracksUsingCdn = tracks.filter((track) => getCdnId(track.url) === cdn);
    if (tracksUsingCdn.length) return tracksUsingCdn;
  }

  return tracks;
}

/**
 * Codec-family sticky constraint — a _hard_ filter for the constraints pre-pass, shared by video and audio, and the
 * reason the re-evaluating variants can run ABR over a mixed-codec source at all: SPF implements no
 * `SourceBuffer.changeType()`, so once segments of the selected track's codec families are what a buffer was created
 * for, a pick outside them could never play — constraint semantics ("can't play here"), not preference. Removes the
 * candidates whose codec-family set doesn't _equal_ the selected track's (set-equality so a muxed `hvc1,mp4a` rendition
 * can't pass as a match for `avc1,mp4a` on its audio half). Purely relational: the lock _is_ the current selection's
 * families, no state of its own. Pruned pre-pass, a cross-family user selection mid-stream never reaches the user
 * filter, which falls through unhonored instead of killing playback. Before any selection exists (the initial pick) it
 * removes nothing, which is what leaves the initial family choice to the rule chain (user intent, then
 * `preferCodecFamilies`).
 *
 * The selected track's families come from the _presentation's_ track list, not the already-pruned candidates: a CDN
 * entering cooldown may prune the current track itself while same-family renditions survive on another host, and the
 * lock must carry over to them. Removes nothing when: no selection yet, a selection the presentation no longer carries,
 * or a selected track without codecs (then no candidate's compatibility is decidable — same inertness as
 * `preferCodecFamilies` on a codec-less ladder).
 *
 * When the selected family genuinely vanishes from the playable set, the pre-pass empties: the behavior reports the
 * type's no-supported-track code and clears the selection — an explicable stop instead of a cross-family append
 * surfacing as an opaque decode error. Clearing also releases the lock (it keys on the live selection), so a following
 * pick may land in the surviving family on freshly-created buffer actors; whether the append layer survives that
 * rebuild is the changeType gap, out of this constraint's hands. If `changeType` support ever lands, this constraint is
 * what relaxes.
 *
 * Reading the selection here — a slot the picking effect itself writes, from inside the candidate-set computed — is
 * safe only because the effect scheduler revalidates an effect's sources after each run; see `core/signals/effect.ts`
 * (`revalidateSources`) for the lost-wakeup it prevents.
 *
 * Composed only into the re-evaluating `switch*` variants: the pinned `selectVideoTrack` (background compositions)
 * evaluates once and never re-picks, so it's immune by construction.
 */
export function stickToSelectedCodecs<S extends SelectionKey, T extends SwitchableTrack>(
  tracks: readonly T[],
  { state, config }: SelectionRuleDeps<TrackSwitchingStateMap<S>, AnySlotMap, TrackSwitchingConfig<S, T>>
): readonly T[] {
  const currentId = state[config.selectionKey].get();
  if (!currentId) return tracks;

  const presentation = state.presentation.get();
  if (!isResolvedPresentation(presentation)) return tracks;

  const current = config.getTracks(presentation).find((track) => track.id === currentId);
  const families = current && getCodecFamilies(current);
  if (!families) return tracks;

  return tracks.filter((track) => {
    const candidateFamilies = getCodecFamilies(track);

    return (
      !!candidateFamilies &&
      candidateFamilies.length === families.length &&
      candidateFamilies.every((family) => families.includes(family))
    );
  });
}

/**
 * Bandwidth ranking — the terminal sort, shared by video and audio. Orders by the throughput estimate: tracks within
 * the bandwidth threshold first (fitting), highest bitrate first; then over-threshold tracks, least-over first. The
 * head is the best-quality track that fits, falling back to the smallest over-throughput track when nothing fits.
 *
 * Hysteresis without temporal state: the current track's effective bitrate is boosted by `upgradeMargin` in the fitting
 * sort, so a higher track only outranks it once it clears `current.bitrate * upgradeMargin` (no flapping on marginal
 * bandwidth gains). Downgrades fall out for free — a current track over the threshold isn't in the fitting set to be
 * boosted, so the best fit (a downgrade) wins immediately. Equal-bitrate tracks break by resolution (higher `width ×
 * height` first), so an equal-bitrate ladder never picks a lower- quality rendition by manifest order; audio tracks
 * carry no dimensions, so they area-compare equal and a stable sort keeps their candidate order (e.g. same-bitrate
 * language variants). Early-bail skips this rule when a prior one narrowed to a single track, so the estimate is
 * neither read nor subscribed while that holds.
 */
function rankByBandwidth<S extends SelectionKey, T extends SwitchableTrack>(
  tracks: readonly T[],
  { state, config }: SelectionRuleDeps<BandwidthRankerStateMap<S>, AnySlotMap, BandwidthRankerConfig<S, T>>
): readonly T[] {
  const safetyMargin = config.quality?.safetyMargin ?? DEFAULT_QUALITY_CONFIG.safetyMargin;
  const upgradeMargin = config.quality?.upgradeMargin ?? DEFAULT_QUALITY_CONFIG.upgradeMargin;
  const initialBandwidth = config.initialBandwidth ?? DEFAULT_INITIAL_BANDWIDTH;
  const bandwidthConfig: BandwidthConfig = { ...DEFAULT_BANDWIDTH_CONFIG, ...config.bandwidth };

  if (!state.bandwidthState) {
    console.debug(
      '[track-switching] rankByBandwidth: no bandwidthState signal in composition; ranking on initialBandwidth'
    );
  }

  const threshold = getBandwidthEstimate(state.bandwidthState?.get(), initialBandwidth, bandwidthConfig) * safetyMargin;
  const currentId = state[config.selectionKey].get();
  const bitrate = (track: T) => track.bandwidth ?? 0;
  // Boost the current track's sort weight by upgradeMargin (fitting set only) so
  // an upgrade must clear current.bitrate * upgradeMargin to outrank it.
  const rank = (track: T) => (track.id === currentId ? bitrate(track) * upgradeMargin : bitrate(track));
  // Equal bitrate → prefer higher resolution (width × height), so an
  // equal-bitrate ladder doesn't pick a lower-quality rendition by manifest
  // order. Audio tracks carry no dimensions, so they area-compare equal and
  // keep candidate order (stable sort).
  const fitting = tracks
    .filter((track) => bitrate(track) <= threshold)
    .sort((a, b) => rank(b) - rank(a) || resolutionArea(b) - resolutionArea(a));
  const over = tracks
    .filter((track) => bitrate(track) > threshold)
    .sort((a, b) => bitrate(a) - bitrate(b) || resolutionArea(b) - resolutionArea(a));

  return [...fitting, ...over];
}

/**
 * Default final pick: the chain head. `applyRules` never narrows to nothing and early-bails to a single survivor, so
 * video and audio always converge to a track and the head is the pick.
 */
function selectChainHead<T extends SwitchableTrack>(candidates: readonly T[]): string {
  return candidates[0]!.id;
}

/**
 * State the text terminal reads: the lifecycle map plus an _optional_ `userTextTrackSelection` — the standing user
 * intent. `Partial<TextTrack>` is an explicit pick (language-based), `'off'` is explicit no-captions, `undefined` is
 * auto (no preference). The slot exists only when the composition materializes it (`shareSignals`); the terminal reads
 * it defensively and treats absence as auto.
 *
 * Unlike `user*TrackSelection` for video/audio, this carries the `'off'` sentinel and feeds the terminal pick (not the
 * shared `filterByUserSelection`) — text is the only type whose selection is legitimately optional, so the off/auto
 * logic lives in one text-specific place rather than widening the shared filter.
 */
type TextSelectionStateMap = TrackSwitchingStateMap<'selectedTextTrackId'> & {
  userTextTrackSelection?: ReadonlySignal<Partial<TextTrack> | 'off' | undefined>;
};

/** Config the text terminal reads: the base config plus the opt-in default policy. */
type TextTerminalConfig = TrackSwitchingConfig<'selectedTextTrackId', TextTrackCandidate> & TextSelectionConfig;

/**
 * Terminal pick for text — the `resolveSelection` the text variant supplies. Resolves the standing
 * `userTextTrackSelection` intent against the chain's survivors (already CDN-failover-pruned and active-CDN-scoped):
 *
 * - `'off'` → no selection (clear the slot). Sticky through re-evaluation, so a live refresh or failover re-run can't
 *   re-assert a default.
 * - Explicit `Partial<TextTrack>` → narrow to the match (language-based). A stale pick whose match is gone (e.g. the
 *   language dropped on a source change) falls through to the default policy.
 * - Auto (`undefined`) → the opt-in default policy (`preferredSubtitleLanguage` → `DEFAULT=YES + AUTOSELECT=YES` → none),
 *   via `pickTextTrackFromTracks`.
 *
 * Returning `undefined` is a real outcome (captions are opt-in), which is why the text variant relies on
 * `setupTrackSwitching`'s no-selection seam.
 */
function pickResolvedTextTrack<T extends TextTrackCandidate>(
  candidates: readonly T[],
  { state, config }: SelectionRuleDeps<TextSelectionStateMap, AnySlotMap, TextTerminalConfig>
): string | undefined {
  const intent = state.userTextTrackSelection?.get();
  if (intent === 'off') return undefined;

  if (intent) {
    // The stored intent is a `Partial<TextTrack>`; cast to the candidate's own
    // partial shape so the generic `matchesPartialTrack` accepts it (every field
    // it carries — language, forced — exists on the candidate too).
    const matched = candidates.filter((track) => matchesPartialTrack(track, intent as Partial<T>));
    if (matched.length) return matched[0]!.id;
  }

  return pickTextTrackFromTracks(candidates, config);
}

// `context` is the composition's context map, threaded in by each variant's
// rest-spread and typed as the generic slot-map shape (`AnySlotMap`). It can't
// be a typed param on the `defineBehavior` setup without widening `ContextMap`
// to its constraint and forcing the slot required, so the variants forward it
// untyped via the rest and it lands here — absent on direct setup calls, and
// passed straight through to the rules (which don't read it yet).
function setupTrackSwitching<
  S extends SelectionKey,
  T extends SwitchableTrack,
  C extends TrackSwitchingConfig<S, T>,
>(deps: { state: TrackSwitchingReporterStateMap<S>; context?: AnySlotMap; config: C }) {
  const { state, config } = deps;
  const { selectionKey, getTracks, rules, resolveSelection = selectChainHead, noSupportedTrackCode } = config;

  const derivedStateSignal = computed(() =>
    isResolvedPresentation(state.presentation.get())
      ? ('presentation-resolved' as const)
      : ('presentation-unresolved' as const)
  );

  // The playable candidate set — the tracks the rule chain gets to pick from,
  // derived *outside* the reaction. The hard-constraints pre-pass (capability
  // probing, CDN-failover cooldown) narrows the type's tracks before the chain
  // runs. Because this is a `computed`, a constraint's own signal reads (e.g.
  // `cdnHealth`) are tracked here, so when the playable set changes — a new
  // source, or a *dynamic* constraint like a CDN entering cooldown — the effect
  // re-picks. With no constraints configured this is just the type's tracks
  // while a presentation is resolved.
  //
  // The `equals` gates notification on the *set of track ids*, not array
  // identity: a live playlist refresh swaps in a new presentation object with
  // the same variant tracks, and a constraint's inputs can churn without
  // changing which tracks survive. In both cases the playable set is unchanged,
  // so the reaction must not re-fire (the rule chain still re-runs on its own
  // inputs — bandwidth, user selection). Same intent as `equalsById`, for the
  // track list.
  const candidateSet = computed<readonly T[]>(
    () => {
      const presentation = state.presentation.get();
      if (!isResolvedPresentation(presentation)) return [];

      return applyConstraints(config.constraints ?? [], getTracks(presentation), deps);
    },
    { equals: sameCandidateSet }
  );

  return createMachineReactor({
    initial: 'presentation-unresolved',
    monitor: () => derivedStateSignal.get(),
    states: {
      'presentation-unresolved': {},
      'presentation-resolved': {
        // Canonical cleanup-binds-to-setup: the selection signal's valid
        // lifespan is exactly 'presentation-resolved'. Clear fires on exit,
        // covering both src unload and behavior destroy.
        entry: () => () => state[selectionKey].set(undefined),
        effects: [
          () => {
            // Reactive read: subscribes the reaction to the candidate set, so a
            // new presentation — or a constraint pruning it — re-fires this and
            // re-picks.
            const tracks = candidateSet.get();

            // Empty candidate set — two shapes, told apart by whether the type
            // has any tracks at all:
            //   - The type has no tracks (e.g. a video-only source's absent
            //     audio): legitimate, nothing to pick or clear.
            //   - The type HAS tracks but the hard-constraints pre-pass pruned
            //     every one (every rendition undecodable, or every CDN in
            //     failover cooldown): no playable rendition. Clear the selection
            //     so a pick made earlier — e.g. under the initial mp4 label,
            //     before resolve-track relabeled the type to a non-fMP4
            //     container — can't linger as a now-unplayable selection and
            //     silently stall the pipeline.
            if (!tracks.length) {
              const presentation = peek(state.presentation);
              const hasTracksOfType = isResolvedPresentation(presentation) && getTracks(presentation).length > 0;

              if (hasTracksOfType) {
                // Reported generically: *why* the set emptied is the constraints'
                // business, not this behavior's, so no constraint's state is read
                // here and no cause is distinguished. Whatever the reason, a type
                // that has renditions but none selectable can't play — a codec
                // this environment can't decode, or every CDN failed, which is
                // itself fatal-or-nearly so. Finer causes (container vs codec)
                // would need `CanPlayTrack` to report a reason; see
                // `internal/design/spf/features/errors.md`.
                if (noSupportedTrackCode !== undefined) {
                  emitError(state, { code: noSupportedTrackCode, data: { selectionKey } });
                }

                state[selectionKey].set(undefined);
              }

              return;
            }

            // The whole deps object passes straight through to every rule in the
            // variant-supplied chain (state + config from the behavior; context
            // threaded in by the variant's rest-spread). Typed against the base
            // config — each rule re-declares the extra fields it reads as
            // optional, and the concrete `C` is assignable to the base.
            const candidates = applyRules<T, TrackSwitchingStateMap<S>, AnySlotMap, TrackSwitchingConfig<S, T>>(
              rules,
              tracks,
              deps
            );

            // applyRules early-bails to a single survivor and never narrows to
            // nothing (a soft filter that would empty the set falls through), so
            // the pick is just the head. An empty result means a rule misbehaved
            // — applyRules is supposed to account for those cases, so surface it.
            if (!candidates.length) {
              console.error('[track-switching] applyRules returned no candidates');
              return;
            }

            // Map survivors to the final id. Defaults to the chain head; a
            // variant with optional selection (text) may resolve to `undefined`,
            // which clears the slot (e.g. explicit off, opt-in decline).
            // No change-guard needed: the slot uses default (Object.is) equality,
            // so re-setting the same value is a no-op (no notify, no re-fire).
            state[selectionKey].set(resolveSelection(candidates, deps));
          },
        ],
      },
    },
  });
}

// ============================================================================
// Default chains
//
// Each variant resolves its chains as `config?.<type>Constraints ?? DEFAULT_…`
// and `config?.<type>Rules ?? DEFAULT_…`, mirroring `select-tracks.ts`. The
// rule aliases name what a chain entry is for one variant: a `SelectionRule`
// over its candidates, its lifecycle state map, and its base config. Video and
// audio are typed over `SwitchableTrack`, the candidate shape their variants
// infer up to (see the text variant's note); text pins `TextTrackCandidate`
// because its terminal reads text-only fields. A rule declared against a
// narrower state or config view (the ranker's optional `bandwidthState`, the
// CDN rules' `getCdnId`) satisfies the alias the same way it satisfied the
// inline chain it used to sit in.
// ============================================================================

/** A constraint or rule in `switchVideoTrack`'s chains. */
export type SwitchVideoTrackRule = SelectionRule<
  SwitchableTrack,
  TrackSwitchingStateMap<'selectedVideoTrackId'>,
  AnySlotMap,
  TrackSwitchingConfig<'selectedVideoTrackId', SwitchableTrack>
>;

/** A constraint or rule in `switchAudioTrack`'s chains. */
export type SwitchAudioTrackRule = SelectionRule<
  SwitchableTrack,
  TrackSwitchingStateMap<'selectedAudioTrackId'>,
  AnySlotMap,
  TrackSwitchingConfig<'selectedAudioTrackId', SwitchableTrack>
>;

/** A constraint or rule in `switchTextTrack`'s chains. */
export type SwitchTextTrackRule = SelectionRule<
  TextTrackCandidate,
  TrackSwitchingStateMap<'selectedTextTrackId'>,
  AnySlotMap,
  TrackSwitchingConfig<'selectedTextTrackId', TextTrackCandidate>
>;

/** Default video pre-pass: failed CDNs, capability, codec-family stickiness. */
export const DEFAULT_VIDEO_CONSTRAINTS: readonly SwitchVideoTrackRule[] = [
  excludeFailedCdns,
  excludeUnplayableTracks,
  stickToSelectedCodecs,
];

/** Default video chain: user intent, codec family, active CDN, player resolution, then the bandwidth ranker. */
export const DEFAULT_VIDEO_RULES: readonly SwitchVideoTrackRule[] = [
  filterByUserSelection,
  preferCodecFamilies,
  preferActiveCdn,
  playerResolutionCap,
  rankByBandwidth,
];

/** Default audio pre-pass: the video one over audio candidates. */
export const DEFAULT_AUDIO_CONSTRAINTS: readonly SwitchAudioTrackRule[] = [
  excludeFailedCdns,
  excludeUnplayableTracks,
  stickToSelectedCodecs,
];

/** Default audio chain: user intent, codec family, active CDN, language/default preference, then bandwidth ranking. */
export const DEFAULT_AUDIO_RULES: readonly SwitchAudioTrackRule[] = [
  filterByUserSelection,
  preferCodecFamilies,
  preferActiveCdn,
  preferAudioPolicy,
  rankByBandwidth,
];

/** Default text pre-pass: failed CDNs only — an MSE codec probe is the wrong question for WebVTT. */
export const DEFAULT_TEXT_CONSTRAINTS: readonly SwitchTextTrackRule[] = [excludeFailedCdns];

/** Default text chain: the active-CDN scope; the pick itself is the text terminal's (`pickResolvedTextTrack`). */
export const DEFAULT_TEXT_RULES: readonly SwitchTextTrackRule[] = [preferActiveCdn];

// ============================================================================
// Variant: switchVideoTrack — bandwidth-driven ABR
// ============================================================================

/**
 * Manage `selectedVideoTrackId`: pick a default on src load, dynamically adjust based on bandwidth, clear on src
 * unload. Honors `userVideoTrackSelection` as a partial-track constraint on candidates; short-circuits ABR when the
 * constraint narrows to a single track.
 *
 * @example
 *   const reactor = switchVideoTrack.setup({ state });
 */
export const switchVideoTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedVideoTrackId'],
  contextKeys: [],
  setup: ({
    state,
    config,
    ...otherProps
  }: {
    state: TrackSwitchingStateMap<'selectedVideoTrackId'>;
    config?: SwitchVideoTrackConfig;
  }) =>
    setupTrackSwitching({
      ...otherProps,
      state,
      config: {
        ...config,
        selectionKey: VIDEO_TYPE_CONFIG.selectedKey,
        userSelectionKey: VIDEO_TYPE_CONFIG.userSelectionKey,
        getTracks: (presentation) => getTracksByType(presentation, 'video') as readonly VideoTrackCandidate[],
        constraints: config?.[VIDEO_TYPE_CONFIG.constraintsKey] ?? DEFAULT_VIDEO_CONSTRAINTS,
        rules: config?.[VIDEO_TYPE_CONFIG.rulesKey] ?? DEFAULT_VIDEO_RULES,
        noSupportedTrackCode: SVTA_NO_SUPPORTED_VIDEO_TRACK,
      },
    }),
});

// ============================================================================
// Variant: switchAudioTrack — bandwidth-ranked (shared ranker)
// ============================================================================

/**
 * Manage `selectedAudioTrackId`: pick a default on src load, narrow by `userAudioTrackSelection` filter, re-pick on
 * filter change, clear on src unload.
 *
 * Mid-stream flush on language switch is handled by the segment-loader's `planTasks` (see
 * `playback/actors/dom/segment-loader.ts`) — not this behavior. Same split as the video pipeline: slot owner writes;
 * loader orchestrates segment + flush plans.
 *
 * @example
 *   const reactor = switchAudioTrack.setup({ state });
 */
export const switchAudioTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedAudioTrackId'],
  contextKeys: [],
  setup: ({
    state,
    config,
    ...otherProps
  }: {
    state: TrackSwitchingStateMap<'selectedAudioTrackId'>;
    config?: SwitchAudioTrackConfig;
  }) =>
    setupTrackSwitching({
      ...otherProps,
      state,
      config: {
        // Spread engine config so the shared fields (`getCdnId`, `canPlayTrack`,
        // `preferredCodecs`) flow through like they do for video, then override
        // the per-type wiring. The engine's video-only ABR tuning rides along at
        // runtime into the shared `rankByBandwidth`; harmless, since audio has no
        // `bandwidthState` to act on it (see `SwitchAudioTrackConfig`).
        ...config,
        selectionKey: AUDIO_TYPE_CONFIG.selectedKey,
        userSelectionKey: AUDIO_TYPE_CONFIG.userSelectionKey,
        getTracks: (presentation) => getTracksByType(presentation, 'audio') as readonly AudioTrackCandidate[],
        constraints: config?.[AUDIO_TYPE_CONFIG.constraintsKey] ?? DEFAULT_AUDIO_CONSTRAINTS,
        rules: config?.[AUDIO_TYPE_CONFIG.rulesKey] ?? DEFAULT_AUDIO_RULES,
        noSupportedTrackCode: SVTA_NO_SUPPORTED_AUDIO_TRACK,
      },
    }),
});

// ============================================================================
// Variant: switchTextTrack — intent-resolved, optional selection
// ============================================================================

/**
 * Config for `switchTextTrack` — the opt-in default policy (`preferredSubtitleLanguage` / `includeForcedTracks` /
 * `enableDefaultTrack`, via `TextSelectionConfig`) read by the terminal when the user has no standing intent, plus the
 * `getCdnId` override shared with the CDN constraint + scope.
 */
export interface SwitchTextTrackConfig extends TextSelectionConfig {
  /** Override CDN-id derivation (shared by the failed-CDN constraint + active-CDN scope). */
  getCdnId?: GetCdnId;
  /** `switchTextTrack`'s chains, replacing {@link DEFAULT_TEXT_CONSTRAINTS} / {@link DEFAULT_TEXT_RULES}. */
  textConstraints?: readonly SwitchTextTrackRule[];
  textRules?: readonly SwitchTextTrackRule[];
}

/**
 * Manage `selectedTextTrackId` as the single-writer **output** of standing user intent (`userTextTrackSelection`)
 * resolved against the playable, CDN-scoped text renditions: clear on src unload; re-resolve when a CDN fails or
 * recovers.
 *
 * Unlike video/audio, the selection is _optional_ — captions are opt-in and the user can turn them off — so the chain
 * skips the bandwidth ranker and the shared user-selection filter, and supplies a text-specific terminal
 * (`pickResolvedTextTrack`) that may resolve to no-selection via `setupTrackSwitching`'s `resolveSelection` seam.
 * Constraints are failed-CDN only (`excludeUnplayableTracks`/`canPlayTrack` is MSE-based — the wrong probe for text,
 * whose playability is SPF-parser support); the active-CDN scope co-locates captions with the surviving CDN on
 * failover.
 *
 * @example
 *   const reactor = switchTextTrack.setup({ state, config: { preferredSubtitleLanguage: 'en' } });
 */
export const switchTextTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedTextTrackId'],
  contextKeys: [],
  setup: ({
    state,
    config,
    ...otherProps
  }: {
    state: TrackSwitchingStateMap<'selectedTextTrackId'>;
    config?: SwitchTextTrackConfig;
  }) =>
    // Explicit type args pin the candidate type to `TextTrackCandidate`. Video and
    // audio let it infer to the `SwitchableTrack` constraint (harmless — every
    // rule is assignable up to it), but the text terminal needs the narrower type
    // (it reads text-only fields), so it's named here rather than inferred.
    setupTrackSwitching<'selectedTextTrackId', TextTrackCandidate, TextTerminalConfig & SwitchTextTrackConfig>({
      ...otherProps,
      state,
      config: {
        ...config,
        selectionKey: TEXT_TYPE_CONFIG.selectedKey,
        getTracks: (presentation) => getTracksByType(presentation, 'text') as readonly TextTrackCandidate[],
        constraints: config?.[TEXT_TYPE_CONFIG.constraintsKey] ?? DEFAULT_TEXT_CONSTRAINTS,
        rules: config?.[TEXT_TYPE_CONFIG.rulesKey] ?? DEFAULT_TEXT_RULES,
        resolveSelection: pickResolvedTextTrack,
      },
    }),
});
