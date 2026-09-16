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
  /** Defaults to the span up to the next chapter, or the end of the composition. */
  durationInFrames?: number;
}

/**
 * True when two sources differ only in `inputProps`, which Remotion's `<Player>` takes live without a reload. Editing
 * parameters is then a live update of the same composition rather than a new source.
 */
export function isSameComposition(a: RemotionSource, b: RemotionSource) {
  return (
    a.id === b.id &&
    a.composition.component === b.composition.component &&
    a.composition.durationInFrames === b.composition.durationInFrames &&
    a.composition.fps === b.composition.fps &&
    a.composition.compositionWidth === b.composition.compositionWidth &&
    a.composition.compositionHeight === b.composition.compositionHeight &&
    a.chapters === b.chapters &&
    a.subtitles === b.subtitles
  );
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
    const endFrame = chapter.durationInFrames
      ? chapter.from + chapter.durationInFrames
      : (chapters[index + 1]?.from ?? durationInFrames);

    return { title: chapter.title, startTime: chapter.from / fps, endTime: endFrame / fps };
  });
}
