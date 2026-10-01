import { describe, expect, it } from 'vite-plus/test';

import { matchesPartialTrack } from '../../primitives/select-tracks';
import type { AudioTrack, MaybeResolvedPresentation, VideoTrack } from '../../types';
import {
  dedupedAudioTracks,
  dedupedVideoTracks,
  findAudioTrackById,
  findVideoTrackById,
  isSameAudioTrack,
  isSameVideoTrack,
  toUserAudioTrackSelection,
  toUserVideoTrackSelection,
} from '../media-tracks';

// Minimal presentation builders. Tracks carry only the fields the transforms
// read — the `as unknown as` cast keeps the fixtures terse (matching the
// sibling track-util tests).
const presentationWith = (
  videoTracks: Partial<VideoTrack>[],
  audioTracks: Partial<AudioTrack>[] = []
): MaybeResolvedPresentation =>
  ({
    id: 'pres-1',
    url: 'https://example.com/master.m3u8',
    selectionSets: [
      { id: 'v', type: 'video', switchingSets: [{ id: 'vs', type: 'video', tracks: videoTracks }] },
      { id: 'a', type: 'audio', switchingSets: [{ id: 'as', type: 'audio', tracks: audioTracks }] },
    ],
  }) as unknown as MaybeResolvedPresentation;

const video = (over: Partial<VideoTrack>): Partial<VideoTrack> => ({
  type: 'video',
  url: 'https://cdn-a.example.com/v.m3u8',
  bandwidth: 1_000_000,
  codecs: ['avc1.640028'],
  ...over,
});

const audio = (over: Partial<AudioTrack>): Partial<AudioTrack> => ({
  type: 'audio',
  url: 'https://cdn-a.example.com/a.m3u8',
  bandwidth: 128_000,
  codecs: ['mp4a.40.2'],
  name: 'Audio',
  ...over,
});

describe('dedupedVideoTracks', () => {
  it('returns the model video tracks in order', () => {
    const renditions = dedupedVideoTracks(
      presentationWith([
        video({ id: 'v1', width: 1920, height: 1080, bandwidth: 5_000_000 }),
        video({ id: 'v2', width: 1280, height: 720, bandwidth: 3_000_000 }),
      ])
    );

    expect(renditions.map((r) => r.id)).toEqual(['v1', 'v2']);
    expect(renditions[0]).toMatchObject({ width: 1920, height: 1080, bandwidth: 5_000_000, codecs: ['avc1.640028'] });
  });

  it('dedups by width + height + bandwidth, collapsing multi-CDN copies (first wins)', () => {
    const renditions = dedupedVideoTracks(
      presentationWith([
        video({ id: 'cdn-a-720', width: 1280, height: 720, bandwidth: 3_000_000, url: 'https://a/v.m3u8' }),
        video({ id: 'cdn-b-720', width: 1280, height: 720, bandwidth: 3_000_000, url: 'https://b/v.m3u8' }),
        video({ id: 'cdn-a-1080', width: 1920, height: 1080, bandwidth: 5_000_000, url: 'https://a/v.m3u8' }),
      ])
    );

    expect(renditions.map((r) => r.id)).toEqual(['cdn-a-720', 'cdn-a-1080']);
  });

  it('keeps renditions with the same bandwidth but different resolution distinct', () => {
    const renditions = dedupedVideoTracks(
      presentationWith([
        video({ id: 'a', width: 1280, height: 720, bandwidth: 3_000_000 }),
        video({ id: 'b', width: 1920, height: 1080, bandwidth: 3_000_000 }),
      ])
    );

    expect(renditions).toHaveLength(2);
  });

  it('returns [] for an unresolved presentation, no video tracks, or undefined', () => {
    expect(dedupedVideoTracks({ url: 'https://example.com/x.m3u8' })).toEqual([]);
    expect(dedupedVideoTracks(presentationWith([]))).toEqual([]);
    expect(dedupedVideoTracks(undefined)).toEqual([]);
  });
});

