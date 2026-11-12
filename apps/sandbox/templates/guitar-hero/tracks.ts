import { defineTextTrack, type TextCueFormat } from '@videojs/react';

import type { Note } from './song';

/** How early or late, in seconds, a strum still hits a note. */
export const HIT_WINDOW = 0.08;

/** A sung line's syllables, to light up as they're sung. */
export interface Lyric {
  syllables: { time: number; text: string }[];
}

// Every part of the chart is a text track. The definitions type each cue's `value`, and pick the tracks to read.
export const notesTrack = defineTextTrack<Note>({ kind: 'metadata', label: 'notes' });
export const sustainsTrack = defineTextTrack<Note>({ kind: 'metadata', label: 'sustains' });
export const starPowerTrack = defineTextTrack({ kind: 'metadata', label: 'star-power' });
export const solosTrack = defineTextTrack({ kind: 'metadata', label: 'solos' });
export const sectionsTrack = defineTextTrack({ kind: 'chapters', label: 'sections' });
export const lyricsTrack = defineTextTrack<Lyric>({ kind: 'subtitles', label: 'Lyrics', language: 'en' });

// A note is a cue that spans its hit window, so it's active exactly while a strum would land.
export const toNoteCues: TextCueFormat<Note> = (text) =>
  parseNotes(text).map((note) => ({ startTime: note.time - HIT_WINDOW, endTime: note.time + HIT_WINDOW, value: note }));

// A sustain is a cue that spans the tail of a held note.
export const toSustainCues: TextCueFormat<Note> = (text) =>
  parseNotes(text)
    .filter((note) => note.length > 0)
    .map((note) => ({ startTime: note.time, endTime: note.time + note.length, value: note }));

function parseNotes(text: string): Note[] {
  return JSON.parse(text);
}
