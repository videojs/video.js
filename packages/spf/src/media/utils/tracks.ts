import type {
  AudioTrack,
  MaybeResolvedPresentation,
  PartiallyResolvedTrack,
  Presentation,
  ResolvedTrack,
  SelectionSet,
  TextTrack,
  TrackType,
  VideoTrack,
} from '../types';
import { isResolvedTrack } from '../types';

/**
 * Get the tracks of the given type from a presentation's first switching set.
 *
 * Returns `[]` when the presentation is unresolved, when no selection set of `type` exists, or when its first switching
 * set is empty. Returned tracks may be partially resolved (URL only) or fully resolved (with segments) — callers narrow
 * as needed.
 *
 * The "first switching set" assumption matches the rest of the codebase (HLS typically has one switching set per type);
 * multi-group / multi-period support would generalize this.
 */
export function getTracksByType(
  presentation: MaybeResolvedPresentation,
  type: TrackType
): readonly (PartiallyResolvedTrack | ResolvedTrack)[] {
  return presentation.selectionSets?.find(({ type: t }) => t === type)?.switchingSets[0]?.tracks ?? [];
}

/**
 * Every track across the given selection sets, every switching set included — unlike {@link getTracksByType}, which
 * reads only the first switching set of one type. Takes the selection-set list rather than the presentation so a caller
 * that orders the sets first (`getOrderedCdnIds`) walks them the same way. Tracks may be partially or fully resolved;
 * callers narrow as needed.
 */
export function getAllTracks(selectionSets: readonly SelectionSet[]): (PartiallyResolvedTrack | ResolvedTrack)[] {
  const tracks: (PartiallyResolvedTrack | ResolvedTrack)[] = [];

  for (const selectionSet of selectionSets) {
    for (const switchingSet of selectionSet.switchingSets) {
      for (const track of switchingSet.tracks) tracks.push(track);
    }
  }

  return tracks;
}

/**
 * Find a track of the given type and id within a presentation.
 *
 * Returns the matching track from the first switching set of the matching selection set, or `undefined` if either is
 * missing. The returned track may be partially resolved (URL only) or fully resolved (with segments) — callers narrow
 * as needed.
 */
export function findTrack(
  presentation: MaybeResolvedPresentation,
  type: TrackType,
  trackId: string
): PartiallyResolvedTrack | ResolvedTrack | undefined {
  return getTracksByType(presentation, type).find(({ id }) => id === trackId);
}

/**
 * Find a track by id across all selection sets in a presentation, without knowing its type up front. Used when the
 * caller has a track id obtained from a downstream consumer (e.g. `SourceBufferActor.initTrackId`) and needs to locate
 * the corresponding track in the presentation.
 *
 * Track ids are unique within a presentation per the HLS spec; the first match wins.
 */
export function findTrackById(
  presentation: MaybeResolvedPresentation,
  trackId: string
): PartiallyResolvedTrack | ResolvedTrack | undefined {
  for (const selectionSet of presentation.selectionSets ?? []) {
    const track = selectionSet.switchingSets[0]?.tracks.find(({ id }) => id === trackId);
    if (track) return track;
  }

  return undefined;
}

/**
 * Find a text track of the given id within a presentation and narrow it to the fully-resolved `TextTrack` shape
 * (segments populated). Returns `undefined` if no track matches the id, the matching track isn't a text track, or it
 * hasn't been resolved yet.
 *
 * The segments-non-empty check stays at the call site — a resolved track with zero segments is a valid state, distinct
 * from "ready to load."
 */
export function findResolvedTextTrack(
  presentation: MaybeResolvedPresentation | undefined,
  trackId: string | undefined
): TextTrack | undefined {
  if (!presentation || !trackId) return undefined;

  const track = findTrack(presentation, 'text', trackId);
  // `findTrack` returns the wide union; narrow via discriminant before
  // applying `isResolvedTrack`'s text-specific overload.
  if (track?.type !== 'text' || !isResolvedTrack(track)) return undefined;

  return track;
}

export function findResolvedVideoTrack(
  presentation: MaybeResolvedPresentation | undefined,
  trackId: string | undefined
): VideoTrack | undefined {
  if (!presentation || !trackId) return undefined;

  const track = findTrack(presentation, 'video', trackId);
  if (track?.type !== 'video' || !isResolvedTrack(track)) return undefined;

  return track;
}

export function findResolvedAudioTrack(
  presentation: MaybeResolvedPresentation | undefined,
  trackId: string | undefined
): AudioTrack | undefined {
  if (!presentation || !trackId) return undefined;

  const track = findTrack(presentation, 'audio', trackId);
  if (track?.type !== 'audio' || !isResolvedTrack(track)) return undefined;

  return track;
}

/**
 * Whether a resolved audio or video track has no separate init segment, so its decoder configuration travels in its
 * media segments (MPEG-TS, packed audio). Surfacing such a track's metadata takes one media segment. Text tracks have
 * no init concept and answer `false`.
 */
export function carriesInitInSegments(track: Pick<ResolvedTrack, 'type' | 'initialization'>): boolean {
  return track.type !== 'text' && !track.initialization?.url;
}

/**
 * Whether a track carries a non-empty `codecs` array. Both partially- resolved and fully-resolved tracks may carry
 * codecs — they come from the multivariant playlist's `EXT-X-STREAM-INF` line, not from the per-type media playlist —
 * so this works at either resolution stage.
 *
 * `TextTrack` doesn't declare a `codecs` field; the `'codecs' in track` check narrows it out for the false branch.
 */
export function hasCodecs(track: PartiallyResolvedTrack | ResolvedTrack | undefined): boolean {
  return !!track && 'codecs' in track && !!track.codecs?.length;
}

