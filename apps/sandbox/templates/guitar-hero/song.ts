/**
 * The song the page plays, as `scripts/fetch-song.ts` writes it: a manifest, one notes file per playable part, cue
 * files for the rest of the chart, and the audio stems.
 */

export type Lane = 0 | 1 | 2 | 3 | 4;

/** One gem on the highway. Times are in seconds. */
export interface Note {
  time: number;
  lane: Lane;
  /** How long the note is held, or 0 for a tap. */
  length: number;
}

export type Instrument = 'guitar' | 'bass' | 'rhythm' | 'keys' | 'drums';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** One instrument at one difficulty: what the quality menu offers. */
export interface Part {
  /** Such as `guitar-expert`. */
  id: string;
  instrument: Instrument;
  difficulty: Difficulty;
  /** Such as `Expert Guitar`. */
  label: string;
  /** Path to the part's `Note[]`, relative to the manifest. */
  notes: string;
  /** The stem a miss mutes, or `null` when the part has none of its own. */
  stem: string | null;
}

export interface Song {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  charter: string;
  credits: string;
  duration: number;
  albumArt: string | null;
  /** Stem name to file, such as `{ song: 'song.opus', guitar: 'guitar.opus' }`. */
  stems: Record<string, string>;
  parts: Part[];
  /** Paths to cue files, each a `TextCueInit[]` the player loads as is. */
  tracks: {
    sections: string;
    lyrics: string;
    starPower: Partial<Record<Instrument, string>>;
    solos: Partial<Record<Instrument, string>>;
  };
}

export const SONG_URL = '/guitar-hero/song/song.json';

/** Resolve a path from the manifest against the manifest's own URL. */
export function songFile(path: string): string {
  return new URL(path, new URL(SONG_URL, location.href)).href;
}
