import {
  type Composition,
  type ContextSignals,
  createComposition,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
  type StateSignals,
} from '../../../core/composition/create-composition';
import { declareInputs } from '../../../core/composition/declare-inputs';
import { makeShareSignalsFor, type ShareSignalsConfig } from '../../../core/composition/share-signals';
import { delayedReschedule } from '../../../core/tasks/delayed-reschedule';
import type { Reschedule } from '../../../core/tasks/task';
import type { QualityConfig } from '../../../media/abr/quality-selection';
import type { BackBufferConfig } from '../../../media/buffer/back-buffer';
import type { ForwardBufferConfig } from '../../../media/buffer/forward-buffer';
import { canPlayTrackWithDrm } from '../../../media/dom/capabilities';
import { DEFAULT_KEY_SYSTEMS } from '../../../media/dom/key-systems';
import { attachMediaSourceAsSourceElement } from '../../../media/dom/mse/mediasource-setup';
import { resolveVttSegment } from '../../../media/dom/text/resolve-vtt-segment';
import {
  addSubtitlesTracksToMedia,
  getShowingSubtitlesTrackFromMedia,
  removeAllSubtitlesTracksFromMedia,
} from '../../../media/dom/text/text-track-slots';
import type { DrmSystemsConfig, DrmSystemsConfigFor, KeySystemId, KeySystemModule } from '../../../media/drm';
import { parseMultivariantPlaylist } from '../../../media/hls/parse-multivariant';
import { mediaPlaylistReloadDelay, resolveLiveLatency } from '../../../media/hls/reload-policy';
import type { CanPlayTrack, ResolvedTrack } from '../../../media/types';
import type { GetCdnId } from '../../../media/utils/cdn';
import { getResolvedSelectedTrackDuration } from '../../../media/utils/track-selection';
import type { BandwidthConfig } from '../../../network/bandwidth-estimator';
import type { RequestCredentialsPolicy } from '../../../network/credentials-fetch';
import {
  calculatePresentationDuration,
  type PresentationDurationResolver,
} from '../../behaviors/calculate-presentation-duration';
import { collectErrors } from '../../behaviors/collect-errors';
import { deriveCdnPriority } from '../../behaviors/derive-cdn-priority';
import { type RemotePlaybackInputs, setupAirPlay } from '../../behaviors/dom/airplay';
import { applyStartPosition } from '../../behaviors/dom/apply-start-position';
import { endOfStream } from '../../behaviors/dom/end-of-stream';
import { exchangeLicenses } from '../../behaviors/dom/exchange-licenses';
import { loadChapters } from '../../behaviors/dom/load-chapters';
import { loadAudioSegments, loadTextTrackSegments, loadVideoSegments } from '../../behaviors/dom/load-segments';
import { recoverEndStall } from '../../behaviors/dom/recover-end-stall';
import { seekToLiveEdge } from '../../behaviors/dom/seek-to-live-edge';
import { setupAirPlayFairPlay } from '../../behaviors/dom/setup-airplay-fairplay';
import { setupAudioBufferActors, setupVideoBufferActors } from '../../behaviors/dom/setup-buffer-actors';
import { setupMediaKeys } from '../../behaviors/dom/setup-media-keys';
import { setupMediaSource } from '../../behaviors/dom/setup-mediasource';
import { setupTextTrackActors } from '../../behaviors/dom/setup-text-track-actors';
import { syncLiveSeekableRange } from '../../behaviors/dom/sync-live-seekable-range';
import { syncTextTracks } from '../../behaviors/dom/sync-text-tracks';
import { trackCurrentTime } from '../../behaviors/dom/track-current-time';
import { trackLoadTriggers } from '../../behaviors/dom/track-load-triggers';
import { trackPlayerResolution } from '../../behaviors/dom/track-player-resolution';
import { updateMediaSourceDuration } from '../../behaviors/dom/update-mediasource-duration';
// Non-zero-PTS relocation (spike): remove this import, the composed reactor, the
// `video/audio/textMessagePipelines` finalConfig entries, the `mediaContainerData`
// state slot, and the `deriveStartMediaTime` config field to drop relocation entirely
// (text then falls back to the plain `resolveVttSegment` resolver).
import {
  type DeriveStartMediaTime,
  deriveSharedMinStartMediaTime,
  establishStartMediaTime,
  gateFirstParseOnAnchor,
} from '../../behaviors/establish-start-media-time';
import { type ParsePresentation, resolvePresentation } from '../../behaviors/resolve-presentation';
import { resolveAudioTrack, resolveTextTrack, resolveVideoTrack } from '../../behaviors/resolve-track';
import { type FailoverMonitorConfig, setupFailoverMonitor } from '../../behaviors/setup-failover-monitor';
import { syncPreload } from '../../behaviors/sync-preload';
import {
  DEFAULT_AUDIO_CONSTRAINTS,
  DEFAULT_VIDEO_CONSTRAINTS,
  type SwitchAudioTrackConfig,
  type SwitchTextTrackConfig,
  type SwitchVideoTrackConfig,
  type UserTrackSelectionInputs,
  switchAudioTrack,
  switchTextTrack,
  switchVideoTrack,
} from '../../behaviors/track-switching';
import { relocatingTextPipelines, relocationPipelinesFor } from '../../primitives/relocation-pipelines';
import {
  type ReportUnsupportedTrackConditions,
  reportUnsupportedTrackConditionsWithDrm,
} from '../../primitives/report-track-conditions';
import { excludeRefusedKeySystems } from '../../primitives/selection-rules';
import type { TextTrackSegmentResolver } from '../../primitives/text-segment-load-pipeline';

