/**
 * Capability probing — the engine's foundation for asking the browser what it can actually decode before committing a
 * rendition to the pipeline.
 *
 * Today this is the synchronous codec half: `canPlayTrack` answers "can this environment play this track?" by building
 * the track's MIME codec string and passing it to `MediaSource.isTypeSupported` (via `isCodecSupported`). It's the DOM
 * implementation of the DOM-free `CanPlayTrack` predicate the track-switching hard-constraint pre-pass consumes —
 * injected through engine config so the (DOM-free) behavior never imports a DOM API directly.
 *
 * Results are memoized by built MIME string: codec support is a pure function of (codec, environment) and never changes
 * after load, so probing is lazy (per candidate, at constraint-apply time) but each unique MIME is asked once.
 *
 * Future cluster-D phases (async `requestMediaKeySystemAccess` key-system probing, `SourceBuffer.changeType()`
 * availability) extend this surface; the async ones land as a state-writing behavior rather than a config predicate,
 * since their verdict resolves asynchronously.
 */

import { type DrmConfig, keySystemCandidates } from '../drm';
import { NON_FMP4_CONTAINER_MIMES } from '../hls/parse-media-playlist';
import { type CanPlayTrack, getMediaPlaylistMetadata } from '../types';
import { buildMimeCodec } from '../utils/tracks';
import { isCodecSupported } from './mse/mediasource-setup';

const codecSupportCache = new Map<string, boolean>();

/** The container + codec half shared by both probes below. */
const canDecodeTrack: CanPlayTrack = (track) => {
  if (track.mimeType && NON_FMP4_CONTAINER_MIMES.has(track.mimeType)) return false;

  if (!track.mimeType || !track.codecs?.length) return true;

  const mimeCodec = buildMimeCodec({ mimeType: track.mimeType, codecs: track.codecs });
  const cached = codecSupportCache.get(mimeCodec);
  if (cached !== undefined) return cached;

  const supported = isCodecSupported(mimeCodec);

  codecSupportCache.set(mimeCodec, supported);
  return supported;
};

/**
 * Whether the environment can decode `track`, by codec. Builds the track's MIME codec string and checks
 * `MediaSource.isTypeSupported`, memoized by MIME. A track without enough to probe — no `mimeType`, or no declared
 * `codecs` (CODECS is optional per the HLS spec) — is unprobeable and passes through as playable (`true`) rather than
 * being dropped; the late `createSourceBuffer` check stays as the backstop for those.
 *
 * Detected non-fMP4 containers (`video/mp2t`, `audio/aac`) are asserted unsupported regardless of the probe, so they're
 * pruned before selection (the type makes no pick) instead of failing/stalling deep in the pipeline. Two different
 * reasons, neither UA-based:
 *
 * - **MPEG-TS** can't be appended as-is: `isTypeSupported('video/mp2t…')` is a genuine false positive on Chromium
 *   (reports `true` but appends produce no buffered range). A composition with `mpegTsTransmuxFeature` swaps in a probe
 *   that sees a TS rendition as the fMP4 it transmuxes to; this plain probe is for compositions without it.
 * - **Raw ADTS AAC** is a _temporary_ limitation. The browser genuinely supports it (Chrome/Safari decode `audio/aac`;
 *   Firefox doesn't), so it could be made playable — but our segment actors / loading behaviors / append pipeline
 *   assume every rendition has an `EXT-X-MAP` init segment (e.g. an `append-init` task with an empty URL, fMP4-shaped
 *   append handling). Until that init-segment assumption is removed, ADTS would fetch but never buffer (a silent
 *   stall), so we assert it unplayable for now. FOLLOW-UP: drop the init-required assumption in the pipeline and switch
 *   this to a bare-MIME probe (`buildMimeCodec` would project `audio/aac` with no codecs) so it plays where the browser
 *   supports it.
 *
 * Override via the engine's `canPlayTrack` config, as `mpegTsTransmuxFeature` does for TS.
 */
export const canPlayTrack: CanPlayTrack = (track) => {
  // Encrypted renditions are unplayable in DRM-free compositions — no EME /
  // license pipeline, so appending them would fail to decode with nothing to
  // explain it. Pruning them here means a partially-encrypted source still plays
  // its clear renditions, and a fully-encrypted one empties the candidate set
  // (which `track-switching` reports). DRM-composed engines swap in
  // `canPlayTrackWithDrm` instead.
  if (getMediaPlaylistMetadata(track)?.encrypted) return false;

  return canDecodeTrack(track);
};

/**
 * DRM-composed variant of {@link canPlayTrack}: an encrypted rendition is playable when its declared keys reach a key
 * system with a configured license server (its container / codecs still have to probe as decodable); everything else
 * matches the standard probe. Encrypted renditions no configured system serves stay pruned — MediaKeys could never be
 * negotiated for them, so playing them would park forever behind the `segmentLoadingBlocked` gate. Reads the engine's
 * `drm` and `keySystems` off the config it is handed (see `DrmConfig`); with either absent, nothing serves any key and
 * it refuses encrypted renditions exactly as {@link canPlayTrack} does.
 */
export const canPlayTrackWithDrm: CanPlayTrack = (track, config) => {
  const metadata = getMediaPlaylistMetadata(track);

  if (metadata?.encrypted) {
    const { drm = {}, keySystems = [] } = (config as DrmConfig | undefined) ?? {};
    if (keySystemCandidates(metadata.keys ?? [], drm, keySystems).length === 0) return false;
  }

  return canDecodeTrack(track);
};
