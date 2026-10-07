// The unit of DRM composability: one value per key system, carrying that
// system's whole contribution to negotiation, init data, and license shaping.
// `config.keySystems` is public, so without these a consumer could neither
// narrow the default nor reconstruct it — `[widevineKeySystem]` alone drops
// PlayReady's and FairPlay's code from the bundle.
// `DrmSystemsConfig` is the `drm` config shape — `createHlsVideoEngine`'s and
// the structured `source.drm`'s — so a consumer building one can name it.
export type { DrmSystemsConfig, KeySystemModule } from '../../../media/drm';
export {
  DEFAULT_KEY_SYSTEMS,
  clearKeySystem,
  fairPlayKeySystem,
  playReadyKeySystem,
  widevineKeySystem,
} from '../../../media/dom/key-systems';
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
} from '../../../media/dom/license-transforms';
// SVTA 2070 error vocabulary — the codes reported on `state.errors` and
// surfaced through the adapter's `error`.
export type { SvtaError } from '../../../media/errors';
export { SVTA_UNSUPPORTED_PLAYBACK_FEATURE, svtaCategory, svtaIndex } from '../../../media/errors';
// HLS media-playlist metadata, including `playlistType` ('VOD' | 'EVENT'). Lets
// consumers distinguish an EVENT / DVR source from sliding-window live directly
// from the manifest, rather than inferring it from the seekable window size.
export type { MediaPlaylistMetadata } from '../../../media/types';
export { getMediaPlaylistMetadata } from '../../../media/types';
// HLS multivariant-playlist metadata: every `#EXT-X-SESSION-DATA` tag, read back
// by `DATA-ID`. Apple's JSON chapters are the first consumer; the parser and its
// `Chapter` shape ship alongside so a consumer can read the document itself.
export type { MultivariantPlaylistMetadata, SessionDataEntry } from '../../../media/types';
export { getMultivariantPlaylistMetadata, getSessionData } from '../../../media/types';
export type {
  Chapter,
  ChapterImage,
  ChapterMetadata,
  HlsJsonChapter,
  HlsJsonChapters,
} from '../../../media/hls/parse-json-chapters';
export { APPLE_HLS_CHAPTERS_DATA_ID, parseHlsJsonChapters } from '../../../media/hls/parse-json-chapters';
export { findSessionDataUri } from '../../../media/hls/session-data';
// Non-zero-PTS relocation (spike): the coordination seam type + the shared-`min`
// default and the per-type alternative, for a consumer swapping the policy via
// `config.deriveStartMediaTime`.
export {
  type DeriveStartMediaTime,
  derivePerTypeStartMediaTime,
  deriveSharedMinStartMediaTime,
} from '../../behaviors/establish-start-media-time';
// The selection rules the engines compose by default, plus the rule shapes
// themselves. The chain config keys are public, so without these a consumer can
// override a chain but cannot reconstruct or partially opt out of the default it
// replaces — `[preferHighestResolution]` alone drops the screen-size cap, and a
// DRM engine's `videoConstraints` needs `excludeRefusedKeySystems` to keep
// pruning refused renditions.
export type { SelectTrackRule } from '../../behaviors/select-tracks';
export { preferHighestResolution, screenResolutionCap } from '../../behaviors/select-tracks';
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
} from '../../behaviors/track-switching';
export {
  type CodecPreferenceConfig,
  DEFAULT_PREFERRED_CODECS,
  excludeRefusedKeySystems,
  preferCodecFamilies,
} from '../../primitives/selection-rules';
// The Medias over these engines are not here: they live behind
// `@videojs/spf/hls-video`, `@videojs/spf/hls-audio`, and
// `@videojs/spf/hls-background-video` so that driving an engine directly doesn't pull
// a Media (and `@videojs/media`) in with it — and so this entry stays the
// engines' own size budget.
export type { HlsVideoEngineConfig, HlsVideoEngineContext, HlsVideoEngineSignals, HlsVideoEngineState } from './engine';
export { createHlsVideoEngine } from './engine';
export type {
  HlsAudioEngineConfig,
  HlsAudioEngineContext,
  HlsAudioEngineSignals,
  HlsAudioEngineState,
} from './engine-audio-only';
export { createHlsAudioEngine } from './engine-audio-only';
export type {
  BackgroundVideoEngineConfig,
  BackgroundVideoEngineContext,
  BackgroundVideoEngineSignals,
  BackgroundVideoEngineState,
} from './engine-background-video';
export { createBackgroundVideoEngine } from './engine-background-video';
