import type { HTMLMediaTargetLike } from '@videojs/media/dom';
import { isCaptionOrSubtitleTrack, listen } from '@videojs/utils/dom';
import type { Constructor } from '@videojs/utils/types';
import type { CuesParsedData, NonNativeTextTracksData } from 'hls.js';
import Hls from 'hls.js';

import type { HlsEngineHost } from './types';

/** Marks the `<track>` elements created here for hls.js's own text tracks. */
const HLS_TRACK_ATTR = 'data-removeondestroy';

/** Marks the subset created from hls.js's CEA-608/708 announcements, which are announced one track at a time. */
const CC_TRACK_ATTR = 'data-cc';

/** `HTMLTrackElement.LOADED` — the element parsed its resource and will not parse it again. */
const TRACK_LOADED = 2;

interface TextTrackSnapshot {
  track: TextTrack;
  mode: TextTrackMode;
  cues: TextTrackCue[];
}

/**
 * Runs an hls.js call that attaches, detaches, or loads a source, leaving the `<track>` children hls.js does not own
 * the way it found them.
 *
 * Hls.js resets _every_ text track on the media element at those points: it clears the cues of all of them and disables
 * the ones it takes for subtitles, without checking which tracks it created. Tracks sideloaded from `<track>` elements
 * are collateral damage, and losing their cues is permanent — an element that finished loading is never parsed again,
 * so the track keeps reporting `showing` while rendering nothing. It surfaces whenever a `<track>` outlives a source
 * assignment, most visibly when `src` arrives after the element connected and its default track already loaded.
 *
 * Cues are the objects the browser parsed, so putting back the ones hls.js took restores the track without refetching
 * its resource.
 */
export function withPreservedTextTracks(media: HTMLMediaElement | null, action: () => void): void {
  const snapshots = media ? snapshotTextTracks(media) : [];

  try {
    action();
  } finally {
    for (const snapshot of snapshots) restoreTextTrack(snapshot);
  }
}

/** Disables and removes every text track created for the current hls.js source. */
export function removeHlsTextTracks(media: HTMLMediaTargetLike | null): void {
  const trackEls = media?.querySelectorAll<HTMLTrackElement>(`track[${HLS_TRACK_ATTR}]`) ?? [];

  for (const trackEl of trackEls) {
    trackEl.track.mode = 'disabled';
    trackEl.remove();
  }
}

function snapshotTextTracks(media: HTMLMediaElement): TextTrackSnapshot[] {
  const snapshots: TextTrackSnapshot[] = [];

  for (const trackEl of media.querySelectorAll('track')) {
    // Tracks created for hls.js are rebuilt from the manifest on every load.
    if (trackEl.hasAttribute(HLS_TRACK_ATTR)) continue;

    const { track } = trackEl;
    // A disabled track stays disabled through anything hls.js does, and only
    // holds cues if it was enabled long enough to load them. Skipping the rest
    // keeps the mode juggling below off the common path.
    if (track.mode === 'disabled' && trackEl.readyState !== TRACK_LOADED) continue;

    snapshots.push({
      track,
      mode: track.mode,
      cues: withReadableCues(track, () => Array.from(track.cues ?? [])),
    });
  }

  return snapshots;
}

function restoreTextTrack({ track, mode, cues }: TextTrackSnapshot): void {
  if (track.mode !== mode) track.mode = mode;

  if (!cues.length) return;

  withReadableCues(track, () => {
    const present = new Set<TextTrackCue>(track.cues ?? []);

    for (const cue of cues) {
      if (!present.has(cue)) track.addCue(cue);
    }
  });
}

/** Reads or writes cues through a mode that exposes them, leaving the track's own mode intact. */
function withReadableCues<T>(track: TextTrack, action: () => T): T {
  const { mode } = track;

  if (mode === 'disabled') track.mode = 'hidden';

  try {
    return action();
  } finally {
    if (mode === 'disabled') track.mode = mode;
  }
}

