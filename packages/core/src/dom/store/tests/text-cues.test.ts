import type { TextCueLike } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { toMediaTextCues } from '../text-cues';

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

  it('derives an id from where a cue sits when it has none', () => {
    const cues = [
      { startTime: 0, endTime: 5, text: 'A' },
      { id: '', startTime: 5, endTime: 10, text: 'B' },
      { startTime: 5, endTime: 10, text: 'C' },
    ];

    expect(toMediaTextCues(cues).map(({ id }) => id)).toEqual(['0-5', '5-10', '5-10-1']);
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
