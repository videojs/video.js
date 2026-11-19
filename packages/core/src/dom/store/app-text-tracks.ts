import type { MediaTextCue, MediaTextTrack } from '@videojs/media';

import type { TextTrackLoad } from './load-text-track';

/** Private store state holding the tracks apps added. Owned by the text-track feature; the text cues feature reads them. */
export const APP_TEXT_TRACKS = Symbol('@videojs/app-text-tracks');

/** Private store state that notifies when the tracks apps added change, and keeps them across a detach. */
export const APP_TEXT_TRACKS_CHANGE = Symbol('@videojs/app-text-tracks-change');

/** A track an app added, as the store keeps it. */
export interface AppTextTrackRecord {
  track: MediaTextTrack;
  /** Ordered by start time. */
  cues: MediaTextCue[];
  /** The file the track's cues come from, kept once they load so URLs in them can be resolved against it. */
  src?: string | undefined;
  /** A file the track's cues still have to be loaded from. */
  load?: TextTrackLoad | undefined;
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
}

export interface AppTextTracksState {
  [APP_TEXT_TRACKS]: readonly AppTextTrackRecord[];
  [APP_TEXT_TRACKS_CHANGE]: AppTextTracksChange;
}

/** The tracks apps added, from store state that may not include the text-track feature. */
export function getAppTextTracks(state: object): readonly AppTextTrackRecord[] {
  return (state as Partial<AppTextTracksState>)[APP_TEXT_TRACKS] ?? [];
}

/** Listen for changes to the tracks apps added, when the store has the text-track feature. */
export function listenForAppTextTracks(state: object, listener: () => void, signal: AbortSignal): void {
  const change = (state as Partial<AppTextTracksState>)[APP_TEXT_TRACKS_CHANGE];
  if (!change) return;

  const unsubscribe = change.subscribe(listener);

  signal.addEventListener('abort', unsubscribe, { once: true });
}

/** Each copy of an app track in the media, to the id of the app track it copies. */
const appTrackCopies = new WeakMap<object, string>();

/** Mark a media track as the copy of the app track with `id`, or unmark it given `null`. */
export function setAppTrackCopy(track: object, id: string | null): void {
  if (id) appTrackCopies.set(track, id);
  else appTrackCopies.delete(track);
}

/**
 * The id of the app track a media track copies, if it's a copy. Copies are told apart by identity, so a media track
 * that happens to share an app track's id is never taken for one.
 */
export function getAppTrackCopyId(track: object): string | undefined {
  return appTrackCopies.get(track);
}
