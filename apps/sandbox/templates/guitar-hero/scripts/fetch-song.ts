/**
 * Downloads a Clone Hero chart and turns it into files the guitar-hero page loads.
 *
 * The chart is "Total Breakdown" by Brad Sucks (audio CC BY-SA 3.0), charted by MB1Nightmare and Greninjo. It comes as
 * an `.sng` package: `song.ini` metadata, a `notes.mid` chart, audio stems, and album art. This script unpacks it,
 * reads the MIDI chart, and writes into `../song/`:
 *
 * - `song.json`: the manifest, typed as `Song` in `../song.ts`.
 * - `notes/<part>.json`: `{ time, lane, length }` notes for each instrument and difficulty.
 * - `sections.json`, `lyrics.json`, `star-power/*.json`, `solos/*.json`: text cues the player loads as they are.
 * - The audio stems and album art, unchanged.
 *
 * The output is gitignored because the chart has no license to redistribute. It is also copied into `src/`, where a
 * running dev server serves it as `/guitar-hero/song/`:
 *
 *   pnpm -F @videojs/sandbox song
 *
 * Behind a proxy, add `NODE_USE_ENV_PROXY=1`, and `NODE_EXTRA_CA_CERTS=<ca.crt>` when it intercepts TLS.
 *
 * Formats: https://github.com/mdsitton/SngFileFormat and https://github.com/TheNathannator/GuitarGame_ChartFormats
 */

import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { Difficulty, Instrument, Lane, Note, Part, Song } from '../song';

const SONG_URL = 'https://files.enchor.us/ea04c558c53df070f9abc41b53669397.sng';
const AUDIO_LICENSE = 'CC BY-SA 3.0';
const OUT_DIR = join(import.meta.dirname, '../song');
/** Where the dev server serves the song from. Setup mirrors `templates/` into `src/`, but only when it starts. */
const SERVED_DIR = join(import.meta.dirname, '../../../src/guitar-hero/song');

/** Each instrument's MIDI track, and the stems a miss could mute, in order of preference. */
const INSTRUMENTS: { instrument: Instrument; trackName: string; stems: string[] }[] = [
  { instrument: 'guitar', trackName: 'PART GUITAR', stems: ['guitar'] },
  { instrument: 'bass', trackName: 'PART BASS', stems: ['bass', 'rhythm'] },
  { instrument: 'rhythm', trackName: 'PART RHYTHM', stems: ['rhythm'] },
  { instrument: 'keys', trackName: 'PART KEYS', stems: ['keys'] },
  { instrument: 'drums', trackName: 'PART DRUMS', stems: ['drums'] },
];

/** Each difficulty spans an octave whose lowest note is the first lane: green, or the kick on drums. */
const DIFFICULTIES: Record<Difficulty, number> = { expert: 96, hard: 84, medium: 72, easy: 60 };
const LANE_COUNT = 5;
/** Notes this close together are one chord, played at the earliest note's tick. */
const CHORD_SNAP_TICKS = 10;

const STAR_POWER_NOTE = 116;
const SOLO_NOTE = 103;
const LYRIC_PHRASE_NOTES = [105, 106];

const SECTION_EVENT = /^\[(?:section[ _]|prc_)(.+)\]$/;
const SECTION_WORDS = new Map([['gtr', 'Guitar']]);
const STEM_FILE = /^[\w-]+\.(?:opus|ogg)$/i;
const ALBUM_ART_FILE = /^album\.(?:png|jpe?g)$/i;

/** The parts of video.js's `TextCueInit` these files use. */
interface Cue {
  startTime: number;
  endTime?: number;
  text?: string;
  value?: unknown;
}

// ---------------------------------------------------------------------------------------------------------------------
// Bytes
// ---------------------------------------------------------------------------------------------------------------------

/** Reads numbers and strings in order, and throws rather than reading past the end of a malformed file. */
class ByteReader {
  offset = 0;

  constructor(readonly bytes: Buffer) {}

  get done(): boolean {
    return this.offset >= this.bytes.length;
  }

