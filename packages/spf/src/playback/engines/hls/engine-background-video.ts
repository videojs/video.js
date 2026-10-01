import {
  type Composition,
  type ContextSignals,
  createComposition,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
  type StateSignals,
} from '../../../core/composition/create-composition';
import { makeShareSignalsFor, type ShareSignalsConfig } from '../../../core/composition/share-signals';
import { canPlayTrack } from '../../../media/dom/capabilities';
import { SVTA_NO_SUPPORTED_VIDEO_TRACK } from '../../../media/errors';
import { parseMultivariantPlaylist } from '../../../media/hls/parse-multivariant';
import type { CanPlayTrack } from '../../../media/types';
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
import { type ParsePresentation, resolvePresentation } from '../../behaviors/resolve-presentation';
import { resolveVideoTrack } from '../../behaviors/resolve-track';
import {
  preferHighestResolution,
  type SelectVideoTrackConfig,
  screenResolutionCap,
  selectVideoTrack,
} from '../../behaviors/select-tracks';
import {
  type ReportUnsupportedTrackConditions,
  reportUnsupportedTrackConditions,
} from '../../primitives/report-track-conditions';
import { excludeUnplayableTracks } from '../../primitives/selection-rules';

// ============================================================================
// Background-video engine state & context
// ============================================================================

/**
 * The behaviors the background-video playback engine composes, in setup order. The engine's state and context types are
 * derived from this list, so adding or removing a behavior changes them with no separate type to update.
 */
const backgroundVideoEngineBehaviors = [
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

/**
 * State shape for the background-video playback engine: every state key its behaviors declare.
 *
 * Includes `bandwidthState`: `setupVideoBufferActors` declares it and `loadVideoSegments` samples into it, which is
 * wasted work in this variant, since nothing ranks by bandwidth.
 */
export type BackgroundVideoEngineState = ResolveBehaviorState<typeof backgroundVideoEngineBehaviors>;

/** Context shape for the background-video playback engine: every context key its behaviors declare. */
export type BackgroundVideoEngineContext = ResolveBehaviorContext<typeof backgroundVideoEngineBehaviors>;

/**
 * The composition signal refs handed to `onSignalsReady` callers — the canonical way to drive the engine externally
 * (writes) or observe its state (reads) without touching `composition.state` / `composition.context` directly.
 */
export type BackgroundVideoEngineSignals = {
  state: StateSignals<BackgroundVideoEngineState>;
  context: ContextSignals<BackgroundVideoEngineContext>;
};

/**
 * Configuration for the background-video engine.
 *
 * Each option is consumed by the appropriate behavior — the engine itself has no config beyond what its behaviors read.
 * Compared to `HlsVideoEngineConfig`, audio/text/ABR/bandwidth/quality knobs are dropped: the variant subtracts the
 * behaviors that read them.
 */
export interface BackgroundVideoEngineConfig extends ShareSignalsConfig<
  BackgroundVideoEngineState,
  BackgroundVideoEngineContext
> {
  /**
   * Hard-constraint pre-pass handed to `selectVideoTrack`. Defaults to `[excludeUnplayableTracks,
   * reportAbsentTrackType(2011)]` — prune the renditions this environment can't decode, then report 2011 if nothing is
   * left (this engine composes only video, so a source with none playable can never play).
   */
  videoConstraints?: SelectVideoTrackConfig['videoConstraints'];
  /**
   * Selection-rule chain handed to `selectVideoTrack`. Defaults to `[screenResolutionCap, preferHighestResolution]` —
   * narrows to the renditions that fit the screen, takes the largest of those, and pins it for the session.
   *
   * The cap sits ahead of the ranker because a scope that narrows first wins over one applied later; pass
   * `[preferHighestResolution]` alone to opt out and always pin the largest rendition on offer.
   */
  videoRules?: readonly NonNullable<SelectVideoTrackConfig['videoRules']>[number][];
  /** Manifest parser handed to `resolvePresentation`. Defaults to the HLS multivariant-playlist parser. */
  parsePresentation?: ParsePresentation;
  /** Whether `state.screenResolution` is reported in device pixels. Read by `trackScreenResolution`; defaults to `true`. */
  useDevicePixelRatio?: boolean;
  /**
   * Codec/container capability probe read by `selectVideoTrack`'s constraint pre-pass. Defaults to the DOM
   * `canPlayTrack`; override to force-exclude a codec.
   */
  canPlayTrack?: CanPlayTrack;
  /**
   * Per-rendition condition reporting, called by `resolveVideoTrack` once a media playlist parses. Defaults to
   * {@link reportUnsupportedTrackConditions}, which reports non-fMP4 containers (1004) and encryption (4008).
   */
  reportUnsupportedTrackConditions?: ReportUnsupportedTrackConditions;
}

// ============================================================================
// Background-video playback engine
// ============================================================================

const shareSignals = makeShareSignalsFor<typeof backgroundVideoEngineBehaviors>();

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
 *   let signals: BackgroundVideoEngineSignals;
 *   const engine = createBackgroundVideoEngine({
 *     onSignalsReady: (refs) => {
 *       signals = refs;
 *     },
 *   });
 *
 *   signals.context.mediaElement.set(videoEl);
 *   signals.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *
 *   await engine.destroy();
 *   ```;
 */
export function createBackgroundVideoEngine(
  config: BackgroundVideoEngineConfig = {}
): Composition<BackgroundVideoEngineState, BackgroundVideoEngineContext> {
  const finalConfig = {
    ...config,
    videoConstraints: config.videoConstraints ?? [
      excludeUnplayableTracks,
      reportAbsentTrackType(SVTA_NO_SUPPORTED_VIDEO_TRACK),
    ],
    videoRules: config.videoRules ?? [screenResolutionCap, preferHighestResolution],
    parsePresentation: config.parsePresentation ?? parseMultivariantPlaylist,
    resolveDuration: getResolvedSelectedTrackDuration,
    canPlayTrack: config.canPlayTrack ?? canPlayTrack,
    reportUnsupportedTrackConditions: config.reportUnsupportedTrackConditions ?? reportUnsupportedTrackConditions,
  };

  return createComposition([...backgroundVideoEngineBehaviors, shareSignals], {
    config: finalConfig,
    initialState: {
      // Note: Set to true until we add preload configuration
      loadActivated: true,
    },
  });
}
