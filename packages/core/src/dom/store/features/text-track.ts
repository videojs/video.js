import type {
  MediaTextCue,
  MediaTextTrack,
  MediaTextTrackCapability,
  MediaTextTrackState,
  MediaThumbnailsTrack,
  TextTrackLike,
  VTTCueLike,
} from '@videojs/media';
import {
  getRegisteredMedia,
  isMediaSeekCapable,
  isMediaSourceCapable,
  isMediaTextTrackCapable,
  toMediaCrossOrigin,
} from '@videojs/media';
import { createTextTrack, type TextTrackHandle } from '@videojs/media/dom';
import { findTrackElement, getCaptionOrSubtitleTracks, isCaptionOrSubtitleTrack, listen } from '@videojs/utils/dom';
import { isAbortError, isNull, isUndefined } from '@videojs/utils/predicate';

import { DEFAULT_LOCALE, findLocaleKeys, getLocaleKey } from '../../../core/i18n';
import {
  type AddTextTrack,
  type AppTextTrack,
  type TextCueInit,
  type TextTrackContent,
  type TextTrackInit,
  toAppCue,
} from '../../../core/text-track/app';
import { definePlayerFeature } from '../../feature';
import {
  APP_TEXT_TRACKS,
  APP_TEXT_TRACKS_CHANGE,
  type AppTextTrackRecord,
  type AppTextTracksChange,
  type AppTextTracksState,
  getAppTextTracks,
} from '../app-text-tracks';
import { loadTextTrackCues } from '../load-text-track';
import { fillChapterEnds, sortCues, toMediaTextCues } from '../text-cues';
import { getTextTrackId, listenForTrackLoads, toMediaTextTrack } from '../text-tracks';

const CURRENT_SRC = Symbol('@videojs/text-track-current-src');

interface TextTrackSourceState extends MediaTextTrackState, AppTextTracksState {
  /**
   * Add a text track from the app. It works on any media, sits next to the media's tracks in `textTrackList`, and its
   * cues are read like theirs. It belongs to the source playing when it's added, or the first one if there's none yet,
   * and is cleared when the source changes or the media is swapped.
   */
  addTextTrack: AddTextTrack;
  /** Remove a track the app added. Tracks from the media stay. */
  removeTextTrack(id: string): void;
  /** The media's current source as the feature last saw it, or `null` before one loads. */
  [CURRENT_SRC]: string | null;
}

/** The modes of app caption copies when the store last detached, so a re-attach can restore them. */
const savedCopyModes = new WeakMap<AppTextTracksChange, Map<string, TextTrackLike['mode']>>();

interface IdentifiedTrack {
  id: string;
  kind: string;
  track: TextTrackLike;
}

/** Caption/subtitle tracks paired with the ids exposed through `textTrackList`, in captions menu order. */
function getSubtitlesTracks(media: MediaTextTrackCapability): IdentifiedTrack[] {
  return getCaptionOrSubtitleTracks(
    Array.from(media.textTracks, (track, index) => ({ id: getTextTrackId(track, index), kind: track.kind, track }))
  );
}

/** Show at most one caption/subtitle track; passing `null` disables them all. */
function showOnly(tracks: IdentifiedTrack[], active: TextTrackLike | null): void {
  for (const { track } of tracks) {
    const mode = track === active ? 'showing' : 'disabled';

    if (track.mode !== mode) track.mode = mode;
  }
}

function findLocaleTrack(tracks: IdentifiedTrack[], locale: string): IdentifiedTrack | undefined {
  const localeKey = getLocaleKey(locale);
  const keys = findLocaleKeys(locale);

  // Translation lookup falls back to English; caption selection should not.
  if (localeKey !== DEFAULT_LOCALE && !localeKey.startsWith(`${DEFAULT_LOCALE}-`)) keys.pop();

  for (const key of keys) {
    const exact = tracks.find(({ track }) => getLocaleKey(track.language) === key);
    if (exact) return exact;

    const regional = tracks.find(({ track }) => getLocaleKey(track.language).startsWith(`${key}-`));
    if (regional) return regional;
  }

  return undefined;
}

/**
 * Lists the media's text tracks and the tracks apps add, selects captions, and holds the chapters and thumbnails
 * tracks. App tracks live in the store, so they work on any media; app captions and subtitles are also copied into the
 * media so the browser can draw them. The text cues feature reads the cues of both.
 */
