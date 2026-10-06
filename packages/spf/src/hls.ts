// The unit of DRM composability: one value per key system, carrying that
// system's whole contribution to negotiation, init data, and license shaping.
// `config.keySystems` is public, so without these a consumer could neither
// narrow the default nor reconstruct it — `[widevineKeySystem]` alone drops
// PlayReady's and FairPlay's code from the bundle.
// `DrmSystemsConfig` is the `drm` config shape — the HLS video engine's and
// the structured `source.drm`'s — so a consumer building one can name it.
export type { DrmSystemsConfig, KeySystemModule } from './media/drm';
export {
  DEFAULT_KEY_SYSTEMS,
  clearKeySystem,
  fairPlayKeySystem,
  playReadyKeySystem,
  widevineKeySystem,
} from './media/dom/key-systems';
// Opt-in, tree-shakable transforms for providers off the raw-wire default: a
// form-encoding `licenseRequest` factory (the `spc=` FairPlay dialect), plus
// `licenseResponse` unwrappers — a FairPlay CKC unwrapper (XML/JSON envelopes)
// and a JSON license unwrapper. Imported only when dropped into a
// `source.drm[ks]` slot, so a composition that needs none pays for none.
export {
  detectFairPlayCkc,
  formEncodeLicenseRequest,
  type FormEncodeLicenseRequestOptions,
  unwrapJsonLicense,
} from './media/dom/license-transforms';
// SVTA 2070 error vocabulary — the codes reported on `state.errors` and
// surfaced through the adapter's `error`.
export type { SvtaError } from './media/errors';
export { SVTA_UNSUPPORTED_PLAYBACK_FEATURE, svtaCategory, svtaIndex } from './media/errors';
// HLS media-playlist metadata, including `playlistType` ('VOD' | 'EVENT'). Lets
// consumers distinguish an EVENT / DVR source from sliding-window live directly
// from the manifest, rather than inferring it from the seekable window size.
export type { MediaPlaylistMetadata } from './media/types';
export { getMediaPlaylistMetadata } from './media/types';
// HLS multivariant-playlist metadata: every `#EXT-X-SESSION-DATA` tag, read back
// by `DATA-ID`. Apple's JSON chapters are the first consumer; the parser and its
// `Chapter` shape ship alongside so a consumer can read the document itself.
export type { MultivariantPlaylistMetadata, SessionDataEntry } from './media/types';
export { getMultivariantPlaylistMetadata, getSessionData } from './media/types';
export type {
  Chapter,
  ChapterImage,
  ChapterMetadata,
  HlsJsonChapter,
  HlsJsonChapters,
} from './media/hls/parse-json-chapters';
export { APPLE_HLS_CHAPTERS_DATA_ID, parseHlsJsonChapters } from './media/hls/parse-json-chapters';
export { findSessionDataUri } from './media/hls/session-data';
// Non-zero-PTS relocation (spike): the coordination seam type + the shared-`min`
// default and the per-type alternative, for a consumer swapping the policy via
// `config.deriveStartMediaTime`.
export {
  type DeriveStartMediaTime,
  derivePerTypeStartMediaTime,
  deriveSharedMinStartMediaTime,
} from './playback/behaviors/establish-start-media-time';
// The selection rules the engines compose by default, plus the rule shapes
// themselves. The chain config keys are public, so without these a consumer can
// override a chain but cannot reconstruct or partially opt out of the default it
// replaces — `[preferHighestResolution]` alone drops the screen-size cap, and a
// DRM engine's `videoConstraints` needs `excludeRefusedKeySystems` to keep
// pruning refused renditions.
export type { SelectTrackRule } from './playback/behaviors/select-tracks';
export { preferHighestResolution, screenResolutionCap } from './playback/behaviors/select-tracks';
export {
  DEFAULT_AUDIO_CONSTRAINTS,
  DEFAULT_AUDIO_RULES,
  DEFAULT_TEXT_CONSTRAINTS,
  DEFAULT_TEXT_RULES,
  DEFAULT_VIDEO_CONSTRAINTS,
  DEFAULT_VIDEO_RULES,
  stickToSelectedCodecs,
  type SwitchAudioTrackRule,
  type SwitchTextTrackRule,
  type SwitchVideoTrackRule,
} from './playback/behaviors/track-switching';
export {
  type CodecPreferenceConfig,
  DEFAULT_PREFERRED_CODECS,
  excludeRefusedKeySystems,
  preferCodecFamilies,
} from './playback/primitives/selection-rules';
// The features the engines are composed from: each a set of behaviors with the
// config defaults and initial state they need. Pass a list of them, in order, to
// `flattenFeatures` (from `@videojs/spf`) to compose an engine of your own; each
// engine entry also exports its own `features` list.
export { airPlayFeature } from './playback/engines/hls/features/airplay';
export { airPlayFairPlayFeature } from './playback/engines/hls/features/airplay-fairplay';
export { audioFeature } from './playback/engines/hls/features/audio';
export { backgroundVideoFeature } from './playback/engines/hls/features/background-video';
export { calculateDurationFeature } from './playback/engines/hls/features/calculate-duration';
export { chaptersFeature } from './playback/engines/hls/features/chapters';
export { currentTimeFeature } from './playback/engines/hls/features/current-time';
export { drmFeature } from './playback/engines/hls/features/drm';
export { endStallRecoveryFeature } from './playback/engines/hls/features/end-stall-recovery';
export { errorFeature } from './playback/engines/hls/features/error';
export { hlsLoadingFeature } from './playback/engines/hls/features/hls-loading';
export { initialLoadFeature } from './playback/engines/hls/features/initial-load';
export { liveFeature } from './playback/engines/hls/features/live';
export { mediaSourceFeature } from './playback/engines/hls/features/media-source';
export { monitorPlayerSizeFeature } from './playback/engines/hls/features/monitor-player-size';
export { multiCdnFeature } from './playback/engines/hls/features/multi-cdn';
export { shiftTextTimestampsFeature } from './playback/engines/hls/features/shift-text-timestamps';
export { shiftTimestampsFeature } from './playback/engines/hls/features/shift-timestamps';
export { startPositionFeature } from './playback/engines/hls/features/start-position';
export { textTracksFeature } from './playback/engines/hls/features/text-tracks';
export { videoFeature } from './playback/engines/hls/features/video';
// The engines themselves are not here: each has its own entry point —
// `@videojs/spf/engines/hls-video`, `@videojs/spf/engines/hls-audio`, and
// `@videojs/spf/engines/hls-background-video` — exporting the same names
// (`createEngine`, `features`, `behaviors`, `defaultConfig`, `initialState`, and the
// `EngineState`, `EngineContext`, `EngineConfig`, `Behaviors`, `Config` types), so a
// consumer pulls in only the engine it drives. This entry holds what they
// share. The Medias over the engines live behind `@videojs/spf/adapters/hls-video`,
// `@videojs/spf/adapters/hls-audio`, and `@videojs/spf/adapters/hls-background-video`, so
// driving an engine directly doesn't pull a Media (and `@videojs/media`) in.
