import { describe, expect, it } from 'vite-plus/test';

import { isCarriedAudioTrack, resolveCarriedAudioRenditions } from '../carried-audio';
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