describe('dedupedAudioTracks', () => {
  it('returns the model audio tracks in order', () => {
    const tracks = dedupedAudioTracks(
      presentationWith(
        [],
        [
          audio({ id: 'c-es', language: 'es', name: 'Spanish' }),
          audio({ id: 'a-en', language: 'en', name: 'English', default: true }),
          audio({ id: 'b-fr', language: 'fr', name: 'French' }),
        ]
      )
    );

    expect(tracks.map((t) => t.id)).toEqual(['c-es', 'a-en', 'b-fr']);
    expect(tracks[1]).toMatchObject({ language: 'en', name: 'English', default: true });
  });

  it('dedups by language + name, collapsing multi-CDN copies (first wins)', () => {
    const tracks = dedupedAudioTracks(
      presentationWith(
        [],
        [
          audio({ id: 'en-cdn-a', language: 'en', name: 'English', url: 'https://a/a.m3u8' }),
          audio({ id: 'en-cdn-b', language: 'en', name: 'English', url: 'https://b/a.m3u8' }),
          audio({ id: 'es-cdn-a', language: 'es', name: 'Spanish', url: 'https://a/a.m3u8' }),
        ]
      )
    );

    expect(tracks.map((t) => t.id)).toEqual(['en-cdn-a', 'es-cdn-a']);
  });

  it('keeps same-language tracks with different names distinct (e.g. commentary)', () => {
    const tracks = dedupedAudioTracks(
      presentationWith(
        [],
        [
          audio({ id: 'en', language: 'en', name: 'English' }),
          audio({ id: 'en-commentary', language: 'en', name: 'English (Commentary)' }),
        ]
      )
    );

    expect(tracks.map((t) => t.id)).toEqual(['en', 'en-commentary']);
  });

  it('returns [] when there are no audio tracks or the presentation is undefined', () => {
    expect(dedupedAudioTracks(presentationWith([]))).toEqual([]);
    expect(dedupedAudioTracks(undefined)).toEqual([]);
  });
});

describe('toUserVideoTrackSelection', () => {
  it('emits the width/height/bandwidth match criteria', () => {
    const [rendition] = dedupedVideoTracks(
      presentationWith([video({ id: 'v1', width: 1280, height: 720, bandwidth: 3_000_000 })])
    );

    expect(toUserVideoTrackSelection(rendition!)).toEqual({ width: 1280, height: 720, bandwidth: 3_000_000 });
  });

  it('matches every underlying track sharing those properties (multi-CDN)', () => {
    const criteria = toUserVideoTrackSelection({ width: 1280, height: 720, bandwidth: 3_000_000 })!;
    const cdnA = video({ id: 'cdn-a', width: 1280, height: 720, bandwidth: 3_000_000 }) as VideoTrack;
    const cdnB = video({ id: 'cdn-b', width: 1280, height: 720, bandwidth: 3_000_000 }) as VideoTrack;
    const other = video({ id: 'other', width: 1920, height: 1080, bandwidth: 5_000_000 }) as VideoTrack;

    expect(matchesPartialTrack(cdnA, criteria)).toBe(true);
    expect(matchesPartialTrack(cdnB, criteria)).toBe(true);
    expect(matchesPartialTrack(other, criteria)).toBe(false);
  });
});

describe('toUserAudioTrackSelection', () => {
  it('emits the language + name match criteria', () => {
    const [track] = dedupedAudioTracks(presentationWith([], [audio({ id: 'a-es', language: 'es', name: 'Spanish' })]));

    expect(toUserAudioTrackSelection(track!)).toEqual({ language: 'es', name: 'Spanish' });
  });

  it('matches same-language same-name tracks (multi-CDN) but not a different role', () => {
    const criteria = toUserAudioTrackSelection({ language: 'en', name: 'English' })!;
    const enA = audio({ id: 'en-a', language: 'en', name: 'English', url: 'https://a/a.m3u8' }) as AudioTrack;
    const enB = audio({ id: 'en-b', language: 'en', name: 'English', url: 'https://b/a.m3u8' }) as AudioTrack;
    const commentary = audio({ id: 'en-c', language: 'en', name: 'English (Commentary)' }) as AudioTrack;

    expect(matchesPartialTrack(enA, criteria)).toBe(true);
    expect(matchesPartialTrack(enB, criteria)).toBe(true);
    expect(matchesPartialTrack(commentary, criteria)).toBe(false);
  });
});

