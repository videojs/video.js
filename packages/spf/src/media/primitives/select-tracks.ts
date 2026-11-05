import type { MaybeResolvedPresentation, PartiallyResolvedTextTrack, TextTrack } from '../types';

/** State shape for track selection. */
export interface TrackSelectionState {
  presentation?: MaybeResolvedPresentation;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
  selectedTextTrackId?: string;
}

/** Configuration for audio track selection. */
export interface AudioSelectionConfig {
  /** Preferred audio language (ISO 639 code, e.g., "en", "es"). If not specified, selects first audio track. */
  preferredAudioLanguage?: string;
}

/** Configuration for text track selection. */
export interface TextSelectionConfig {
  /** Preferred subtitle language (ISO 639 code, e.g., "en", "es"). If specified, selects matching track if available. */
  preferredSubtitleLanguage?: string;

  /**
   * Include FORCED subtitle tracks in selection. Default: false (follows hls.js/http-streaming pattern)
   *
   * Note: Per Apple's HLS spec, if content has forced and regular subtitles in the same language, the regular track
   * MUST contain both forced and regular content. Therefore, forced-only tracks are redundant and excluded by default.
   */
  includeForcedTracks?: boolean;

  /**
   * Auto-select DEFAULT track (requires DEFAULT=YES + AUTOSELECT=YES in HLS). Off when unset; `textTracksFeature` turns
   * it on.
   *
   * When enabled, tracks marked with both DEFAULT=YES and AUTOSELECT=YES will be automatically selected if no user
   * preference matches.
   */
  enableDefaultTrack?: boolean;
}

// =============================================================================
// Helper Functions (Pure Selection Logic)
//
// Candidate-list policies and track geometry, for the selection rules in
// `playback/behaviors/select-tracks.ts` and `playback/behaviors/track-switching.ts`
// to compose. Nothing here consults a whole presentation or returns a single id:
// narrowing a list and ordering a list are the two shapes a rule can take, and the
// rule chain takes the head of what they leave.
// =============================================================================

/**
 * Test whether a track matches a partial-track description: every present, defined field of `filter` equals the
 * track's. Absent or `undefined` filter fields don't constrain. Used to narrow candidates by a user selection (`{ id
 * }`, `{ language }`, `{ height }`, …).
 *
 * @param track - The track to test
 * @param filter - Partial-track description; only present, defined fields constrain
 * @returns `true` when the track matches every constraining field
 */
export function matchesPartialTrack<T>(track: T, filter: Partial<T>): boolean {
  for (const key in filter) {
    const filterValue = filter[key as keyof T];
    if (filterValue !== undefined && track[key as keyof T] !== filterValue) return false;
  }

  return true;
}

type RankableTrack = { id: string; width?: number; height?: number; bandwidth?: number };

/** Missing dimensions are treated as area `0`, so a track without them ranks last. */
function pixelArea(track: RankableTrack): number {
  return (track.width ?? 0) * (track.height ?? 0);
}

/**
 * Narrow to the tracks at or below `maxPixelArea`, and nothing else: no ordering, no fallback. Survivors keep their
 * incoming order, and an empty result is a real answer — "none of these fit".
 *
 * Deliberately only the filter, because as a selection rule this composes under `applyRules`, which already owns both
 * halves a caller might expect here: an empty result is skipped, so a preference can never narrow the candidate set to
 * nothing; and ordering the survivors is a separate rule's job ({@link byDescendingResolution}, bandwidth ABR). Doing
 * either here would duplicate the composer and give one rule two responsibilities.
 */
export function tracksUnderPixelArea<T extends RankableTrack>(
  tracks: readonly T[],
  maxPixelArea: number = Number.POSITIVE_INFINITY
): readonly T[] {
  return tracks.filter((track) => pixelArea(track) <= maxPixelArea);
}

/**
 * The smallest track area that still covers `minPixelArea`, or `undefined` when no track reaches it.
 *
 * The cap a surface-size rule wants when it should round _up_ to the ladder: a surface between two tiers is covered by
 * the upper one, and capping at the surface's own area instead would serve a picture smaller than the surface and
 * upscale it.
 *
 * Tracks declaring no dimensions compare as area `0` and so never cover anything, which keeps them out of the cap
 * rather than pinning it to zero.
 */
export function smallestCoveringPixelArea(tracks: readonly RankableTrack[], minPixelArea: number): number | undefined {
  const covering = tracks.map(pixelArea).filter((area) => area >= minPixelArea);

  return covering.length ? Math.min(...covering) : undefined;
}

/**
 * Compare two tracks by resolution, largest first, with bandwidth as the tiebreak for renditions of identical
 * dimensions. Missing dimensions are treated as area `0`, so a track without them sorts last.
 *
 * A comparator rather than a "highest track" function: the selection-rule chain takes the head of the list it produces,
 * so ranking never has to collapse to a single track. `preferHighestResolution` is `sort` over this and nothing more.
 */
export function byDescendingResolution(a: RankableTrack, b: RankableTrack): number {
  return pixelArea(b) - pixelArea(a) || (b.bandwidth ?? 0) - (a.bandwidth ?? 0);
}

/**
 * Default audio policy over a candidate list: the three-tier pick a selection-rule chain applies once it has narrowed
 * the candidates.
 *
 * Priority: `preferredAudioLanguage` match → `DEFAULT=YES` → first track.
 */
export function pickAudioTrackFromTracks(
  tracks: readonly { id: string; language?: string | undefined; default?: boolean | undefined }[],
  config?: AudioSelectionConfig
): string | undefined {
  // Try preferred language first
  if (config?.preferredAudioLanguage) {
    const languageMatch = tracks.find((track) => track.language === config.preferredAudioLanguage);
    if (languageMatch) return languageMatch.id;
  }

  // Try default track
  const defaultTrack = tracks.find((track) => track.default === true);
  if (defaultTrack) return defaultTrack.id;

  // Fall back to first track
  return tracks[0]?.id;
}

/**
 * Default text-track policy over a candidate list: the opt-in three-tier pick `switchTextTrack`'s terminal applies once
 * it has narrowed the renditions to the constrained, CDN-scoped set.
 *
 * Priority: `preferredSubtitleLanguage` match → `DEFAULT=YES + AUTOSELECT=YES` (only when `enableDefaultTrack`) →
 * `undefined` (opt-in). FORCED tracks are excluded unless `includeForcedTracks` (Apple-spec: a regular track must carry
 * forced content when both exist, so a forced-only track is redundant).
 */
export function pickTextTrackFromTracks(
  tracks: readonly (PartiallyResolvedTextTrack | TextTrack)[],
  config?: TextSelectionConfig
): string | undefined {
  const availableTracks = config?.includeForcedTracks ? tracks : tracks.filter((track) => !track.forced);
  if (availableTracks.length === 0) return undefined;

  const { preferredSubtitleLanguage, enableDefaultTrack = false } = config ?? {};

  if (preferredSubtitleLanguage) {
    const languageMatch = availableTracks.find((track) => track.language === preferredSubtitleLanguage);
    if (languageMatch) return languageMatch.id;
  }

  if (enableDefaultTrack) {
    const defaultTrack = availableTracks.find((track) => track.default === true);
    if (defaultTrack) return defaultTrack.id;
  }

  return undefined;
}
