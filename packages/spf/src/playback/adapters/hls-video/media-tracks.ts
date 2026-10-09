import type {
  AudioTrackLike,
  MediaAudioTrackCapability,
  MediaVideoRenditionCapability,
  MediaVideoTrackCapability,
  VideoRenditionLike,
} from '@videojs/media';
import type { Constructor } from '@videojs/utils/types';

import type { Composition } from '../../../core/composition/create-composition';
import { effect } from '../../../core/signals/effect';
import { computed, untrack } from '../../../core/signals/primitives';
import {
  type AudioTrack,
  dedupedAudioTracks,
  dedupedVideoTracks,
  findAudioTrackById,
  findVideoTrackById,
  frameRateToNumber,
  isSameAudioTrack,
  isSameVideoTrack,
  toUserAudioTrackSelection,
  toUserVideoTrackSelection,
  type VideoTrack,
} from '../../../media/media-tracks';
import type { EngineContext, EngineState } from '../../engines/hls/engine';

// Translate a DOM rendition/track into the SPF dedupe-key shape
const toVideoKey = (rendition: VideoRenditionLike) => ({
  width: rendition.width,
  height: rendition.height,
  bandwidth: rendition.bitrate!,
});

const toAudioKey = (track: AudioTrackLike) => ({ language: track.language, name: track.label });

type HlsVideoEngineHost = {
  readonly engine: Composition<EngineState, EngineContext>;
  destroy?(): void;
};

type MediaTracksHost = HlsVideoEngineHost &
  MediaVideoTrackCapability &
  MediaAudioTrackCapability &
  MediaVideoRenditionCapability;

/** Two track lists carry the same set when their id sequences match. */
const sameIds = (a: { id: string }[], b: { id: string }[]): boolean =>
  a.length === b.length && a.every((item, i) => item.id === b[i]!.id);

/**
 * Projects the SPF engine's presentation onto the media element's `videoRenditions` / `audioTracks` lists, and wires
 * user selection back to the engine's `userVideoTrackSelection` / `userAudioTrackSelection` signals.
 *
 * Requires the media-tracks mixin (track-list infrastructure) earlier in the chain so the host exposes `addVideoTrack`,
 * `videoRenditions`, and friends.
 */
