import { addRemovableTextTrack, findTrackElement, listen } from '@videojs/utils/dom';
import { isObject, isUndefined } from '@videojs/utils/predicate';

import { getRegisteredMedia } from '../../core/registered-media';
import type {
  DataCueLike,
  MediaTextTrackCapability,
  TextCueLike,
  TextTrackCueLike,
  TextTrackKind,
  TextTrackLike,
} from '../../core/types';
import { getMediaElement } from '../utils';

/** `HTMLTrackElement.LOADED`: the element loaded its resource. `ERROR`, the only state above it, follows a failed load. */
const TRACK_LOADED = 2;

/** @internal */
export interface CreateTextTrackOptions {
  /** The track's id. A track backed by a `<track>` element takes the element's `id`. */
  id?: string | undefined;
  kind: TextTrackKind;
  label?: string | undefined;
  /** BCP 47 language tag. */
  language?: string | undefined;
  /** Defaults to `hidden`, like a track from `addTextTrack()`. `disabled` is applied once the backing element settles. */
  mode?: TextTrackLike['mode'] | undefined;
}

/**
 * A text track its creator writes cues to and removes when done.
 *
 * @internal
 */
export interface NativeTextTrackHandle {
  readonly track: TextTrackLike;
  /**
   * Write `cue` to the track as a new native cue, once the backing `<track>` has settled. A cue that already belongs to
   * another track stays there. Adding the same object again does nothing.
   */
  addCue(cue: TextCueLike): void;
  /** Take out a cue written with `addCue()`, given the same object. A cue still waiting to be written is dropped. */
  removeCue(cue: TextCueLike): void;
  /** Disable the track and remove it from the media. Safe to call more than once. */
  remove(): void;
}

/**
 * Add a text track to `media` that the caller can write cues to and remove again.
 *
 * DOM media back the track with a `<track>` element on the element they play through, which is what makes it removable.
 * Chromium discards cues added to such a track before the element settles, which a `<track>` without `src` does by
 * firing `error` once it leaves `disabled` mode. The handle holds cues until then, so callers can write them right
 * away.
 *
 * @returns `null` when the media gives no track.
 * @internal
 */
export function createTextTrack(
  media: MediaTextTrackCapability,
  options: CreateTextTrackOptions
): NativeTextTrackHandle | null {
  const { id, kind, label, language, mode = 'hidden' } = options;

  // The platform's `addTextTrack()` makes tracks that can never be removed, so DOM media get a `<track>` on the element
  // they play through. Other media add their own; embeds can list tracks without adding any.
  const mediaElement = findMediaElement(media);
  const track: TextTrackLike | undefined = mediaElement
    ? addRemovableTextTrack(mediaElement, kind, label, language)
    : media.addTextTrack?.(kind, label, language);
  if (!track) return null;

  const element = mediaElement ? findTrackElement(mediaElement, track) : null;

  if (element && id) element.id = id;

  const pending = new Set<TextCueLike>();
  const written = new Map<TextCueLike, TextTrackCueLike>();
  const listeners = new AbortController();
  let settled = !element || element.readyState >= TRACK_LOADED;
  let removed = false;

  const write = (cue: TextCueLike) => {
    const nativeCue = createNativeCue(cue);
    if (!nativeCue) return;

    track.addCue?.(nativeCue);
    written.set(cue, nativeCue);
  };

  const settle = () => {
    listeners.abort();
    settled = true;

    for (const cue of pending) write(cue);

    pending.clear();

    // Leave alone a mode someone changed while the load ran.
    if (mode === 'disabled' && track.mode === 'hidden') track.mode = 'disabled';
  };

  if (element && !settled) {
    listen(element, 'load', settle, { signal: listeners.signal });
    listen(element, 'error', settle, { signal: listeners.signal });
  }

  // Leaving `disabled` starts the element load. A track kept disabled would never load, so held cues would never land.
  track.mode = mode === 'disabled' && !settled ? 'hidden' : mode;

  return {
    track,
    addCue(cue) {
      if (removed || pending.has(cue) || written.has(cue)) return;

      if (settled) write(cue);
      else pending.add(cue);
    },
    removeCue(cue) {
      if (pending.delete(cue)) return;

      const nativeCue = written.get(cue);
      if (!nativeCue) return;

      written.delete(cue);

      try {
        track.removeCue?.(nativeCue);
      } catch {
        // Something else took it out already, such as an engine resetting the media's tracks.
      }
    },
    remove() {
      if (removed) return;

      removed = true;
      listeners.abort();
      pending.clear();
      written.clear();
      track.mode = 'disabled';

      if (element) element.remove();
      else media.removeTextTrack?.(track);
    },
  };
}

/**
 * The native element `media` plays through, also when it's a media component fronting another, such as an `<hls-video>`
 * slotted into another media component.
 */
function findMediaElement(media: unknown): HTMLMediaElement | null {
  const element = getMediaElement(media);
  if (element) return element;

  const target = isObject(media) ? (getRegisteredMedia(media) as { target?: unknown }).target : null;

  return isObject(target) && target !== media ? findMediaElement(target) : null;
}

interface DataCueConstructor {
  new (startTime: number, endTime: number, value: unknown, type?: string): TextTrackCue;
}

/** Cue constructors a platform may lack: there are none server-side or in jsdom, and only Safari has `DataCue`. */
interface CueConstructors {
  VTTCue?: typeof VTTCue;
  DataCue?: DataCueConstructor;
}

function isDataCue(cue: TextCueLike): cue is DataCueLike {
  return 'value' in cue && !isUndefined(cue.value);
}

/** A native cue carrying `cue`, or `null` where the platform can't build one. */
function createNativeCue(cue: TextCueLike): TextTrackCue | null {
  try {
    const nativeCue = isDataCue(cue) ? createDataCue(cue) : createVTTCue(cue.startTime, cue.endTime, cue.text);

    if (nativeCue && cue.id) nativeCue.id = cue.id;

    return nativeCue;
  } catch {
    // Engines reject some cue times, such as an infinite end.
    return null;
  }
}

/**
 * A `DataCue` where the platform has one. Elsewhere, what hls.js writes: a `VTTCue` with `value` and `type` set on it,
 * here with the value as JSON for its text so readers that only see text still get the data.
 */
function createDataCue({ startTime, endTime, value, type }: DataCueLike): TextTrackCue | null {
  // SAFETY: an optional global; reading it where it's missing gives `undefined`.
  const { DataCue } = globalThis as CueConstructors;
  if (DataCue) return new DataCue(startTime, endTime, value, type);

  const cue = createVTTCue(startTime, endTime, toJson(value));

  return cue && Object.assign(cue, type ? { value, type } : { value });
}

function createVTTCue(startTime: number, endTime: number, text: string): VTTCue | null {
  // SAFETY: an optional global; reading it where it's missing gives `undefined`.
  const { VTTCue } = globalThis as CueConstructors;

  return VTTCue ? new VTTCue(startTime, endTime, text) : null;
}

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}
