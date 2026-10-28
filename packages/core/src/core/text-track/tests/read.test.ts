import type { MediaTextCue, MediaTextTrack, MediaTrackCues } from '@videojs/media';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';

import { defineTextTrack } from '../definition';
import { type HlsMetadataCue, hlsMetadataTrack } from '../hls';
import { getActiveTextCues, getTextCues, getTextTracks } from '../read';
import type { StandardSchemaV1 } from '../schema';

interface Quiz {
  question: string;
}

function createTrack(id: string, overrides: Partial<MediaTextTrack> = {}): MediaTextTrack {
  return { id, kind: 'metadata', label: id, language: '', mode: 'hidden', source: 'app', ...overrides };
}

function createCue(id: string, startTime: number, value?: unknown): MediaTextCue {
  return { id, startTime, endTime: startTime + 10, text: '', ...(value === undefined ? {} : { value }) };
}

function entry(track: MediaTextTrack, cues: MediaTextCue[], activeCues: MediaTextCue[] = []): MediaTrackCues {
  return { track, cues, activeCues };
}

function isQuiz(value: unknown): value is Quiz {
  return typeof (value as Quiz | undefined)?.question === 'string';
}

function createSchema<Output>(
  validate: (value: unknown) => { value: Output } | { issues: { message: string }[] }
): StandardSchemaV1<unknown, Output> {
  return { '~standard': { version: 1, vendor: 'test', validate } };
}

const QuizSchema = createSchema<Quiz>((value) => (isQuiz(value) ? { value } : { issues: [{ message: 'not a quiz' }] }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getTextTracks', () => {
  it('returns the tracks a filter matches', () => {
    const textTrackList = [createTrack('quiz'), createTrack('chapters', { kind: 'chapters' })];

    expect(getTextTracks({ textTrackList }, { kind: 'chapters' })).toEqual([textTrackList[1]]);
    expect(getTextTracks({ textTrackList })).toEqual(textTrackList);
  });
});

describe('getTextCues', () => {
  it('returns every cue on the matching tracks, merged by time', () => {
    const a = createCue('a', 0);
    const b = createCue('b', 5);
    const c = createCue('c', 2);
    const textCues = [
      entry(createTrack('ads'), [a, b]),
      entry(createTrack('quiz'), [c]),
      entry(createTrack('chapters', { kind: 'chapters' }), [createCue('d', 1)]),
    ];

    expect(getTextCues({ textCues }, { kind: 'metadata' })).toEqual([a, c, b]);
    expect(getTextCues({ textCues }, { label: 'quiz' })).toEqual([c]);
  });

  it('matches a function filter against the whole track', () => {
    const cue = createCue('a', 0);
    const textCues = [entry(createTrack('app'), [cue]), entry(createTrack('media', { source: 'media' }), [])];

    expect(getTextCues({ textCues }, (track) => track.source === 'app')).toEqual([cue]);
  });

  it('types cues by a track definition', () => {
    const quizTrack = defineTextTrack<Quiz>({ kind: 'metadata', label: 'quiz' });
    const cue = createCue('a', 0, { question: 'Ready?' });
    const cues = getTextCues({ textCues: [entry(createTrack('quiz'), [cue])] }, quizTrack);

    expect(cues).toEqual([cue]);
    expectTypeOf(cues).toEqualTypeOf<readonly MediaTextCue<Quiz>[]>();
  });

  describe('with a schema', () => {
    it('skips cues whose value fails it, with a warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const quizTrack = defineTextTrack({ kind: 'metadata', label: 'quiz', schema: QuizSchema });
      const valid = createCue('a', 0, { question: 'Ready?' });
      const invalid = createCue('b', 5, { answer: 42 });
      const cues = getTextCues({ textCues: [entry(createTrack('quiz'), [valid, invalid])] }, quizTrack);

      expect(cues).toEqual([valid]);
      expect(warn).toHaveBeenCalledOnce();
      expectTypeOf(cues).toEqualTypeOf<readonly MediaTextCue<Quiz>[]>();
    });

    it('checks each cue once and keeps what it read', () => {
      const validate = vi.fn((value: unknown) => ({ value: { question: String((value as Quiz).question) } }));
      const schema = createSchema<Quiz>(validate);
      const quizTrack = defineTextTrack({ kind: 'metadata', label: 'quiz', schema });
      const state = { textCues: [entry(createTrack('quiz'), [createCue('a', 0, { question: 1 })])] };

      const [first] = getTextCues(state, quizTrack);
      const [second] = getTextCues(state, quizTrack);

      expect(first!.value).toEqual({ question: '1' });
      expect(second).toBe(first);
      expect(validate).toHaveBeenCalledOnce();
    });

    it('skips every cue when the schema is asynchronous', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const schema = {
        '~standard': { version: 1, vendor: 'test', validate: async (value: unknown) => ({ value }) },
      } as StandardSchemaV1;
      const track = defineTextTrack({ kind: 'metadata', label: 'quiz', schema });

      expect(getTextCues({ textCues: [entry(createTrack('quiz'), [createCue('a', 0, {})])] }, track)).toEqual([]);
    });
  });
});

describe('getActiveTextCues', () => {
  it('returns the active cues on the matching tracks', () => {
    const active = createCue('a', 0);
    const textCues = [entry(createTrack('quiz'), [active, createCue('b', 20)], [active])];

    expect(getActiveTextCues({ textCues }, { label: 'quiz' })).toEqual([active]);
  });

  it("returns one track's list as the store holds it", () => {
    const active = createCue('a', 0);
    const quiz = entry(createTrack('quiz'), [active], [active]);

    expect(getActiveTextCues({ textCues: [quiz, entry(createTrack('ads'), [])] }, { label: 'quiz' })).toBe(
      quiz.activeCues
    );
  });

  it('returns the same array until the cues change', () => {
    const filter = { kind: 'metadata' } as const;
    const textCues = [
      entry(createTrack('quiz'), [], [createCue('a', 0)]),
      entry(createTrack('ads'), [], [createCue('b', 5)]),
    ];
    const first = getActiveTextCues({ textCues }, filter);

    expect(getActiveTextCues({ textCues }, filter)).toBe(first);
    expect(getActiveTextCues({ textCues: [...textCues] }, filter)).not.toBe(first);
    expect(getActiveTextCues({ textCues: [...textCues] }, filter)).toEqual(first);
  });
});

describe('hlsMetadataTrack', () => {
  it('matches the hls.js metadata track and types its cues', () => {
    const cue = { ...createCue('a', 0, { key: 'X-AD-ID', data: '123' }), type: 'com.apple.quicktime.HLS' };
    const textCues = [
      entry(createTrack('id3', { label: 'id3', source: 'media' }), [cue]),
      entry(createTrack('quiz'), [createCue('b', 0)]),
    ];
    const cues = getTextCues({ textCues }, hlsMetadataTrack);

    expect(cues).toEqual([cue]);
    expectTypeOf(cues).toEqualTypeOf<readonly HlsMetadataCue[]>();
  });
});