export function HlsVideoMediaTracksMixin<Base extends Constructor<MediaTracksHost>>(BaseClass: Base) {
  class HlsVideoMediaTracks extends (BaseClass as Constructor<MediaTracksHost>) {
    #abort = new AbortController();
    #destroyed = false;
    // Memoized SPF model — the last `computed` result per type — so a DOM
    // selection maps back to the engine's match criteria by id via the SPF
    // selection helpers (the DOM lists carry only DOM-shape props).
    #renditions: VideoTrack[] = [];
    #audioTracks: AudioTrack[] = [];

    constructor(...args: any[]) {
      super(...args);

      const { state } = this.engine;
      const { signal } = this.#abort;

      const renditionsSignal = computed(() => dedupedVideoTracks(state.presentation.get()), { equals: sameIds });
      const audioTracksSignal = computed(() => dedupedAudioTracks(state.presentation.get()), { equals: sameIds });

      // Rebuild video renditions when the set changes; seed `active` from the
      // current resolved selection (read untracked — `active` deltas are the
      // reflection effect's job).
      const reflectRenditions = () => {
        const renditions = renditionsSignal.get();

        this.#renditions = renditions;
        this.#removeVideoTracks();

        if (!renditions.length) return;

        // "video track" here is the Media UI Extensions concept, which maps onto
        // the SPF model differently than the name suggests:
        //   MUE track     -> SPF selection set
        //   MUE rendition -> SPF track
        // @see https://github.com/video-dev/media-ui-extensions/blob/main/proposals/0011-renditions-list.md
        //
        // Every rendition hangs off a single "main" video track. Multi-track
        // video (multiple camera angles, CMAF multi-track) isn't supported yet,
        // so exactly one video track is always exposed; when it lands, this
        // becomes one track (selection set) per angle.
        const videoTrack = this.addVideoTrack('main');

        videoTrack.selected = true;

        const resolved = untrack(() => findVideoTrackById(state.presentation.get(), state.selectedVideoTrackId.get()));

        for (const rendition of renditions) {
          const domRendition = videoTrack.addRendition(
            '',
            rendition.width,
            rendition.height,
            rendition.codecs.join(','),
            rendition.bandwidth,
            rendition.frameRate ? frameRateToNumber(rendition.frameRate) : undefined
          );

          domRendition.id = rendition.id;
          domRendition.active = isSameVideoTrack(toVideoKey(domRendition), resolved);
        }
      };

      const reflectSelectedVideo = () => {
        const resolved = findVideoTrackById(state.presentation.get(), state.selectedVideoTrackId.get());

        for (const rendition of this.videoRenditions) {
          rendition.active = isSameVideoTrack(toVideoKey(rendition), resolved);
        }
      };

      // Rebuild audio tracks when the set changes; seed `enabled` from the
      // current resolved selection.
      const reflectAudioTracks = () => {
        const tracks = audioTracksSignal.get();

        this.#audioTracks = tracks;
        this.#removeAudioTracks();

        if (!tracks.length) return;

        const resolved = untrack(() => findAudioTrackById(state.presentation.get(), state.selectedAudioTrackId.get()));

        for (const track of tracks) {
          const domTrack = this.addAudioTrack(track.default ? 'main' : 'alternative', track.name, track.language ?? '');

          domTrack.id = track.id;
          domTrack.enabled = isSameAudioTrack(toAudioKey(domTrack), resolved);
        }
      };

      const reflectSelectedAudio = () => {
        const resolved = findAudioTrackById(state.presentation.get(), state.selectedAudioTrackId.get());

        for (const track of this.audioTracks) {
          track.enabled = isSameAudioTrack(toAudioKey(track), resolved);
        }
      };

      // A source change (new manifest URL) invalidates any pinned selection:
      // rendition identity (width/height/bandwidth) and audio identity
      // (language/name) don't reliably carry across sources, so drop both pins
      // and let the engine re-pick for the new source.
      const sourceUrl = computed(() => state.presentation.get()?.url);
      const resetSelectionOnSourceChange = () => {
        sourceUrl.get();
        state.userVideoTrackSelection.set(undefined);
        state.userAudioTrackSelection.set(undefined);
      };

      const effectCleanups = [
        effect(reflectRenditions),
        effect(reflectSelectedVideo),
        effect(reflectAudioTracks),
        effect(reflectSelectedAudio),
        effect(resetSelectionOnSourceChange),
      ];

      this.videoRenditions.addEventListener('change', this.#selectRendition, { signal });
      this.audioTracks.addEventListener('change', this.#selectAudio, { signal });
      signal.addEventListener('abort', () => effectCleanups.forEach((cleanup) => cleanup()), { once: true });
    }

    destroy(): void {
      if (this.#destroyed) return;

      this.#destroyed = true;
      this.#abort.abort();
      this.#removeVideoTracks();
      this.#removeAudioTracks();
      super.destroy?.();
    }

    // Manual quality pin → the chosen rendition's width/height/bandwidth as the
    // match criteria (the properties renditions were deduped on).
    // `selectedIndex === -1` (Auto) clears the pin, resuming ABR.
    #selectRendition = () => {
      const { userVideoTrackSelection } = this.engine.state;
      const index = this.videoRenditions.selectedIndex;
      const domRendition = index < 0 ? undefined : this.videoRenditions[index];
      const rendition = this.#renditions.find((candidate) => candidate.id === domRendition?.id);

      userVideoTrackSelection.set(toUserVideoTrackSelection(rendition));
    };

    #selectAudio = () => {
      const { presentation, selectedAudioTrackId, userAudioTrackSelection } = this.engine.state;
      const resolved = findAudioTrackById(presentation.get(), selectedAudioTrackId.get());
      const current = [...this.audioTracks].find((track) => isSameAudioTrack(toAudioKey(track), resolved));

      // `enabled` is not exclusive like video `selected`, so prefer a newly
      // enabled track over the one that is already playing.
      const enabled = [...this.audioTracks].filter((track) => track.enabled);
      const target = enabled.find((track) => track !== current) ?? enabled[0];
      if (!target) return;

      // Disable the rest so future change events resolve unambiguously.
      for (const track of enabled) {
        if (track !== target) track.enabled = false;
      }

      // Skip the write when the enabled track is already the resolved one
      // that's this projection's own reflection (or a no-op re-affirm), not a user switch.
      if (target === current) return;

      const audioTrack = this.#audioTracks.find((candidate) => candidate.id === target.id);

      userAudioTrackSelection.set(toUserAudioTrackSelection(audioTrack));
    };

    #removeVideoTracks() {
      for (const videoTrack of [...this.videoTracks]) this.removeVideoTrack(videoTrack);
    }

    #removeAudioTracks() {
      for (const audioTrack of [...this.audioTracks]) this.removeAudioTrack(audioTrack);
    }
  }

  return HlsVideoMediaTracks as unknown as Base;
}
