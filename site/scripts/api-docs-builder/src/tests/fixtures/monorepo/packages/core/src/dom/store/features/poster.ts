/**
 * Mock poster feature — what a published config key still has to carry.
 *
 * Metadata already covers an input whose action is named by string. This one
 * covers the rest of that path: the initial value read from state() under a
 * plain key rather than a computed one, an input typed by a union narrower
 * than plain text, which the config constraint has to admit, and a list input
 * whose default is an array constant.
 */
import { definePlayerFeature, type PlayerFeatureConfig } from '../../feature';

/** A named constant default, reached through a plain rather than computed key. */
const DEFAULT_POSTER = '/poster.jpg';

/** An array constant default, shown as its literal rather than its name. */
const DEFAULT_POSTER_WIDTHS: readonly number[] = [320, 640];

type PosterFit = 'contain' | 'cover';

/** Poster configuration and its user-config writers. */
interface PosterState {
  /** Image shown before playback starts. */
  poster: string;
  /** How the image fills the container. */
  posterFit: PosterFit;
  /** Widths the poster is offered at. */
  posterWidths: readonly number[];
  /** Sets the poster image. Absent input restores the default. */
  setPoster(value: string | null | undefined): void;
  /** Sets how the image fills the container. Absent input restores the default. */
  setPosterFit(value: PosterFit | null | undefined): void;
  /** Sets the offered widths from a list or a space-separated attribute. */
  setPosterWidths(value: readonly number[] | string | null | undefined): void;
}

/** Shows a poster image until playback starts. */
export const posterFeature = definePlayerFeature({
  name: 'poster',
  config: {
    /** Image shown before playback starts. */
    poster: {
      action: 'setPoster',
      state: 'poster',
    },
    /** How the image fills the container. */
    posterFit: {
      action: 'setPosterFit',
      state: 'posterFit',
    },
    /** Widths the poster is offered at. */
    posterWidths: {
      action: 'setPosterWidths',
      state: 'posterWidths',
    },
  } satisfies PlayerFeatureConfig<PosterState>,
  state: (): PosterState => ({
    poster: DEFAULT_POSTER,
    posterFit: 'contain',
    posterWidths: DEFAULT_POSTER_WIDTHS,
    setPoster: () => {},
    setPosterFit: () => {},
    setPosterWidths: () => {},
  }),
});
