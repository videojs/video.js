import type { MediaTextCue, MediaTextTrack } from '@videojs/media';

/** Private store state holding the tracks apps added. Owned by the text cues feature; the text-track feature lists them. */
export const APP_TEXT_TRACKS = Symbol('@videojs/app-text-tracks');

/** Private store state that notifies when the tracks apps added change, and keeps them across a detach. */
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
  /** Call after every change to the tracks, so listeners and the copy below follow it. */
  notify(): void;
  /**
   * The tracks as of the last change. The store resets its state on every detach, which also happens when only the
   * container or an extension changes; this copy survives, so attaching again can bring the tracks back.
   */
  records: readonly AppTextTrackRecord[];
  /** The media the tracks were last attached with, as `getRegisteredMedia()` resolves it. */
  media: unknown;
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
