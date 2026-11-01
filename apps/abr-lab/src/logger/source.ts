import { type DashRepresentation, parseMpd, parseSidx } from './dash.ts';
import { type MediaPlaylist, parseMedia, parseMultivariant, type Rendition } from './hls.ts';
import type { TransferRecorder } from './recorder.ts';

/** What the session needs from a stream, whatever its protocol: video renditions, matching audio, and their segments. */
export interface StreamSource {
  /** Video renditions, lowest bandwidth first. */
  renditions: Rendition[];
  /** The audio to fetch alongside a rendition, as a key for `load`; undefined when audio is muxed or absent. */
  audioFor(rendition: Rendition): string | undefined;
  /** Segments for a rendition id or audio key, fetching whatever that takes (playlist, `sidx`) through the recorder. */
  load(key: string, trackType: 'video' | 'audio'): Promise<MediaPlaylist>;
}

export async function openSource(url: string, recorder: TransferRecorder): Promise<StreamSource> {
  const decoder = new TextDecoder();
  const { body } = await recorder.fetch(url, { kind: 'playlist', role: 'multivariant' });
  const text = decoder.decode(body ?? new Uint8Array());

  return text.trimStart().startsWith('<') ? dashSource(text, url, recorder) : hlsSource(text, url, recorder, decoder);
}

function hlsSource(text: string, url: string, recorder: TransferRecorder, decoder: TextDecoder): StreamSource {
  const { renditions, audio } = parseMultivariant(text, url);
  const urlByKey = new Map<string, string>([
    ...renditions.map((r) => [r.id, r.url] as const),
    ...[...audio].map(([group, audioUrl]) => [`audio:${group}`, audioUrl] as const),
  ]);

  return {
    renditions,
    audioFor: (rendition) =>
      rendition.audioGroup && audio.has(rendition.audioGroup) ? `audio:${rendition.audioGroup}` : undefined,
    async load(key, trackType) {
      const playlistUrl = urlByKey.get(key)!;
      const { body } = await recorder.fetch(playlistUrl, { kind: 'playlist', role: 'playlist', trackType });

      return parseMedia(decoder.decode(body ?? new Uint8Array()), playlistUrl);
    },
  };
}

function dashSource(text: string, url: string, recorder: TransferRecorder): StreamSource {
  const manifest = parseMpd(text, url);
  // One audio representation for the whole session, as players typically pick one and keep it.
  const audio = manifest.audio[Math.floor((manifest.audio.length - 1) / 2)];
  const byKey = new Map<string, DashRepresentation>([
    ...manifest.video.map((r) => [r.id, r] as const),
    ...(audio ? [[`audio:${audio.id}`, audio] as const] : []),
  ]);

  return {
    renditions: manifest.video.map((r) => ({ id: r.id, bandwidth: r.bandwidth, url, audioGroup: audio?.id })),
    audioFor: () => (audio ? `audio:${audio.id}` : undefined),
    async load(key, trackType) {
      const { segments } = byKey.get(key)!;
      if ('segments' in segments) return segments;

      // SegmentBase: the segment byte ranges live in the sidx box at indexRange.
      const { body } = await recorder.fetch(segments.indexUrl, {
        kind: 'other',
        role: 'segment',
        trackType,
        renditionId: key,
        byteRange: segments.indexRange,
      });
      const references = parseSidx(body ?? new Uint8Array(), segments.indexRange[0]);

      return {
        init: segments.init,
        segments: references.map(({ range }) => ({ url: segments.indexUrl, byteRange: range })),
        segmentSeconds: references[0]?.seconds ?? 4,
      };
    },
  };
}
