import { loadScript } from '@videojs/utils/dom';

export class InvalidStateError extends Error {}
export class NotSupportedError extends Error {}
export class NotFoundError extends Error {}

export const GOOGLE_CAST_FRAMEWORK_URL = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

const HLS_RESPONSE_HEADERS = ['application/x-mpegURL', 'application/vnd.apple.mpegurl', 'audio/mpegurl'];

export class IterableWeakSet<T extends WeakKey> {
  readonly #refs = new Set<WeakRef<T>>();
  readonly #seen = new WeakMap<T, WeakRef<T>>();

  add(value: T): this {
    if (this.#seen.has(value)) return this;

    const ref = new WeakRef(value);

    this.#seen.set(value, ref);
    this.#refs.add(ref);

    return this;
  }

  delete(value: T): boolean {
    const ref = this.#seen.get(value);
    if (!ref) return false;

    this.#seen.delete(value);

    return this.#refs.delete(ref);
  }

  forEach(fn: (value: T) => void): void {
    for (const ref of this.#refs) {
      const value = ref.deref();

      if (value) fn(value);
      else this.#refs.delete(ref);
    }
  }
}

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

export function currentMedia() {
  return currentSession()?.getSessionObj().media[0] ?? undefined;
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

export type CastOptions = cast.framework.CastOptions;

export function setCastOptions(options: Partial<CastOptions>) {
  getCastContext()!.setOptions({
    ...getDefaultCastOptions(),
    ...options,
  });
}

export function getDefaultCastOptions(): CastOptions {
  return {
    receiverApplicationId: 'CC1AD845',
    autoJoinPolicy:
      globalThis.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED ?? ('origin_scoped' as chrome.cast.AutoJoinPolicy),
    androidReceiverCompatible: false,
    language: 'en-US',
    resumeSavedSession: true,
  };
}

function getFormat(segment: string | undefined) {
  if (!segment) return undefined;

  const regex = /\.([a-zA-Z0-9]+)(?:\?.*)?$/;
  const match = segment.match(regex);

  return match ? match[1] : null;
}

function parseAudioRenditionUrl(playlistContent: string) {
  for (const line of playlistContent.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXT-X-MEDIA') && /TYPE=AUDIO/i.test(trimmed)) {
      const match = trimmed.match(/URI="([^"]+)"/i);
      if (match) return match[1];
    }
  }

  return undefined;
}

function parsePlaylistUrls(playlistContent: string) {
  const lines = playlistContent.split('\n');
  const urls: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();

    if (line.startsWith('#EXT-X-STREAM-INF')) {
      const nextLine = lines[i + 1] ? lines[i + 1]!.trim() : '';

      if (nextLine && !nextLine.startsWith('#')) {
        urls.push(nextLine);
      }
    }
  }

  return urls;
}

function parseSegment(playlistContent: string) {
  const lines = playlistContent.split('\n');

  return lines.find((line) => !line.trim().startsWith('#') && line.trim() !== '')?.trim();
}

export async function isHls(url: string) {
  if (!url) return false;

  if (/\.m3u8?(\?.*)?$/i.test(url)) return true;

  if (url.startsWith('blob:')) return false;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');
    if (!contentType) return false;

    const normalizedContentType = contentType.toLowerCase().split(';')[0]!.trim();

    return HLS_RESPONSE_HEADERS.some((header) => normalizedContentType === header.toLowerCase());
  } catch (err) {
    console.error('Error while trying to get the Content-Type of the manifest', err);
    return false;
  }
}

interface PlaylistSegmentFormat {
  videoFormat: string | null | undefined;
  audioFormat: string | null | undefined;
}

/**
 * Reads the segment file extensions of the first video variant and, when the multivariant playlist declares one, the
 * first audio rendition. Audio falls back to the video format when it is muxed or its playlist can't be read.
 */
export async function getPlaylistSegmentFormat(url: string): Promise<PlaylistSegmentFormat> {
  if (!url || url.startsWith('blob:')) return { videoFormat: undefined, audioFormat: undefined };

  try {
    const mainManifestContent = await (await fetch(url)).text();
    let videoChunksContent = mainManifestContent;

    const playlists = parsePlaylistUrls(mainManifestContent);

    if (playlists.length > 0) {
      const chosenPlaylistUrl = new URL(playlists[0]!, url).toString();

      videoChunksContent = await (await fetch(chosenPlaylistUrl)).text();
    }

    const videoFormat = getFormat(parseSegment(videoChunksContent));
    const audioRenditionPath = parseAudioRenditionUrl(mainManifestContent);
    let audioFormat = videoFormat;

    if (audioRenditionPath) {
      try {
        const audioPlaylistUrl = new URL(audioRenditionPath, url).toString();
        const audioChunksContent = await (await fetch(audioPlaylistUrl)).text();

        audioFormat = getFormat(parseSegment(audioChunksContent)) ?? videoFormat;
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