/**
 * Bridges hls.js non-native text tracks to native `<track>` elements so the rest of the player can treat them like any
 * other text track.
 *
 * When `renderTextTracksNatively: false`, hls.js fires `NON_NATIVE_TEXT_TRACKS_FOUND` with track metadata and
 * `CUES_PARSED` with VTTCues. This mixin creates `<track>` elements on the media target and forwards cues into them. It
 * also syncs user track-mode changes back to hls.js via `engine.subtitleTrack`.
 */
export function HlsJsTextTracksMixin<Base extends Constructor<HlsEngineHost>>(BaseClass: Base) {
  class HlsJsTextTracks extends (BaseClass as Constructor<HlsEngineHost>) {
    #disconnect: AbortController | null = null;

    constructor(...args: any[]) {
      super(...args);

      // A new manifest invalidates the tracks built from the previous one. Attaching media does not: it rebinds the
      // handlers to the element hls.js drives now, and the tracks of the load in progress have to survive it.
      this.engine?.on(Hls.Events.MANIFEST_LOADING, () => {
        removeHlsTextTracks(this.target);
        this.#init();
      });
      this.engine?.on(Hls.Events.MEDIA_ATTACHED, () => this.#init());
      this.engine?.on(Hls.Events.MEDIA_DETACHED, () => this.#destroy());
      this.engine?.on(Hls.Events.DESTROYING, () => this.#destroy());
    }

    #destroy(): void {
      this.#disconnect?.abort();
      this.#disconnect = null;
      removeHlsTextTracks(this.target);
    }

    #init(): void {
      this.#disconnect?.abort();
      this.#disconnect = new AbortController();

      const { signal } = this.#disconnect;
      const { engine } = this;
      if (!engine || !this.target) return;

      // The hls.js delegate always binds to the real `<video>` element.
      const media = this.target as HTMLVideoElement;

      // NOTE: Undocumented identifiers hls.js addresses CUES_PARSED with: `_id` for CEA-608/708 tracks, and
      // `default` or `subtitles` plus the group-local index it stamps on `subtitleTrack.id` for the subtitle set.
      // See: https://github.com/video-dev/hls.js/blob/master/src/controller/timeline-controller.ts
      const trackIdFor = ({ _id, default: isDefault, subtitleTrack }: NonNativeTextTracksData['tracks'][number]) =>
        _id ?? (isDefault ? 'default' : `subtitles${subtitleTrack?.id}`);

      const onTracksFound = (_event: string, data: NonNativeTextTracksData) => {
        // The subtitle set arrives in one batch, and each CC track arrives alone once 608 data shows up in the
        // stream. Replace only what is being re-announced, so a CC announcement does not destroy the subtitle set
        // and a fresh subtitle set does not destroy the CC tracks.
        const incomingIds = new Set(data.tracks.map(trackIdFor));
        const ccBatch = data.tracks.every((trackObj) => trackObj._id != null);

        for (const trackEl of media.querySelectorAll<HTMLTrackElement>(`track[${HLS_TRACK_ATTR}]`)) {
          const replaced = incomingIds.has(trackEl.id);
          const ccOwned = trackEl.hasAttribute(CC_TRACK_ATTR);
          if (!replaced && (ccBatch || ccOwned)) continue;

          trackEl.track.mode = 'disabled';
          trackEl.remove();
        }

        for (const trackObj of data.tracks) {
          const baseTrackObj = trackObj.subtitleTrack ?? trackObj.closedCaptions;

          addTextTrack(
            media,
            trackObj.kind as TextTrackKind,
            trackObj.label,
            baseTrackObj?.lang,
            trackIdFor(trackObj),
            trackObj.default,
            trackObj._id != null
          );
        }
      };

      const onCuesParsed = (_event: string, { track, cues }: CuesParsedData) => {
        const textTrack = media.textTracks.getTrackById(track);
        if (!textTrack) return;

        const disabled = textTrack.mode === 'disabled';

        if (disabled) {
          textTrack.mode = 'hidden';
        }

        cues.forEach((cue: VTTCue) => {
          if (textTrack.cues?.getCueById(cue.id)) return;

          textTrack.addCue(cue);
        });

        if (disabled) {
          textTrack.mode = 'disabled';
        }
      };

      let lastShowingTrack: TextTrack | undefined;

      const onTextTrackChange = () => {
        const showingTrack = Array.from(media.textTracks).find((textTrack) => {
          return textTrack.id && textTrack.mode === 'showing' && isCaptionOrSubtitleTrack(textTrack);
        });
        const showingChanged = showingTrack !== lastShowingTrack;

        lastShowingTrack = showingTrack;

        if (!showingTrack) return;

        const hlsTrackEls = media.querySelectorAll<HTMLTrackElement>(`track[${HLS_TRACK_ATTR}]`);

        // Refresh the cues after a texttrack mode change to fix a Chrome bug causing the captions not to render.
        // Only when the showing track changes: `onCuesParsed` fires `change` for every batch it forwards to a
        // disabled track, and re-adding each time re-renders the active cue several times a second.
        if (showingChanged && Array.from(hlsTrackEls).some((trackEl) => trackEl.track === showingTrack)) {
          Array.from(showingTrack.cues ?? []).forEach((cue) => {
            showingTrack.addCue(cue);
          });
        }

        if (!engine.subtitleTracks.length) return;

        const currentHlsTrack = engine.subtitleTracks[engine.subtitleTrack];

        // If hls.subtitleTrack is -1 or its id changed compared to the one that is showing load the new subtitle track.
        const hlsTrackId = !currentHlsTrack
          ? undefined
          : currentHlsTrack.default
            ? 'default'
            : `${engine.subtitleTracks[engine.subtitleTrack]?.type.toLowerCase()}${engine.subtitleTrack}`;

        if (engine.subtitleTrack < 0 || showingTrack?.id !== hlsTrackId) {
          const idx = engine.subtitleTracks.findIndex(({ lang, name, type, default: defaultTrack }) => {
            return (
              (showingTrack.id === 'default' && defaultTrack) ||
              (lang === showingTrack.language &&
                name === showingTrack.label &&
                type.toLowerCase() === showingTrack.kind)
            );
          });

          // A closed-caption track has no entry in `subtitleTracks`, so it never matches. Assigning the -1 that
          // `findIndex` returns makes hls.js disable every subtitle and caption track, including the one just picked.
          // After the subtitleTrack is set here, hls.js will load the playlist and CUES_PARSED events will be fired below.
          if (idx >= 0) engine.subtitleTrack = idx;
        }
      };

      engine.on(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, onTracksFound);
      engine.on(Hls.Events.CUES_PARSED, onCuesParsed);
      listen(media.textTracks, 'change', onTextTrackChange, { signal });

      signal.addEventListener(
        'abort',
        () => {
          engine.off(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, onTracksFound);
          engine.off(Hls.Events.CUES_PARSED, onCuesParsed);
        },
        { once: true }
      );
    }
  }

  return HlsJsTextTracks as unknown as Base;
}

function addTextTrack(
  mediaEl: HTMLMediaElement,
  kind: TextTrackKind,
  label: string,
  lang?: string,
  id?: string,
  defaultTrack?: boolean,
  ccOwned?: boolean
): TextTrack {
  const trackEl = document.createElement('track');

  trackEl.kind = kind;
  trackEl.label = label;

  if (lang) {
    // This attribute must be present if the element's kind attribute is in the subtitles state.
    trackEl.srclang = lang;
  }

  if (id) {
    trackEl.id = id;
  }

  if (defaultTrack) {
    trackEl.default = true;
  }

  trackEl.track.mode = isCaptionOrSubtitleTrack({ kind }) ? 'disabled' : 'hidden';

  // Add data attribute to identify tracks that should be removed when switching sources/destroying hls.js instance.
  trackEl.setAttribute(HLS_TRACK_ATTR, '');

  if (ccOwned) trackEl.setAttribute(CC_TRACK_ATTR, '');

  mediaEl.append(trackEl);

  return trackEl.track as TextTrack;
}