export const textTrackFeature = definePlayerFeature({
  name: 'textTrack',
  state: ({ target, get, set }): TextTrackSourceState => {
    // The track the user last had showing. Remembered so `toggleSubtitles()`
    // restores that one selection instead of enabling every language at once.
    let lastShownId: string | null = null;
    let trackCount = 0;

    const appListeners = new Set<() => void>();

    // The tracks apps added, kept outside store state so a detach doesn't drop them. Actions work from this copy.
    const appTracks: AppTextTracksChange = {
      records: [],
      media: undefined,
      subscribe(listener) {
        appListeners.add(listener);

        return () => appListeners.delete(listener);
      },
      notify() {
        appTracks.records = getAppTextTracks(get());

        for (const listener of [...appListeners]) listener();
      },
    };

    const setRecords = (records: readonly AppTextTrackRecord[]) => {
      set({ [APP_TEXT_TRACKS]: records });
      appTracks.notify();
    };

    const updateRecord = (id: string, update: (record: AppTextTrackRecord) => AppTextTrackRecord) => {
      const records = appTracks.records;
      if (!records.some((record) => record.track.id === id)) return;

      setRecords(records.map((record) => (record.track.id === id ? update(record) : record)));
    };

    const removeTextTrack = (id: string) => {
      const records = appTracks.records;
      const next = records.filter((record) => record.track.id !== id);

      if (next.length !== records.length) setRecords(next);
    };

    const addTextTrack = (init: TextTrackInit, content?: TextTrackContent): AppTextTrack => {
      const id = `app-text-track-${++trackCount}`;
      let cueCount = 0;

      const toCue = (cue: TextCueInit) => toAppCue(cue, `${id}-cue-${cueCount++}`);

      const record: AppTextTrackRecord = {
        track: {
          id,
          kind: init.kind,
          label: init.label ?? '',
          language: init.language ?? '',
          mode: 'hidden',
          source: 'app',
        },
        cues: sortCues((content?.cues ?? init.cues ?? []).map(toCue)),
        mediaSrc: get()[CURRENT_SRC] as string | null,
      };

      const src = content?.src ?? init.src;

      // Loading waits for the store to attach, which only happens on the client.
      if (src) record.load = { src, format: content?.format ?? init.format };

      setRecords([...appTracks.records, record]);

      return {
        id,
        get removed() {
          return !appTracks.records.some((entry) => entry.track.id === id);
        },
        addCue(cue) {
          updateRecord(id, (current) => ({ ...current, cues: sortCues([...current.cues, toCue(cue)]) }));
        },
        removeCue(cueId) {
          updateRecord(id, (current) => ({ ...current, cues: current.cues.filter((cue) => cue.id !== cueId) }));
        },
        remove() {
          removeTextTrack(id);
        },
      };
    };

    return {
      textTrackList: [],
      subtitlesShowing: false,
      toggleSubtitles(forceShow?: boolean) {
        const { media } = target();
        if (!isMediaTextTrackCapable(media)) return false;

        const subtitlesTracks = getSubtitlesTracks(media);
        if (!subtitlesTracks.length) return false;

        const showing = subtitlesTracks.find(({ track }) => track.mode === 'showing');
        const nextShowing = forceShow ?? !showing;

        if (showing) lastShownId = showing.id;

        if (!nextShowing) {
          showOnly(subtitlesTracks, null);
          return false;
        }

        // Restore the remembered track, then prefer the browser locale before
        // falling back to the first track the captions menu offers.
        const next =
          showing ??
          subtitlesTracks.find(({ id }) => id === lastShownId) ??
          findLocaleTrack(subtitlesTracks, globalThis.navigator?.language ?? '') ??
          subtitlesTracks[0]!;

        lastShownId = next.id;
        showOnly(subtitlesTracks, next.track);

        return true;
      },
      selectSubtitlesTrack(id: string | null) {
        const { media } = target();
        if (!isMediaTextTrackCapable(media)) return;

        const subtitlesTracks = getSubtitlesTracks(media);
        if (!subtitlesTracks.length) return;

        if (isNull(id)) {
          const showing = subtitlesTracks.find(({ track }) => track.mode === 'showing');

          if (showing) lastShownId = showing.id;

          showOnly(subtitlesTracks, null);
          return;
        }

        const active = subtitlesTracks.find((entry) => entry.id === id);
        if (!active) return;

        lastShownId = active.id;
        showOnly(subtitlesTracks, active.track);
      },
      chaptersCues: [],
      thumbnailsTrack: null,
      // SAFETY: the implementation accepts both overloads; a definition is a track description without cues.
      addTextTrack: addTextTrack as AddTextTrack,
      removeTextTrack,
      [APP_TEXT_TRACKS]: [],
      [APP_TEXT_TRACKS_CHANGE]: appTracks,
      [CURRENT_SRC]: null,
    };
  },

  attach({ target, signal, get, set }) {
    const { media } = target;
    const textTracks = isMediaTextTrackCapable(media) ? media : null;

    // The store reset on detach, so bring back the app tracks it held. A container change or an extension re-attaches
    // to the same media and keeps them; other media drop the tracks that belonged to the last one's source.
    const appTracks = get()[APP_TEXT_TRACKS_CHANGE];
    const registeredMedia = getRegisteredMedia(media);

    if (!isUndefined(appTracks.media) && appTracks.media !== registeredMedia) {
      appTracks.records = appTracks.records.filter((record) => record.mediaSrc === null);
    }

    appTracks.media = registeredMedia;
    set({ [APP_TEXT_TRACKS]: appTracks.records });
    appTracks.notify();

    // App tracks added before any source adopt the first one; tracks from an earlier source go with it.
    const syncSource = () => {
      const src = (isMediaSourceCapable(media) && media.currentSrc) || null;

      set({ [CURRENT_SRC]: src });

      if (!src) return;

      const records = get()[APP_TEXT_TRACKS];
      const next = records.flatMap((record) => {
        if (record.mediaSrc === src) return [record];

        if (record.mediaSrc === null) return [{ ...record, mediaSrc: src }];

        return [];
      });

      const changed = next.length !== records.length || next.some((record, index) => record !== records[index]);

      if (changed) {
        set({ [APP_TEXT_TRACKS]: next });
        appTracks.notify();
      }
    };

    // The browser only draws captions and subtitles on tracks the media holds, including in iOS fullscreen where the
    // player's UI isn't shown, so app captions are copied into the media. A copy takes its app track's id, so the
    // captions menu selects the app track by showing its copy.
    const copies = new Map<string, { handle: TextTrackHandle; written: Map<MediaTextCue, VTTCueLike> }>();

    const syncCopies = () => {
      if (!textTracks) return;

      const records = get()[APP_TEXT_TRACKS].filter(({ track }) => isCaptionOrSubtitleTrack(track));
      const ids = new Set(records.map(({ track }) => track.id));

      for (const [id, copy] of copies) {
        if (ids.has(id)) continue;

        copy.handle.remove();
        copies.delete(id);
      }

      for (const { track, cues } of records) {
        let copy = copies.get(track.id);

        if (!copy) {
          const { id, kind, label, language } = track;
          // A re-attach recreates copies; one that was showing keeps showing.
          const mode = savedCopyModes.get(appTracks)?.get(id) ?? 'disabled';
          const handle = createTextTrack(textTracks, { id, kind, label, language, mode });
          if (!handle) continue;

          copy = { handle, written: new Map() };
          copies.set(id, copy);
        }

        const current = new Set(cues);

        for (const [cue, written] of copy.written) {
          if (current.has(cue)) continue;

          copy.handle.removeCue(written);
          copy.written.delete(cue);
        }

        for (const cue of cues) {
          if (copy.written.has(cue)) continue;

          const written = { id: cue.id, startTime: cue.startTime, endTime: cue.endTime, text: cue.text };

          copy.handle.addCue(written);
          copy.written.set(cue, written);
        }
      }
    };

    // App tracks with a `src` load once per attach; a track removed meanwhile drops what loaded.
    const loading = new Set<string>();

    const loadAppCues = () => {
      for (const { track, load } of get()[APP_TEXT_TRACKS]) {
        if (!load || loading.has(track.id)) continue;

        loading.add(track.id);

        loadTextTrackCues(load, track, signal)
          .then((cues) =>
            updateAppTrack(track.id, (record) => ({ ...record, cues: sortCues([...record.cues, ...cues]) }))
          )
          .catch((error: unknown) => {
            if (isAbortError(error)) return;

            // A track that fails to load keeps the cues it has; it never fails the player.
            if (__DEV__) console.warn(error);

            updateAppTrack(track.id, (record) => record);
          })
          .finally(() => loading.delete(track.id));
      }
    };

    const updateAppTrack = (id: string, update: (record: AppTextTrackRecord) => AppTextTrackRecord) => {
      if (signal.aborted) return;

      const records = get()[APP_TEXT_TRACKS];
      if (!records.some((record) => record.track.id === id)) return;

      set({
        [APP_TEXT_TRACKS]: records.map((record) =>
          record.track.id === id ? { ...update(record), load: undefined } : record
        ),
      });
      appTracks.notify();
    };

    let trackCleanup: AbortController | null = null;

    const sync = () => {
      const appRecords = get()[APP_TEXT_TRACKS];

      if (!textTracks) {
        // Media without text tracks of its own, such as an embed, still lists the tracks apps add.
        set({ textTrackList: appRecords.map(({ track }) => track) });
        return;
      }

      trackCleanup?.abort();
      trackCleanup = new AbortController();

      let chaptersTrack: TextTrackLike | null = null;
      let thumbnailsTextTrack: TextTrackLike | null = null;
      const textTrackList: MediaTextTrack[] = [];
      let subtitlesShowing = false;

      const appTrackIds = new Set(appRecords.map(({ track }) => track.id));
      // App captions are drawn through copies in the media that share their ids; the app track is listed in its copy's mode.
      const copyModes = new Map<string, TextTrackLike['mode']>();

      for (let i = 0; i < textTracks.textTracks.length; i++) {
        const track = textTracks.textTracks[i]!;
        const id = getTextTrackId(track, i);

        if (appTrackIds.has(id)) {
          copyModes.set(id, track.mode);

          if (isCaptionOrSubtitleTrack(track) && track.mode === 'showing') subtitlesShowing = true;

          continue;
        }

        if (!chaptersTrack && track.kind === 'chapters') chaptersTrack = track;

        if (!thumbnailsTextTrack && track.kind === 'metadata' && track.label === 'thumbnails') {
          thumbnailsTextTrack = track;
        }

        textTrackList.push(toMediaTextTrack(track, i));

        if (isCaptionOrSubtitleTrack(track) && track.mode === 'showing') {
          subtitlesShowing = true;
        }
      }

      for (const { track } of appRecords) {
        const mode = copyModes.get(track.id);

        textTrackList.push(mode && mode !== track.mode ? { ...track, mode } : track);
      }

      // The last chapter of an in-stream chapters document is open-ended on the
      // track; consumers read it ending where the media does. Chapters an app
      // added stand in when the media has none.
      const duration = isMediaSeekCapable(media) ? media.duration : NaN;
      const chaptersCues = chaptersTrack
        ? toMediaTextCues(chaptersTrack.cues, { kind: 'chapters', duration })
        : fillChapterEnds(appRecords.find(({ track }) => track.kind === 'chapters')?.cues ?? [], duration);

      let thumbnailsTrack: MediaThumbnailsTrack | null = null;

      if (thumbnailsTextTrack) {
        thumbnailsTrack = {
          // VTTCue extends TextTrackCue with `text` — cast via `unknown` since
          // the CueList is typed as TextTrackCue which doesn't expose `text`.
          cues: thumbnailsTextTrack.cues ? (Array.from(thumbnailsTextTrack.cues) as unknown as MediaTextCue[]) : [],
          src: findTrackElement(textTracks, thumbnailsTextTrack)?.src ?? null,
          // Read the host rather than any inner native element: for a media
          // component the attribute lives on the host and is forwarded inward.
          crossOrigin: isMediaSourceCapable(media) ? toMediaCrossOrigin(media.crossOrigin) : null,
        };
      }

      listenForTrackLoads(textTracks, sync, trackCleanup.signal);

      set({
        textTrackList,
        subtitlesShowing,
        chaptersCues,
        thumbnailsTrack,
      });
    };

    syncSource();
    syncCopies();
    sync();
    loadAppCues();

    const unsubscribeAppTracks = appTracks.subscribe(() => {
      syncCopies();
      sync();
      loadAppCues();
    });

    const trackList = textTracks?.textTracks;

    if (trackList instanceof EventTarget) {
      listen(trackList, 'addtrack', sync, { signal });
      listen(trackList, 'removetrack', sync, { signal });
      listen(trackList, 'change', sync, { signal });
    }

    listen(
      media,
      'loadstart',
      () => {
        syncSource();
        sync();
      },
      { signal }
    );
    // The chapter clamp follows the media duration.
    listen(media, 'durationchange', sync, { signal });

    signal.addEventListener(
      'abort',
      () => {
        unsubscribeAppTracks();
        trackCleanup?.abort();

        savedCopyModes.set(appTracks, new Map(Array.from(copies, ([id, { handle }]) => [id, handle.track.mode])));

        for (const { handle } of copies.values()) handle.remove();

        copies.clear();
      },
      { once: true }
    );
  },
});
