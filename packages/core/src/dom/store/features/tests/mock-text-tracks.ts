/**
 * Jsdom has no `VTTCue` and never populates `textTracks`, so tracks and cues are plain stand-ins. Tracks and the track
 * list are event targets so the feature's `cuechange` and `addtrack` listeners can be exercised.
 */

export interface MockCue {
  id?: string;
  startTime: number;
  endTime: number;
  text?: string;
  value?: unknown;
  type?: string;
}

export interface MockTrack extends EventTarget {
  id: string;
  kind: TextTrackKind;
  label: string;
  language: string;
  mode: TextTrackMode;
  cues: MockCue[] | null;
}

export function createTrack(
  kind: TextTrackKind,
  options: { mode?: TextTrackMode; label?: string; language?: string; id?: string; cues?: MockCue[] } = {}
): MockTrack {
  return Object.assign(new EventTarget(), {
    id: options.id ?? '',
    kind,
    label: options.label ?? '',
    language: options.language ?? '',
    mode: options.mode ?? 'hidden',
    cues: options.cues ?? [],
  });
}

export function setTracks(video: HTMLVideoElement, tracks: MockTrack[]): EventTarget {
  const list = Object.assign(new EventTarget(), { length: tracks.length }, tracks);

  Object.defineProperty(video, 'textTracks', { configurable: true, value: list });

  return list;
}

export function setTime(video: HTMLVideoElement, currentTime: number, event = 'timeupdate'): void {
  Object.defineProperty(video, 'currentTime', { configurable: true, value: currentTime });
  video.dispatchEvent(new Event(event));
}

export function setSrc(video: HTMLVideoElement, src: string): void {
  Object.defineProperty(video, 'currentSrc', { configurable: true, value: src });
  video.dispatchEvent(new Event('loadstart'));
}
