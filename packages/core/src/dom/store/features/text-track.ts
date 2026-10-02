import type {
  MediaTextCue,
  MediaTextTrack,
  MediaTextTrackCapability,
  MediaTextTrackState,
  MediaThumbnailsTrack,
  TextTrackLike,
} from '@videojs/media';
import {
  isMediaSeekCapable,
  isMediaSourceCapable,
  isMediaTextTrackCapable,
  isQuerySelectorAllCapable,
} from '@videojs/media';
import { findTrackElement, getCaptionOrSubtitleTracks, isCaptionOrSubtitleTrack, listen } from '@videojs/utils/dom';
import { isNil, isNull } from '@videojs/utils/predicate';

import { DEFAULT_LOCALE, findLocaleKeys, getLocaleKey } from '../../../core/i18n';
import { definePlayerFeature } from '../../feature';
import { clampCuesToDuration } from '../text-cues';

interface IdentifiedTrack {
  id: string;
  kind: string;
  track: TextTrackLike;
}

function getTrackId(track: TextTrackLike, index: number): string {
  return track.id || `track:${index}:${track.kind}:${track.language}:${track.label}`;
}

/** Caption/subtitle tracks paired with the ids exposed through `textTrackList`, in captions menu order. */
function getSubtitlesTracks(media: MediaTextTrackCapability): IdentifiedTrack[] {
  return getCaptionOrSubtitleTracks(
    Array.from(media.textTracks, (track, index) => ({ id: getTrackId(track, index), kind: track.kind, track }))
  );
}

/** Show at most one caption/subtitle track; passing `null` disables them all. */
function showOnly(tracks: IdentifiedTrack[], active: TextTrackLike | null): void {
  for (const { track } of tracks) {
    const mode = track === active ? 'showing' : 'disabled';

    if (track.mode !== mode) track.mode = mode;
  }
}

/**
 * Map a media element's `crossOrigin` to a CORS mode. Per the CORS-settings attribute, any value other than
 * `use-credentials` is Anonymous — including the empty string and unknown keywords.
 */
function toCorsMode(value: string | null | undefined): MediaThumbnailsTrack['crossOrigin'] {
  if (isNil(value)) return null;

  return value.toLowerCase() === 'use-credentials' ? 'use-credentials' : 'anonymous';
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

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaTextTrackCapable(media)) return;

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

        textTrackList.push({
          id: getTrackId(track, i),
          kind: track.kind as TextTrackKind,
          label: track.label,
          language: track.language,
          mode: track.mode,
        });

        if (isCaptionOrSubtitleTrack(track) && track.mode === 'showing') {
          subtitlesShowing = true;
        }
      }

      // The last chapter of an in-stream chapters document is open-ended on the
      // track; consumers read it ending where the media does.
      const chaptersCues = clampCuesToDuration(chaptersTrack?.cues, isMediaSeekCapable(media) ? media.duration : NaN);

      let thumbnailsTrack: MediaThumbnailsTrack | null = null;

      if (thumbnailsTextTrack) {
        thumbnailsTrack = {
          // VTTCue extends TextTrackCue with `text` — cast via `unknown` since
          // the CueList is typed as TextTrackCue which doesn't expose `text`.
          cues: thumbnailsTextTrack.cues ? (Array.from(thumbnailsTextTrack.cues) as unknown as MediaTextCue[]) : [],
          src: findTrackElement(media, thumbnailsTextTrack)?.src ?? null,
          // Read the host rather than any inner native element: for a media
          // component the attribute lives on the host and is forwarded inward.
          crossOrigin: isMediaSourceCapable(media) ? toCorsMode(media.crossOrigin) : null,
        };
      }

      // Listen for <track> load events on tracks that don't have cues yet.
      // `addtrack` fires before cues are parsed — we need the `load` event
      // on the <track> element to know when cues are ready.
      const tracks = (isQuerySelectorAllCapable<HTMLTrackElement>(media) && media.querySelectorAll('track')) || [];
      const shadowTracks = (media instanceof HTMLElement && media.shadowRoot?.querySelectorAll('track')) || [];

      for (const trackEl of [...tracks, ...shadowTracks]) {
        if (!trackEl.track?.cues?.length) {
          listen(trackEl, 'load', sync, { signal: trackCleanup.signal });
        }
      }

      set({
        textTrackList,
        subtitlesShowing,
        chaptersCues,
        thumbnailsTrack,
      });
    };

    sync();

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
