import {
  type ConfigWithDefaults,
  defineCompositionFactory,
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../core/composition/create-composition';
import { canPlayTrack } from '../../../media/dom/capabilities';
import { SVTA_NO_SUPPORTED_VIDEO_TRACK } from '../../../media/errors';
import { parseMultivariantPlaylist } from '../../../media/hls/parse-multivariant';
import { getResolvedSelectedTrackDuration } from '../../../media/utils/track-selection';
import { calculatePresentationDuration } from '../../behaviors/calculate-presentation-duration';
import { collectErrors, reportAbsentTrackType } from '../../behaviors/collect-errors';
import { endOfStream } from '../../behaviors/dom/end-of-stream';
import { loadVideoSegments } from '../../behaviors/dom/load-segments';
import { setupVideoBufferActors } from '../../behaviors/dom/setup-buffer-actors';
import { setupMediaSource } from '../../behaviors/dom/setup-mediasource';
import { trackCurrentTime } from '../../behaviors/dom/track-current-time';
import { trackScreenResolution } from '../../behaviors/dom/track-screen-resolution';
import { updateMediaSourceDuration } from '../../behaviors/dom/update-mediasource-duration';
import { resolvePresentation } from '../../behaviors/resolve-presentation';
import { resolveVideoTrack } from '../../behaviors/resolve-track';
import {
  preferHighestResolution,
  type SelectVideoTrackConfig,
  screenResolutionCap,
  selectVideoTrack,
} from '../../behaviors/select-tracks';
import { reportUnsupportedTrackConditions } from '../../primitives/report-track-conditions';
import { excludeUnplayableTracks } from '../../primitives/selection-rules';

// ============================================================================
// Background-video engine state & context
// ============================================================================

/**
 * The behaviors the background-video playback engine composes, in setup order. The engine's state and context types are
 * derived from this list, so adding or removing a behavior changes them with no separate type to update.
 */
export const behaviors = [
  resolvePresentation,
  // Presentation duration
  calculatePresentationDuration,

  // Owns `errors` and its per-source lifecycle; reporters append into it.
  collectErrors,

  // Track selection - pinned single-rendition pick on presentation resolve,
  // unpinned again if the constraint pre-pass later prunes every rendition
  // (which is how a container relabel reaches a pick already made).
  selectVideoTrack,
  // Resolve selected video track (fetch its media playlist)
  resolveVideoTrack,
  // Segment loading — video-only.
  loadVideoSegments,

  // MSE setup — video-only.
  setupMediaSource,
  updateMediaSourceDuration,
  setupVideoBufferActors,

  // Playback tracking
  trackCurrentTime,

  // Environment tracking — the signal source for a screen-size rendition
  // cap. Independent of the presentation, so it sits outside the
  // resolve/select/load sequence above.
  trackScreenResolution,

  // End of stream coordination
  endOfStream,
] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = ResolveBehaviorConfig<Behaviors>;

/**
 * State shape for the background-video playback engine: every state key its behaviors declare.
 *
 * Includes `bandwidthState`: `setupVideoBufferActors` declares it and `loadVideoSegments` samples into it, which is
 * wasted work in this variant, since nothing ranks by bandwidth.
 */
export type EngineState = ResolveBehaviorState<Behaviors>;

/** Context shape for the background-video playback engine: every context key its behaviors declare. */
export type EngineContext = ResolveBehaviorContext<Behaviors>;

/**
 * Configuration for the background-video engine: every config key its behaviors read, with each key `defaultConfig`
 * covers optional. Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = ConfigWithDefaults<Config, typeof defaultConfig>;

// ============================================================================
// Background-video playback engine
// ============================================================================

// Prune what this environment can't decode, then report 2011 if nothing is left: this engine composes only video, so a
// source with none playable can never play.
// SAFETY: `reportAbsentTrackType` also reads the optional `errors` state, which the config's rule type doesn't
// declare; `collectErrors` provides it in this composition, and the rule no-ops without it.
const videoConstraints = [excludeUnplayableTracks, reportAbsentTrackType(SVTA_NO_SUPPORTED_VIDEO_TRACK)] as NonNullable<
  SelectVideoTrackConfig['videoConstraints']
>;
// Narrow to the renditions that fit the screen, then take the largest.
const videoRules: NonNullable<SelectVideoTrackConfig['videoRules']> = [screenResolutionCap, preferHighestResolution];

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`, including wiring such as
 * `resolveDuration`. Each is optional in `EngineConfig`, so a caller may override it.
 */
export const defaultConfig = {
  videoConstraints,
  videoRules,
  parsePresentation: parseMultivariantPlaylist,
  resolveDuration: getResolvedSelectedTrackDuration,
  canPlayTrack,
  reportUnsupportedTrackConditions,
} satisfies Partial<Config>;

/**
 * The state the engine starts with. `loadActivated: true` stands in for the preload gating this engine doesn't compose,
 * so it starts loading the moment a source is set.
 */
export const initialState = {
  loadActivated: true,
} satisfies Partial<EngineState>;

/**
 * Create a background-video playback engine.
 *
 * Subtractive composition over the HLS engine baseline: audio-side, text-side, ABR-driven, preload-monitoring, and
 * play/seek load-trigger behaviors are removed. `selectVideoTrack` (with a highest-resolution rule by default) replaces
 * `switchVideoQuality`, pinning a single rendition for the session. The initial state seeds `loadActivated: true` so
 * the composition behaves as if preload has already been activated — appropriate for ambient / hero / GIF-replacement
 * surfaces that should start loading the moment a src is set.
 *
 * Error reporting is _not_ subtracted: `collectErrors` owns the sequence, `resolveVideoTrack` reports per-rendition
 * causes, and `selectVideoTrack` reports the video verdict when nothing survives its constraints. Without them every
 * unplayable source here is a silent stall — an unsupported container, encryption this engine can't decrypt, and an
 * undecodable codec all leave `HTMLMediaElement.error` null on both Chromium and WebKit.
 *
 * Native `loop` / `muted` / `autoplay` are adapter concerns and live on `HlsBackgroundVideoAdapterCore` rather than the
 * engine.
 *
 * @example
 *   ```ts
 *   const engine = createEngine();
 *
 *   engine.context.mediaElement.set(videoEl);
 *   engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *
 *   await engine.destroy();
 *   ```;
 */
export const createEngine = defineCompositionFactory([...behaviors], { defaultConfig, initialState });