  take(length: number): Buffer {
    const end = this.offset + length;
    if (!Number.isSafeInteger(end) || length < 0 || end > this.bytes.length) throw new Error('Unexpected end of data');

    const slice = this.bytes.subarray(this.offset, end);
    this.offset = end;
    return slice;
  }

  string(length: number): string {
    return this.take(length).toString('utf8');
  }

  u8(): number {
    return this.take(1).readUInt8();
  }

  u16be(): number {
    return this.take(2).readUInt16BE();
  }

  u32be(): number {
    return this.take(4).readUInt32BE();
  }

  u32le(): number {
    return this.take(4).readUInt32LE();
  }

  u64le(): number {
    return Number(this.take(8).readBigUInt64LE());
  }

  /** MIDI's variable-length number: 7 bits per byte, with the high bit set on every byte but the last. */
  varint(): number {
    let value = 0;

    for (let i = 0; i < 4; i++) {
      const byte = this.u8();
      value = (value << 7) | (byte & 0x7f);
      if (byte < 0x80) return value;
    }

    throw new Error('Variable-length number longer than 4 bytes');
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// .sng
// ---------------------------------------------------------------------------------------------------------------------

interface SngPackage {
  metadata: Map<string, string>;
  files: Map<string, Buffer>;
}

function unpackSng(bytes: Buffer): SngPackage {
  const reader = new ByteReader(bytes);
  if (reader.string(6) !== 'SNGPKG') throw new Error('Not an .sng file');

  reader.u32le(); // version
  const xorMask = reader.take(16);

  const metadata = new Map<string, string>();
  reader.u64le(); // section length
  for (let count = reader.u64le(); count > 0; count--) {
    metadata.set(reader.string(reader.u32le()), reader.string(reader.u32le()));
  }

  const index: { name: string; length: number; offset: number }[] = [];
  reader.u64le(); // section length
  for (let count = reader.u64le(); count > 0; count--) {
    index.push({ name: reader.string(reader.u8()), length: reader.u64le(), offset: reader.u64le() });
  }

  const files = new Map<string, Buffer>();
  for (const { name, length, offset } of index) {
    reader.offset = offset;
    files.set(name, unmask(reader.take(length), xorMask));
  }

  return { metadata, files };
}

/** File bytes are XORed with the header's 16-byte mask and the low byte of their own position. */
function unmask(masked: Buffer, xorMask: Buffer): Buffer {
  return Buffer.from(masked.map((byte, i) => byte ^ xorMask[i % 16]! ^ (i & 0xff)));
}

// ---------------------------------------------------------------------------------------------------------------------
// MIDI
// ---------------------------------------------------------------------------------------------------------------------

interface MidiNote {
  note: number;
  tick: number;
  endTick: number;
}

interface MidiText {
  tick: number;
  /** The meta event type: 0x01 for text, 0x05 for a lyric, and so on. */
  type: number;
  text: string;
}

interface MidiTempo {
  tick: number;
  microsecondsPerQuarter: number;
}

interface MidiTrack {
  name: string;
  notes: MidiNote[];
  texts: MidiText[];
  tempos: MidiTempo[];
}

interface Midi {
  /** Ticks per quarter note. */
  resolution: number;
  tracks: MidiTrack[];
}

function parseMidi(bytes: Buffer): Midi {
  const reader = new ByteReader(bytes);
  if (reader.string(4) !== 'MThd') throw new Error('Not a MIDI file');

  const header = new ByteReader(reader.take(reader.u32be()));
  const format = header.u16be();
  header.u16be(); // track count; the chunks themselves are the source of truth
  const resolution = header.u16be();
  if (format !== 1 || resolution & 0x8000) throw new Error('Expected a type 1 MIDI file timed in ticks per quarter note');

  const tracks: MidiTrack[] = [];
  while (!reader.done) {
    const type = reader.string(4);
    const chunk = reader.take(reader.u32be());
    if (type === 'MTrk') tracks.push(parseTrack(new ByteReader(chunk)));
  }

  return { resolution, tracks };
}

function parseTrack(reader: ByteReader): MidiTrack {
  const track: MidiTrack = { name: '', notes: [], texts: [], tempos: [] };
  const noteStarts = new Map<number, number>();
  let tick = 0;
  let runningStatus = 0;

  while (!reader.done) {
    tick += reader.varint();
    let status = reader.u8();

    if (status === 0xff) {
      const type = reader.u8();
      const data = reader.take(reader.varint());

      if (type === 0x51) track.tempos.push({ tick, microsecondsPerQuarter: data.readUIntBE(0, 3) });
      else if (type === 0x03 && !track.name) track.name = data.toString('utf8');
      else if (type >= 0x01 && type <= 0x0f) track.texts.push({ tick, type, text: data.toString('utf8') });
      continue;
    }

    if (status === 0xf0 || status === 0xf7) {
      reader.take(reader.varint()); // SysEx
      continue;
    }

    // A data byte where a status belongs repeats the last channel event's status. Some charts carry it across meta and
    // SysEx events, so it is never reset.
    if (status < 0x80) {
      reader.offset--;
      status = runningStatus;
    } else {
      runningStatus = status;
    }

    const kind = status & 0xf0;
    const [note = 0, velocity = 0] = reader.take(kind === 0xc0 || kind === 0xd0 ? 1 : 2);
    const start = noteStarts.get(note);

    if (kind === 0x90 && velocity > 0) {
      noteStarts.set(note, tick);
    } else if ((kind === 0x80 || kind === 0x90) && start !== undefined) {
      track.notes.push({ note, tick: start, endTick: tick });
      noteStarts.delete(note);
    }
  }

  track.notes.sort((a, b) => a.tick - b.tick || a.note - b.note);
  return track;
}

// ---------------------------------------------------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------------------------------------------------

interface Timing {
  /** When a tick plays, in seconds of audio. */
  seconds(tick: number): number;
  /** How long a note is held, or 0 when it is too short to be a sustain. */
  sustain(tick: number, endTick: number): number;
}

function createTiming(midi: Midi, songIni: Map<string, string>): Timing {
  const clock = createTickClock(midi.tracks[0]?.tempos ?? [], midi.resolution);
  const delay = (Number(songIni.get('delay')) || 0) / 1000;
  // Anything shorter than a 1/12 step is a plain note, so charters needn't make every note one tick long.
  const sustainCutoff = Number(songIni.get('sustain_cutoff_threshold')) || midi.resolution / 3;

  return {
    seconds: (tick) => roundToMs(clock(tick) + delay),
    sustain: (tick, endTick) => (endTick - tick < sustainCutoff ? 0 : roundToMs(clock(endTick) - clock(tick))),
  };
}

/** Converts ticks to seconds one tempo at a time, since every tempo change alters how long a tick lasts. */
function createTickClock(tempos: MidiTempo[], resolution: number): (tick: number) => number {
  // 120 BPM until the first tempo event.
  const segments = [{ tick: 0, seconds: 0, secondsPerTick: 0.5 / resolution }];

  for (const { tick, microsecondsPerQuarter } of tempos) {
    const previous = segments.at(-1)!;
    const seconds = previous.seconds + (tick - previous.tick) * previous.secondsPerTick;
    segments.push({ tick, seconds, secondsPerTick: microsecondsPerQuarter / 1e6 / resolution });
  }

  return (tick) => {
    let segment = segments[0]!;
    for (const next of segments) if (next.tick <= tick) segment = next;

    return segment.seconds + (tick - segment.tick) * segment.secondsPerTick;
  };
}

function roundToMs(seconds: number): number {
  return Math.round(seconds * 1000) / 1000;
}

// ---------------------------------------------------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------------------------------------------------

function readNotes(track: MidiTrack, firstLaneNote: number, timing: Timing): Note[] {
  const notes = track.notes.filter(({ note }) => note >= firstLaneNote && note < firstLaneNote + LANE_COUNT);

  return snapChords(notes)
    .map(({ note, tick, endTick }) => ({
      time: timing.seconds(tick),
      lane: (note - firstLaneNote) as Lane,
      length: timing.sustain(tick, endTick),
    }))
    .sort((a, b) => a.time - b.time || a.lane - b.lane);
}

function snapChords(notes: MidiNote[]): MidiNote[] {
  let chordTick = -Infinity;

  return notes.map((note) => {
    if (note.tick - chordTick > CHORD_SNAP_TICKS) chordTick = note.tick;
    return { ...note, tick: chordTick };
  });
}

/** Star Power, solos, and lyric phrases are marked by holding one MIDI note for the length of the phrase. */
function readPhrases(track: MidiTrack, markerNotes: number[], timing: Timing): Cue[] {
  return track.notes
    .filter(({ note }) => markerNotes.includes(note))
    .map(({ tick, endTick }) => ({ startTime: timing.seconds(tick), endTime: timing.seconds(endTick) }))
    .filter((phrase, i, phrases) => phrase.startTime !== phrases[i - 1]?.startTime);
}

function readSections(events: MidiTrack, timing: Timing): Cue[] {
  return events.texts.flatMap(({ tick, text }) => {
    const name = SECTION_EVENT.exec(text)?.[1];
    return name ? [{ startTime: timing.seconds(tick), text: toTitle(name) }] : [];
  });
}

/** `gtr_solo` → `Guitar Solo`, `Verse 1` → `Verse 1`. */
function toTitle(name: string): string {
  return name
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => SECTION_WORDS.get(word.toLowerCase()) ?? word[0]!.toUpperCase() + word.slice(1))
    .join(' ');
}

/** One cue per lyric phrase, with each syllable's start time kept for karaoke-style highlighting. */
function readLyrics(vocals: MidiTrack, timing: Timing): Cue[] {
  const syllables = vocals.texts
    .filter(({ type, text }) => type === 0x05 || (type === 0x01 && !text.startsWith('[')))
    .map(({ tick, text }) => ({ time: timing.seconds(tick), text: toPlainSyllable(text) }))
    .filter(({ text }) => text.trim());

  return readPhrases(vocals, LYRIC_PHRASE_NOTES, timing).map((phrase) => {
    const sung = syllables.filter(({ time }) => time >= phrase.startTime && time < phrase.endTime!);
    return { ...phrase, text: sung.map(({ text }) => text).join('').trim(), value: { syllables: sung } };
  });
}

/**
 * Lyric markup as plain text: `-` joins the next syllable, `=` is a literal hyphen that also joins, `_` and `§` are
 * spaces, and pitch and display symbols are dropped. Syllables that don't join end in a space, so a phrase's syllables
 * concatenate into its text.
 */
function toPlainSyllable(lyric: string): string {
  const text = lyric.replace(/[#^*%+$/]/g, '');
  const joinsNext = /[-=]$/.test(text);
  const plain = text.replace(/-$/, '').replace(/=/g, '-').replace(/[_§]/g, ' ');

  return joinsNext ? plain : `${plain} `;
}

// ---------------------------------------------------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------------------------------------------------

/** Downloads once; later runs reuse the copy on disk. */
async function download(url: string, path: string): Promise<Buffer> {
  if (!existsSync(path)) {
    console.log(`Downloading ${url}`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);

    await writeFile(path, Buffer.from(await response.arrayBuffer()));
  }

  return readFile(path);
}

/** Writes JSON under the output folder. Arrays get one entry per line, which keeps big files easy to skim. */
async function writeJson(path: string, data: unknown): Promise<void> {
  const json = Array.isArray(data)
    ? `[\n${data.map((entry) => `  ${JSON.stringify(entry)}`).join(',\n')}\n]`
    : JSON.stringify(data, null, 2);

  await mkdir(dirname(join(OUT_DIR, path)), { recursive: true });
  await writeFile(join(OUT_DIR, path), `${json}\n`);
}

/** Writes a cue file for each instrument with any cues, and returns where each one went. */
async function writeCueFiles(folder: string, cues: [Instrument, Cue[]][]): Promise<Partial<Record<Instrument, string>>> {
  const paths: Partial<Record<Instrument, string>> = {};

  for (const [instrument, instrumentCues] of cues) {
    if (instrumentCues.length === 0) continue;

    paths[instrument] = `${folder}/${instrument}.json`;
    await writeJson(paths[instrument], instrumentCues);
  }

  return paths;
}

function capitalize(word: string): string {
  return word[0]!.toUpperCase() + word.slice(1);
}

// ---------------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------------

await mkdir(OUT_DIR, { recursive: true });

const sng = unpackSng(await download(SONG_URL, join(OUT_DIR, 'chart.sng')));
const notesMid = sng.files.get('notes.mid');
if (!notesMid) throw new Error('The chart has no notes.mid');

const songIni = sng.metadata;
const midi = parseMidi(notesMid);
const timing = createTiming(midi, songIni);
const tracks = new Map(midi.tracks.map((track) => [track.name, track]));

// Only names matching these patterns are written, so a file name in the package can't point outside the folder.
for (const [name, bytes] of sng.files) {
  if (STEM_FILE.test(name) || ALBUM_ART_FILE.test(name)) await writeFile(join(OUT_DIR, name), bytes);
}

const fileNames = [...sng.files.keys()];
const stemFiles = fileNames.filter((name) => STEM_FILE.test(name));
const stems = Object.fromEntries(stemFiles.map((name) => [name.replace(/\.\w+$/, ''), name]));
const albumArt = fileNames.find((name) => ALBUM_ART_FILE.test(name)) ?? null;

const instruments = INSTRUMENTS.flatMap(({ trackName, ...instrument }) => {
  const track = tracks.get(trackName);
  return track ? [{ ...instrument, track }] : [];
});

const parts = instruments.flatMap(({ instrument, track, stems: missStems }) =>
  Object.entries(DIFFICULTIES).map(([difficulty, firstLaneNote]) => ({
    id: `${instrument}-${difficulty}`,
    instrument,
    difficulty: difficulty as Difficulty,
    label: `${capitalize(difficulty)} ${capitalize(instrument)}`,
    notes: readNotes(track, firstLaneNote, timing),
    stem: missStems.find((stem) => Object.hasOwn(stems, stem)) ?? null,
  }))
).filter(({ notes }) => notes.length > 0);

for (const { id, notes } of parts) await writeJson(`notes/${id}.json`, notes);

const events = tracks.get('EVENTS') ?? { name: 'EVENTS', notes: [], texts: [], tempos: [] };
const vocals = tracks.get('PART VOCALS') ?? { name: 'PART VOCALS', notes: [], texts: [], tempos: [] };

await writeJson('sections.json', readSections(events, timing));
await writeJson('lyrics.json', readLyrics(vocals, timing));

const starPower = await writeCueFiles(
  'star-power',
  instruments.map(({ instrument, track }) => [instrument, readPhrases(track, [STAR_POWER_NOTE], timing)])
);
const solos = await writeCueFiles(
  'solos',
  instruments.map(({ instrument, track }) => [instrument, readPhrases(track, [SOLO_NOTE], timing)])
);

const endEvent = events.texts.find(({ text }) => text === '[end]');
const lastNoteEnd = Math.max(0, ...parts.flatMap(({ notes }) => notes.map(({ time, length }) => time + length)));

const title = songIni.get('name') ?? 'Unknown song';
const artist = songIni.get('artist') ?? 'Unknown artist';
const album = songIni.get('album');
const year = songIni.get('year');
const charter = songIni.get('charter') ?? 'Unknown charter';

const song: Song = {
  title,
  artist,
  ...(album && { album }),
  ...(year && { year }),
  charter,
  credits: `"${title}" by ${artist}, ${AUDIO_LICENSE}. Chart by ${charter}.`,
  duration: endEvent ? timing.seconds(endEvent.tick) : roundToMs(lastNoteEnd + 2),
  albumArt,
  stems,
  parts: parts.map(({ notes, ...part }): Part => ({ ...part, notes: `notes/${part.id}.json` })),
  tracks: { sections: 'sections.json', lyrics: 'lyrics.json', starPower, solos },
};

await writeJson('song.json', song);
await cp(OUT_DIR, SERVED_DIR, { recursive: true });

console.log(`Wrote ${song.title} by ${song.artist} to ${OUT_DIR}: ${parts.map(({ id }) => id).join(', ')}`);
