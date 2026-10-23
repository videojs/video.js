import { describe, expect, it } from 'vite-plus/test';

import { addMuxedAudioRendition, isCarriedAudioTrack, resolveCarriedAudioRenditions } from '../carried-audio';
import { parseMultivariantPlaylist } from '../parse-multivariant';

const baseUrl = 'https://example.com/master.m3u8';

// Mux's multi-audio TS shape: the default rendition is carried in the video segments (no URI),
// the alternates are audio-only renditions of their own.
const muxMultiAudioTs = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud1",NAME="English",AUTOSELECT=YES,DEFAULT=YES,LANGUAGE="en"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud1",NAME="Español",AUTOSELECT=YES,LANGUAGE="es",URI="es/rendition.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=2493700,CODECS="mp4a.40.2,avc1.640020",AUDIO="aud1",RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=595100,CODECS="mp4a.40.2,avc1.64001e",AUDIO="aud1",RESOLUTION=480x270
270p.m3u8`;

function audioTracks(text: string) {
  const presentation = resolveCarriedAudioRenditions(parseMultivariantPlaylist(text, { url: baseUrl }));
  const tracks = presentation.selectionSets.find((set) => set.type === 'audio')?.switchingSets[0]?.tracks ?? [];

  return { presentation, tracks };
}

describe('resolveCarriedAudioRenditions', () => {
  it('gives a URI-less rendition the playlist of the lowest-bandwidth variant carrying its group', () => {
    const { tracks } = audioTracks(muxMultiAudioTs);

    expect(tracks.map((track) => track.url)).toEqual([
      'https://example.com/270p.m3u8',
      'https://example.com/es/rendition.m3u8',
    ]);
    expect(tracks[0]).toMatchObject({ name: 'English', default: true, codecs: ['mp4a.40.2'] });
  });

  it('leaves a rendition alone when no variant carries its group', () => {
    const text = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="orphan",NAME="English",DEFAULT=YES
#EXT-X-STREAM-INF:BANDWIDTH=595100,CODECS="mp4a.40.2,avc1.64001e",AUDIO="aud1"
270p.m3u8`;
    const parsed = parseMultivariantPlaylist(text, { url: baseUrl });

    expect(resolveCarriedAudioRenditions(parsed)).toBe(parsed);
  });
});

// Mux's single-audio TS shape: every variant carries the audio muxed in, and no rendition declares it.
const muxSingleAudioTs = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=2493700,CODECS="mp4a.40.2,avc1.640020",RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=595100,CODECS="mp4a.40.2,avc1.64001e",RESOLUTION=480x270
270p.m3u8`;

describe('addMuxedAudioRendition', () => {
  it('adds one default audio track carried by the lowest-bandwidth muxed variant', () => {
    const presentation = addMuxedAudioRendition(parseMultivariantPlaylist(muxSingleAudioTs, { url: baseUrl }));
    const audio = presentation.selectionSets.filter((set) => set.type === 'audio');

    expect(audio).toHaveLength(1);
    expect(audio[0]!.switchingSets[0]!.tracks).toEqual([
      expect.objectContaining({
        type: 'audio',
        url: 'https://example.com/270p.m3u8',
        codecs: ['mp4a.40.2'],
        default: true,
        autoselect: true,
      }),
    ]);
    expect(isCarriedAudioTrack(presentation, audio[0]!.switchingSets[0]!.tracks[0]!)).toBe(true);
  });

  it('leaves a presentation that already declares audio alone', () => {
    const parsed = parseMultivariantPlaylist(muxMultiAudioTs, { url: baseUrl });

    expect(addMuxedAudioRendition(parsed)).toBe(parsed);
  });

  it('leaves a presentation whose variants carry no audio alone', () => {
    const text = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=595100,CODECS="avc1.64001e"
270p.m3u8`;
    const parsed = parseMultivariantPlaylist(text, { url: baseUrl });

    expect(addMuxedAudioRendition(parsed)).toBe(parsed);
  });
});

describe('isCarriedAudioTrack', () => {
  it('is true for the resolved carried rendition and false for an audio-only rendition', () => {
    const { presentation, tracks } = audioTracks(muxMultiAudioTs);

    expect(isCarriedAudioTrack(presentation, tracks[0]!)).toBe(true);
    expect(isCarriedAudioTrack(presentation, tracks[1]!)).toBe(false);
  });

  it('is false for a video track at the same URL', () => {
    const { presentation } = audioTracks(muxMultiAudioTs);

    expect(isCarriedAudioTrack(presentation, { type: 'video', url: 'https://example.com/270p.m3u8' })).toBe(false);
  });
});
