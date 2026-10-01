import { hasMethods } from '@videojs/utils/predicate';
import type { AnyConstructor, MixinReturn } from '@videojs/utils/types';

import type {
  MediaAudioRenditionCapability,
  MediaAudioTrackCapability,
  MediaVideoRenditionCapability,
  MediaVideoTrackCapability,
} from '../types';
import { AudioRenditionList } from './audio-rendition-list';
import { AudioTrack } from './audio-track';
import { AudioTrackList, addAudioTrack, removeAudioTrack } from './audio-track-list';
import type { TrackEvent } from './change-event';
import './global';
import { getPrivate } from './utils';
import { VideoRenditionList } from './video-rendition-list';
import { VideoTrack } from './video-track';
import { addVideoTrack, removeVideoTrack, VideoTrackList } from './video-track-list';

/** @experimental */
export type WithMediaTracks<Base extends AnyConstructor<any>> = MixinReturn<
  Base,
  MediaVideoTrackCapability & MediaAudioTrackCapability & MediaVideoRenditionCapability & MediaAudioRenditionCapability
>;

const HTMLMediaElementConstructor = (globalThis as { HTMLMediaElement?: AnyConstructor<HTMLMediaElement> })
  .HTMLMediaElement;
const nativeVideoTracksFn = getBaseMediaTracksFn(HTMLMediaElementConstructor, 'video');
const nativeAudioTracksFn = getBaseMediaTracksFn(HTMLMediaElementConstructor, 'audio');

// Safari supports native media tracks, but native implementations cannot
// reliably represent manifest-derived MSE tracks or manually-added tracks.
/** @internal */
export function MediaTracksMixin<Base extends AnyConstructor<any>>(MediaElementClass: Base): WithMediaTracks<Base> {
  if (!MediaElementClass?.prototype) return MediaElementClass as WithMediaTracks<Base>;

  const prototype = MediaElementClass.prototype as Record<string, any>;
  const videoTracksFn = getBaseMediaTracksFn(MediaElementClass, 'video');

  if (!videoTracksFn || `${videoTracksFn}`.includes('[native code]')) {
    Object.defineProperty(prototype, 'videoTracks', {
      get() {
        return getVideoTracks(this);
      },
    });
  }

  const audioTracksFn = getBaseMediaTracksFn(MediaElementClass, 'audio');

  if (!audioTracksFn || `${audioTracksFn}`.includes('[native code]')) {
    Object.defineProperty(prototype, 'audioTracks', {
      get() {
        return getAudioTracks(this);
      },
    });
  }

  if (!hasOwn(prototype, 'addVideoTrack')) {
    prototype.addVideoTrack = function (this: HTMLMediaElement, kind: string, label = '', language = '') {
      const track = new VideoTrack();

      track.kind = kind;
      track.label = label;
      track.language = language;
      addVideoTrack(this, track);
      return track;
    };
  }

  if (!hasOwn(prototype, 'removeVideoTrack')) {
    prototype.removeVideoTrack = removeVideoTrack;
  }

  if (!hasOwn(prototype, 'addAudioTrack')) {
    prototype.addAudioTrack = function (this: HTMLMediaElement, kind: string, label = '', language = '') {
      const track = new AudioTrack();

      track.kind = kind;
      track.label = label;
      track.language = language;
      addAudioTrack(this, track);
      return track;
    };
  }

  if (!hasOwn(prototype, 'removeAudioTrack')) {
    prototype.removeAudioTrack = removeAudioTrack;
  }

  // Tear down the native-track listeners wired in getVideoTracks/getAudioTracks
  // when the target is removed, and drop the cached lists so a re-attach
  // re-mirrors against the new target.
  if (!hasOwn(prototype, 'detach')) {
    const baseDetach = prototype.detach as ((this: object) => void) | undefined;

    prototype.detach = function (this: object) {
      const priv = getPrivate(this);

      (priv.videoTracksCleanup as AbortController | undefined)?.abort();
      (priv.audioTracksCleanup as AbortController | undefined)?.abort();
      delete priv.videoTracks;
      delete priv.audioTracks;
      delete priv.videoTracksCleanup;
      delete priv.audioTracksCleanup;
      baseDetach?.call(this);
    };
  }

  if (!hasOwn(prototype, 'videoRenditions')) {
    Object.defineProperty(prototype, 'videoRenditions', {
      get() {
        return initVideoRenditions(this);
      },
    });
  }

  if (!hasOwn(prototype, 'audioRenditions')) {
    Object.defineProperty(prototype, 'audioRenditions', {
      get() {
        return initAudioRenditions(this);
      },
    });
  }

  return MediaElementClass as WithMediaTracks<Base>;
}

function hasOwn(value: object, key: PropertyKey) {
  return Object.hasOwn(value, key);
}