// ============================================================================
// HLS Engine State & Context
// ============================================================================

/**
 * State the HLS playback engine reads but no composed behavior declares: the consumer's track selections and
 * remote-playback opt-out, written through the adapter.
 */
const hlsVideoEngineInputs = declareInputs<UserTrackSelectionInputs & RemotePlaybackInputs>()([
  'userVideoTrackSelection',
  'userAudioTrackSelection',
  'userTextTrackSelection',
  'disableRemotePlayback',
]);

/**
 * The behaviors the HLS playback engine composes, in setup order. The engine's state and context types are derived from
 * this list, so adding or removing a behavior changes them with no separate type to update.
 */
const hlsVideoEngineBehaviors = [
  syncPreload,
  trackLoadTriggers,
  resolvePresentation,

  // Session-level CDN priority for redundant-stream sources. Owns
  // `cdnPriority`; `track-switching`'s preferActiveCdn scope reads it so
  // every type stays on one CDN. No-op for single-CDN sources.
  //
  // Placed before switch* so `cdnPriority` is set before the first pick —
  // but this ordering is only *mildly* load-bearing, not required for
  // correctness. Selection is reactive: a late `cdnPriority` re-fires the
  // pick and converges on the same result (see the late-arrival test in
  // track-switching.test.ts). Order affects only a transient, and only for
  // an *asymmetric* manifest (a type listing a non-primary CDN first):
  // composing this after switch* would let that type fire one wasted
  // media-playlist fetch to the wrong CDN before correcting. Symmetric
  // redundant streams (the norm) never hit it — the first-listed CDN is
  // already the primary we'd pick anyway.
  deriveCdnPriority,

  // CDN failover cooldown: owns the expiry half of failover — watches
  // `failedCdns` (tripped directly by track resolution on a failed
  // media-playlist fetch) and removes each CDN once its cooldown lapses.
  setupFailoverMonitor,

  // Owns `errors` and its per-source lifecycle. Composed before the
  // behaviors that report into it so the slot exists when they first run;
  // reporting no-ops if it isn't composed at all.
  collectErrors,

  // Resolve selected tracks (fetch media playlists). Composed before the
  // switch* slot owners; selection is reactive, so a resolve* re-fires once
  // its switch* sets the id (same convergence for all three types).
  resolveVideoTrack,
  resolveAudioTrack,
  resolveTextTrack,

  // Presentation duration
  calculatePresentationDuration,

  // MSE setup. Video cluster is registered first so that, when both
  // per-type variants flip to `'buffer-ready'` on the shared gate's
  // monitor evaluation, `addSourceBuffer(video)` runs before
  // `addSourceBuffer(audio)` — see the Firefox `mozHasAudio` invariant
  // in setup-buffer-actors.ts.
  setupMediaSource,
  updateMediaSourceDuration,

  // EME for encrypted sources (no-op for clear ones). Composed right after
  // MSE setup and — load-bearing — before the `load*Segments` dispatchers,
  // so the `segmentLoadingBlocked` gate is up before their first dispatch of
  // encrypted segments.
  //
  // `exchangeLicenses` precedes the negotiation it consumes, also
  // load-bearing: `createComposition` calls cleanups in registration order,
  // and the sessions it opens must close before `setupMediaKeys` detaches
  // the MediaKeys they belong to. Setup order costs nothing in return — its
  // precondition is reactive on `context.mediaKeys`.
  //
  // `setupAirPlayFairPlay` sits ahead of `setupMediaKeys` for the same
  // reason. Both react to the AirPlay session's falling edge — one
  // releasing the receiver's MediaKeys, the other negotiating MSE's afresh
  // — and registration order is what puts the detach before the attach.
  exchangeLicenses,
  setupAirPlayFairPlay,
  setupMediaKeys,

  // ── Non-zero-PTS relocation (spike) ──────────────────────────────────
  // Establishes per-track `startMediaTime` and publishes the relocating
  // segment-loader pipelines to context. MUST precede `setup*BufferActors`
  // so the pipelines are published before the loaders read them. Remove this
  // one line (+ the import, the `mediaContainerData`/`*MessagePipelines`
  // slots including `textMessagePipelines`, and the `deriveStartMediaTime`
  // config) to drop relocation and test the Tier-0 baseline / bundle size.
  establishStartMediaTime,
  // ─────────────────────────────────────────────────────────────────────

  setupVideoBufferActors,
  setupAudioBufferActors,

  // AirPlay/MSE bridge (WebKit only; no-op elsewhere).
  setupAirPlay,

  // Playback tracking
  trackCurrentTime,
  // After trackCurrentTime: the one-shot currentTime seed must land after
  // the mirror's attach-time sync (see apply-start-position.ts).
  applyStartPosition,

  // Ordering isn't load-bearing — selection is reactive, so a measurement
  // that lands after the first pick just re-fires it.
  trackPlayerResolution,
  switchVideoTrack,
  switchAudioTrack,
  // Mid-stream audio-buffer flush on language switch is handled in
  // `segment-loader`'s `planTasks` (predicate: language differs from
  // the previously-buffered track) — not in switchAudioTrack itself.

  // Text selection: resolves `userTextTrackSelection` intent (incl. 'off',
  // or the configured preferred-language / DEFAULT-track policy) against the
  // failed-CDN-pruned, active-CDN-scoped text renditions. Optional selection
  // (captions are opt-in), so it can resolve to none.
  switchTextTrack,

  // Segment loading
  loadVideoSegments,
  loadAudioSegments,

  // Live: declare the seekable window, then command the live-edge start
  // position + keep the playhead in-window. No-op for complete playlists
  // (VoD / ended). `seekToLiveEdge` commands `state.startPosition`;
  // `applyStartPosition` (composed above) performs the seek.
  syncLiveSeekableRange,
  seekToLiveEdge,

  // End of stream coordination
  endOfStream,
  // Force native `ended` when Chrome freezes the playhead a few frames short of a
  // skewed-A/V end after `endOfStream` (audio-clock stall). Inert otherwise.
  recoverEndStall,

  // Text tracks
  syncTextTracks,
  setupTextTrackActors,
  loadTextTrackSegments,
  // Apple JSON chapters (`EXT-X-SESSION-DATA`, `com.apple.hls.chapters`) →
  // a hidden `chapters` track per language, the preferred subtitle
  // language leading. Cues live on the element; no state signal.
  loadChapters,

  // Consumer inputs: written through the adapter, read by the behaviors above.
  hlsVideoEngineInputs,
] as const;

