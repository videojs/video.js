import {
  type Composition,
  type ConfigWithDefaults,
  createComposition,
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../core/composition/create-composition';
import { defineExternalSignals } from '../../../core/composition/define-external-signals';
import type { CheckKeyedFields } from '../../../core/composition/keyed-by';
import { delayedReschedule } from '../../../core/tasks/delayed-reschedule';
import { canPlayTrackWithDrm } from '../../../media/dom/capabilities';
import { DEFAULT_KEY_SYSTEMS } from '../../../media/dom/key-systems';
import { attachMediaSourceAsSourceElement } from '../../../media/dom/mse/mediasource-setup';
import { resolveVttSegment } from '../../../media/dom/text/resolve-vtt-segment';
import {
  addSubtitlesTracksToMedia,
  getShowingSubtitlesTrackFromMedia,
  removeAllSubtitlesTracksFromMedia,
} from '../../../media/dom/text/text-track-slots';
import type { DrmSystemsConfig } from '../../../media/drm';
import { parseMultivariantPlaylist } from '../../../media/hls/parse-multivariant';
import { mediaPlaylistReloadDelay, resolveLiveLatency } from '../../../media/hls/reload-policy';
import { getResolvedSelectedTrackDuration } from '../../../media/utils/track-selection';
import { calculatePresentationDuration } from '../../behaviors/calculate-presentation-duration';
import { collectErrors } from '../../behaviors/collect-errors';
import { deriveCdnPriority } from '../../behaviors/derive-cdn-priority';
import { type DisableRemotePlaybackState, setupAirPlay } from '../../behaviors/dom/airplay';
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
// `video/audio/textMessagePipelines` defaultConfig entries, the `mediaContainerData`
// state slot, and the `deriveStartMediaTime` config field to drop relocation entirely
// (text then falls back to the plain `resolveVttSegment` resolver).
import {
  deriveSharedMinStartMediaTime,
  establishStartMediaTime,
  gateFirstParseOnAnchor,
} from '../../behaviors/establish-start-media-time';
import { resolvePresentation } from '../../behaviors/resolve-presentation';
import { resolveAudioTrack, resolveTextTrack, resolveVideoTrack } from '../../behaviors/resolve-track';
import { setupFailoverMonitor } from '../../behaviors/setup-failover-monitor';
import { syncPreload } from '../../behaviors/sync-preload';
import {
  DEFAULT_AUDIO_CONSTRAINTS,
  DEFAULT_VIDEO_CONSTRAINTS,
  type SwitchAudioTrackRule,
  type SwitchVideoTrackRule,
  type UserTrackSelectionState,
  switchAudioTrack,
  switchTextTrack,
  switchVideoTrack,
} from '../../behaviors/track-switching';
import { relocatingTextPipelines, relocationPipelinesFor } from '../../primitives/relocation-pipelines';
import { reportUnsupportedTrackConditionsWithDrm } from '../../primitives/report-track-conditions';
import { excludeRefusedKeySystems } from '../../primitives/selection-rules';

// ============================================================================
// HLS Engine State & Context
// ============================================================================

/**
 * External signals of the HLS playback engine: state written from outside the engine (by the adapter) that no composed
 * behavior declares — the consumer's track selections and remote-playback opt-out.
 */
const externalSignals = defineExternalSignals<UserTrackSelectionState & DisableRemotePlaybackState>()({
  state: ['userVideoTrackSelection', 'userAudioTrackSelection', 'userTextTrackSelection', 'disableRemotePlayback'],
});

/**
 * The behaviors the HLS playback engine composes, in setup order. The engine's state and context types are derived from
 * this list, so adding or removing a behavior changes them with no separate type to update.
 */
const behaviors = [
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

  // External signals: written by the adapter, read by the behaviors above.
  externalSignals,
] as const;

/** State shape for the HLS playback engine: every state key its behaviors and inputs declare. */
export type EngineState = ResolveBehaviorState<typeof behaviors>;

/** Context shape for the HLS playback engine: every context key its behaviors declare. */
export type EngineContext = ResolveBehaviorContext<typeof behaviors>;

/**
 * Configuration for the HLS playback engine: every config key its behaviors read, with each key `defaultConfig` covers
 * optional. Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = ConfigWithDefaults<ResolveBehaviorConfig<typeof behaviors>, typeof defaultConfig>;

// ============================================================================
// HLS Playback Engine
// ============================================================================

// Typed as the runtime shapes the behaviors read, so `defaults` accepts any `EngineConfig` against them.
const noLicenseServers: DrmSystemsConfig = {};
// The literal tuple, so a config that omits `keySystems` is checked against the default systems' ids.
const defaultKeySystems: typeof DEFAULT_KEY_SYSTEMS = DEFAULT_KEY_SYSTEMS;
const drmAwareVideoConstraints: readonly SwitchVideoTrackRule[] = [
  ...DEFAULT_VIDEO_CONSTRAINTS,
  excludeRefusedKeySystems,
];
const drmAwareAudioConstraints: readonly SwitchAudioTrackRule[] = [
  ...DEFAULT_AUDIO_CONSTRAINTS,
  excludeRefusedKeySystems,
];

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`. Also includes wiring the
 * engine config doesn't expose (`attachMediaSource`, the relocation pipelines, `gateFirstParse`,
 * `resolveLiveLatency`).
 */
export const defaultConfig = {
  // Non-zero-PTS relocation (spike): the coordination seam the reactor (model
  // `startMediaTime`) and the loader stamps (buffer `timestampOffset`) both read from
  // config, so they apply the SAME derive. Shared-`min` across selected A/V (subsumes
  // per-type).
  deriveStartMediaTime: deriveSharedMinStartMediaTime,
  // No license servers configured is the degenerate DRM config: the DRM-aware
  // probe and reporter refuse encrypted renditions exactly as the DRM-less
  // `canPlayTrack` / `reportUnsupportedTrackConditions` pair does, and
  // `setupMediaKeys` reports SVTA 4008 for an encrypted source it can't serve.
  // Typed as the runtime shapes: the behaviors read any id, and the composition's
  // config type is the intersection of what they declare.
  drm: noLicenseServers,
  keySystems: defaultKeySystems,
  // Not in `EngineConfig`: this engine composes `setupAirPlay`, whose native
  // fallback `<source>` requires the MSE attachment to keep sibling source
  // alternatives part of resource selection.
  attachMediaSource: attachMediaSourceAsSourceElement,
  canPlayTrack: canPlayTrackWithDrm,
  // The late half of DRM pruning, appended to each type's default pre-pass:
  // once negotiation publishes a refusal, encrypted renditions prune and the
  // emptied type reports its own verdict. Dropped with the rest of the DRM
  // defaults by a composition that omits DRM.
  videoConstraints: drmAwareVideoConstraints,
  audioConstraints: drmAwareAudioConstraints,
  reportUnsupportedTrackConditions: reportUnsupportedTrackConditionsWithDrm,
  resolveTextTrackSegment: resolveVttSegment,
  // Non-zero-PTS relocation (spike): the text pipeline rebases cues onto the
  // relocated 0-based timeline. Remove `textMessagePipelines` to drop text relocation.
  textMessagePipelines: relocatingTextPipelines,
  resolveDuration: getResolvedSelectedTrackDuration,
  parsePresentation: parseMultivariantPlaylist,
  addSubtitlesTracksToMedia,
  getShowingSubtitlesTrackFromMedia,
  removeAllSubtitlesTracksFromMedia,
  // Non-zero-PTS relocation (spike): the discover/stamp steps `establishStartMediaTime`
  // pairs with. They apply the same `deriveStartMediaTime` seam as the reactor. Remove
  // these two lines with the reactor.
  videoMessagePipelines: relocationPipelinesFor('video'),
  audioMessagePipelines: relocationPipelinesFor('audio'),
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
  reschedule: delayedReschedule(mediaPlaylistReloadDelay),
};

/**
 * The state the engine starts with. Seeds `bandwidthState` so `switchVideoTrack` fires on initial subscribe with the
 * `initialBandwidth` fallback rather than waiting for the first chunk: the empty sample buffer means
 * `getBandwidthEstimate` returns the configured initial bandwidth until real samples land.
 */
export const initialState = {
  bandwidthState: {
    fastEstimate: 0,
    fastTotalWeight: 0,
    slowEstimate: 0,
    slowTotalWeight: 0,
    bytesSampled: 0,
  },
};

/**
 * Create an HLS playback engine.
 *
 * Composes SPF behaviors into a reactive pipeline for HLS playback over MSE: manifest resolution, track selection, ABR,
 * segment loading, and end-of-stream coordination.
 *
 * @example
 *   ```ts
 *   const engine = createEngine({
 *     initialBandwidth: 2_000_000,
 *   });
 *
 *   engine.context.mediaElement.set(videoEl);
 *   engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *
 *   videoEl.play();
 *
 *   await engine.destroy();
 *   ```;
 */
export function createEngine<const Config extends EngineConfig = EngineConfig>(
  config?: Config & CheckKeyedFields<ResolveBehaviorConfig<typeof behaviors>, Config, typeof defaultConfig>
): Composition<EngineState, EngineContext> {
  // Checked above, at this function's call site; here `config` is generic, so compose against the general type.
  return createComposition<typeof behaviors, typeof defaultConfig, EngineConfig>([...behaviors], {
    defaultConfig,
    config,
    initialState,
  });
}
