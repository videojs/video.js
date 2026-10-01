import { describe, expect, it } from 'vite-plus/test';

import {
  getMediaPlaylistMetadata,
  type PartiallyResolvedAudioTrack,
  type PartiallyResolvedTextTrack,
  type PartiallyResolvedVideoTrack,
} from '../../types';
import { parseMediaPlaylist } from '../parse-media-playlist';
import drmCmafAudio from './fixtures/drm-cmaf-audio.m3u8?raw';
import drmCmafVideo from './fixtures/drm-cmaf-video.m3u8?raw';
import liveCmafAudio from './fixtures/live-cmaf-audio.m3u8?raw';
import liveCmafVideo from './fixtures/live-cmaf-video.m3u8?raw';
import liveTsVideo1 from './fixtures/live-ts-video-1.m3u8?raw';
import liveTsVideo2 from './fixtures/live-ts-video-2.m3u8?raw';
import liveTsVideo3 from './fixtures/live-ts-video-3.m3u8?raw';

describe('parseMediaPlaylist', () => {
  describe('Video tracks', () => {
    const unresolvedVideo: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'video-0',
      url: 'https://example.com/video/playlist.m3u8',
      bandwidth: 1400000,
      width: 1280,
      height: 720,
      codecs: ['avc1.4d401f'],
      frameRate: { frameRateNumerator: 30 },
      mimeType: 'video/mp4',
    };

    it('returns VideoTrack for PartiallyResolvedVideoTrack input (type inference)', () => {
      const playlistText = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.005,
segment0.m4s
#EXTINF:5.005,
segment1.m4s
#EXT-X-ENDLIST`;

      // Argument order: text first, unresolved second
      const result = parseMediaPlaylist(playlistText, unresolvedVideo);

      // TypeScript should infer result as VideoTrack
      expect(result.type).toBe('video');
      expect(result.id).toBe('video-0');
      expect(result.url).toBe('https://example.com/video/playlist.m3u8');
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
      expect(result.bandwidth).toBe(1400000);
      expect(result.startTime).toBe(0);
      expect(result.segments).toHaveLength(2);
    });

    it('returns HAM-compliant VideoTrack (Track & video-specific)', () => {
      const playlistText = `#EXTM3U
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.0,
segment.m4s
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedVideo);

      // HAM composition: Ham & AddressableObject & TimeSpan & Track
      expect(result.id).toBeDefined(); // Ham
      expect(result.url).toBeDefined(); // AddressableObject
      expect(result.startTime).toBe(0); // TimeSpan
      expect(result.duration).toBe(5.0); // TimeSpan
      expect(result.segments).toBeDefined(); // Track
      expect(result.initialization).toBeDefined(); // Track

      // Video-specific
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
      expect(result.frameRate).toBeDefined();
    });

    it('segments follow HAM Segment type (Ham & AddressableObject & Duration)', () => {
      const playlistText = `#EXTM3U
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.0,
seg0.m4s
#EXTINF:6.0,
seg1.m4s
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedVideo);

      const seg0 = result.segments[0];

      expect(seg0).toBeDefined();
      expect(seg0!.id).toBe('segment-0'); // Ham
      expect(seg0!.url).toBe('https://example.com/video/seg0.m4s'); // AddressableObject
      expect(seg0!.duration).toBe(5.0); // Duration
      expect(seg0!.startTime).toBe(0); // Segment-specific
    });

    it('handles segment byte ranges (AddressableObject.byteRange)', () => {
      const playlistText = `#EXTM3U
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.0,
#EXT-X-BYTERANGE:1000@0
main.mp4
#EXTINF:5.0,
#EXT-X-BYTERANGE:1000@1000
main.mp4
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedVideo);

      expect(result.segments[0]?.byteRange).toEqual({ start: 0, end: 999 });
      expect(result.segments[1]?.byteRange).toEqual({ start: 1000, end: 1999 });
    });

    it('handles implicit byte range offsets', () => {
      const playlistText = `#EXTM3U
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.0,
#EXT-X-BYTERANGE:1000@0
main.mp4
#EXTINF:5.0,
#EXT-X-BYTERANGE:1000
main.mp4
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedVideo);

      expect(result.segments[0]?.byteRange).toEqual({ start: 0, end: 999 });
      expect(result.segments[1]?.byteRange).toEqual({ start: 1000, end: 1999 });
    });

    it('handles Mux CMAF video playlist', () => {
      const muxUnresolved: PartiallyResolvedVideoTrack = {
        type: 'video',
        id: 'video-0',
        url: 'https://example.com/video-med.m3u8',
        bandwidth: 1124200,
        width: 768,
        height: 432,
        codecs: ['avc1.64001f'],
        mimeType: 'video/mp4',
      };

      const muxPlaylist = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.005000,
chunk-00001.m4s
#EXTINF:5.005000,
chunk-00002.m4s
#EXTINF:5.005000,
chunk-00003.m4s
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(muxPlaylist, muxUnresolved);

      expect(result.type).toBe('video');
      expect(result.width).toBe(768);
      expect(result.height).toBe(432);
      expect(result.codecs).toEqual(['avc1.64001f']);
      expect(result.segments).toHaveLength(3);
      expect(result.duration).toBeCloseTo(15.015, 3);
      // Standard HLS: init.mp4 relative to /video-med.m3u8 → /init.mp4
      expect(result.initialization.url).toBe('https://example.com/init.mp4');
      expect(result.mimeType).toBe('video/mp4');
    });
  });

  describe('Audio tracks', () => {
    const unresolvedAudio: PartiallyResolvedAudioTrack = {
      type: 'audio',
      id: 'audio-0',
      url: 'https://example.com/audio/playlist.m3u8',
      groupId: 'audio-med-0',
      name: 'Default',
      language: 'und',
      codecs: ['mp4a.40.2'],
      // Type-specific defaults (from P1)
      mimeType: 'audio/mp4',
      bandwidth: 0,
      sampleRate: 48000,
      channels: 2,
    };

    it('returns AudioTrack for PartiallyResolvedAudioTrack input (type inference)', () => {
      const playlistText = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.005,
audio-chunk-00001.m4s
#EXTINF:5.005,
audio-chunk-00002.m4s
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedAudio);

      // TypeScript should infer result as AudioTrack
      expect(result.type).toBe('audio');
      expect(result.id).toBe('audio-0');
      expect(result.codecs).toEqual(['mp4a.40.2']);
      expect(result.language).toBe('und');
      expect(result.segments).toHaveLength(2);
      expect(result.bandwidth).toBe(0); // Default - not in multivariant for demuxed audio
    });

    it('returns HAM-compliant AudioTrack with audio-specific properties', () => {
      const playlistText = `#EXTM3U
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.0,
segment.m4s
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedAudio);

      expect(result.mimeType).toBe('audio/mp4');
      expect(result.sampleRate).toBe(48000); // Default
      expect(result.channels).toBe(2); // Default (stereo)
      expect(result.duration).toBe(5.0);
    });

    it('handles Mux CMAF audio playlist', () => {
      const muxAudio: PartiallyResolvedAudioTrack = {
        type: 'audio',
        id: 'audio-0',
        url: 'https://example.com/audio-hi.m3u8',
        groupId: 'audio-hi-0',
        name: 'Default',
        codecs: ['mp4a.40.2'],
        mimeType: 'audio/mp4',
        bandwidth: 0,
        sampleRate: 48000,
        channels: 2,
      };

      const playlistText = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MAP:URI="init.mp4"
#EXTINF:5.005000,
audio-chunk-00001.m4s
#EXTINF:5.005000,
audio-chunk-00002.m4s
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, muxAudio);

      expect(result.type).toBe('audio');
      expect(result.segments).toHaveLength(2);
      expect(result.duration).toBeCloseTo(10.01, 2);
    });
  });

  describe('Text tracks', () => {
    const unresolvedText: PartiallyResolvedTextTrack = {
      type: 'text',
      id: 'text-0',
      url: 'https://example.com/subs/en.m3u8',
      groupId: 'subs',
      label: 'English',
      kind: 'subtitles',
      language: 'en',
      default: true,
      // Type-specific defaults (from P1)
      mimeType: 'text/vtt',
      bandwidth: 0,
      codecs: [],
    };

    it('returns TextTrack for PartiallyResolvedTextTrack input (type inference)', () => {
      const playlistText = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.0,
subtitle-00001.vtt
#EXTINF:10.0,
subtitle-00002.vtt
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedText);

      // TypeScript should infer result as TextTrack
      expect(result.type).toBe('text');
      expect(result.id).toBe('text-0');
      expect(result.label).toBe('English');
      expect(result.kind).toBe('subtitles');
      expect(result.language).toBe('en');
      expect(result.default).toBe(true);
      expect(result.segments).toHaveLength(2);
    });

    it('returns HAM-compliant TextTrack (no initialization for VTT)', () => {
      const playlistText = `#EXTM3U
#EXTINF:10.0,
subtitle.vtt
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlistText, unresolvedText);

      expect(result.mimeType).toBe('text/vtt');
      expect(result.duration).toBe(10.0);
      // TextTrack may not have initialization (VTT doesn't use init segments)
      expect(result.initialization).toBeUndefined();
    });
  });

  describe('container detection (non-fMP4)', () => {
    const unresolvedVideo: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'video-0',
      url: 'https://example.com/video/playlist.m3u8',
      bandwidth: 1400000,
      codecs: ['avc1.4d401f'],
      mimeType: 'video/mp4',
    };
    const unresolvedAudio: PartiallyResolvedAudioTrack = {
      type: 'audio',
      id: 'audio-0',
      url: 'https://example.com/audio/playlist.m3u8',
      bandwidth: 128000,
      codecs: ['mp4a.40.2'],
      groupId: 'audio',
      name: 'Default',
      sampleRate: 48000,
      channels: 2,
      mimeType: 'audio/mp4',
    };

    it('relabels to video/mp2t when there is no EXT-X-MAP and segments are .ts', () => {
      const playlist = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXTINF:6.0,
segment0.ts
#EXTINF:6.0,
segment1.ts
#EXT-X-ENDLIST`;

      expect(parseMediaPlaylist(playlist, unresolvedVideo).mimeType).toBe('video/mp2t');
    });

    it('uses video/mp2t for audio TS renditions too (no audio/mp2t)', () => {
      const playlist = `#EXTM3U
#EXTINF:6.0,
a0.ts
#EXT-X-ENDLIST`;

      expect(parseMediaPlaylist(playlist, unresolvedAudio).mimeType).toBe('video/mp2t');
    });

    it('ignores the query string when checking the .ts extension', () => {
      const playlist = `#EXTM3U
#EXTINF:6.0,
https://cdn.example.com/path/segment0.ts?token=abc123&expires=1
#EXT-X-ENDLIST`;

      expect(parseMediaPlaylist(playlist, unresolvedVideo).mimeType).toBe('video/mp2t');
    });

    it('keeps the fMP4 default when an EXT-X-MAP init segment is present (even with a .ts-less map)', () => {
      const playlist = `#EXTM3U
#EXT-X-MAP:URI="init.mp4"
#EXTINF:6.0,
segment0.ts
#EXT-X-ENDLIST`;

      // EXT-X-MAP present ⇒ fMP4 by definition; never relabel.
      expect(parseMediaPlaylist(playlist, unresolvedVideo).mimeType).toBe('video/mp4');
    });

    it('relabels to audio/aac when there is no EXT-X-MAP and segments are .aac (raw ADTS)', () => {
      const playlist = `#EXTM3U
#EXTINF:9.98,
fileSequence0.aac
#EXTINF:9.98,
fileSequence1.aac
#EXT-X-ENDLIST`;

      expect(parseMediaPlaylist(playlist, unresolvedAudio).mimeType).toBe('audio/aac');
    });

    it('keeps the fMP4 default for an .aac rendition that has an EXT-X-MAP', () => {
      const playlist = `#EXTM3U
#EXT-X-MAP:URI="init.mp4"
#EXTINF:9.98,
fileSequence0.aac
#EXT-X-ENDLIST`;

      expect(parseMediaPlaylist(playlist, unresolvedAudio).mimeType).toBe('audio/mp4');
    });

    it('keeps the fMP4 default when there is no map but the extension is unrecognized (e.g. .mp4)', () => {
      const playlist = `#EXTM3U
#EXTINF:6.0,
segment0.mp4
#EXT-X-ENDLIST`;

      expect(parseMediaPlaylist(playlist, unresolvedVideo).mimeType).toBe('video/mp4');
    });
  });

  describe('Live playlists', () => {
    const unresolvedVideo: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'video-0',
      url: 'https://example.com/video/playlist.m3u8',
      bandwidth: 1400000,
      codecs: ['avc1.4d401f'],
      mimeType: 'video/mp4',
    };

    it('reports Infinity duration for an unended live playlist (no ENDLIST, no PLAYLIST-TYPE)', () => {
      const playlist = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-MAP:URI="init.mp4"
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s`;

      const result = parseMediaPlaylist(playlist, unresolvedVideo);

      expect(result.duration).toBe(Number.POSITIVE_INFINITY);
      expect(result.startTime).toBe(0);
      expect(getMediaPlaylistMetadata(result)?.endList).toBe(false);
      // No EXT-X-SERVER-CONTROL → undefined, so the latency policy applies its default.
      expect(getMediaPlaylistMetadata(result)?.holdBack).toBeUndefined();
    });

    it('surfaces EXT-X-SERVER-CONTROL HOLD-BACK, ignoring PART-HOLD-BACK', () => {
      // Shaped after a real LL-HLS-capable server: PART-HOLD-BACK is advertised
      // alongside HOLD-BACK, but only applies to partial-segment playback.
      const playlist = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:2
#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,HOLD-BACK=7.5,PART-HOLD-BACK=2.171
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-MAP:URI="init.mp4"
#EXTINF:2.0,
segment0.m4s`;

      const metadata = getMediaPlaylistMetadata(parseMediaPlaylist(playlist, unresolvedVideo));

      expect(metadata?.holdBack).toBe(7.5);
      expect(metadata).not.toHaveProperty('partHoldBack');
    });

    it('leaves holdBack undefined when SERVER-CONTROL declares only PART-HOLD-BACK', () => {
      // The common Mux/LL-HLS shape. Reading PART-HOLD-BACK here would seat the
      // playhead ahead of the last complete segment.
      const playlist = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:2
#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=2.171
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-MAP:URI="init.mp4"
#EXTINF:2.0,
segment0.m4s`;

      expect(getMediaPlaylistMetadata(parseMediaPlaylist(playlist, unresolvedVideo))?.holdBack).toBeUndefined();
    });

    it('reports Infinity duration for an unended EVENT playlist', () => {
      const playlist = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:EVENT
#EXTINF:6.0,
segment0.m4s`;

      expect(parseMediaPlaylist(playlist, unresolvedVideo).duration).toBe(Number.POSITIVE_INFINITY);
    });

    it('anchors startTime at 0 on first parse, with media-sequence-derived segment ids', () => {
      const playlist = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:10
#EXTINF:6.0,
segment10.m4s
#EXTINF:6.0,
segment11.m4s`;

      const result = parseMediaPlaylist(playlist, unresolvedVideo);

      // No previous snapshot → the window anchors at 0 regardless of media sequence.
      expect(result.startTime).toBe(0);
      expect(result.segments.map((s) => s.startTime)).toEqual([0, 6]);
      // Segment ids are media-sequence-derived, so they stay stable across reloads.
      expect(result.segments.map((s) => s.id)).toEqual(['segment-10', 'segment-11']);
    });

    it('treats an ended live playlist as complete with finite duration', () => {
      const playlist = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:5
#EXTINF:6.0,
segment5.m4s
#EXTINF:6.0,
segment6.m4s
#EXT-X-ENDLIST`;

      const result = parseMediaPlaylist(playlist, unresolvedVideo);

      expect(result.duration).toBe(12.0);
      expect(result.startTime).toBe(0); // first parse, no previous → anchored at 0
      expect(getMediaPlaylistMetadata(result)?.endList).toBe(true);
    });

    it('spans to the last segment when a slid window ends, not just the window length', () => {
      const first = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:00.000Z
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s`;
      const previous = parseMediaPlaylist(first, unresolvedVideo);

      expect(previous.duration).toBe(Number.POSITIVE_INFINITY);

      // Window slid past segment0/1 and the stream ended. Placement is PDT-primary
      // against the frozen anchor, so the surviving segments stay where they were.
      const ended = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:2
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:12.000Z
#EXTINF:6.0,
segment2.m4s
#EXTINF:6.0,
segment3.m4s
#EXT-X-ENDLIST`;
      const result = parseMediaPlaylist(ended, previous);

      expect(result.segments.map((s) => s.startTime)).toEqual([12, 18]);
      // `startTime` is the presentation origin, so `duration` has to reach the last
      // segment's end (24) — the 12s EXTINF sum is the window's length, not its span.
      expect(result.startTime).toBe(0);
      expect(result.duration).toBe(24);
    });

    it('carries the timeline forward across reloads as the window slides', () => {
      const first = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s`;
      const previous = parseMediaPlaylist(first, unresolvedVideo);

      expect(previous.segments.map((s) => s.startTime)).toEqual([0, 6, 12]);

      // Window slid by one (media sequence 0 → 1) and gained a segment.
      const reload = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s
#EXTINF:6.0,
segment3.m4s`;
      const next = parseMediaPlaylist(reload, previous);

      // segment1 anchors to its prior start (6); the appended segment3 continues at 18.
      expect(next.segments.map((s) => s.startTime)).toEqual([6, 12, 18]);
      expect(next.segments.map((s) => s.id)).toEqual(['segment-1', 'segment-2', 'segment-3']);
    });

    it('appends without shifting when nothing rolls off (media sequence unchanged)', () => {
      const first = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s`;
      const previous = parseMediaPlaylist(first, unresolvedVideo);

      const reload = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s`;
      const next = parseMediaPlaylist(reload, previous);

      expect(next.segments.map((s) => s.startTime)).toEqual([0, 6, 12]);
    });

    it('estimates the timeline forward on a full window turnover (no overlap)', () => {
      const first = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s`;
      const previous = parseMediaPlaylist(first, unresolvedVideo); // ends at 18

      // Jump far ahead — no overlap (offset 10 ≥ 3 segments).
      const reload = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:10
#EXTINF:6.0,
segment10.m4s
#EXTINF:6.0,
segment11.m4s`;
      const next = parseMediaPlaylist(reload, previous);

      // anchor = previous end (18) + (offset 10 − 3) × 6 = 60
      expect(next.segments.map((s) => s.startTime)).toEqual([60, 66]);
    });

    it('bridges a full window turnover exactly via PDT, not the target-duration estimate', () => {
      // Actual segment duration (5s) is below the declared TARGETDURATION (6s), so
      // the target-duration estimate over-shoots — PDT (the spec-consistent
      // cross-reload reference) places the turnover window exactly.
      const first = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2024-01-01T00:00:00.000Z
#EXTINF:5.0,
segment0.m4s
#EXTINF:5.0,
segment1.m4s
#EXTINF:5.0,
segment2.m4s`;
      const previous = parseMediaPlaylist(first, unresolvedVideo); // [0, 5, 10], seg2 PDT = origin+10

      // Turnover (offset 10 ≥ 3), 50s of real elapsed (10 × 5s) — PDT says so.
      const reload = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:10
#EXT-X-PROGRAM-DATE-TIME:2024-01-01T00:00:50.000Z
#EXTINF:5.0,
segment10.m4s
#EXTINF:5.0,
segment11.m4s`;
      const next = parseMediaPlaylist(reload, previous);

      // PDT-exact: seg2 sits at 10 with PDT origin+10; seg10 is origin+50 → 10 + 40 = 50.
      // (The target-duration estimate would over-shoot to 15 + (10−3)×6 = 57.)
      expect(next.segments.map((s) => s.startTime)).toEqual([50, 55]);
    });

    it('re-places reload windows from PDT against the frozen anchor, not EXTINF carry-forward', () => {
      const first = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2024-01-01T00:00:00.000Z
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s`;
      const previous = parseMediaPlaylist(first, unresolvedVideo); // [0, 6, 12], anchor = origin

      // The overlap reload declares segment1's PDT as origin+6.5 — the encoder's
      // actual content ran long vs the EXTINF it declared last window. PDT-primary
      // placement corrects to the actual timeline; carry-forward would pin
      // segment1 at its stale previous position (6).
      const reload = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-PROGRAM-DATE-TIME:2024-01-01T00:00:06.500Z
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s
#EXTINF:6.0,
segment3.m4s`;
      const next = parseMediaPlaylist(reload, previous);

      expect(next.segments.map((s) => s.startTime)).toEqual([6.5, 12.5, 18.5]);
      // The anchor stays frozen — re-derived startDate reads back unchanged.
      expect(next.startDate).toBe(previous.startDate);
    });

    it('falls back to carry-forward when a reload window loses PDT', () => {
      const first = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2024-01-01T00:00:00.000Z
#EXTINF:6.0,
segment0.m4s
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s`;
      const previous = parseMediaPlaylist(first, unresolvedVideo);

      // Non-conformant: PDT disappears mid-stream. The window must carry
      // forward from the media-sequence overlap, not reset to the local base.
      const reload = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:1
#EXTINF:6.0,
segment1.m4s
#EXTINF:6.0,
segment2.m4s
#EXTINF:6.0,
segment3.m4s`;
      const next = parseMediaPlaylist(reload, previous);

      expect(next.segments.map((s) => s.startTime)).toEqual([6, 12, 18]);
    });
  });

  describe('EXT-X-PROGRAM-DATE-TIME', () => {
    const videoShell: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'video-0',
      url: 'https://example.com/video/playlist.m3u8',
      bandwidth: 1400000,
      width: 1280,
      height: 720,
      codecs: ['avc1.4d401f'],
      frameRate: { frameRateNumerator: 30 },
      mimeType: 'video/mp4',
    };
    const epoch = (iso: string) => Date.parse(iso) / 1000;

    it('captures the per-segment program date time in epoch seconds', () => {
      const text = `#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:00.000Z
#EXTINF:4,
s0.ts
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:04.000Z
#EXTINF:4,
s1.ts`;
      const r = parseMediaPlaylist(text, videoShell);

      expect(r.segments.map((s) => s.startDate)).toEqual([
        epoch('2026-01-01T00:00:00.000Z'),
        epoch('2026-01-01T00:00:04.000Z'),
      ]);
    });

    it('interpolates the date time forward via EXTINF when a tag is absent', () => {
      const text = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:00.000Z
#EXTINF:4,
s0.ts
#EXTINF:4,
s1.ts
#EXTINF:4,
s2.ts`;
      const r = parseMediaPlaylist(text, videoShell);

      expect(r.segments.map((s) => s.startDate)).toEqual([
        epoch('2026-01-01T00:00:00.000Z'),
        epoch('2026-01-01T00:00:04.000Z'),
        epoch('2026-01-01T00:00:08.000Z'),
      ]);
    });

    it('re-anchors on an explicit tag rather than interpolating (discontinuity jump)', () => {
      const text = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:00.000Z
#EXTINF:4,
s0.ts
#EXT-X-DISCONTINUITY
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T01:00:00.000Z
#EXTINF:4,
s1.ts`;
      const r = parseMediaPlaylist(text, videoShell);

      // s1 takes the jumped absolute time, not s0 + 4s.
      expect(r.segments.map((s) => s.startDate)).toEqual([
        epoch('2026-01-01T00:00:00.000Z'),
        epoch('2026-01-01T01:00:00.000Z'),
      ]);
    });

    it('interpolates with each segment’s actual EXTINF, not a nominal duration', () => {
      const text = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:00.000Z
#EXTINF:1.9,
s0.ts
#EXTINF:2.05,
s1.ts
#EXTINF:2.0,
s2.ts`;
      const r = parseMediaPlaylist(text, videoShell);
      const t0 = epoch('2026-01-01T00:00:00.000Z');

      expect(r.segments[0]?.startDate).toBeCloseTo(t0, 6);
      expect(r.segments[1]?.startDate).toBeCloseTo(t0 + 1.9, 6);
      expect(r.segments[2]?.startDate).toBeCloseTo(t0 + 1.9 + 2.05, 6);
    });

    it('leaves program date time undefined when the source carries no PDT', () => {
      const text = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4,
s0.ts
#EXTINF:4,
s1.ts`;
      const r = parseMediaPlaylist(text, videoShell);

      expect(r.segments.map((segment) => segment.startDate)).toEqual([undefined, undefined]);
    });

    it('exposes Track.startDate as the wall-clock at the origin (startDate − startTime)', () => {
      const text = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:10.000Z
#EXTINF:4,
s0.ts
#EXTINF:4,
s1.ts`;

      // First parse anchors startTime at 0, so the origin maps to s0's wall clock.
      expect(parseMediaPlaylist(text, videoShell).startDate).toBe(epoch('2026-01-01T00:00:10.000Z'));
    });

    it('keeps Track.startDate stable as the window slides', () => {
      const first = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:00.000Z
#EXTINF:4,
s0.ts
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:04.000Z
#EXTINF:4,
s1.ts`;
      const prev = parseMediaPlaylist(first, videoShell);

      expect(prev.startDate).toBe(epoch('2026-01-01T00:00:00.000Z'));

      // Window slid by one: s0 rolled off, s1 is now first (startTime carried to 4).
      const reload = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:04.000Z
#EXTINF:4,
s1.ts
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:08.000Z
#EXTINF:4,
s2.ts`;
      const next = parseMediaPlaylist(reload, prev);

      expect(next.segments[0]?.startTime).toBe(4); // window advanced
      expect(next.startDate).toBe(epoch('2026-01-01T00:00:00.000Z')); // origin unchanged
    });

    it('leaves Track.startDate undefined when the source carries no PDT', () => {
      const text = `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4,
s0.ts`;

      expect(parseMediaPlaylist(text, videoShell).startDate).toBeUndefined();
    });
  });

  describe('real Mux live snapshots (fixtures)', () => {
    const videoShell: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'video-0',
      url: 'https://example.com/video/playlist.m3u8',
      bandwidth: 2191200,
      width: 1280,
      height: 572,
      codecs: ['avc1.640020'],
      frameRate: { frameRateNumerator: 30 },
      mimeType: 'video/mp4',
    };
    const audioShell: PartiallyResolvedAudioTrack = {
      type: 'audio',
      id: 'audio-hi-0',
      url: 'https://example.com/audio/playlist.m3u8',
      groupId: 'audio-hi-0',
      name: 'Default',
      language: 'und',
      codecs: ['mp4a.40.2'],
      mimeType: 'audio/mp4',
      bandwidth: 0,
      sampleRate: 48000,
      channels: 2,
    };

    it('carries the timeline forward across a non-uniform window slide (TS, media-seq 85→86→88)', () => {
      const s1 = parseMediaPlaylist(liveTsVideo1, videoShell);
      const s2 = parseMediaPlaylist(liveTsVideo2, s1);
      const s3 = parseMediaPlaylist(liveTsVideo3, s2);

      // Track startTime stays ≡ 0 (the origin); the window edge slides on segments.
      expect([s1.startTime, s2.startTime, s3.startTime]).toEqual([0, 0, 0]);
      expect(s1.segments[0]?.startTime).toBe(0); // first parse anchors at 0
      expect(s2.segments[0]?.startTime).toBe(4); // slid by one segment (4s)
      expect(s3.segments[0]?.startTime).toBe(12); // slid by TWO segments (8s) — the offset=2 path
      expect(s3.segments[0]?.id).toBe('segment-88');
      expect(s3.mimeType).toBe('video/mp2t'); // TS container detected
      // PDT rides through carry-forward unchanged (absolute, not re-based).
      expect(s3.segments[0]?.startDate).toBeDefined();
      expect(s3.segments.map((seg) => seg.startDate ?? 0)).toEqual(
        [...s3.segments.map((seg) => seg.startDate ?? 0)].sort((a, b) => a - b)
      );
    });

    it('parses CMAF/LL-HLS: fMP4 mime, init segment, ignores partial segments', () => {
      const video = parseMediaPlaylist(liveCmafVideo, videoShell);

      expect(video.mimeType).toBe('video/mp4'); // fMP4 — not relabeled to a TS/unplayable mime
      expect(video.initialization?.url).toContain('18446744073709551615.m4s'); // EXT-X-MAP
      expect(video.duration).toBe(Number.POSITIVE_INFINITY); // unended live
      // EXT-X-PART / PRELOAD-HINT / SERVER-CONTROL are ignored: only the 10
      // complete .m4s segments are parsed.
      expect(video.segments).toHaveLength(10);
      expect(video.segments.every((s) => /\/\d+\.m4s$/.test(s.url))).toBe(true);
    });

    it('aligns demuxed audio and video by PDT, where per-track startTime disagrees', () => {
      const video = parseMediaPlaylist(liveCmafVideo, videoShell);
      const audio = parseMediaPlaylist(liveCmafAudio, audioShell);

      const v82 = video.segments.find((s) => s.id === 'segment-82');
      const a82 = audio.segments.find((s) => s.id === 'segment-82');

      expect(v82).toBeDefined();
      expect(a82).toBeDefined();

      // Same real instant → identical absolute PDT (the cross-track sync anchor)…
      expect(v82?.startDate).toBe(a82?.startDate);
      // …even though per-track relative startTime disagrees by a full segment
      // (video's window starts one segment earlier). This 2s gap is exactly the
      // A/V misalignment that PDT-based alignment resolves and sequence-number
      // alignment would mask.
      expect(v82?.startTime).toBe(2);
      expect(a82?.startTime).toBe(0);
    });

    it('exposes per-track startDate whose audio/video delta is the relative skew', () => {
      const video = parseMediaPlaylist(liveCmafVideo, videoShell);
      const audio = parseMediaPlaylist(liveCmafAudio, audioShell);

      expect(video.startDate).toBeDefined();
      expect(audio.startDate).toBeDefined();
      // Parsed independently (no shared anchor), each track's origin sits at a
      // different real instant — audio's window starts one 2s segment later — so
      // the startDate delta exposes the window offset PDT placement resolves.
      expect((audio.startDate ?? 0) - (video.startDate ?? 0)).toBeCloseTo(2, 3);
    });
  });

  describe('pre-applied anchor (startDate on the unresolved shell)', () => {
    const shell: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'video-0',
      url: 'https://example.com/video/playlist.m3u8',
      bandwidth: 1400000,
      codecs: ['avc1.4d401f'],
      mimeType: 'video/mp4',
    };
    const epoch = (iso: string) => Date.parse(iso) / 1000;
    const anchor = epoch('2026-01-01T00:00:00.000Z');

    const withPdt = `#EXTM3U
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:5
#EXT-X-PROGRAM-DATE-TIME:2026-01-01T00:00:10.000Z
#EXTINF:2,
s5.m4s
#EXTINF:2,
s6.m4s`;

    it('places first-resolve segments by PDT relative to the pre-applied startDate', () => {
      const r = parseMediaPlaylist(withPdt, { ...shell, startDate: anchor });

      // segment.startTime = segment PDT − anchor (10s and 12s past media-time 0).
      expect(r.segments.map((s) => s.startTime)).toEqual([10, 12]);
      expect(r.startTime).toBe(0); // the origin — the window edge lives on segments
      // The recomputed track startDate reads back as the anchor.
      expect(r.startDate).toBe(anchor);
    });

    it('anchors at the local base 0 when the shell carries no startDate (unchanged)', () => {
      const r = parseMediaPlaylist(withPdt, shell);

      expect(r.segments.map((s) => s.startTime)).toEqual([0, 2]);
      expect(r.startTime).toBe(0);
    });

    it('falls back to the local base when the shell has a startDate but no segment carries PDT', () => {
      const noPdt = `#EXTM3U
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:5
#EXTINF:2,
s5.m4s
#EXTINF:2,
s6.m4s`;
      const r = parseMediaPlaylist(noPdt, { ...shell, startDate: anchor });

      expect(r.segments.map((s) => s.startTime)).toEqual([0, 2]);
      expect(r.startDate).toBeUndefined();
    });
  });
});

describe('parseMediaPlaylist (LL-HLS detection)', () => {
  const shell: PartiallyResolvedVideoTrack = {
    id: 'v-1',
    type: 'video',
    url: 'https://example.com/v.m3u8',
    bandwidth: 1000,
    codecs: ['avc1.4d401f'],
    mimeType: 'video/mp4',
  };

  const playlist = (extra: string) => `#EXTM3U
#EXT-X-TARGETDURATION:4
${extra}
#EXT-X-MAP:URI="init.mp4"
#EXTINF:4.0,
0.m4s
`;

  it('reports no low latency for a plain live playlist', () => {
    const track = parseMediaPlaylist(playlist('#EXT-X-MEDIA-SEQUENCE:0'), shell);

    expect(getMediaPlaylistMetadata(track)?.lowLatency).toBe(false);
  });

  it('detects EXT-X-PART-INF', () => {
    const track = parseMediaPlaylist(playlist('#EXT-X-PART-INF:PART-TARGET=1.0'), shell);

    expect(getMediaPlaylistMetadata(track)?.lowLatency).toBe(true);
  });

  it('detects PART-HOLD-BACK on EXT-X-SERVER-CONTROL, without reading its value', () => {
    // Deliberately unread: it only applies to clients playing partial segments.
    // Its presence is still the server advertising LL-HLS.
    const track = parseMediaPlaylist(
      playlist('#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=2.171,HOLD-BACK=6'),
      shell
    );
    const metadata = getMediaPlaylistMetadata(track);

    expect(metadata?.lowLatency).toBe(true);
    expect(metadata?.holdBack).toBe(6);
  });

  it('detects EXT-X-PART lines without mistaking them for segments', () => {
    const track = parseMediaPlaylist(
      `#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-MAP:URI="init.mp4"
#EXTINF:4.0,
0.m4s
#EXT-X-PART:DURATION=1.0,URI="1.0.m4s"
#EXT-X-PART:DURATION=1.0,URI="1.1.m4s"
`,
      shell
    );

    expect(getMediaPlaylistMetadata(track)?.lowLatency).toBe(true);
    // Parts are not segments — only the complete one is parsed.
    expect(track.segments).toHaveLength(1);
  });
});

describe('parseMediaPlaylist (encryption detection)', () => {
  const withKey = (keyLines: string) => `#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-MAP:URI="init.mp4"
${keyLines}
#EXTINF:4.0,
0.m4s
#EXT-X-ENDLIST
`;

  const unresolved: PartiallyResolvedVideoTrack = {
    id: 'v-1',
    type: 'video',
    url: 'https://example.com/v.m3u8',
    bandwidth: 1000,
    codecs: ['avc1.4d401f'],
    mimeType: 'video/mp4',
  };

  it('reports no encryption when the playlist has no EXT-X-KEY', () => {
    const track = parseMediaPlaylist(withKey(''), unresolved);

    expect(getMediaPlaylistMetadata(track)?.encrypted).toBe(false);
  });

  it('reports no encryption for METHOD=NONE', () => {
    const track = parseMediaPlaylist(withKey('#EXT-X-KEY:METHOD=NONE'), unresolved);

    expect(getMediaPlaylistMetadata(track)?.encrypted).toBe(false);
  });

  it('reports encryption for a real METHOD', () => {
    const track = parseMediaPlaylist(
      withKey('#EXT-X-KEY:METHOD=SAMPLE-AES,URI="skd://k",KEYFORMAT="com.apple.streamingkeydelivery"'),
      unresolved
    );

    expect(getMediaPlaylistMetadata(track)?.encrypted).toBe(true);
  });

  it('reports encryption for a clear lead — METHOD=NONE followed by a real key', () => {
    // Conservative by design: the opening segments are playable, but we can only
    // report whether decryption is needed at all, so this reads as encrypted.
    const track = parseMediaPlaylist(
      withKey('#EXT-X-KEY:METHOD=NONE\n#EXT-X-KEY:METHOD=AES-128,URI="k.bin"'),
      unresolved
    );

    expect(getMediaPlaylistMetadata(track)?.encrypted).toBe(true);
  });

  it('does not treat EXT-X-KEY as a segment tag', () => {
    const track = parseMediaPlaylist(withKey('#EXT-X-KEY:METHOD=AES-128,URI="k.bin"'), unresolved);

    expect(track.segments).toHaveLength(1);
  });

  // Snapshots of a real Mux DRM asset (playback policy `drm`), truncated to four
  // segments with the signed CDN URLs replaced by relative names. The synthetic
  // cases above pin the rule; these pin it against what Mux actually emits —
  // three sibling EXT-X-KEY lines, one per key system, all METHOD=SAMPLE-AES.
  describe('real Mux DRM snapshots (fixtures)', () => {
    const videoShell: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'video-0',
      url: 'https://example.com/video/playlist.m3u8',
      bandwidth: 7264400,
      width: 2048,
      height: 914,
      codecs: ['avc1.64002a'],
      mimeType: 'video/mp4',
    };
    const audioShell: PartiallyResolvedAudioTrack = {
      type: 'audio',
      id: 'audio-hi-0',
      url: 'https://example.com/audio/playlist.m3u8',
      groupId: 'audio-hi-0',
      name: 'Default',
      language: 'und',
      codecs: ['mp4a.40.2'],
      mimeType: 'audio/mp4',
      bandwidth: 0,
      sampleRate: 48000,
      channels: 2,
    };

    it('reads a Mux DRM video rendition as encrypted', () => {
      const video = parseMediaPlaylist(drmCmafVideo, videoShell);

      expect(getMediaPlaylistMetadata(video)?.encrypted).toBe(true);
    });

    it('reads the sibling audio rendition as clear — Mux encrypts video only', () => {
      // The asymmetry that makes a Mux DRM source a *partially* encrypted one
      // rather than a wholly unplayable one: the audio playlist carries no
      // EXT-X-KEY at all, so audio survives the pruning that drops every video
      // rendition. Anything reasoning about a DRM source per-type depends on it.
      const audio = parseMediaPlaylist(drmCmafAudio, audioShell);

      expect(getMediaPlaylistMetadata(audio)?.encrypted).toBe(false);
    });

    it('parses the rest of an encrypted playlist normally', () => {
      // Three EXT-X-KEY lines carrying base64 PSSH/PlayReady payloads and an
      // skd:// URI sit between TARGETDURATION and EXT-X-MAP. None of them are
      // segments, and none derail the tags around them.
      const video = parseMediaPlaylist(drmCmafVideo, videoShell);

      expect(video.segments).toHaveLength(4);
      expect(video.initialization?.url).toContain('18446744073709551615.m4s');
      expect(video.mimeType).toBe('video/mp4');
      expect(video.duration).toBe(16);
    });
  });
});

describe('parseMediaPlaylist (key metadata)', () => {
  const withKey = (keyLines: string) => `#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-MAP:URI="init.mp4"
${keyLines}
#EXTINF:4.0,
0.m4s
#EXT-X-ENDLIST
`;

  const unresolved: PartiallyResolvedVideoTrack = {
    id: 'v-1',
    type: 'video',
    url: 'https://example.com/v.m3u8',
    bandwidth: 1000,
    codecs: ['avc1.4d401f'],
    mimeType: 'video/mp4',
  };

  it('surfaces no keys for a clear playlist or METHOD=NONE', () => {
    expect(getMediaPlaylistMetadata(parseMediaPlaylist(withKey(''), unresolved))?.keys).toBeUndefined();
    expect(
      getMediaPlaylistMetadata(parseMediaPlaylist(withKey('#EXT-X-KEY:METHOD=NONE'), unresolved))?.keys
    ).toBeUndefined();
  });

  // Key URIs are opaque identifiers for every DRM system — a `data:` PSSH/PRO
  // payload, a FairPlay `skd://` — and only `identity`/AES-128 names a fetchable
  // resource. Three real providers delimit the FairPlay form three different ways,
  // so the parser must hand every one of them back untouched.
  it.each([
    ['Axinom keyid:iv', 'skd://302f80dd-411e-4886-bca5-bb1f8018a024:77FD1889AAF4143B085548B3C0F95B9A'],
    ['EZDRM host/;id', 'skd://fps.ezdrm.com/;b99ed9e5-c641-49d1-bfa8-43692b686ddb'],
    ['bare id', 'skd://9fd385d5-f389-48b5-b7c3-b1863ee10888'],
    ['data: payload', 'data:text/plain;base64,AAAAPnBzc2gAAAAA'],
  ])('preserves an opaque %s key URI verbatim', (_label, uri) => {
    const track = parseMediaPlaylist(
      withKey(`#EXT-X-KEY:METHOD=SAMPLE-AES,URI="${uri}",KEYFORMAT="com.apple.streamingkeydelivery"`),
      unresolved
    );

    expect(getMediaPlaylistMetadata(track)?.keys?.[0]?.uri).toBe(uri);
  });

  it('surfaces a DRM key declaration with raw attribute values', () => {
    const track = parseMediaPlaylist(
      withKey(
        '#EXT-X-KEY:METHOD=SAMPLE-AES,URI="skd://k",IV=0x9c7db8778570d05c3177c349fd9236aa,KEYFORMAT="com.apple.streamingkeydelivery"'
      ),
      unresolved
    );

    expect(getMediaPlaylistMetadata(track)?.keys).toEqual([
      {
        method: 'SAMPLE-AES',
        uri: 'skd://k',
        iv: '0x9c7db8778570d05c3177c349fd9236aa',
        keyFormat: 'com.apple.streamingkeydelivery',
      },
    ]);
  });

  it('resolves a relative key URI against the playlist URL', () => {
    const track = parseMediaPlaylist(withKey('#EXT-X-KEY:METHOD=AES-128,URI="keys/k.bin"'), unresolved);

    expect(getMediaPlaylistMetadata(track)?.keys).toEqual([
      { method: 'AES-128', uri: 'https://example.com/keys/k.bin' },
    ]);
  });

  it('dedupes a key re-declared between segment runs', () => {
    const track = parseMediaPlaylist(
      `#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-MAP:URI="init.mp4"
#EXT-X-KEY:METHOD=AES-128,URI="k.bin"
#EXTINF:4.0,
0.m4s
#EXT-X-KEY:METHOD=AES-128,URI="k.bin"
#EXTINF:4.0,
1.m4s
#EXT-X-ENDLIST
`,
      unresolved
    );

    expect(getMediaPlaylistMetadata(track)?.keys).toHaveLength(1);
  });

  it('surfaces all three Mux key systems from the DRM fixture', () => {
    // The manifest-driven init-data source for the EME pipeline: Mux carries a
    // complete Widevine PSSH as a data: URI plus the KEYID extension attribute.
    const video = parseMediaPlaylist(drmCmafVideo, unresolved);
    const keys = getMediaPlaylistMetadata(video)?.keys;

    expect(keys?.map((k) => k.keyFormat)).toEqual([
      'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
      'com.microsoft.playready',
      'com.apple.streamingkeydelivery',
    ]);
    const widevine = keys?.[0];

    expect(widevine?.method).toBe('SAMPLE-AES');
    expect(widevine?.uri).toMatch(/^data:text\/plain;base64,AAAAlnBzc2g/);
    expect(widevine?.keyId).toBe('0xbfd7ce06e7f24ca811498a15d29b0376');
  });
});