/** State shape for the HLS playback engine: every state key its behaviors declare. */
export type HlsVideoEngineState = ResolveBehaviorState<typeof hlsVideoEngineBehaviors>;

/** Context shape for the HLS playback engine: every context key its behaviors declare. */
export type HlsVideoEngineContext = ResolveBehaviorContext<typeof hlsVideoEngineBehaviors>;

/**
 * The composition signal refs handed to `onSignalsReady` callers — the canonical way to drive the engine externally
 * (writes) or observe its state (reads) without touching `composition.state` / `composition.context` directly.
 */
export type HlsVideoEngineSignals = {
  state: StateSignals<HlsVideoEngineState>;
  context: ContextSignals<HlsVideoEngineContext>;
};

/**
 * Configuration for the HLS playback engine.
 *
 * Each option is consumed by the appropriate behavior — the engine itself has no config beyond what its behaviors read.
 */
export interface HlsVideoEngineConfig<
  KeySystems extends readonly KeySystemModule[] = typeof DEFAULT_KEY_SYSTEMS,
> extends ShareSignalsConfig<HlsVideoEngineState, HlsVideoEngineContext> {
  /**
   * Bandwidth estimate in bps to use before enough samples have been collected. Default: `DEFAULT_INITIAL_BANDWIDTH` (5
   * Mbps).
   */
  initialBandwidth?: number;
  /**
   * License servers keyed by EME key-system id — `source.drm`'s shape. Feeds `setupMediaKeys` (negotiation, MediaKeys
   * attach, license exchange) and the DRM-aware capability probe / condition reporter, so encrypted renditions a
   * configured system can serve play instead of being pruned. Absent or empty, encrypted renditions are refused exactly
   * as a DRM-less engine refuses them: pruned before selection, with `SVTA_UNSUPPORTED_DRM_SYSTEM` causes reported.
   *
   * Keyed by the ids `keySystems` composes: an entry for a system no composed module claims could never be negotiated
   * (`keySystemCandidates` intersects the two), so naming one is a type error here instead of a silent refusal. A
   * `keySystems` list typed as plain `KeySystemModule[]` widens the keys back to `string`.
   */
  drm?: DrmSystemsConfigFor<KeySystemId<KeySystems>>;
  /**
   * The key systems this engine can negotiate, most-preferred first. Defaults to `DEFAULT_KEY_SYSTEMS` (FairPlay,
   * Widevine, PlayReady). Narrow it to drop the systems an engine will never see along with their code — a
   * `[widevineKeySystem]` engine carries no PlayReady request variants, PSSH wrap, or XML envelope unwrap. Inferred as
   * a tuple, so it also decides which ids `drm` may name.
   */
  keySystems?: KeySystems;
  /**
   * Codec capability probe injected into `track-switching`'s `excludeUnplayableTracks` constraint — drops renditions
   * the environment can't decode before selection. Defaults to `canPlayTrackWithDrm`, which reads `drm` and
   * `keySystems` off this config (with no `drm`, equivalent to the plain `MediaSource.isTypeSupported`-backed
   * `canPlayTrack`); supply your own to override (e.g. force-exclude a codec).
   */
  canPlayTrack?: CanPlayTrack;
  /**
   * Codec families (RFC 6381 4CCs, e.g. `'avc1'` / `'hvc1'` / `'mp4a'`) the initial video/audio picks prefer on a
   * mixed-codec source, read by the `preferCodecFamilies` selection scope. SPF implements no
   * `SourceBuffer.changeType()`, so the initial pick's codec family is sticky for the source's lifetime
   * (`stickToSelectedCodecs`); this decides which family that is. Soft — a source with no preferred-family rendition is
   * unaffected. Defaults to `DEFAULT_PREFERRED_CODECS` (AVC + AAC, the broadest-decode pair); pass `[]` to disable and
   * let ABR pick the initial family (it then still can't leave it mid-stream).
   */
  preferredCodecs?: string[];
  /**
   * The per-type hard-constraint pre-pass and rule chain `switch{Video,Audio,Text}Track` run, each replacing its
   * `DEFAULT_*` chain outright (`@videojs/spf/hls` exports the defaults, so spread one to extend it). The video and
   * audio constraints default here to the DRM-aware pair: the default pre-pass plus `excludeRefusedKeySystems`.
   */
  videoConstraints?: SwitchVideoTrackConfig['videoConstraints'];
  videoRules?: SwitchVideoTrackConfig['videoRules'];
  audioConstraints?: SwitchAudioTrackConfig['audioConstraints'];
  audioRules?: SwitchAudioTrackConfig['audioRules'];
  textConstraints?: SwitchTextTrackConfig['textConstraints'];
  textRules?: SwitchTextTrackConfig['textRules'];
  /**
   * Conditions reported about each rendition as it resolves — the _causes_ behind a later verdict, and the copy a
   * verdict reuses when they agree. Defaults to `reportUnsupportedTrackConditionsWithDrm`, which reads `drm` and
   * `keySystems` off this config and reports non-fMP4 containers plus encryption no configured system serves; supply
   * your own to report a different set (a provider that never ships MPEG-TS can drop that check) or `() => []` to
   * report nothing.
   */
  reportUnsupportedTrackConditions?: ReportUnsupportedTrackConditions;
  preferredAudioLanguage?: string;
  preferredSubtitleLanguage?: string;
  includeForcedTracks?: boolean;
  enableDefaultTrack?: boolean;
  /**
   * Resolver that turns a text-track segment fetch into VTT cues. Defaults to the DOM-bound `resolveVttSegment`
   * resolver, which uses an offscreen `<track>` element to parse WebVTT.
   */
  resolveTextTrackSegment?: TextTrackSegmentResolver<VTTCue>;
  /**
   * Resolver for `presentation.duration`. Defaults to picking the first resolved selected track's duration (video
   * preferred, audio fallback) — appropriate for VoD and audio-only. Live engines should supply a resolver that returns
   * `Number.POSITIVE_INFINITY` once the presentation is established as live; downstream `updateMediaSourceDuration`
   * propagates that value to `mediaSource.duration` per the MSE spec.
   */
  resolveDuration?: PresentationDurationResolver;
  /**
   * Manifest parser handed to `resolvePresentation`. Defaults to the HLS multivariant-playlist parser; supply your own
   * for alternate format support without forking the engine.
   */
  parsePresentation?: ParsePresentation;
  /**
   * Allocate SPF-owned text-track slots on the media element. Defaults to the standard `<track>`-element implementation
   * in `media/dom/text/text-track-slots`.
   */
  addSubtitlesTracksToMedia?: typeof addSubtitlesTracksToMedia;
  /**
   * Return the SPF-owned subtitle/caption `TextTrack` currently in showing mode. Defaults to the standard
   * selector-based implementation in `media/dom/text/text-track-slots`.
   */
  getShowingSubtitlesTrackFromMedia?: typeof getShowingSubtitlesTrackFromMedia;
  /**
   * Evict all SPF-owned text-track slots from the media element. Defaults to the standard selector-based implementation
   * in `media/dom/text/text-track-slots`.
   */
  removeAllSubtitlesTracksFromMedia?: typeof removeAllSubtitlesTracksFromMedia;
  /**
   * Forward-buffer tuning. `bufferDuration` controls how far ahead of the playhead segments are loaded (and where
   * forward-flush kicks in). Defaults: see `DEFAULT_FORWARD_BUFFER_CONFIG` (30 seconds). Threaded to segment-loader
   * actors (v/a + text) at construction time and to `loadXSegments` dispatchers for the load-message range.
   */
  forwardBuffer?: Partial<ForwardBufferConfig>;
  /**
   * Back-buffer tuning. `keepSegments` controls how many segments stay behind the playhead before eviction. Defaults:
   * see `DEFAULT_BACK_BUFFER_CONFIG` (2 segments). Threaded to the v/a segment-loader actor only (text tracks don't use
   * back-buffer eviction).
   */
  backBuffer?: Partial<BackBufferConfig>;
  /**
   * Bandwidth-estimator tuning. Overrides any field of `BandwidthConfig` (`fastHalfLife`, `slowHalfLife`,
   * `minTotalBytes`, `minBytes`, `minDuration`). `bandwidth.minTotalBytes` supersedes the flat `minTotalBytes` field
   * above. Defaults: see `DEFAULT_BANDWIDTH_CONFIG`.
   */
  bandwidth?: Partial<BandwidthConfig>;
  /**
   * Quality-selection tuning. `safetyMargin` is the bandwidth-headroom multiplier used by `selectQuality`;
   * `upgradeMargin` is the hysteresis ratio gating ABR upgrades. Defaults: `DEFAULT_QUALITY_CONFIG` (0.85 / 1.15).
   */
  quality?: Partial<QualityConfig>;
  /**
   * Whether video renditions are capped to the player element's rendered size. Read by `trackPlayerResolution`; `false`
   * measures nothing, which leaves the `playerResolutionCap` rule inert. Defaults to `true`.
   */
  capRenditionToPlayerSize?: boolean;
  /** Whether `state.playerResolution` is reported in device pixels. Read by `trackPlayerResolution`; defaults to `true`. */
  useDevicePixelRatio?: boolean;
  /**
   * Multi-CDN failover monitor tuning. `cooldownMs` is how long a CDN stays excluded after a failed fetch trips it.
   * Defaults: `DEFAULT_FAILOVER_MONITOR_CONFIG` (300s). Only meaningful for redundant-stream sources.
   */
  failover?: Partial<FailoverMonitorConfig>;
  /**
   * How to derive a CDN grouping key from a track URL — used to build `cdnPriority`, to record the failover trip in
   * `failedCdns`, and by the track-switching CDN scope + failover constraint. One function, read by all of them, so the
   * keys stay comparable. Defaults to the URL origin; override to key on something else (e.g. Mux's `cdn=` query
   * param).
   */
  getCdnId?: GetCdnId;
  /**
   * Non-zero-PTS relocation (spike): the reduce seam consumed by the `establishStartMediaTime` reactor. Defaults to
   * per-track own origin (Tier 1); a Tier-2 variant returns the shared `min` across selected A/V. Relocation is
   * composed into the standard engine below — see the marked block — so this only needs setting to swap the tier
   * policy. See `internal/design/spf/presentation-timeline-model.md`.
   */
  deriveStartMediaTime?: DeriveStartMediaTime;
  /**
   * Proximity window (seconds) for the `recoverEndStall` behavior — how close the playhead must be to the reachable
   * buffered end for a `waiting` to be treated as the end-of-stream freeze and nudged to `ended`. Defaults to `0.2`.
   * See `behaviors/dom/recover-end-stall`.
   */
  endStallNudgeWindow?: number;
  /**
   * Live media-playlist re-run policy for the resolve* loaders' `RecurringRunner`: returns a promise that resolves when
   * the playlist should reload, or `null` to stop. Defaults to `mediaPlaylistReloadDelay` (target-duration cadence,
   * half on an unchanged window, stop on `#EXT-X-ENDLIST`) composed with a cancellable `sleep`. Inert for VoD (a
   * complete playlist stops it after the first resolve). Override to tune live reload timing.
   */
  reschedule?: Reschedule<ResolvedTrack>;
  /**
   * The `credentials` mode every engine request (manifest, media playlists, segments, chapters) is made with: a fixed
   * mode, or a policy consulted per request. The media adapters supply a policy that reads the element's `crossorigin`
   * attribute — `use-credentials` maps to `'include'`, so cookie-gated cross-origin streams work the way they do under
   * native playback — which is why this is a policy rather than a value: the engine is built once and outlives
   * attribute changes. Absent, or `undefined` from the policy, leaves the platform default (`same-origin`).
   */
  requestCredentials?: RequestCredentialsPolicy;
}