describe('findVideoTrackById', () => {
  const pres = presentationWith([
    video({ id: 'cdn-a-1080', width: 1920, height: 1080, url: 'https://a/v.m3u8' }),
    video({ id: 'cdn-b-1080', width: 1920, height: 1080, url: 'https://b/v.m3u8' }),
  ]);

  it('finds a track by id, including a non-first per-CDN copy the dedup drops', () => {
    // 'cdn-b-1080' is collapsed out of dedupedVideoTracks but still resolvable.
    expect(findVideoTrackById(pres, 'cdn-b-1080')?.id).toBe('cdn-b-1080');
  });

  it('returns undefined for a missing id or absent presentation', () => {
    expect(findVideoTrackById(pres, 'nope')).toBeUndefined();
    expect(findVideoTrackById(undefined, 'cdn-a-1080')).toBeUndefined();
    expect(findVideoTrackById(pres, undefined)).toBeUndefined();
  });
});

describe('findAudioTrackById', () => {
  const pres = presentationWith(
    [],
    [
      audio({ id: 'en-a', language: 'en', name: 'English', url: 'https://a/a.m3u8' }),
      audio({ id: 'en-b', language: 'en', name: 'English', url: 'https://b/a.m3u8' }),
    ]
  );

  it('finds a track by id, including a non-first per-CDN copy', () => {
    expect(findAudioTrackById(pres, 'en-b')?.id).toBe('en-b');
  });

  it('returns undefined for a missing id or absent presentation', () => {
    expect(findAudioTrackById(pres, 'nope')).toBeUndefined();
    expect(findAudioTrackById(undefined, 'en-a')).toBeUndefined();
  });
});

describe('isSameVideoTrack', () => {
  it('matches by width + height + bandwidth regardless of id/url', () => {
    const a = { width: 1280, height: 720, bandwidth: 3_000_000 };
    const b = video({ id: 'other-cdn', width: 1280, height: 720, bandwidth: 3_000_000 }) as VideoTrack;

    expect(isSameVideoTrack(a, b)).toBe(true);
  });

  it('does not match a different quality, and is false when the track is undefined', () => {
    const a = { width: 1280, height: 720, bandwidth: 3_000_000 };

    for (const mismatch of [{ width: 1920 }, { height: 1080 }, { bandwidth: 5_000_000 }]) {
      expect(isSameVideoTrack(a, video({ ...a, ...mismatch }) as VideoTrack)).toBe(false);
    }

    expect(isSameVideoTrack(a, undefined)).toBe(false);
  });
});

describe('isSameAudioTrack', () => {
  it('matches by language + name, treating empty and absent language alike', () => {
    expect(
      isSameAudioTrack({ language: 'en', name: 'English' }, audio({ language: 'en', name: 'English' }) as AudioTrack)
    ).toBe(true);
    // DOM coerces a missing language to '' — must still match the model's `undefined`.
    expect(
      isSameAudioTrack({ language: '', name: 'Audio' }, audio({ language: undefined, name: 'Audio' }) as AudioTrack)
    ).toBe(true);
  });

  it('does not match a different role, and is false when the track is undefined', () => {
    expect(
      isSameAudioTrack({ language: 'en', name: 'English' }, audio({ language: 'en', name: 'Commentary' }) as AudioTrack)
    ).toBe(false);
    expect(
      isSameAudioTrack({ language: 'en', name: 'English' }, audio({ language: 'es', name: 'English' }) as AudioTrack)
    ).toBe(false);
    expect(isSameAudioTrack({ language: 'en', name: 'English' }, undefined)).toBe(false);
  });
});
