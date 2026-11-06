import {
  audioDecoderConfigFromTrack,
  findReplacementTrack,
  groupMsfTracks,
  type MsfCatalog,
  type MsfCatalogTrack,
} from '@caprid/moq-media';

/** A video track and the decoder config it plays with. */
export interface VideoChoice {
  readonly track: MsfCatalogTrack;
  readonly config: VideoDecoderConfig;
}

/** An audio track and the decoder config it plays with. */
export interface AudioChoice {
  readonly track: MsfCatalogTrack;
  readonly config: AudioDecoderConfig;
}

/**
 * What one element plays from a catalog: the video alternates of the first render group that has video, which are its
 * renditions, and that group's audio, if any.
 */
export interface Presentation {
  readonly video: readonly [VideoChoice, ...VideoChoice[]];
  readonly audio: AudioChoice | undefined;
}

/** The presentation a catalog offers, or `undefined` when it lists no video track a decoder can be configured for. */
export function choosePresentation(catalog: MsfCatalog): Presentation | undefined {
  const sets = groupMsfTracks(catalog.tracks);

  for (const set of sets) {
    const [first, ...rest] = set.tracks.flatMap(toVideoChoice);
    if (!first) continue;

    const audio = sets
      .filter((other) => other.renderGroup === set.renderGroup)
      .flatMap((other) => other.tracks.flatMap(toAudioChoice))[0];

    return { video: [first, ...rest], audio };
  }

  return undefined;
}

function toVideoChoice(track: MsfCatalogTrack): VideoChoice[] {
  if (track.role !== 'video' || !track.codec) return [];

  const config: VideoDecoderConfig = {
    codec: track.codec,
    optimizeForLatency: true,
    ...(track.initData ? { description: track.initData } : {}),
    ...(track.width ? { codedWidth: track.width } : {}),
    ...(track.height ? { codedHeight: track.height } : {}),
  };

  return [{ track, config }];
}

function toAudioChoice(track: MsfCatalogTrack): AudioChoice[] {
  if (track.role !== 'audio' || !track.codec) return [];

  try {
    return [{ track, config: audioDecoderConfigFromTrack(track) }];
  } catch {
    // A channel layout that is not a channel count; the broadcast still plays without its audio.
    return [];
  }
}

/** The smallest rendition at least `height` pixels tall, else the tallest. */
export function pickAutoVideo(video: Presentation['video'], height: number): VideoChoice {
  const byHeight = [...video].sort((a, b) => (a.track.height ?? 0) - (b.track.height ?? 0));

  return byHeight.find((choice) => (choice.track.height ?? 0) >= height) ?? byHeight.at(-1)!;
}

/**
 * Where a track of an older catalog went in a newer one: the same track, or the one the publisher listed in its place.
 * `undefined` when it was removed.
 */
export function findVideo(
  presentation: Presentation,
  catalog: MsfCatalog,
  track: MsfCatalogTrack
): VideoChoice | undefined {
  const name = presentation.video.some((choice) => choice.track.name === track.name)
    ? track.name
    : findReplacementTrack(track, catalog.tracks)?.name;

  return presentation.video.find((choice) => choice.track.name === name);
}

/** Whether two catalog entries decode with the same config. */
export function sameDecoding(a: MsfCatalogTrack, b: MsfCatalogTrack): boolean {
  return (
    a.name === b.name &&
    a.codec === b.codec &&
    a.width === b.width &&
    a.height === b.height &&
    a.samplerate === b.samplerate &&
    a.channelConfig === b.channelConfig &&
    sameBytes(a.initData, b.initData)
  );
}

function sameBytes(a: Uint8Array | undefined, b: Uint8Array | undefined): boolean {
  if (!a || !b) return a === b;

  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}
