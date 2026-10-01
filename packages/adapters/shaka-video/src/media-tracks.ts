import type {
  MediaAudioTrackCapability,
  MediaVideoRenditionCapability,
  MediaVideoTrackCapability,
} from '@videojs/media';
import type { AudioTrack, VideoRendition } from '@videojs/media/media-tracks';
import type { Constructor } from '@videojs/utils/types';
import type shaka from 'shaka-player/dist/shaka-player.compiled-es2021';

import type { ShakaEngineHost } from './types';

type MediaTracksHost = ShakaEngineHost &
  MediaVideoTrackCapability &
  MediaAudioTrackCapability &
  MediaVideoRenditionCapability;

/**
 * Mirrors the Shaka video and audio tracks of the loaded asset into the media element's `videoRenditions` /
 * `audioTracks` lists, and wires user selection back to `engine.selectVideoTrack()` and `engine.selectAudioTrack()`.
 *
 * Shaka video tracks are a flattened view over the manifest's variants rather than a list of their own, so they are
 * hung off a single `'main'` video track — the one the renditions of the asset that is playing are read from.
 *
 * Requires the media-tracks mixin (track-list infrastructure) to be applied earlier in the chain so the host exposes
 * `addVideoTrack`, `videoRenditions`, and friends.
 */
export function ShakaMediaTracksMixin<Base extends Constructor<MediaTracksHost>>(BaseClass: Base) {
  class ShakaMediaTracks extends (BaseClass as Constructor<MediaTracksHost>) {
    // The source is announced as a whole, so the URL it resolved to last is what
    // tells a new asset apart from a configuration-only change.
    #src = '';
    // Shaka identifies neither kind of track by an id, so what it last announced
    // is what a re-announcement of the same set is recognized by.
    #videoTracksKey = '';
    #audioTracksKey = '';
    #isAbrOff = false;

    constructor(...args: any[]) {
      super(...args);

      const { engine } = this;
      if (!engine) return;

      engine.addEventListener('trackschanged', this.#onTracksChanged);
      engine.addEventListener('audiotrackschanged', this.#onAudioTracksChanged);
      engine.addEventListener('variantchanged', this.#onVariantChanged);
      engine.addEventListener('adaptation', this.#onVariantChanged);
      engine.addEventListener('audiotrackchanged', this.#onAudioTrackChanged);

      this.addEventListener('sourcechange', this.#onSourceChange);
      this.videoRenditions.addEventListener('change', this.#switchRendition);
      this.audioTracks.addEventListener('change', this.#switchAudioTrack);
    }

    destroy() {
      const { engine } = this;

      engine?.removeEventListener('trackschanged', this.#onTracksChanged);
      engine?.removeEventListener('audiotrackschanged', this.#onAudioTracksChanged);
      engine?.removeEventListener('variantchanged', this.#onVariantChanged);
      engine?.removeEventListener('adaptation', this.#onVariantChanged);
      engine?.removeEventListener('audiotrackchanged', this.#onAudioTrackChanged);

      this.removeEventListener('sourcechange', this.#onSourceChange);
      this.videoRenditions.removeEventListener('change', this.#switchRendition);
      this.audioTracks.removeEventListener('change', this.#switchAudioTrack);

      this.#reset();

      super.destroy();
    }

    // Shaka re-announces its tracks whenever the playable set changes — a new
    // asset, a new period, a restriction lifted. Rebuilding throws away the
    // rendition a user pinned, so it only happens when the set is actually
    // different.
    #onTracksChanged = () => {
      const { engine } = this;
      if (!engine) return;

      const videoTracks = engine.getVideoTracks();
      const key = videoTracksKey(videoTracks);

      if (key === this.#videoTracksKey) {
        let metadataChanged = false;

        // Refresh metadata without rebuilding the list and losing a pinned rendition.
        for (const rendition of this.videoRenditions) {
          const track = videoTracks[Number(rendition.id)];
          if (!track) continue;

          const frameRate = track.frameRate ?? undefined;
          if (rendition.frameRate === frameRate) continue;

          // SAFETY: MediaTracksMixin created these renditions with mutable metadata.
          (rendition as VideoRendition).frameRate = frameRate;
          metadataChanged = true;
        }

        if (metadataChanged) this.videoRenditions.dispatchEvent(new Event('change'));

        this.#onAudioTracksChanged();
        return;
      }

      this.#videoTracksKey = key;

      this.#removeVideoTracks();
      this.#restoreAbr();

      const videoTrack = this.addVideoTrack('main');

      // Selecting the track is what puts its renditions in `videoRenditions`, so
      // it happens before any is added and their `addrendition` events land.
      videoTrack.selected = true;

      for (const [index, track] of videoTracks.entries()) {
        const rendition = videoTrack.addRendition(
          // A Shaka video track is a set of manifest variants rather than one
          // playable URL, so there is nothing to point at.
          '',
          track.width ?? undefined,
          track.height ?? undefined,
          track.codecs ?? undefined,
          track.bandwidth,
          track.frameRate ?? undefined
        );

        // Shaka has no id of its own for a track, so its position in the list is
        // what a selection is looked back up by.
        rendition.id = `${index}`;
      }

      this.#setActiveRendition(videoTracks);
      // Audio tracks arrive with the asset, and Shaka announces them separately
      // only when they change after that.
      this.#onAudioTracksChanged();
    };

    #onAudioTracksChanged = () => {
      const { engine } = this;
      if (!engine) return;

      const audioTracks = engine.getAudioTracks();
      const key = audioTracksKey(audioTracks);

      if (key === this.#audioTracksKey) {
        let metadataChanged = false;

        for (const audioTrack of this.audioTracks) {
          const track = audioTracks[Number(audioTrack.id)];
          if (!track) continue;

          const kind = track.primary ? 'main' : 'alternative';
          if (audioTrack.kind === kind) continue;

          // SAFETY: MediaTracksMixin created these audio tracks with mutable metadata.
          (audioTrack as AudioTrack).kind = kind;
          metadataChanged = true;
        }

        if (metadataChanged) this.audioTracks.dispatchEvent(new Event('change'));

        return;
      }

      this.#audioTracksKey = key;

      this.#removeAudioTracks();

      for (const [index, track] of audioTracks.entries()) {
        const audioTrack = this.addAudioTrack(
          track.primary ? 'main' : 'alternative',
          track.label ?? track.language,
          track.language
        );

        audioTrack.id = `${index}`;
        audioTrack.enabled = track.active;
      }
    };

    #onVariantChanged = () => {
      const { engine } = this;

      if (engine) this.#setActiveRendition(engine.getVideoTracks());
    };

    #onAudioTrackChanged = () => {
      const { engine } = this;
      if (!engine) return;

      const activeIndex = engine.getAudioTracks().findIndex((track) => track.active);

      for (const audioTrack of this.audioTracks) {
        audioTrack.enabled = audioTrack.id === `${activeIndex}`;
      }
    };

    #switchRendition = () => {
      const { engine } = this;
      if (!engine) return;

      // Multiple renditions can be selected, but Shaka plays exactly one video
      // track at a time, so the first one wins.
      const selected = [...this.videoRenditions].find((rendition) => rendition.selected);

      if (!selected?.id) {
        this.#restoreAbr();
        return;
      }

      const videoTrack = engine.getVideoTracks()[Number(selected.id)];
      if (!videoTrack) return;

      this.#isAbrOff = true;
      engine.configure({ abr: { enabled: false } });
      engine.selectVideoTrack(videoTrack);
    };

    #switchAudioTrack = () => {
      const { engine } = this;
      if (!engine) return;

      // `enabled` is not exclusive the way video `selected` is, so prefer a
      // newly enabled track over the one that is already playing.
      const enabledTracks = [...this.audioTracks].filter((track) => track.enabled);
      const audioTracks = engine.getAudioTracks();

      const selectedTrack = enabledTracks.find((track) => !audioTracks[Number(track.id)]?.active) ?? enabledTracks[0];
      if (!selectedTrack?.id) return;

      const audioTrack = audioTracks[Number(selectedTrack.id)];

      if (audioTrack && !audioTrack.active) engine.selectAudioTrack(audioTrack);

      // Disable the rest so future change events resolve unambiguously.
      for (const track of enabledTracks) {
        if (track !== selectedTrack) track.enabled = false;
      }
    };

    #onSourceChange = () => {
      const srcChanged = this.src !== this.#src;

      this.#src = this.src;

      // A new asset announces tracks of its own, and the one that is going away
      // leaves nothing to select from.
      if (srcChanged) {
        this.#reset();
        return;
      }

      // Applying `engine.shaka` resets Shaka's configuration wholesale, which
      // drops the adaptation this mixin turned off; re-apply the selection it
      // was for.
      if (this.#isAbrOff && this.#isEngineAbrOn()) this.#switchRendition();
    };

    // Shaka's own reading rather than what this mixin last asked for:
    // configuration is reset out from under it, and only the engine knows
    // whether that happened. Announcing a source that changed nothing must leave
    // the pinned track alone, or an inline React `source` prop would interrupt
    // playback on every render.
    #isEngineAbrOn() {
      return this.engine?.getConfiguration().abr?.enabled !== false;
    }

    #setActiveRendition(videoTracks: shaka.extern.VideoTrack[]) {
      const activeIndex = videoTracks.findIndex((track) => track.active);

      for (const rendition of this.videoRenditions) {
        rendition.active = activeIndex >= 0 && rendition.id === `${activeIndex}`;
      }
    }

    #reset() {
      this.#removeVideoTracks();
      this.#removeAudioTracks();
      this.#restoreAbr();
      this.#videoTracksKey = '';
      this.#audioTracksKey = '';
    }

    // Only ever undoes what a selection turned off, so a Shaka configuration
    // that disables adaptation on purpose is left as configured.
    #restoreAbr() {
      if (!this.#isAbrOff) return;

      this.#isAbrOff = false;
      this.engine?.configure({ abr: { enabled: true } });
    }

    #removeVideoTracks() {
      for (const videoTrack of this.videoTracks) {
        this.removeVideoTrack(videoTrack);
      }
    }

    #removeAudioTracks() {
      for (const audioTrack of this.audioTracks) {
        this.removeAudioTrack(audioTrack);
      }
    }
  }

  return ShakaMediaTracks as unknown as Base;
}

function videoTracksKey(tracks: shaka.extern.VideoTrack[]) {
  return tracks.map((track) => `${track.width}x${track.height}|${track.codecs}|${track.bandwidth}|${track.hdr}`).join();
}

function audioTracksKey(tracks: shaka.extern.AudioTrack[]) {
  return tracks.map((track) => `${track.language}|${track.label}|${track.roles}|${track.channelsCount}`).join();
}
