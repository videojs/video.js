import { describe, expect, it } from 'vite-plus/test';

import type {
  MaybeResolvedPresentation,
  PartiallyResolvedAudioTrack,
  PartiallyResolvedTextTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  VideoTrack,
} from '../index';
import { hasPresentationDuration, isResolvedPresentation, isResolvedTrack } from '../index';

describe('Type Guards', () => {
  describe('isResolvedTrack', () => {
    it('returns true for resolved video track (has segments)', () => {
      const resolved: VideoTrack = {
        type: 'video',
        codecs: [],
        id: 'video-0',
        url: 'https://example.com/video.m3u8',
        bandwidth: 1400000,
        width: 1280,
        height: 720,
        frameRate: { frameRateNumerator: 30 },
        mimeType: 'video/mp4',
        startTime: 0,
        duration: 10,
        initialization: { url: 'https://example.com/init.mp4' },
        segments: [],
      };

      expect(isResolvedTrack(resolved)).toBe(true);
    });

    it('returns false for unresolved video track (no segments)', () => {
      const unresolved: PartiallyResolvedVideoTrack = {
        type: 'video',
        codecs: [],
        id: 'video-0',
        url: 'https://example.com/video.m3u8',
        bandwidth: 1400000,
        mimeType: 'video/mp4',
      };

      expect(isResolvedTrack(unresolved)).toBe(false);
    });

    it('narrows PartiallyResolvedVideoTrack | VideoTrack to VideoTrack', () => {
      const track: PartiallyResolvedVideoTrack | VideoTrack = {
        type: 'video',
        codecs: [],
        id: 'video-0',
        url: 'https://example.com/video.m3u8',
        bandwidth: 1400000,
        width: 1280,
        height: 720,
        frameRate: { frameRateNumerator: 30 },
        mimeType: 'video/mp4',
        startTime: 0,
        duration: 10,
        initialization: { url: 'https://example.com/init.mp4' },
        segments: [],
      };

      function checkNarrowing(value: PartiallyResolvedVideoTrack | VideoTrack) {
        expect(isResolvedTrack(value)).toBe(true);

        if (!isResolvedTrack(value)) throw new Error('Expected a resolved track');

        const resolved: VideoTrack = value;

        expect(resolved.segments).toEqual([]);
      }

      checkNarrowing(track);
    });

    it('works for audio tracks', () => {
      const unresolved: PartiallyResolvedAudioTrack = {
        type: 'audio',
        id: 'audio-0',
        url: 'https://example.com/audio.m3u8',
        groupId: 'audio',
        name: 'Default',
        mimeType: 'audio/mp4',
        bandwidth: 0,
        sampleRate: 48000,
        channels: 2,
        codecs: [],
      };

      expect(isResolvedTrack(unresolved)).toBe(false);
    });

    it('works for text tracks', () => {
      const unresolved: PartiallyResolvedTextTrack = {
        type: 'text',
        id: 'text-0',
        url: 'https://example.com/subs.m3u8',
        groupId: 'subs',
        label: 'English',
        kind: 'subtitles',
        mimeType: 'text/vtt',
        bandwidth: 0,
        codecs: [],
      };

      expect(isResolvedTrack(unresolved)).toBe(false);
    });
  });

  describe('hasPresentationDuration', () => {
    it('returns true when presentation has duration', () => {
      const presentation: Presentation = {
        id: 'presentation-0',
        url: 'https://example.com/master.m3u8',
        startTime: 0,
        duration: 100,
        selectionSets: [],
      };

      expect(hasPresentationDuration(presentation)).toBe(true);
    });

    it('returns false when presentation has undefined duration', () => {
      const presentation: Presentation = {
        id: 'presentation-0',
        url: 'https://example.com/master.m3u8',
        startTime: 0,

        selectionSets: [],
      };

      expect(hasPresentationDuration(presentation)).toBe(false);
    });

    it('narrows type to include required duration', () => {
      const presentation: Presentation = {
        id: 'presentation-0',
        url: 'https://example.com/master.m3u8',
        startTime: 0,
        duration: 100,
        selectionSets: [],
      };

      function checkNarrowing(value: MaybeResolvedPresentation) {
        expect(hasPresentationDuration(value)).toBe(true);

        if (!hasPresentationDuration(value)) throw new Error('Expected a presentation duration');

        const duration: number = value.duration;

        expect(duration).toBe(100);
      }

      checkNarrowing(presentation);
    });
  });

  describe('isResolvedPresentation', () => {
    it('returns false for undefined', () => {
      expect(isResolvedPresentation(undefined)).toBe(false);
    });

    it('returns false for an unresolved presentation (url only)', () => {
      const unresolved: MaybeResolvedPresentation = {
        url: 'https://example.com/master.m3u8',
      };

      expect(isResolvedPresentation(unresolved)).toBe(false);
    });

    it('returns false when id is set but selectionSets is missing', () => {
      // Guards against partial values that would crash downstream behaviors
      // when they access selectionSets — only `id` is not enough.
      const partial: MaybeResolvedPresentation = {
        url: 'https://example.com/master.m3u8',
        id: 'presentation-0',
      };

      expect(isResolvedPresentation(partial)).toBe(false);
    });

    it('returns false when selectionSets is set but id is missing', () => {
      const partial: MaybeResolvedPresentation = {
        url: 'https://example.com/master.m3u8',
        selectionSets: [],
      };

      expect(isResolvedPresentation(partial)).toBe(false);
    });

    it('returns true when selectionSets is empty (still resolved)', () => {
      // Empty selectionSets is a valid resolved manifest (no playable tracks),
      // distinct from "selectionSets not yet known".
      const resolved: Presentation = {
        id: 'presentation-0',
        url: 'https://example.com/master.m3u8',
        startTime: 0,
        selectionSets: [],
      };

      expect(isResolvedPresentation(resolved)).toBe(true);
    });

    it('narrows MaybeResolvedPresentation to Presentation', () => {
      const presentation: MaybeResolvedPresentation = {
        id: 'presentation-0',
        url: 'https://example.com/master.m3u8',
        selectionSets: [],
      };

      function checkNarrowing(value: MaybeResolvedPresentation | undefined) {
        expect(isResolvedPresentation(value)).toBe(true);

        if (!isResolvedPresentation(value)) throw new Error('Expected a resolved presentation');

        const resolved: Presentation = value;

        expect(resolved.id).toBe('presentation-0');
        expect(resolved.selectionSets).toEqual([]);
      }

      checkNarrowing(presentation);
    });
  });
});
