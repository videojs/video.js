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
import { canPlayTrack } from '../../../media/dom/capabilities';
import { attachMediaSourceAsSourceElement } from '../../../media/dom/mse/mediasource-setup';
import { parseMultivariantPlaylist } from '../../../media/hls/parse-multivariant';
import { getResolvedSelectedTrackDuration } from '../../../media/utils/track-selection';
import { calculatePresentationDuration } from '../../behaviors/calculate-presentation-duration';
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
// `audioMessagePipelines` defaultConfig entry, the `mediaContainerData` state slot,
// and the `deriveStartMediaTime` config field to drop relocation from audio-only.
import { deriveSharedMinStartMediaTime, establishStartMediaTime } from '../../behaviors/establish-start-media-time';
import { resolvePresentation } from '../../behaviors/resolve-presentation';
import { resolveAudioTrack } from '../../behaviors/resolve-track';
import { setupFailoverMonitor } from '../../behaviors/setup-failover-monitor';
import { syncPreload } from '../../behaviors/sync-preload';
import { switchAudioTrack, type UserTrackSelectionState } from '../../behaviors/track-switching';
import { relocationPipelinesFor } from '../../primitives/relocation-pipelines';
import { reportUnsupportedTrackConditions } from '../../primitives/report-track-conditions';

// ============================================================================
// Audio-Only HLS Engine State & Context
// ============================================================================

/**
 * External signals of the audio-only HLS playback engine: state written from outside the engine (by the adapter) that
 * no composed behavior declares — the consumer's track selections and remote-playback opt-out.
 */
const externalSignals = defineExternalSignals<UserTrackSelectionState<'audio'> & DisableRemotePlaybackState>()({
  state: ['userAudioTrackSelection', 'disableRemotePlayback'],
});

/**
 * The behaviors the audio-only HLS playback engine composes, in setup order. The engine's state and context types are
 * derived from this list, so adding or removing a behavior changes them with no separate type to update.
 */
const behaviors = [
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
  // defaultConfig/state entries to drop relocation. (Selection is optional in the
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

  // External signals: written by the adapter, read by the behaviors above.
  externalSignals,
] as const;

/** State shape for the audio-only HLS playback engine: every state key its behaviors and inputs declare. */
export type EngineState = ResolveBehaviorState<typeof behaviors>;

/** Context shape for the audio-only HLS playback engine: every context key its behaviors declare. */
export type EngineContext = ResolveBehaviorContext<typeof behaviors>;

/**
 * Configuration for the audio-only HLS playback engine: every config key its behaviors read, with each key
 * `defaultConfig` covers optional. Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = ConfigWithDefaults<ResolveBehaviorConfig<typeof behaviors>, typeof defaultConfig>;

// ============================================================================
// Audio-Only HLS Playback Engine
// ============================================================================

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`. Also includes wiring the
 * engine config doesn't expose (`attachMediaSource`, the relocation pipeline).
 */
export const defaultConfig = {
  deriveStartMediaTime: deriveSharedMinStartMediaTime,
  // Not in `EngineConfig`: this engine composes `setupAirPlay`, whose native
  // fallback `<source>` requires the MSE attachment to keep sibling source
  // alternatives part of resource selection. The helper's `video/mp4` source
  // type is inert here — resource selection probes it with `canPlayType`,
  // which answers `'maybe'` on an audio element too.
  attachMediaSource: attachMediaSourceAsSourceElement,
  canPlayTrack,
  reportUnsupportedTrackConditions,
  resolveDuration: getResolvedSelectedTrackDuration,
  parsePresentation: parseMultivariantPlaylist,
  // Non-zero-PTS relocation (spike): pair the audio loader with the relocation steps
  // `establishStartMediaTime` derives from; same `deriveStartMediaTime` seam. Remove
  // with the reactor.
  audioMessagePipelines: relocationPipelinesFor('audio'),
};

/** The state the engine starts with. Nothing needs seeding; exported so every engine module has the same shape. */
export const initialState = {};

/**
 * Create an audio-only HLS playback engine.
 *
 * Subtractive composition variant of the HLS video engine (`./engine`): omits video-side behaviors
 * (`resolveVideoTrack`, `switchVideoTrack`, `setupVideoBufferActors`, `loadVideoSegments`) and subtitle behaviors
 * (`switchTextTrack`, `resolveTextTrack`, `syncTextTracks`, `setupTextTrackActors`, `loadTextTrackSegments`). Chapters
 * (`loadChapters`) stay: they are session data, not a subtitle rendition. The remaining audio pipeline composes
 * unchanged.
 *
 * Handles both truly audio-only HLS sources (no video stream-inf) and mixed-AV HLS sources where the audio rendition is
 * selected and video / subtitle renditions are ignored at composition time. The variant decision is encoded by adapter
 * choice; this engine does not branch on source shape.
 *
 * @example
 *   ```ts
 *   const engine = createEngine();
 *
 *   engine.context.mediaElement.set(audioEl);
 *   engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *   ```;
 */
export function createEngine<const Config extends EngineConfig = EngineConfig>(
  config?: Config & CheckKeyedFields<ResolveBehaviorConfig<typeof behaviors>, Config, typeof defaultConfig>
): Composition<EngineState, EngineContext> {
  // Checked at this function's call site. Widened to the general type, the composition's own check of it is trivial.
  const engineConfig: EngineConfig | undefined = config;

  return createComposition([...behaviors], { defaultConfig, config: engineConfig, initialState });
}