function initVideoRenditions(media: HTMLMediaElement) {
  let renditions = getPrivate(media).videoRenditions as VideoRenditionList | undefined;

  if (!renditions) {
    renditions = new VideoRenditionList();
    getPrivate(renditions).media = new WeakRef(media);
    getPrivate(media).videoRenditions = renditions;
  }

  return renditions;
}

function initAudioRenditions(media: HTMLMediaElement) {
  let renditions = getPrivate(media).audioRenditions as AudioRenditionList | undefined;

  if (!renditions) {
    renditions = new AudioRenditionList();
    getPrivate(renditions).media = new WeakRef(media);
    getPrivate(media).audioRenditions = renditions;
  }

  return renditions;
}

function getBaseMediaTracksFn(MediaElementClass: any, type: string): (() => any) | undefined {
  if (MediaElementClass?.prototype) {
    return Object.getOwnPropertyDescriptor(MediaElementClass.prototype, `${type}Tracks`)?.get;
  }

  return undefined;
}

// Native track lists are event targets wherever they are implemented (Safari).
// Environments that stub them out as plain arrays (jsdom) publish no changes, so
// there is nothing to mirror and the list stays local.
function isNativeTrackList(
  value: unknown
): value is Iterable<any> & Record<'addEventListener' | 'removeEventListener', (...args: any[]) => void> {
  return hasMethods(value, ['addEventListener', 'removeEventListener']);
}

function getVideoTracks(media: any) {
  let tracks = getPrivate(media).videoTracks as VideoTrackList | undefined;

  if (!tracks) {
    tracks = new VideoTrackList();
    getPrivate(media).videoTracks = tracks;

    const nativeEl = media.target;
    const nativeTracks = nativeVideoTracksFn && nativeEl ? nativeVideoTracksFn.call(nativeEl) : undefined;

    if (isNativeTrackList(nativeTracks)) {
      const currentTracks = tracks;

      for (const nativeTrack of nativeTracks) {
        addVideoTrack(media, nativeTrack);
      }

      const onChange = () => {
        currentTracks.dispatchEvent(new Event('change'));
      };

      const onAddTrack = (event: TrackEvent) => {
        if ([...currentTracks].some((track) => track instanceof VideoTrack)) return;

        addVideoTrack(media, event.track as VideoTrack);
      };

      const onRemoveTrack = (event: TrackEvent) => {
        removeVideoTrack(event.track as VideoTrack);
      };

      // Adding a custom track replaces any mirrored native tracks.
      const onCustomAddTrack = (event: Event) => {
        if (!((event as TrackEvent).track instanceof VideoTrack)) return;

        for (const nativeTrack of nativeTracks) {
          removeVideoTrack(nativeTrack as VideoTrack);
        }
      };

      const controller = new AbortController();
      const { signal } = controller;

      getPrivate(media).videoTracksCleanup = controller;

      nativeTracks.addEventListener('change', onChange, { signal });
      nativeTracks.addEventListener('addtrack', onAddTrack, { signal });
      nativeTracks.addEventListener('removetrack', onRemoveTrack, { signal });
      currentTracks.addEventListener('addtrack', onCustomAddTrack, { signal });
    }
  }

  return tracks;
}

function getAudioTracks(media: any) {
  let tracks = getPrivate(media).audioTracks as AudioTrackList | undefined;

  if (!tracks) {
    tracks = new AudioTrackList();
    getPrivate(media).audioTracks = tracks;

    const nativeEl = media.target;
    const nativeTracks = nativeAudioTracksFn && nativeEl ? nativeAudioTracksFn.call(nativeEl) : undefined;

    if (isNativeTrackList(nativeTracks)) {
      const currentTracks = tracks;

      for (const nativeTrack of nativeTracks) {
        addAudioTrack(media, nativeTrack);
      }

      const onChange = () => {
        currentTracks.dispatchEvent(new Event('change'));
      };

      const onAddTrack = (event: TrackEvent) => {
        if ([...currentTracks].some((track) => track instanceof AudioTrack)) return;

        addAudioTrack(media, event.track as AudioTrack);
      };

      const onRemoveTrack = (event: TrackEvent) => {
        removeAudioTrack(event.track as AudioTrack);
      };

      // Adding a custom track replaces any mirrored native tracks.
      const onCustomAddTrack = (event: Event) => {
        if (!((event as TrackEvent).track instanceof AudioTrack)) return;

        for (const nativeTrack of nativeTracks) {
          removeAudioTrack(nativeTrack as AudioTrack);
        }
      };

      const controller = new AbortController();
      const { signal } = controller;

      getPrivate(media).audioTracksCleanup = controller;

      nativeTracks.addEventListener('change', onChange, { signal });
      nativeTracks.addEventListener('addtrack', onAddTrack, { signal });
      nativeTracks.addEventListener('removetrack', onRemoveTrack, { signal });
      currentTracks.addEventListener('addtrack', onCustomAddTrack, { signal });
    }
  }

  return tracks;
}
