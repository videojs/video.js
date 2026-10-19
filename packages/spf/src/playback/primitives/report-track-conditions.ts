/**
 * The seam `resolve-track` uses to report conditions discovered in a freshly parsed media playlist.
 *
 * Injected rather than baked in so `resolve-track` stays free of format and policy knowledge: it parses and commits,
 * and whatever the composition wants noticed about the result is this function's business. Which conditions matter, and
 * which codes they carry, therefore vary per composition — a provider that never ships MPEG-TS can drop that check, and
 * future playlist-derived notices (LL-HLS or DVR support that's partial rather than absent) attach here without
 * touching the resolver.
 *
 * Reported **per rendition, as it resolves**, which is why these are causes and not verdicts: one rendition being
 * unplayable doesn't make the source unplayable. The verdict is `track-switching`'s, which reports
 * `SVTA_NO_SUPPORTED_{VIDEO,AUDIO}_TRACK` when a type's candidates actually empty. Keeping the two apart is what lets a
 * mixed source — some renditions encrypted or MPEG-TS, others playable — log its causes and still play.
 */
import { type DrmConfig, keySystemCandidates, unsupportedEncryptionMethodCause } from '../../media/drm';
import {
  SVTA_UNSUPPORTED_AUDIO_FORMAT,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  SVTA_UNSUPPORTED_VIDEO_FORMAT,
  type SvtaError,
} from '../../media/errors';
import { NON_FMP4_CONTAINER_MIMES } from '../../media/hls/parse-media-playlist';
import { asTransmuxed } from '../../media/mpeg-ts/transmuxed-track';
import { getMediaPlaylistMetadata, type ResolvedTrack, type TrackType } from '../../media/types';

/**
 * Conditions worth reporting about a just-resolved track. Return an empty array (or omit the seam) to report nothing.
 *
 * `config` is the composition's config, handed along by `resolve-track` so an extended reporter can read the props it
 * defines off it — `reportUnsupportedTrackConditionsWithDrm` reads `drm` and `keySystems` — through a cast, the way the
 * selection rules read their own. Untyped here because the seam composes into configs that share nothing else; a
 * reporter that needs nothing from it ignores it.
 */
export type ReportUnsupportedTrackConditions = (track: ResolvedTrack, config?: unknown) => readonly SvtaError[];

/** Unsupported-format code per type; text has none — absent captions aren't a failure. */
const UNSUPPORTED_FORMAT_CODE: Partial<Record<TrackType, number>> = {
  video: SVTA_UNSUPPORTED_VIDEO_FORMAT,
  audio: SVTA_UNSUPPORTED_AUDIO_FORMAT,
};

/**
 * The types a reported cause can legitimately describe: the ones whose candidates `canPlayTrack` actually prunes, via
 * `track-switching`'s `excludeUnplayableTracks` pre-pass.
 *
 * Text is outside it by design — its switching chain runs failed-CDN constraints alone, because an MSE codec probe is
 * the wrong question for a WebVTT rendition (see `track-switching.ts`). So nothing prunes a text rendition, no verdict
 * can follow from one, and a cause reported against it would be an orphan: the adapter's unsupported-feature
 * substitution scans the sequence as a whole, so a lone encrypted subtitle would otherwise recode an unrelated verdict
 * — an all-CDN cooldown among them — as "this engine can't play the source".
 */
const CAPABILITY_PRUNED_TYPES: ReadonlySet<TrackType> = new Set<TrackType>(['video', 'audio']);

/**
 * The default: report what makes a rendition unplayable _to this engine_ — a container MSE can't accept, or encryption
 * with no decryption pipeline. Both mirror what `canPlayTrack` prunes on, so a reported cause always has a
 * corresponding exclusion.
 *
 * A condition carries its code and its context, not copy. `data.mimeType` is what preserves the specificity — the
 * format codes cover every non-fMP4 container, so "which one" lives there for a consumer that wants to say, rather than
 * being flattened into an English sentence here.
 *
 * Both carry `trackType`, redundantly for the format codes (1004/1005 are already per type) but not for 4008, which
 * isn't per type — SVTA has one content-protection code for both. Nothing branches on the tag: it's diagnostic context,
 * reaching a developer through the logged sequence and `error.data`, which is why it goes on every condition rather
 * than only where the code can't carry it. `trackId` alongside it is what distinguishes two renditions of the same
 * type.
 */
export function reportUnsupportedTrackConditions(track: ResolvedTrack): readonly SvtaError[] {
  return unsupportedTrackConditions(track, Boolean(getMediaPlaylistMetadata(track)?.encrypted));
}

/**
 * DRM-composed variant of {@link reportUnsupportedTrackConditions}: encryption is only a cause when no configured key
 * system serves the rendition's declared keys — mirroring what `canPlayTrackWithDrm` prunes on, so a reported cause
 * still always has a corresponding exclusion. Reads the engine's `drm` and `keySystems` off the config it is handed
 * (see `DrmConfig`); with either absent, nothing serves any key and encryption is a cause exactly as in the default.
 */
export const reportUnsupportedTrackConditionsWithDrm: ReportUnsupportedTrackConditions = (track, config) => {
  const metadata = getMediaPlaylistMetadata(track);
  const { drm = {}, keySystems = [] } = (config as DrmConfig | undefined) ?? {};
  const unservable =
    Boolean(metadata?.encrypted) && keySystemCandidates(metadata?.keys ?? [], drm, keySystems).length === 0;

  return unsupportedTrackConditions(track, unservable);
};

function unsupportedTrackConditions(track: ResolvedTrack, encryptionUnsupported: boolean): readonly SvtaError[] {
  if (!CAPABILITY_PRUNED_TYPES.has(track.type)) return [];

  const conditions: SvtaError[] = [];
  const data = { trackType: track.type, trackId: track.id };

  const formatCode = UNSUPPORTED_FORMAT_CODE[track.type];

  if (formatCode !== undefined && NON_FMP4_CONTAINER_MIMES.has(track.mimeType)) {
    conditions.push({ code: formatCode, data: { ...data, mimeType: track.mimeType } });
  }

  if (encryptionUnsupported) {
    // Name the real gap, through the same helper `setupMediaKeys` uses at
    // negotiation: a non-DRM `identity`-keyformat key (clear-key AES) is an
    // unsupported encryption method, not a DRM system. Absent keys default to
    // the DRM assumption.
    conditions.push(
      unsupportedEncryptionMethodCause(getMediaPlaylistMetadata(track)?.keys ?? [], data) ?? {
        code: SVTA_UNSUPPORTED_DRM_SYSTEM,
        data,
      }
    );
  }

  return conditions;
}

/**
 * The DRM-aware reporter over the transmuxed container: with the MPEG-TS transmux feature, TS is no longer an
 * unsupported format.
 */
export const reportUnsupportedTransmuxedTrackConditions: ReportUnsupportedTrackConditions = (track, config) =>
  reportUnsupportedTrackConditionsWithDrm(asTransmuxed(track), config);
