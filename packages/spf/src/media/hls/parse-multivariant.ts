import { generateId } from '@videojs/utils/string';

import type {
  AddressableObject,
  AudioSelectionSet,
  AudioSwitchingSet,
  FrameRate,
  MultivariantPlaylistMetadata,
  PartiallyResolvedAudioTrack,
  PartiallyResolvedTextTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  SelectionSet,
  SessionDataEntry,
  TextSelectionSet,
  TextSwitchingSet,
  VideoSelectionSet,
  VideoSwitchingSet,
} from '../types';
import { MULTIVARIANT_PLAYLIST_METADATA_KEY } from '../types';
import { matchTag, parseCodecs } from './parse-attributes';
import { resolveUrl } from './resolve-url';
import { parseSessionData } from './session-data';

/**
 * Parse HLS multivariant playlist into a Presentation.
 *
 * Returns Presentation with partially resolved tracks (no segment information). Tracks contain metadata from
 * multivariant playlist (bandwidth, resolution, codecs) but segment information is added when media playlists are
 * fetched.
 *
 * @param text - Raw playlist text content
 * @param unresolved - Unresolved presentation (contains URL for base URL resolution)
 * @returns Presentation with partially resolved tracks (duration is undefined)
 */
export function parseMultivariantPlaylist(text: string, unresolved: AddressableObject): Presentation {
  const baseUrl = unresolved.url;
  const lines = text.split(/\r?\n/);

  // Intermediate parsing structures
  interface StreamInfo {
    uri: string;
    bandwidth: number;
    resolution?: { width: number; height: number } | undefined;
    codecs?: string | undefined;
    frameRate?: FrameRate | undefined;
    audioGroupId?: string | undefined;
  }

  interface AudioRenditionInfo {
    groupId: string;
    name: string;
    language?: string | undefined;
    uri?: string | undefined;
    default?: boolean | undefined;
    autoselect?: boolean | undefined;
    channels?: number | undefined;
  }

  interface SubtitleRenditionInfo {
    groupId: string;
    name: string;
    language?: string | undefined;
    uri: string;
    default?: boolean | undefined;
    autoselect?: boolean | undefined;
    forced?: boolean | undefined;
  }

  const streams: StreamInfo[] = [];
  const audioRenditions: AudioRenditionInfo[] = [];
  const subtitleRenditions: SubtitleRenditionInfo[] = [];
  const sessionData: SessionDataEntry[] = [];

  // State for STREAM-INF parsing (URI follows on next line)
  let pendingStreamInfo: Omit<StreamInfo, 'uri'> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || (trimmed.startsWith('#') && !trimmed.startsWith('#EXT'))) continue;

    // Skip tags not used in Presentation model
    if (
      trimmed === '#EXTM3U' ||
      trimmed.startsWith('#EXT-X-VERSION:') ||
      trimmed.startsWith('#EXT-X-INDEPENDENT-SEGMENTS')
    ) {
      continue;
    }

    // #EXT-X-SESSION-DATA — recorded, not fetched; a behavior that knows the
    // DATA-ID reads it back via `getSessionData`.
    const sessionDataAttrs = matchTag(trimmed, 'EXT-X-SESSION-DATA');

    if (sessionDataAttrs) {
      const entry = parseSessionData(sessionDataAttrs, baseUrl);

      if (entry) sessionData.push(entry);

      continue;
    }

    // #EXT-X-MEDIA:TYPE=AUDIO/SUBTITLES
    const mediaAttrs = matchTag(trimmed, 'EXT-X-MEDIA');

    if (mediaAttrs) {
      const type = mediaAttrs.get('TYPE');
      const groupId = mediaAttrs.get('GROUP-ID');
      const name = mediaAttrs.get('NAME');

      if (type === 'AUDIO' && groupId && name) {
        const uri = mediaAttrs.get('URI');

        audioRenditions.push({
          groupId,
          name,
          language: mediaAttrs.get('LANGUAGE'),
          uri: uri ? resolveUrl(uri, baseUrl) : undefined,
          default: mediaAttrs.getBool('DEFAULT'),
          autoselect: mediaAttrs.getBool('AUTOSELECT'),
          // CHANNELS is a quoted string whose first parameter is the channel
          // count ("6", or "16/JOC" for spatial audio); getInt reads the
          // leading integer.
          channels: mediaAttrs.getInt('CHANNELS'),
        });
      }

      if (type === 'SUBTITLES' && groupId && name) {
        const uri = mediaAttrs.get('URI');

        // URI is required for subtitle tracks
        if (uri) {
          subtitleRenditions.push({
            groupId,
            name,
            language: mediaAttrs.get('LANGUAGE'),
            uri: resolveUrl(uri, baseUrl),
            default: mediaAttrs.getBool('DEFAULT'),
            autoselect: mediaAttrs.getBool('AUTOSELECT'),
            forced: mediaAttrs.getBool('FORCED'),
          });
        }
      }

      continue;
    }

    // #EXT-X-STREAM-INF:BANDWIDTH=...
    const streamInfAttrs = matchTag(trimmed, 'EXT-X-STREAM-INF');

    if (streamInfAttrs) {
      pendingStreamInfo = {
        bandwidth: streamInfAttrs.getInt('BANDWIDTH', 0)!,
        resolution: streamInfAttrs.getResolution('RESOLUTION'),
        codecs: streamInfAttrs.get('CODECS'),
        frameRate: streamInfAttrs.getFrameRate('FRAME-RATE'),
        audioGroupId: streamInfAttrs.get('AUDIO'),
      };
      continue;
    }

    // URI line following STREAM-INF
    if (!trimmed.startsWith('#') && pendingStreamInfo) {
      streams.push({
        ...pendingStreamInfo,
        uri: resolveUrl(trimmed, baseUrl),
      });
      pendingStreamInfo = null;
    }
  }

  // Separate streams into video and audio based on codecs
  // If CODECS has single codec, use parseCodecs to determine type
  const videoStreams: typeof streams = [];
  const audioOnlyStreams: typeof streams = [];

  for (const stream of streams) {
    if (!stream.codecs) {
      // No codecs - assume video (default behavior)
      videoStreams.push(stream);
      continue;
    }

    const parsedCodecs = parseCodecs(stream.codecs);
    const codecCount = stream.codecs.split(',').length;

    // Single codec - determine type from parseCodecs result
    if (codecCount === 1) {
      if (parsedCodecs.audio && !parsedCodecs.video) {
        // Audio-only stream
        audioOnlyStreams.push(stream);
      } else {
        // Video stream (or unknown - default to video)
        videoStreams.push(stream);
      }
    } else {
      // Multiple codecs - video stream with muxed audio
      videoStreams.push(stream);
    }
  }

  // Build PartiallyResolvedVideoTracks from video streams, de-duplicating the
  // HLS cross-product: one video rendition is listed across several
  // `EXT-X-STREAM-INF` entries — one per audio group it can pair with, all
  // sharing the same media-playlist URI. Collapse them to one track per URI,
  // accumulating every advertised audio group. (Redundant-stream renditions
  // live at *distinct* per-CDN URIs, so they stay separate — only the same-URI
  // cross-product merges.)
  const videoTracksByUrl = new Map<string, PartiallyResolvedVideoTrack>();

  for (const stream of videoStreams) {
    const existing = videoTracksByUrl.get(stream.uri);

    if (existing) {
      if (stream.audioGroupId && !existing.audioGroupIds?.includes(stream.audioGroupId)) {
        existing.audioGroupIds = [...(existing.audioGroupIds ?? []), stream.audioGroupId];
      }

      // BANDWIDTH is video + audio combined; the duplicates differ only in the
      // paired audio. Keep the lowest as the closest proxy to video-only, which
      // is what ABR should rank on.
      if (stream.bandwidth < existing.bandwidth) {
        existing.bandwidth = stream.bandwidth;
      }

      continue;
    }

    const codecs = stream.codecs ? parseCodecs(stream.codecs) : undefined;

    const track: PartiallyResolvedVideoTrack = {
      type: 'video' as const,
      id: generateId(),
      url: stream.uri,
      bandwidth: stream.bandwidth,
      // Type-specific defaults (CMAF video)
      mimeType: 'video/mp4',
      codecs: [],
    };

    if (stream.resolution?.width !== undefined) {
      track.width = stream.resolution.width;
    }

    if (stream.resolution?.height !== undefined) {
      track.height = stream.resolution.height;
    }

    if (codecs?.video) {
      // When the STREAM-INF lists an audio codec but declares no AUDIO group,
      // the audio is muxed into this rendition's segments — keep both codecs so
      // the SourceBuffer mimetype matches the muxed media (otherwise the muxed
      // audio fails to append: "audio object type does not match the mimetype").
      // With an AUDIO group the audio is a separate rendition, so only the video
      // codec belongs here.
      track.codecs = codecs.audio && !stream.audioGroupId ? [codecs.video, codecs.audio] : [codecs.video];
    }

    if (stream.frameRate) {
      track.frameRate = stream.frameRate;
    }

    if (stream.audioGroupId) {
      track.audioGroupIds = [stream.audioGroupId];
    }

    videoTracksByUrl.set(stream.uri, track);
  }

  const videoTracks: PartiallyResolvedVideoTrack[] = [...videoTracksByUrl.values()];

  // Build PartiallyResolvedAudioTracks from audio-only streams
  const audioOnlyTracks: PartiallyResolvedAudioTrack[] = audioOnlyStreams.map((stream) => {
    const codecs = stream.codecs ? parseCodecs(stream.codecs) : undefined;

    const track: PartiallyResolvedAudioTrack = {
      type: 'audio' as const,
      id: generateId(),
      url: stream.uri,
      bandwidth: stream.bandwidth,
      mimeType: 'audio/mp4',
      codecs: codecs?.audio ? [codecs.audio] : [],
      groupId: stream.audioGroupId || 'default',
      name: 'Default',
      sampleRate: 48000, // Default - will be in media playlist if available
      channels: 2, // Default - will be in media playlist if available
    };

    return track;
  });

  // Build PartiallyResolvedAudioTracks from audio renditions (EXT-X-MEDIA)
  // Extract audio codecs from referencing streams
  const audioRenditionTracks: PartiallyResolvedAudioTrack[] = audioRenditions.flatMap((rendition) => {
    let audioCodecs: string[] | undefined;

    for (const stream of streams) {
      if (stream.audioGroupId === rendition.groupId && stream.codecs) {
        const codecs = parseCodecs(stream.codecs);

        if (codecs.audio) {
          audioCodecs = [codecs.audio];
          break;
        }
      }
    }

    // A rendition with no URI names media carried in the streams referencing its
    // group. When such a stream is audio-only it is already a track of its own, so
    // the two describe one rendition: merge rather than add a second entry that has
    // nothing to fetch. The rendition holds the naming and selection metadata, the
    // stream the URL and bandwidth.
    if (!rendition.uri) {
      const carrier = audioOnlyTracks.find((track) => track.groupId === rendition.groupId);

      if (carrier) {
        carrier.name = rendition.name;

        if (rendition.language) carrier.language = rendition.language;

        if (rendition.channels) carrier.channels = rendition.channels;

        if (rendition.default) carrier.default = rendition.default;

        if (rendition.autoselect) carrier.autoselect = rendition.autoselect;

        return [];
      }
    }

    const track: PartiallyResolvedAudioTrack = {
      type: 'audio' as const,
      id: generateId(),
      url: rendition.uri ?? '',
      groupId: rendition.groupId,
      name: rendition.name,
      // Type-specific defaults (CMAF audio)
      mimeType: 'audio/mp4',
      bandwidth: 0, // Not available in multivariant for demuxed audio
      sampleRate: 48000, // CMAF default
      channels: rendition.channels ?? 2, // From EXT-X-MEDIA CHANNELS; stereo default
      codecs: [],
    };

    if (rendition.language) {
      track.language = rendition.language;
    }

    if (audioCodecs) {
      track.codecs = audioCodecs;
    }

    if (rendition.default) {
      track.default = rendition.default;
    }

    if (rendition.autoselect) {
      track.autoselect = rendition.autoselect;
    }

    return [track];
  });

  // Combine audio tracks from both EXT-X-MEDIA renditions and audio-only STREAM-INF
  const audioTracks = [...audioRenditionTracks, ...audioOnlyTracks];

  // Build PartiallyResolvedTextTracks from subtitle renditions
  const textTracks: PartiallyResolvedTextTrack[] = subtitleRenditions.map((rendition) => {
    const track: PartiallyResolvedTextTrack = {
      type: 'text' as const,
      id: generateId(),
      url: rendition.uri,
      groupId: rendition.groupId,
      label: rendition.name,
      kind: 'subtitles' as const,
      // Type-specific defaults (VTT)
      mimeType: 'text/vtt',
      bandwidth: 0, // Text tracks don't consume bandwidth
    };

    if (rendition.language) {
      track.language = rendition.language;
    }

    // Match hls.js/http-streaming: only set default=true when BOTH DEFAULT=YES AND AUTOSELECT=YES
    if (rendition.default && rendition.autoselect) {
      track.default = true;
    }

    if (rendition.autoselect) {
      track.autoselect = rendition.autoselect;
    }

    if (rendition.forced) {
      track.forced = rendition.forced;
    }

    return track;
  });

  // Build selection sets
  const selectionSets: SelectionSet[] = [];

  if (videoTracks.length > 0) {
    const videoSwitchingSet: VideoSwitchingSet = {
      id: generateId(),
      type: 'video',
      tracks: videoTracks,
    };

    const videoSelectionSet: VideoSelectionSet = {
      id: generateId(),
      type: 'video',
      switchingSets: [videoSwitchingSet],
    };

    selectionSets.push(videoSelectionSet);
  }

  if (audioTracks.length > 0) {
    const audioSwitchingSet: AudioSwitchingSet = {
      id: generateId(),
      type: 'audio',
      tracks: audioTracks,
    };

    const audioSelectionSet: AudioSelectionSet = {
      id: generateId(),
      type: 'audio',
      switchingSets: [audioSwitchingSet],
    };

    selectionSets.push(audioSelectionSet);
  }

  if (textTracks.length > 0) {
    const textSwitchingSet: TextSwitchingSet = {
      id: generateId(),
      type: 'text',
      tracks: textTracks,
    };

    const textSelectionSet: TextSelectionSet = {
      id: generateId(),
      type: 'text',
      switchingSets: [textSwitchingSet],
    };

    selectionSets.push(textSelectionSet);
  }

  // Build presentation (duration is undefined until tracks are resolved)
  const presentation: Presentation = {
    id: generateId(),
    url: unresolved.url,
    startTime: 0,
    // duration: undefined, // Won't be known until after at least one media playlist is fetched + parsed
    selectionSets,
  };

  // Only a playlist that carries session data grows a metadata bag, so
  // everything else keeps its shape.
  if (sessionData.length > 0) {
    const metadata: MultivariantPlaylistMetadata = { sessionData };

    presentation.metadata = { [MULTIVARIANT_PLAYLIST_METADATA_KEY]: metadata };
  }

  return presentation;
}