// ============================================================================
// HLS Playback Engine
// ============================================================================

const shareSignals = makeShareSignalsFor<typeof hlsVideoEngineBehaviors>();

/**
 * Create an HLS playback engine.
 *
 * Composes SPF behaviors into a reactive pipeline for HLS playback over MSE: manifest resolution, track selection, ABR,
 * segment loading, and end-of-stream coordination.
 *
 * @example
 *   ```ts
 *   let signals: HlsVideoEngineSignals;
 *   const engine = createHlsVideoEngine({
 *     initialBandwidth: 2_000_000,
 *     preferredAudioLanguage: 'en',
 *     onSignalsReady: (refs) => {
 *       signals = refs;
 *     },
 *   });
 *
 *   signals.context.mediaElement.set(videoEl);
 *   signals.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *
 *   videoEl.play();
 *
 *   await engine.destroy();
 *   ```;
 */
export function createHlsVideoEngine<const KeySystems extends readonly KeySystemModule[] = typeof DEFAULT_KEY_SYSTEMS>(
  config: HlsVideoEngineConfig<KeySystems> = {}
): Composition<HlsVideoEngineState, HlsVideoEngineContext> {
  // Non-zero-PTS relocation (spike): resolve the coordination seam once so the reactor
  // (model `startMediaTime`) and the loader stamps (buffer `timestampOffset`) apply the
  // SAME derive. Default is shared-`min` across selected A/V (subsumes per-type).
  const deriveStartMediaTime = config.deriveStartMediaTime ?? deriveSharedMinStartMediaTime;
  // No license servers configured is the degenerate DRM config: the DRM-aware
  // probe and reporter refuse encrypted renditions exactly as the DRM-less
  // `canPlayTrack` / `reportUnsupportedTrackConditions` pair does, and
  // `setupMediaKeys` reports SVTA 4008 for an encrypted source it can't serve.
  // Widened back to the runtime shapes here: the behaviors read any id, and the
  // composition's config type is the intersection of what they declare.
  const drm: DrmSystemsConfig = config.drm ?? {};
  const keySystems: readonly KeySystemModule[] = config.keySystems ?? DEFAULT_KEY_SYSTEMS;
  const finalConfig = {
    ...config,
    deriveStartMediaTime,
    drm,
    keySystems,
    // Baked (not user-overridable): this engine composes `setupAirPlay`,
    // whose native fallback `<source>` requires the MSE attachment to keep
    // sibling source alternatives part of resource selection.
    attachMediaSource: attachMediaSourceAsSourceElement,
    canPlayTrack: config.canPlayTrack ?? canPlayTrackWithDrm,
    // The late half of DRM pruning, appended to each type's default pre-pass:
    // once negotiation publishes a refusal, encrypted renditions prune and the
    // emptied type reports its own verdict. Dropped with the rest of the DRM
    // defaults by a composition that omits DRM.
    videoConstraints: config.videoConstraints ?? [...DEFAULT_VIDEO_CONSTRAINTS, excludeRefusedKeySystems],
    audioConstraints: config.audioConstraints ?? [...DEFAULT_AUDIO_CONSTRAINTS, excludeRefusedKeySystems],
    reportUnsupportedTrackConditions:
      config.reportUnsupportedTrackConditions ?? reportUnsupportedTrackConditionsWithDrm,
    resolveTextTrackSegment: config.resolveTextTrackSegment ?? resolveVttSegment,
    // Non-zero-PTS relocation (spike): the text pipeline rebases cues onto the
    // relocated 0-based timeline. Remove `textMessagePipelines` to drop text relocation.
    textMessagePipelines: relocatingTextPipelines,
    resolveDuration: config.resolveDuration ?? getResolvedSelectedTrackDuration,
    parsePresentation: config.parsePresentation ?? parseMultivariantPlaylist,
    addSubtitlesTracksToMedia: config.addSubtitlesTracksToMedia ?? addSubtitlesTracksToMedia,
    getShowingSubtitlesTrackFromMedia: config.getShowingSubtitlesTrackFromMedia ?? getShowingSubtitlesTrackFromMedia,
    removeAllSubtitlesTracksFromMedia: config.removeAllSubtitlesTracksFromMedia ?? removeAllSubtitlesTracksFromMedia,
    // Non-zero-PTS relocation (spike): the discover/stamp steps `establishStartMediaTime`
    // pairs with. They apply the same `deriveStartMediaTime` seam as the reactor. Remove
    // these two lines with the reactor.
    videoMessagePipelines: relocationPipelinesFor('video', deriveStartMediaTime),
    audioMessagePipelines: relocationPipelinesFor('audio', deriveStartMediaTime),
    // Live-anchor establishment order: each non-reference track's first parse
    // waits for the reference track to settle the wall-clock anchor question
    // (see `gate-first-parse.ts`); pairs with the reactor's anchor stamp.
    gateFirstParse: gateFirstParseOnAnchor,
    // Format-neutral live-latency seam for `seekToLiveEdge` — the HLS resolver
    // (HOLD-BACK); a DASH engine would inject `suggestedPresentationDelay`.
    resolveLiveLatency,
    // The resolve* loaders' RecurringRunner re-runs on this `reschedule`: the pure
    // target-duration cadence, start-anchored + made awaitable by `delayedReschedule`.
    // Inert for VoD (the cadence returns null once a playlist is complete), so it
    // composes always.
    reschedule: config.reschedule ?? delayedReschedule(mediaPlaylistReloadDelay),
  };

  // `shareSignals`: behavior whose sole purpose is to use a callback to allow for signal writing from the outside (e.g.
  // an adapter). NOTE: While not required, adding at the end since behaviors are setup in order, so this increases the
  // likelihood that initial signal setup will have occurred before shareSignals' callback is invoked. (CJP)
  return createComposition([...hlsVideoEngineBehaviors, shareSignals], {
    config: finalConfig,
    // Seed bandwidthState so switchVideoTrack fires on initial subscribe
    // with the `initialBandwidth` fallback rather than waiting for the
    // first chunk. The empty sample buffer means `getBandwidthEstimate`
    // returns the configured initial bandwidth until real samples land.
    initialState: {
      bandwidthState: {
        fastEstimate: 0,
        fastTotalWeight: 0,
        slowEstimate: 0,
        slowTotalWeight: 0,
        bytesSampled: 0,
      },
    },
  });
}
