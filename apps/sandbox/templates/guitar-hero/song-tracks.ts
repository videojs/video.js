import { useCreateTextTrack } from '@videojs/react';

import { type Part, type Song, songFile } from './song';
import {
  lyricsTrack,
  notesTrack,
  sectionsTrack,
  solosTrack,
  starPowerTrack,
  sustainsTrack,
  toNoteCues,
  toSustainCues,
} from './tracks';

/** Add the chart's tracks to the player. A new part swaps in its own notes, Star Power, and solos. */
export function SongTracks({ song, part }: { song: Song; part: Part }): null {
  const notes = songFile(part.notes);
  const starPower = song.tracks.starPower[part.instrument];
  const solos = song.tracks.solos[part.instrument];

  // One notes file, read two ways: a cue per note to hit, and a cue per sustain to hold.
  useCreateTextTrack(notesTrack, { src: notes, format: toNoteCues });
  useCreateTextTrack(sustainsTrack, { src: notes, format: toSustainCues });

  // The rest are cue files the player reads as they are.
  useCreateTextTrack(starPowerTrack, { src: starPower && songFile(starPower) });
  useCreateTextTrack(solosTrack, { src: solos && songFile(solos) });
  useCreateTextTrack(sectionsTrack, { src: songFile(song.tracks.sections) });
  useCreateTextTrack(lyricsTrack, { src: songFile(song.tracks.lyrics) });

  return null;
}
