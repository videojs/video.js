import type { TextCueLike } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { isCueListUnchanged, toMediaTextCues } from '../text-cues';

describe('toMediaTextCues', () => {
  it('returns an empty list without cues', () => {
    expect(toMediaTextCues(null)).toEqual([]);
    expect(toMediaTextCues(undefined)).toEqual([]);
  });

  it('copies cues into plain data with ids', () => {
    const cue = { id: 'intro', startTime: 0, endTime: 5, text: 'Intro' };
    const [result] = toMediaTextCues([cue]);

    expect(result).toEqual({ id: 'intro', startTime: 0, endTime: 5, text: 'Intro' });
    expect(result).not.toBe(cue);
  });

  it('returns the same copy of a cue that has not changed', () => {
    const cues = [{ startTime: 0, endTime: 1, text: '{"question":"Ready?"}' }];
    const [first] = toMediaTextCues(cues, { kind: 'metadata' });
    const [second] = toMediaTextCues(cues, { kind: 'metadata' });

    expect(second).toBe(first);
  });

  it('makes a new copy of a cue changed in place', () => {
    const cue = { startTime: 0, endTime: 1, text: 'A' };
    const [first] = toMediaTextCues([cue]);

    cue.endTime = 2;
    cue.text = 'B';

    const [second] = toMediaTextCues([cue]);

    expect(second).not.toBe(first);
    expect(second).toMatchObject({ endTime: 2, text: 'B' });
  });

  it('makes a new copy when the duration clamps a cue differently', () => {
    const cues = [{ startTime: 0, endTime: Number.MAX_VALUE, text: 'A' }];
    const [unclamped] = toMediaTextCues(cues);
    const [clamped] = toMediaTextCues(cues, { duration: 60 });

    expect(clamped).not.toBe(unclamped);
    expect(clamped!.endTime).toBe(60);
  });

  it('derives an id from where a cue sits when it has none', () => {
    const cues = [
      { startTime: 0, endTime: 5, text: 'A' },
      { id: '', startTime: 5, endTime: 10, text: 'B' },
      { startTime: 5, endTime: 10, text: 'C' },
    ];

    expect(toMediaTextCues(cues).map(({ id }) => id)).toEqual(['0-5', '5-10', '5-10-1']);
  });

  it('never gives two cues the same id', () => {
    const cues = [
      { id: 'ad', startTime: 0, endTime: 1, text: 'A' },
      { id: 'ad', startTime: 1, endTime: 2, text: 'B' },
      { id: 'ad-1', startTime: 2, endTime: 3, text: 'C' },
      { startTime: 5, endTime: 10, text: 'D' },
      { id: '5-10', startTime: 6, endTime: 7, text: 'E' },
    ];

    expect(toMediaTextCues(cues).map(({ id }) => id)).toEqual(['ad', 'ad-2', 'ad-1', '5-10-1', '5-10']);
  });

  it('clamps cue ends to a finite duration', () => {
    const cues = [
      { startTime: 0, endTime: 5, text: 'A' },
      { startTime: 5, endTime: Number.MAX_VALUE, text: 'B' },
    ];

    expect(toMediaTextCues(cues, { duration: 60 }).map(({ endTime }) => endTime)).toEqual([5, 60]);
  });

  it('keeps cue ends while the duration is unknown or infinite', () => {
    const cues = [{ startTime: 0, endTime: 100, text: 'A' }];

    expect(toMediaTextCues(cues, { duration: Number.NaN })[0]!.endTime).toBe(100);
    expect(toMediaTextCues(cues, { duration: Number.POSITIVE_INFINITY })[0]!.endTime).toBe(100);
    expect(toMediaTextCues(cues, { duration: 0 })[0]!.endTime).toBe(100);
  });

  describe('value', () => {
    it('takes value and type from a data cue', () => {
      const frame = { key: 'TXXX', info: 'ad', data: 'break' };
      const cue: TextCueLike = { startTime: 1, endTime: 2, value: frame, type: 'org.id3' };

      expect(toMediaTextCues([cue], { kind: 'metadata' })[0]).toEqual({
        id: '1-2',
        startTime: 1,
        endTime: 2,
        text: '',
        value: frame,
        type: 'org.id3',
      });
    });

    it('takes value from a text cue that also carries data, as hls.js writes them', () => {
      const cue = { startTime: 1, endTime: 2, text: '', value: { key: 'X-AD', data: 'break' } };

      expect(toMediaTextCues([cue], { kind: 'metadata' })[0]!.value).toEqual({ key: 'X-AD', data: 'break' });
    });

    it('parses JSON text on a metadata track', () => {
      const cues = [
        { startTime: 0, endTime: 1, text: '{"question":"What does HLS stand for?"}' },
        { startTime: 1, endTime: 2, text: ' [1, 2] ' },
      ];

      expect(toMediaTextCues(cues, { kind: 'metadata' }).map(({ value }) => value)).toEqual([
        { question: 'What does HLS stand for?' },
        [1, 2],
      ]);
    });

    it('leaves value unset for plain or invalid text', () => {
      const cues = [
        { startTime: 0, endTime: 1, text: 'plain' },
        { startTime: 1, endTime: 2, text: '42' },
        { startTime: 2, endTime: 3, text: '{not json' },
      ];

      for (const cue of toMediaTextCues(cues, { kind: 'metadata' })) {
        expect(cue).not.toHaveProperty('value');
      }
    });

    it('keeps JSON-looking text as text on other tracks', () => {
      const cue = { startTime: 0, endTime: 1, text: '{"caption":true}' };
      const [result] = toMediaTextCues([cue], { kind: 'captions' });

      expect(result!.text).toBe('{"caption":true}');
      expect(result).not.toHaveProperty('value');
    });
  });
});