/**
 * The family (RFC 6381 4CC) of one codec string: `'avc1.640028'` → `'avc1'`, `'mp4a.40.2'` → `'mp4a'`, dotless strings
 * (`'ec-3'`) pass through whole. Lowercased so families compare regardless of manifest casing.
 *
 * The family is what a `SourceBuffer`'s bytestream is keyed on: renditions in one family swap via a new init segment,
 * while crossing families needs `SourceBuffer.changeType()` (which SPF doesn't implement).
 */
export function getCodecFamily(codec: string): string {
  return codec.trim().split('.', 1)[0]!.toLowerCase();
}

/**
 * The distinct codec families a track carries, or `undefined` when it carries no codecs (unknowable, per `hasCodecs` —
 * not "none"). A demuxed rendition has one family; a muxed one (bipbop's `CODECS="hvc1…,mp4a…"`) has one per elementary
 * stream.
 */
export function getCodecFamilies(track: { codecs?: string[] }): readonly string[] | undefined {
  if (!track.codecs?.length) return undefined;

  return [...new Set(track.codecs.map(getCodecFamily))];
}

/**
 * A track's MIME codec string — `mimeType` plus its `codecs` — the form `MediaSource.isTypeSupported`,
 * `addSourceBuffer` and EME's `contentType` all take. Works on partially-resolved tracks: both fields come from the
 * multivariant playlist and are available before media-playlist resolution.
 *
 * The parameter is `Pick<Track, 'mimeType' | 'codecs'>` with `mimeType` required: a track without one has nothing to
 * build from, and callers guard that before asking.
 *
 * @example
 *   buildMimeCodec({ mimeType: 'video/mp4', codecs: ['avc1.42E01E'] });
 *   // => 'video/mp4; codecs="avc1.42E01E"'
 */
export function buildMimeCodec(track: { mimeType: string; codecs?: string[] }): string {
  const codecString = track.codecs?.join(',') ?? '';

  return `${track.mimeType}; codecs="${codecString}"`;
}

/**
 * The distinct MIME codec strings across a presentation's audio and video tracks, grouped by type. Includes unresolved
 * tracks, since `CODECS` comes from the multivariant, and skips tracks with no `mimeType` or no codecs, which have
 * nothing to build from. Text tracks carry no codecs and are excluded. An ABR ladder collapses to one entry per type.
 *
 * Today's consumer is key-system negotiation, which offers these as the capabilities a CDM is asked to support; nothing
 * about the computation is specific to it.
 */
export function mimeCodecsByType(presentation: MaybeResolvedPresentation | undefined): {
  video: string[];
  audio: string[];
} {
  const video = new Set<string>();
  const audio = new Set<string>();

  for (const track of getAllTracks(presentation?.selectionSets ?? [])) {
    if (track.type !== 'video' && track.type !== 'audio') continue;

    if (!track.mimeType || !track.codecs?.length) continue;

    const bucket = track.type === 'video' ? video : audio;

    bucket.add(buildMimeCodec({ mimeType: track.mimeType, codecs: track.codecs }));
  }

  return { video: [...video], audio: [...audio] };
}

/**
 * Set `mimeType` on every track of one `type` (immutably). Used to propagate a detected container across a type's
 * renditions: an ABR ladder is the same content at different bitrates, so one rendition's container holds for all of
 * them — capability probing + SourceBuffer setup then get the right MIME for the whole type from a single resolved
 * media playlist, without fetching the rest.
 *
 * Scoped to one type on purpose: propagating _across_ audio/video would be wrong for mixed-container sources (e.g.
 * muxed-TS video + raw-`.aac` audio) and races concurrent per-type resolution. Same-type writes are disjoint and safe.
 * Idempotent — tracks already at `mimeType` are left as-is.
 *
 * **Assumes one container per type, which the HLS specs don't guarantee.** Apple's HLS Authoring Specification not only
 * permits a mixed ladder, it produces one: §1.5 requires HEVC in fMP4, while §9.22 says a 192 kbit/s H.264 variant
 * _packaged in a transport stream_ SHOULD be provided for cellular — so a conformant HEVC ladder with that fallback is
 * necessarily mixed. RFC 8216 is silent too (§6.2.4 constrains variant _content_, not container).
 *
 * Where that happens, resolving the TS variant first relabels the whole type, capability probing prunes all of it, and
 * a source whose fMP4 variants were fine reports as unplayable. Accepted because the current target is CMAF-compliant
 * single-container delivery (plus Apple's official fMP4 example); revisit by narrowing the relabel to the resolved
 * track, or gating propagation on config, if mixed ladders come into scope.
 */
export function applyContainerMimeType(presentation: Presentation, type: TrackType, mimeType: string): Presentation {
  return {
    ...presentation,
    selectionSets: presentation.selectionSets.map((selectionSet) =>
      selectionSet.type === type
        ? {
            ...selectionSet,
            switchingSets: selectionSet.switchingSets.map((switchingSet) => ({
              ...switchingSet,
              tracks: switchingSet.tracks.map((track) =>
                track.mimeType === mimeType ? track : { ...track, mimeType }
              ),
            })),
          }
        : selectionSet
    ),
  } as Presentation;
}

/** Updates a track within a presentation (immutably). Generic — works for video, audio, or text tracks. */
export function updateTrackInPresentation<T extends ResolvedTrack>(
  presentation: Presentation,
  resolvedTrack: T
): Presentation {
  const trackId = resolvedTrack.id;

  return {
    ...presentation,
    selectionSets: presentation.selectionSets.map((selectionSet) => ({
      ...selectionSet,
      switchingSets: selectionSet.switchingSets.map((switchingSet) => ({
        ...switchingSet,
        tracks: switchingSet.tracks.map((track) => (track.id === trackId ? resolvedTrack : track)),
      })),
    })),
  } as Presentation;
}
