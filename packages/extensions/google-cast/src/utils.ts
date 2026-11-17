import { loadScript } from '@videojs/utils/dom';

export class InvalidStateError extends Error {}
export class NotSupportedError extends Error {}
export class NotFoundError extends Error {}

export const GOOGLE_CAST_FRAMEWORK_URL = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

const HLS_CONTENT_TYPES = ['application/x-mpegurl', 'application/vnd.apple.mpegurl', 'audio/mpegurl'];

export function onCastApiAvailable(callback: () => void) {
  const whenDefined = () => customElements.whenDefined('google-cast-button').then(callback);

  if (!globalThis.chrome?.cast?.isAvailable) {
    (globalThis as { __onGCastApiAvailable?: () => void }).__onGCastApiAvailable = whenDefined;
  } else if (typeof cast === 'undefined' || !cast.framework) {
    whenDefined();
  } else {
    callback();
  }
}

export function requiresCastFramework() {
  // todo: exclude for Android>=56 which supports the Remote Playback API natively.
  return Boolean(globalThis.chrome);
}

export async function loadCastFramework() {
  if (globalThis.chrome?.cast) return;

  await loadScript(GOOGLE_CAST_FRAMEWORK_URL);
}

export function getCastContext() {
  return typeof cast === 'undefined' ? undefined : cast.framework?.CastContext.getInstance();
}

export function currentSession() {
  return getCastContext()?.getCurrentSession();
}

/**
 * The session's current media. A session can list several, idle ones included, so this is the first one still active,
 * as the SDK picks it. Once all are idle, such as after the media ended, the latest stands in so its idle reason can
 * still be read.
 */
export function currentMedia() {
  const session = currentSession();

  return session?.getMediaSession() ?? session?.getSessionObj().media.at(-1) ?? undefined;
}

export function editTracksInfo(request: chrome.cast.media.EditTracksInfoRequest) {
  return new Promise<void>((resolve, reject) => {
    currentMedia()!.editTracksInfo(request, resolve, reject);
  });
}

export function getMediaStatus(request: chrome.cast.media.GetStatusRequest) {
  return new Promise<void>((resolve, reject) => {
    currentMedia()!.getStatus(request, resolve, reject);
  });
}

const MEDIA_NAMESPACE = 'urn:x-cast:com.google.cast.media';
let requestId = 0;

export function setPlaybackRate(rate: number) {
  const media = currentMedia();

  return currentSession()!.sendMessage(MEDIA_NAMESPACE, {
    type: 'SET_PLAYBACK_RATE',
    playbackRate: rate,
    mediaSessionId: media?.mediaSessionId,
    requestId: ++requestId,
  });
}

export function setCastOptions(options: Partial<cast.framework.CastOptions>) {
  getCastContext()!.setOptions({
    receiverApplicationId: 'CC1AD845',
    autoJoinPolicy:
      globalThis.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED ?? ('origin_scoped' as chrome.cast.AutoJoinPolicy),
    androidReceiverCompatible: false,
    language: 'en-US',
    resumeSavedSession: true,
    ...options,
  });
}

/** The first URI a playlist lists: a variant playlist in a multivariant playlist, otherwise a segment. */
function getFirstUri(playlist: string) {
  return playlist
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'));
}

/** The URI of a multivariant playlist's first audio rendition. */
function getAudioRenditionUri(playlist: string) {
  for (const line of playlist.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXT-X-MEDIA') && /TYPE=AUDIO/i.test(trimmed)) {
      const uri = trimmed.match(/URI="([^"]+)"/i)?.[1];
      if (uri) return uri;
    }
  }

  return undefined;
}

/** The file extension of the first segment a media playlist lists, such as `ts` or `m4s`. */
function getSegmentFormat(playlist: string) {
  return getFirstUri(playlist)?.match(/\.(\w+)(?:\?.*)?$/)?.[1];
}

async function fetchText(url: string | URL) {
  return (await fetch(url)).text();
}

export async function isHls(url: string) {
  if (!url) return false;

  if (/\.m3u8?(\?.*)?$/i.test(url)) return true;

  if (url.startsWith('blob:')) return false;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');
    if (!contentType) return false;

    return HLS_CONTENT_TYPES.includes(contentType.toLowerCase().split(';')[0]!.trim());
  } catch (err) {
    console.error('Error while trying to get the Content-Type of the manifest', err);
    return false;
  }
}

interface PlaylistSegmentFormat {
  videoFormat: string | undefined;
  audioFormat: string | undefined;
}

/**
 * Reads the segment file extensions of the first video variant and, when the multivariant playlist declares one, the
 * first audio rendition. Audio falls back to the video format when it is muxed or its playlist can't be read.
 */
export async function getPlaylistSegmentFormat(url: string): Promise<PlaylistSegmentFormat> {
  if (!url || url.startsWith('blob:')) return { videoFormat: undefined, audioFormat: undefined };

  try {
    const playlist = await fetchText(url);
    const variantUri = playlist.includes('#EXT-X-STREAM-INF') ? getFirstUri(playlist) : undefined;
    const videoFormat = getSegmentFormat(variantUri ? await fetchText(new URL(variantUri, url)) : playlist);

    const audioUri = getAudioRenditionUri(playlist);
    let audioFormat = videoFormat;

    if (audioUri) {
      try {
        audioFormat = getSegmentFormat(await fetchText(new URL(audioUri, url))) ?? videoFormat;
      } catch (err) {
        console.error('Error while trying to parse the audio rendition playlist', err);
      }
    }

    return { videoFormat, audioFormat };
  } catch (err) {
    console.error('Error while trying to parse the manifest playlist', err);
    return { videoFormat: undefined, audioFormat: undefined };
  }
}
