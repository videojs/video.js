import { isCaptionOrSubtitleTrack, listen } from '@videojs/utils/dom';
import { isNil } from '@videojs/utils/predicate';
import type { Constructor } from '@videojs/utils/types';
import type { CuesParsedData, NonNativeTextTrack, NonNativeTextTracksData } from 'hls.js';
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

function snapshotTextTracks(media: HTMLMediaElement): TextTrackSnapshot[] {
  const snapshots: TextTrackSnapshot[] = [];

  for (const trackEl of media.querySelectorAll('track')) {
    // Tracks created for hls.js are rebuilt from the manifest on every load.
    if (trackEl.hasAttribute(HLS_TRACK_ATTR)) continue;

    const { track } = trackEl;
    // A disabled track stays disabled through anything hls.js does, and only
    // holds cues if it was enabled long enough to load them. Skipping the rest
    // keeps the mode juggling below off the common path. A track without `src`
    // settles in the error state, yet can hold cues written to it from code.
    if (track.mode === 'disabled' && trackEl.readyState < TRACK_LOADED) continue;

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

/** A text track hls.js announced for the current source. */
interface HlsTextTrack {
  info: NonNativeTextTrack;
  /** The mode the track had when it was last unmounted, put back when it is mounted again. */
  mode: TextTrackMode | null;
  /** The `<track>` element while the track is mounted on the media element. */
  el: HTMLTrackElement | null;
}

/**
 * Bridges hls.js non-native text tracks to native `<track>` elements so the rest of the player can treat them like any
 * other text track.
 *
 * When `renderTextTracksNatively: false`, hls.js fires `NON_NATIVE_TEXT_TRACKS_FOUND` with track metadata and
 * `CUES_PARSED` with VTTCues. This mixin creates `<track>` elements on the media target and forwards cues into them. It
 * also syncs user track-mode changes back to hls.js via `engine.subtitleTrack`.
 *
 * The tracks belong to the source, not to the media element. A new manifest or the engine's destruction drops them; a
 * detach only unmounts them, and the next attach mounts them again with their modes. hls.js cannot be relied on to
 * announce them again after a detach/attach of the same source, e.g. `hls.recoverMediaError()`: it announces the
 * subtitle set only when its list changes, and each CC track only once 608 data shows up again.
 */
export function HlsJsTextTracksMixin<Base extends Constructor<HlsEngineHost>>(BaseClass: Base) {
  class HlsJsTextTracks extends (BaseClass as Constructor<HlsEngineHost>) {
    #disconnect: AbortController | null = null;
    /** The tracks of the current source, by the id hls.js addresses their cues with. */
    #tracks = new Map<string, HlsTextTrack>();

    constructor(...args: any[]) {
      super(...args);

      const { engine } = this;
      if (!engine) return;

      engine.on(Hls.Events.MANIFEST_LOADING, () => {
        this.#reset();
        this.#init();
      });
      engine.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.#init();
        this.#mount();
      });
      engine.on(Hls.Events.MEDIA_DETACHED, () => this.#stop());
      engine.on(Hls.Events.DESTROYING, () => this.#reset());
    }

    /** Lets go of the media element: stops listening to it and unmounts the tracks, keeping them for the next attach. */
    #stop(): void {
      this.#disconnect?.abort();
      this.#disconnect = null;
      this.#unmount();
    }

    #reset(): void {
      this.#stop();
      this.#tracks.clear();
    }

    /** Mounts the tracks of the current source that are not on the media element yet. */
    #mount(): void {
      // SAFETY: the hls.js delegate always binds to the real `<video>` element.
      const media = this.target as HTMLVideoElement | null;
      if (!media) return;

      for (const [id, track] of this.#tracks) {
        if (track.el?.parentNode === media) continue;

        unmountTrack(track);
        mountTrack(media, id, track);
      }
    }

    #unmount(): void {
      for (const track of this.#tracks.values()) unmountTrack(track);
    }

    #owns(textTrack: TextTrack): boolean {
      for (const { el } of this.#tracks.values()) {
        if (el?.track === textTrack) return true;
      }

      return false;
    }

    #init(): void {
      this.#disconnect?.abort();
      this.#disconnect = new AbortController();

      const { signal } = this.#disconnect;
      const { engine } = this;
      if (!engine || !this.target) return;

      // The hls.js delegate always binds to the real `<video>` element.
      const media = this.target as HTMLVideoElement;

      const onTracksFound = (_event: string, { tracks }: NonNativeTextTracksData) => {
        // The subtitle set arrives in one batch and replaces the previous set. Each CC track arrives alone once 608 data
        // shows up in the stream and leaves the other tracks alone. A track announced again keeps its mode.
        const previous = new Map(this.#tracks);

        if (!tracks.every(isClosedCaptions)) {
          for (const [id, track] of this.#tracks) {
            if (isClosedCaptions(track.info)) continue;

            unmountTrack(track);
            this.#tracks.delete(id);
          }
        }

        for (const info of tracks) {
          const id = trackIdFor(info);
          const replaced = previous.get(id);

          if (replaced) unmountTrack(replaced);

          this.#tracks.set(id, { info, mode: replaced?.mode ?? null, el: null });
        }

        this.#mount();
      };

      const onCuesParsed = (_event: string, { track, cues }: CuesParsedData) => {
        const textTrack = this.#tracks.get(track)?.el?.track;
        if (!textTrack) return;

        withReadableCues(textTrack, () => {
          for (const cue of cues) {
            if (!textTrack.cues?.getCueById(cue.id)) textTrack.addCue(cue);
          }
        });
      };

      let lastShowingTrack: TextTrack | undefined;

      const onTextTrackChange = () => {
        const showingTrack = Array.from(media.textTracks).find((textTrack) => {
          return textTrack.id && textTrack.mode === 'showing' && isCaptionOrSubtitleTrack(textTrack);
        });
        const showingChanged = showingTrack !== lastShowingTrack;

        lastShowingTrack = showingTrack;

        if (!showingTrack) return;

        // Only on a new showing track: `onCuesParsed` fires `change` for every batch it forwards to a disabled
        // track, and refreshing each time would re-render the active cue several times a second.
        if (showingChanged && this.#owns(showingTrack)) refreshCues(showingTrack);

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

          // After the subtitleTrack is set here, hls.js will load the playlist and CUES_PARSED events will be fired below.
          // A closed-caption track has no entry in `subtitleTracks`, so picking one assigns -1, which only stops
          // subtitle loading: CEA-608 cues come from the video segments.
          engine.subtitleTrack = idx;
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

/**
 * Makes the media element render the cues of a track that just became the showing one.
 *
 * The `<track>` elements created here have no `src`, so their load fails. WebKit only hands a re-enabled track's cues
 * back to the media element when its `<track>` loaded, so a track turned off and on again lists its cues but renders
 * none; Chrome has a similar rendering bug. Adding a cue that is already on the track is a no-op in WebKit, so each cue
 * is removed before it is added back.
 */
function refreshCues(track: TextTrack): void {
  for (const cue of Array.from(track.cues ?? [])) {
    track.removeCue(cue);
    track.addCue(cue);
  }
}

/** CEA-608/708 tracks are the ones hls.js announces with an `_id`, one at a time. */
function isClosedCaptions(info: NonNativeTextTrack): boolean {
  return !isNil(info._id);
}

/**
 * NOTE: Undocumented identifiers hls.js addresses CUES_PARSED with: `_id` for CEA-608/708 tracks, and `default` or
 * `subtitles` plus the group-local index it stamps on `subtitleTrack.id` for the subtitle set. See:
 * https://github.com/video-dev/hls.js/blob/master/src/controller/timeline-controller.ts
 */
function trackIdFor({ _id, default: isDefault, subtitleTrack }: NonNativeTextTrack): string {
  return _id ?? (isDefault ? 'default' : `subtitles${subtitleTrack?.id}`);
}

function mountTrack(media: HTMLMediaElement, id: string, track: HlsTextTrack): void {
  const { info, mode } = track;
  const kind = info.kind as TextTrackKind;
  const lang = (info.subtitleTrack ?? info.closedCaptions)?.lang;
  const el = document.createElement('track');

  el.id = id;
  el.kind = kind;
  el.label = info.label;

  // Required when the element's kind is subtitles.
  if (lang) el.srclang = lang;

  if (info.default) el.default = true;

  el.track.mode = isCaptionOrSubtitleTrack({ kind }) ? 'disabled' : 'hidden';

  // Lets `withPreservedTextTracks` tell these tracks from sideloaded ones.
  el.setAttribute(HLS_TRACK_ATTR, '');
  media.append(el);

  if (mode && el.track.mode !== mode) el.track.mode = mode;

  track.el = el;
}

/** Disables and removes the track's element, remembering its mode for the next mount. */
function unmountTrack(track: HlsTextTrack): void {
  const { el } = track;
  if (!el) return;

  track.mode = el.track.mode;
  el.track.mode = 'disabled';
  el.remove();
  track.el = null;
}
