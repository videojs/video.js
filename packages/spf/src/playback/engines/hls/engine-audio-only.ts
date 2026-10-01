import {
  type Composition,
  createComposition,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../core/composition/create-composition';
import { makeExternalInputs } from '../../../core/composition/make-external-inputs';
import type { BackBufferConfig } from '../../../media/buffer/back-buffer';
import type { ForwardBufferConfig } from '../../../media/buffer/forward-buffer';
import { canPlayTrack } from '../../../media/dom/capabilities';
import { attachMediaSourceAsSourceElement } from '../../../media/dom/mse/mediasource-setup';
import { parseMultivariantPlaylist } from '../../../media/hls/parse-multivariant';
import type { CanPlayTrack } from '../../../media/types';
import type { GetCdnId } from '../../../media/utils/cdn';
import { getResolvedSelectedTrackDuration } from '../../../media/utils/track-selection';
import type { RequestCredentialsPolicy } from '../../../network/credentials-fetch';
import {
  calculatePresentationDuration,
  type PresentationDurationResolver,
} from '../../behaviors/calculate-presentation-duration';
import { collectErrors } from '../../behaviors/collect-errors';
import { deriveCdnPriority } from '../../behaviors/derive-cdn-priority';
import { type DisableRemotePlaybackState, setupAirPlay } from '../../behaviors/dom/airplay';
import { applyStartPosition } from '../../behaviors/dom/apply-start-position';
import { endOfStream } from '../../behaviors/dom/end-of-stream';
import { loadChapters } from '../../behaviors/dom/load-chapters';
import { loadAudioSegments } from '../../behaviors/dom/load-segments';
import { recoverEndStall } from '../../behaviors/dom/recover-end-stall';
import { setupAudioBufferActors } from '../../behaviors/dom/setup-buffer-actors';
import { setupMediaSource } from '../../behaviors/dom/setup-mediasource';
import { trackCurrentTime } from '../../behaviors/dom/track-current-time';
import { trackLoadTriggers } from '../../behaviors/dom/track-load-triggers';
import { updateMediaSourceDuration } from '../../behaviors/dom/update-mediasource-duration';
// Non-zero-PTS relocation (spike): remove this import, the composed reactor, the
// `audioMessagePipelines` finalConfig entry, the `mediaContainerData` state slot,
// and the `deriveStartMediaTime` config field to drop relocation from audio-only.
import {
  type DeriveStartMediaTime,
  deriveSharedMinStartMediaTime,
  establishStartMediaTime,
} from '../../behaviors/establish-start-media-time';
import { type ParsePresentation, resolvePresentation } from '../../behaviors/resolve-presentation';
import { resolveAudioTrack } from '../../behaviors/resolve-track';
import { type FailoverMonitorConfig, setupFailoverMonitor } from '../../behaviors/setup-failover-monitor';
import { syncPreload } from '../../behaviors/sync-preload';
import {
  type SwitchAudioTrackConfig,
  switchAudioTrack,
  type UserTrackSelectionState,
} from '../../behaviors/track-switching';
import { relocationPipelinesFor } from '../../primitives/relocation-pipelines';
import {
  type ReportUnsupportedTrackConditions,
  reportUnsupportedTrackConditions,
} from '../../primitives/report-track-conditions';

// ============================================================================
// Audio-Only HLS Engine State & Context
// ============================================================================

/**
 * External inputs of the audio-only HLS playback engine: state written from outside the engine (by the adapter) that no
 * composed behavior declares — the consumer's track selections and remote-playback opt-out.
 */
const hlsAudioEngineExternalInputs = makeExternalInputs<
  UserTrackSelectionState<'audio'> & DisableRemotePlaybackState
>()({
  state: ['userAudioTrackSelection', 'disableRemotePlayback'],
});

/**
 * The behaviors the audio-only HLS playback engine composes, in setup order. The engine's state and context types are
 * derived from this list, so adding or removing a behavior changes them with no separate type to update.
 */
const hlsAudioEngineBehaviors = [
  syncPreload,
  trackLoadTriggers,
  resolvePresentation,

  // Session-level CDN priority for redundant-stream sources. Owns
  // `cdnPriority`; switchAudioTrack's preferActiveCdn scope reads it. No-op
  // for single-CDN sources.
  //
  // With a single track type there's no cross-type coherence to enforce and
  // the first pick is the primary CDN regardless, so composition order is
  // not load-bearing here today. It earns its place for forward-consistency
  // with the default engine and for future failover / steering, where the
  // active CDN changes dynamically (and selection stays reactive either way).
  deriveCdnPriority,

  // CDN failover cooldown: watches `failedCdns` (tripped directly by audio
  // track resolution on a failed media-playlist fetch) and removes each CDN
  // once its cooldown lapses.
  setupFailoverMonitor,

  // Owns `errors` and its per-source lifecycle; reporters append into it.
  collectErrors,

  // Audio track selection — slot owner with filter reactivity.
  // Mid-stream flush on language switch is handled in segment-loader's
  // planTasks, not here.
  switchAudioTrack,

  // Resolve selected tracks — audio only.
  resolveAudioTrack,

  // Presentation duration
  calculatePresentationDuration,

  // MSE setup. Single audio buffer; no video buffer to coordinate with,
  // so the Firefox `mozHasAudio` registration ordering is moot here.
  setupMediaSource,
  updateMediaSourceDuration,

  // Non-zero-PTS relocation (spike): establishes per-track startMediaTime;
  // MUST precede setupAudioBufferActors. Remove this line + the import + the
  // finalConfig/state entries to drop relocation. (Selection is optional in the
  // reactor, so it works with only audio in scope.)
  establishStartMediaTime,

  setupAudioBufferActors,

  // AirPlay/MSE bridge (WebKit only; no-op elsewhere). Audio-only sources
  // AirPlay to audio receivers (HomePod, AirPlay speakers) through the same
  // native-HLS fallback `<source>`; `webkitCurrentPlaybackTargetIsWireless`
  // and the picker are HTMLMediaElement-level, so an `<audio>` host is
  // AirPlay-capable on the same terms as a `<video>` one.
  setupAirPlay,

  // Playback tracking
  trackCurrentTime,
  // After trackCurrentTime: the one-shot currentTime seed must land after
  // the mirror's attach-time sync (see apply-start-position.ts).
  applyStartPosition,

  // Segment loading — audio only.
  loadAudioSegments,

  // End of stream coordination. `endOfStream` iterates buffer actors via
  // `[videoBufferActor, audioBufferActor].filter(Boolean)` and reads
  // `mediaSource.sourceBuffers` aggregately — composes unchanged with
  // only audio in scope.
  endOfStream,
  // Force native `ended` if Chrome freezes the playhead short of the buffered end
  // after `endOfStream`. Inert for a clean-ending single-track source.
  recoverEndStall,

  // Chapters. Not a subtitle behavior: an `<audio>` element carries text
  // tracks too, and podcast-style sources ship chapters. With no
  // `preferredSubtitleLanguage` on this config the `und` track leads.
  loadChapters,

  // External inputs: written by the adapter, read by the behaviors above.
  hlsAudioEngineExternalInputs,
] as const;

/** State shape for the audio-only HLS playback engine: every state key its behaviors and inputs declare. */
export type HlsAudioEngineState = ResolveBehaviorState<typeof hlsAudioEngineBehaviors>;

/** Context shape for the audio-only HLS playback engine: every context key its behaviors declare. */
export type HlsAudioEngineContext = ResolveBehaviorContext<typeof hlsAudioEngineBehaviors>;

/**
 * Configuration for the audio-only HLS playback engine.
 *
 * Subset of `HlsVideoEngineConfig` — video-quality, bandwidth-estimator, and text-track config fields are omitted (no
 * behavior consumes them).
 */
export interface HlsAudioEngineConfig {
  preferredAudioLanguage?: string;
  /**
   * Codec capability probe read by `track-switching`'s `excludeUnplayableTracks` constraint. Defaults to the
   * `MediaSource.isTypeSupported`-backed `canPlayTrack`; override to force-exclude a codec. Mirrors the default engine
   * — without it, capability probing (and TS / raw-AAC detection) would be inert for audio-only playback.
   */
  canPlayTrack?: CanPlayTrack;
  /**
   * Codec families the initial audio pick prefers on a mixed-codec source (`preferCodecFamilies` scope) — the family it
   * lands in is then sticky for the source's lifetime (`stickToSelectedCodecs`; SPF implements no
   * `SourceBuffer.changeType()`). Defaults to `DEFAULT_PREFERRED_CODECS` (AAC, plus video 4CCs inert here); pass `[]`
   * to disable.
   */
  preferredCodecs?: string[];
  /**
   * The hard-constraint pre-pass and rule chain `switchAudioTrack` runs, each replacing its `DEFAULT_AUDIO_*` chain
   * outright (`@videojs/spf/hls` exports the defaults, so spread one to extend it).
   */
  audioConstraints?: SwitchAudioTrackConfig['audioConstraints'];
  audioRules?: SwitchAudioTrackConfig['audioRules'];
  /**
   * Conditions reported about each rendition as it resolves — the _causes_ behind a later verdict, and the copy a
   * verdict reuses when they agree. Defaults to {@link reportUnsupportedTrackConditions}, which reports non-fMP4
   * containers and encryption; supply your own to report a different set (a provider that never ships MPEG-TS can drop
   * that check) or `() => []` to report nothing.
   */
  reportUnsupportedTrackConditions?: ReportUnsupportedTrackConditions;
  resolveDuration?: PresentationDurationResolver;
  parsePresentation?: ParsePresentation;
  forwardBuffer?: Partial<ForwardBufferConfig>;
  backBuffer?: Partial<BackBufferConfig>;
  /** Multi-CDN failover monitor tuning. Defaults: `DEFAULT_FAILOVER_MONITOR_CONFIG`. */
  failover?: Partial<FailoverMonitorConfig>;
  /**
   * Derive a CDN grouping key from a track URL (used by `cdnPriority`, the failover trip, and the track-switching CDN
   * rules — one function read by all). Defaults to the URL origin; override to key on e.g. Mux's `cdn=` param.
   */
  getCdnId?: GetCdnId;
  /** Non-zero-PTS relocation (spike): the reduce seam (tier knob); defaults to per-track own. */
  deriveStartMediaTime?: DeriveStartMediaTime;
  /**
   * The `credentials` mode every engine request is made with: a fixed mode, or a policy consulted per request. The
   * media adapter supplies a policy reading the element's `crossorigin` (`use-credentials` → `'include'`). See the
   * video engine's `HlsVideoEngineConfig['requestCredentials']`.
   */
  requestCredentials?: RequestCredentialsPolicy;
}

// ============================================================================
// Audio-Only HLS Playback Engine
// ============================================================================

/**
 * Create an audio-only HLS playback engine.
 *
 * Subtractive composition variant of `createHlsVideoEngine`: omits video-side behaviors (`resolveVideoTrack`,
 * `switchVideoTrack`, `setupVideoBufferActors`, `loadVideoSegments`) and subtitle behaviors (`switchTextTrack`,
 * `resolveTextTrack`, `syncTextTracks`, `setupTextTrackActors`, `loadTextTrackSegments`). Chapters (`loadChapters`)
 * stay: they are session data, not a subtitle rendition. The remaining audio pipeline composes unchanged.
 *
 * Handles both truly audio-only HLS sources (no video stream-inf) and mixed-AV HLS sources where the audio rendition is
 * selected and video / subtitle renditions are ignored at composition time. The variant decision is encoded by adapter
 * choice; this engine does not branch on source shape.
 *
 * @example
 *   ```ts
 *   const engine = createHlsAudioEngine({
 *     preferredAudioLanguage: 'en',
 *   });
 *
 *   engine.context.mediaElement.set(audioEl);
 *   engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *   ```;
 */
export function createHlsAudioEngine(
  config: HlsAudioEngineConfig = {}
): Composition<HlsAudioEngineState, HlsAudioEngineContext> {
  const deriveStartMediaTime = config.deriveStartMediaTime ?? deriveSharedMinStartMediaTime;
  const finalConfig = {
    ...config,
    deriveStartMediaTime,
    // Baked (not user-overridable): this engine composes `setupAirPlay`,
    // whose native fallback `<source>` requires the MSE attachment to keep
    // sibling source alternatives part of resource selection. The helper's
    // `video/mp4` source type is inert here — resource selection probes it
    // with `canPlayType`, which answers `'maybe'` on an audio element too.
    attachMediaSource: attachMediaSourceAsSourceElement,
    canPlayTrack: config.canPlayTrack ?? canPlayTrack,
    reportUnsupportedTrackConditions: config.reportUnsupportedTrackConditions ?? reportUnsupportedTrackConditions,
    resolveDuration: config.resolveDuration ?? getResolvedSelectedTrackDuration,
    parsePresentation: config.parsePresentation ?? parseMultivariantPlaylist,
    // Non-zero-PTS relocation (spike): pair the audio loader with the relocation steps
    // `establishStartMediaTime` derives from; same `deriveStartMediaTime` seam. Remove
    // with the reactor.
    audioMessagePipelines: relocationPipelinesFor('audio', deriveStartMediaTime),
  };

  return createComposition([...hlsAudioEngineBehaviors], {
    config: finalConfig,
  });
}
