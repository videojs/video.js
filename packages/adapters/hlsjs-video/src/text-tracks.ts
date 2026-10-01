import type { HTMLMediaTargetLike } from '@videojs/media/dom';
import { isCaptionOrSubtitleTrack, listen } from '@videojs/utils/dom';
import type { Constructor } from '@videojs/utils/types';
import type { CuesParsedData, NonNativeTextTracksData } from 'hls.js';
import Hls from 'hls.js';

import type { HlsEngineHost } from './types';

/** Marks the `<track>` elements created here for hls.js's own text tracks. */
const HLS_TRACK_ATTR = 'data-removeondestroy';

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

      const onTracksFound = (_event: string, data: NonNativeTextTracksData) => {
        removeHlsTextTracks(this.target);

        for (const trackObj of data.tracks) {
          const baseTrackObj = trackObj.subtitleTrack ?? trackObj.closedCaptions;
          const idx = engine.subtitleTracks.findIndex(({ lang, name, type }) => {
            return lang === baseTrackObj?.lang && name === trackObj.label && type.toLowerCase() === trackObj.kind;
          });

          // NOTE: Undocumented method for determining identifier by hls.js. Relied on for
          // ensuring CUES_PARSED events can identify and apply cues to the appropriate track (CJP).
          // See: https://github.com/video-dev/hls.js/blob/master/src/controller/timeline-controller.ts#L640
          const id = (trackObj._id ?? trackObj.default) ? 'default' : `${trackObj.kind}${idx}`;

          addTextTrack(media, trackObj.kind as TextTrackKind, trackObj.label, baseTrackObj?.lang, id, trackObj.default);
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

      const onTextTrackChange = () => {
        if (!engine.subtitleTracks.length) return;

        const showingTrack = Array.from(media.textTracks).find((textTrack) => {
          return textTrack.id && textTrack.mode === 'showing' && isCaptionOrSubtitleTrack(textTrack);
        });
        if (!showingTrack) return;

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

          // After the subtitleTrack is set here, hls.js will load the playlist and CUES_PARSED events will be fired below.
          engine.subtitleTrack = idx;
        }

        if (showingTrack?.id === hlsTrackId) {
          // Refresh the cues after a texttrack mode change to fix a Chrome bug causing the captions not to render.
          if (showingTrack.cues) {
            Array.from(showingTrack.cues).forEach((cue) => {
              showingTrack.addCue(cue);
            });
          }
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
  defaultTrack?: boolean
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
  mediaEl.append(trackEl);

  return trackEl.track as TextTrack;
}
