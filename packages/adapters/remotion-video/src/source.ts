import type { ComponentType } from 'react';

/**
 * What plays: a Remotion composition, plus what the player needs to describe it. A composition is code rather than a
 * URL, so it is named by `source` alone — there is no `src` string that could stand in for it.
 *
 * Remotion's own inputs stay inside `composition`; everything beside it is player state derived from the source.
 */
export interface RemotionSource {
  /** Stable name for `src`/`currentSrc`; store features gate on a non-empty source string. */
  id: string;
  /** What Remotion renders, and how. */
  composition: RemotionComposition;
  /** Scene markers in frames, surfaced to the player as a `chapters` text track. */
  chapters?: readonly RemotionChapter[];
  /**
   * Timed captions, surfaced as a `subtitles` text track so the player's captions menu can toggle them. The composition
   * draws them itself; the track carries the timing and the on/off state.
   */
  subtitles?: RemotionSubtitles;
}

/** Everything Remotion's `<Player>` needs, spelled the way it spells them, so the façade forwards them untouched. */
export interface RemotionComposition {
  component: ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  /** Props handed to the composition. `<Player>` takes changes live, without reloading the source. */
  inputProps?: Record<string, unknown>;
}

export interface RemotionCaption {
  text: string;
  startMs: number;
  endMs: number;
}

export interface RemotionSubtitles {
  label: string;
  language: string;
  cues: readonly RemotionCaption[];
}

export interface RemotionChapter {
  title: string;
  from: number;
  /** Defaults to the span up to the next chapter, or the end of the composition. `0` is a zero-length span. */
  durationInFrames?: number;
}

/**
 * Whether two sources name the same thing to play. `id` alone decides: it is what `src` reports, what the React façade
 * keys `<Player>` on, and the only part of a source the player can act on when it changes. Everything else — the
 * composition, its timing, chapters, captions — reaches a mounted `<Player>` as props, so it updates in place.
 *
 * Comparing more than `id` would also make an inline `chapters` or `subtitles` array, rebuilt on every parent render,
 * read as a new source and reset playback.
 */
export function isSameSource(a: RemotionSource, b: RemotionSource) {
  return a.id === b.id;
}

/** One chapter resolved to the time span it covers, in seconds. */
export interface RemotionChapterSpan {
  title: string;
  startTime: number;
  endTime: number;
}

/**
 * A composition's chapter markers as time spans, in order. A chapter without an explicit `durationInFrames` fills the
 * gap up to the next one, or to the end of the composition.
 */
export function resolveChapterSpans(source: RemotionSource): RemotionChapterSpan[] {
  const { durationInFrames, fps } = source.composition;
  const chapters = [...(source.chapters ?? [])].sort((a, b) => a.from - b.from);

  return chapters.map((chapter, index) => {
    const endFrame =
      chapter.durationInFrames === undefined
        ? (chapters[index + 1]?.from ?? durationInFrames)
        : chapter.from + chapter.durationInFrames;

    return { title: chapter.title, startTime: chapter.from / fps, endTime: endFrame / fps };
  });
}
