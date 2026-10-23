import type { MediaTextCue, MediaTextTrack } from '@videojs/media';

/** Private store state holding the tracks apps added. Owned by the text cues feature; the text-track feature lists them. */
export const APP_TEXT_TRACKS = Symbol('@videojs/app-text-tracks');

/** Private store state that notifies when the tracks apps added change. Survives a detach, like the feature's actions. */
export const APP_TEXT_TRACKS_CHANGE = Symbol('@videojs/app-text-tracks-change');

/** A track an app added, as the store keeps it. */
export interface AppTextTrackRecord {
  track: MediaTextTrack;
  /** Ordered by start time. */
  cues: MediaTextCue[];
  /** The source the track belongs to, or `null` until the first source loads. */
  src: string | null;
}

export interface AppTextTracksChange {
  subscribe(listener: () => void): () => void;
  notify(): void;
}

export interface AppTextTracksState {
  [APP_TEXT_TRACKS]: readonly AppTextTrackRecord[];
  [APP_TEXT_TRACKS_CHANGE]: AppTextTracksChange;
}

/** The tracks apps added, from store state that may not include the text cues feature. */
export function getAppTextTracks(state: object): readonly AppTextTrackRecord[] {
  return (state as Partial<AppTextTracksState>)[APP_TEXT_TRACKS] ?? [];
}

/** Listen for changes to the tracks apps added, when the store has the text cues feature. */
export function listenForAppTextTracks(state: object, listener: () => void, signal: AbortSignal): void {
  const change = (state as Partial<AppTextTracksState>)[APP_TEXT_TRACKS_CHANGE];
  if (!change) return;

  const unsubscribe = change.subscribe(listener);

  signal.addEventListener('abort', unsubscribe, { once: true });
}