describe('isCueListUnchanged', () => {
  it('holds for the cues last read, as they were', () => {
    const read = [
      { startTime: 0, endTime: 1, text: 'a' },
      { startTime: 1, endTime: 2, text: 'b' },
    ];

    toMediaTextCues(read);

    expect(isCueListUnchanged([...read], read)).toBe(true);
    expect(isCueListUnchanged(null, [])).toBe(true);
  });

  it('fails once a cue is added, removed, swapped, or reordered', () => {
    const a = { startTime: 0, endTime: 1, text: 'a' };
    const b = { startTime: 1, endTime: 2, text: 'b' };
    const c = { startTime: 2, endTime: 3, text: 'c' };
    const read = [a, b];

    toMediaTextCues([a, b, c]);

    expect(isCueListUnchanged([a, b, c], read)).toBe(false);
    expect(isCueListUnchanged([a], read)).toBe(false);
    expect(isCueListUnchanged([a, c], read)).toBe(false);
    expect(isCueListUnchanged([b, a], read)).toBe(false);
    expect(isCueListUnchanged(null, read)).toBe(false);
  });

  it('fails once a cue changes in place', () => {
    const cue = { id: '', startTime: 0, endTime: 1, text: 'a' };
    const changes = [
      () => (cue.startTime = 0.5),
      () => (cue.endTime = 2),
      () => (cue.text = 'b'),
      () => (cue.id = 'intro'),
    ];

    for (const change of changes) {
      toMediaTextCues([cue]);
      change();

      expect(isCueListUnchanged([cue], [cue])).toBe(false);
    }
  });

  it('fails when the duration clamps a cue differently', () => {
    const read = [{ startTime: 0, endTime: 100, text: 'a' }];

    toMediaTextCues(read);

    expect(isCueListUnchanged(read, read, { duration: 200 })).toBe(true);
    expect(isCueListUnchanged(read, read, { duration: 60 })).toBe(false);
  });

  it('fails for cues never read', () => {
    const read = [{ startTime: 0, endTime: 1, text: 'a' }];

    expect(isCueListUnchanged(read, read)).toBe(false);
  });
});
