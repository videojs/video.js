import type {
  MediaTextCue,
  MediaTextTrack,
  MediaTextTrackCapability,
  MediaTextTrackState,
  MediaThumbnailsTrack,
  TextTrackLike,
} from '@videojs/media';
import { isMediaSeekCapable, isMediaSourceCapable, isMediaTextTrackCapable, toMediaCrossOrigin } from '@videojs/media';
import { findTrackElement, getCaptionOrSubtitleTracks, isCaptionOrSubtitleTrack, listen } from '@videojs/utils/dom';
import { isNull } from '@videojs/utils/predicate';

import { DEFAULT_LOCALE, findLocaleKeys, getLocaleKey } from '../../../core/i18n';
import { definePlayerFeature } from '../../feature';
import { getAppTextTracks, listenForAppTextTracks } from '../app-text-tracks';
import { toMediaTextCues } from '../text-cues';
import { getTextTrackId, listenForTrackLoads, toMediaTextTrack } from '../text-tracks';

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

export const textTrackFeature = definePlayerFeature({
  name: 'textTrack',
  state: ({ target }): MediaTextTrackState => {
    // The track the user last had showing. Remembered so `toggleSubtitles()`
    // restores that one selection instead of enabling every language at once.
    let lastShownId: string | null = null;

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
    };
  },

  attach({ target, signal, get, set }) {
    const { media } = target;

    if (!isMediaTextTrackCapable(media)) {
      // Media without text tracks of its own, such as an embed, still lists the tracks apps add.
      const syncAppTracks = () => set({ textTrackList: getAppTextTracks(get()).map(({ track }) => track) });

      syncAppTracks();
      listenForAppTextTracks(get(), syncAppTracks, signal);
      return;
    }

    let trackCleanup: AbortController | null = null;

    const sync = () => {
      trackCleanup?.abort();
      trackCleanup = new AbortController();

      let chaptersTrack: TextTrackLike | null = null;
      let thumbnailsTextTrack: TextTrackLike | null = null;
      const textTrackList: MediaTextTrack[] = [];
      let subtitlesShowing = false;

      for (let i = 0; i < media.textTracks.length; i++) {
        const track = media.textTracks[i]!;

        if (!chaptersTrack && track.kind === 'chapters') chaptersTrack = track;

        if (!thumbnailsTextTrack && track.kind === 'metadata' && track.label === 'thumbnails') {
          thumbnailsTextTrack = track;
        }

        textTrackList.push(toMediaTextTrack(track, i));

        if (isCaptionOrSubtitleTrack(track) && track.mode === 'showing') {
          subtitlesShowing = true;
        }
      }

      const appTracks = getAppTextTracks(get());

      for (const { track } of appTracks) textTrackList.push(track);

      // The last chapter of an in-stream chapters document is open-ended on the
      // track; consumers read it ending where the media does. Chapters an app
      // added stand in when the media has none.
      const chaptersCues = chaptersTrack
        ? toMediaTextCues(chaptersTrack.cues, {
            kind: 'chapters',
            duration: isMediaSeekCapable(media) ? media.duration : NaN,
          })
        : (appTracks.find(({ track }) => track.kind === 'chapters')?.cues ?? []);

      let thumbnailsTrack: MediaThumbnailsTrack | null = null;

      if (thumbnailsTextTrack) {
        thumbnailsTrack = {
          // VTTCue extends TextTrackCue with `text` — cast via `unknown` since
          // the CueList is typed as TextTrackCue which doesn't expose `text`.
          cues: thumbnailsTextTrack.cues ? (Array.from(thumbnailsTextTrack.cues) as unknown as MediaTextCue[]) : [],
          src: findTrackElement(media, thumbnailsTextTrack)?.src ?? null,
          // Read the host rather than any inner native element: for a media
          // component the attribute lives on the host and is forwarded inward.
          crossOrigin: isMediaSourceCapable(media) ? toMediaCrossOrigin(media.crossOrigin) : null,
        };
      }

      listenForTrackLoads(media, sync, trackCleanup.signal);

      set({
        textTrackList,
        subtitlesShowing,
        chaptersCues,
        thumbnailsTrack,
      });
    };

    sync();
    listenForAppTextTracks(get(), sync, signal);

    const textTracks = media.textTracks;

    if (textTracks instanceof EventTarget) {
      listen(textTracks, 'addtrack', sync, { signal });
      listen(textTracks, 'removetrack', sync, { signal });
      listen(textTracks, 'change', sync, { signal });
    }

    listen(media, 'loadstart', sync, { signal });
    // The chapter clamp follows the media duration.
    listen(media, 'durationchange', sync, { signal });

    signal.addEventListener('abort', () => trackCleanup?.abort(), { once: true });
  },
});
