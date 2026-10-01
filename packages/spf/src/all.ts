/**
 * All SPF exports (public + internal) for bundle size measurement.
 *
 * This file exports everything implemented in SPF, including internal APIs. Use this for accurate bundle size
 * measurements during development.
 *
 * For the public API, import from './index' instead.
 */

// Re-export everything from public API
export * from './index';

// =============================================================================
// HLS Parsing (P1, P2, P3)
// =============================================================================

export type {
  Chapter,
  ChapterImage,
  ChapterMetadata,
  HlsJsonChapter,
  HlsJsonChapters,
} from './media/hls/parse-json-chapters';
export { APPLE_HLS_CHAPTERS_DATA_ID, parseHlsJsonChapters } from './media/hls/parse-json-chapters';
export { parseMediaPlaylist } from './media/hls/parse-media-playlist';
export { parseMultivariantPlaylist } from './media/hls/parse-multivariant';
export { resolveUrl } from './media/hls/resolve-url';

// =============================================================================
// ABR (P6, P7)
// =============================================================================

export type { QualityConfig } from './media/abr/quality-selection';
export { DEFAULT_QUALITY_CONFIG } from './media/abr/quality-selection';
export type { BandwidthConfig, BandwidthState } from './network/bandwidth-estimator';
export { DEFAULT_BANDWIDTH_CONFIG, getBandwidthEstimate, sampleBandwidth } from './network/bandwidth-estimator';

// =============================================================================
// Buffer Management (P8, P9)
// =============================================================================

export type { BackBufferConfig } from './media/buffer/back-buffer';
export { calculateBackBufferFlushPoint, DEFAULT_BACK_BUFFER_CONFIG } from './media/buffer/back-buffer';
export type { ForwardBufferConfig } from './media/buffer/forward-buffer';
export { DEFAULT_FORWARD_BUFFER_CONFIG, getSegmentsToLoad } from './media/buffer/forward-buffer';

// =============================================================================
// Types (P15)
// =============================================================================

export type {
  AudioTrack,
  FrameRate,
  MaybeResolvedPresentation,
  MediaElementLike,
  MultivariantPlaylistMetadata,
  PartiallyResolvedAudioTrack,
  PartiallyResolvedTextTrack,
  PartiallyResolvedTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  Segment,
  SelectionSet,
  SessionDataEntry,
  TextTrack,
  Track,
  VideoTrack,
} from './media/types';
export {
  getMultivariantPlaylistMetadata,
  getSessionData,
  hasPresentationDuration,
  isResolvedPresentation,
  isResolvedTrack,
} from './media/types';

// =============================================================================
// DOM APIs (P4, P12, P16)
// =============================================================================

export type { AttachMediaSourceResult, CreateMediaSourceOptions } from './media/dom/mse/mediasource-setup';
export {
  attachMediaSource,
  attachMediaSourceAsSourceElement,
  createMediaSource,
  createSourceBuffer,
  isCodecSupported,
  supportsManagedMediaSource,
  supportsMediaSource,
} from './media/dom/mse/mediasource-setup';
export type { AddChaptersTracksOptions } from './media/dom/text/chapters-tracks';
export { addChaptersTracksToMedia, removeAllChaptersTracksFromMedia } from './media/dom/text/chapters-tracks';
export { fetchResolvable, getResponseText } from './network/fetch';

// =============================================================================
// Features (F1)
// =============================================================================

export type {
  ParsePresentation,
  PresentationState,
  ResolvePresentationConfig,
} from './playback/behaviors/resolve-presentation';
export { resolvePresentation } from './playback/behaviors/resolve-presentation';
export { syncPreload } from './playback/behaviors/sync-preload';

// =============================================================================
// Features — Track Switching (video ABR + audio language selection)
// =============================================================================

export type {
  SwitchAudioTrackConfig,
  SwitchTextTrackConfig,
  SwitchVideoTrackConfig,
  TrackSwitchingSharedConfig,
  TrackSwitchingState,
} from './playback/behaviors/track-switching';
export {
  DEFAULT_INITIAL_BANDWIDTH,
  switchAudioTrack,
  switchTextTrack,
  switchVideoTrack,
} from './playback/behaviors/track-switching';
