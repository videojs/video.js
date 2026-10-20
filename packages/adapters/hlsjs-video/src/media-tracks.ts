import type {
  MediaAudioTrackCapability,
  MediaVideoRenditionCapability,
  MediaVideoTrackCapability,
  VideoRenditionLike,
  VideoTrackLike,
} from '@videojs/media';
import type { Constructor } from '@videojs/utils/types';
import Hls from 'hls.js';

import type { HlsEngineHost } from './types';

type MediaTracksHost = HlsEngineHost &
  MediaVideoTrackCapability &
  MediaAudioTrackCapability &
  MediaVideoRenditionCapability;

type HlsJsMediaTrackLevel = {
  url: string[];
  width?: number | undefined;
  height?: number | undefined;
  videoCodec?: string | undefined;
  bitrate?: number | undefined;
};

type HlsJsMediaAudioTrack = {
  id: number;
  default?: boolean | undefined;
  name?: string | undefined;
  lang?: string | undefined;
};

// hls.js may rebuild its levels array with new object references between
// events, so key levels by their identifying attributes instead of identity.
function getLevelKey(level: HlsJsMediaTrackLevel): string {
  return `${level.url[0] ?? ''}|${level.width}x${level.height}|${level.videoCodec}|${level.bitrate}`;
}

function getAudioTrackKind(audioTrack: HlsJsMediaAudioTrack): string {
  return audioTrack.default ? 'main' : 'alternative';
}

/**
 * Mirrors hls.js manifest levels and alternate audio into the media element's `videoRenditions` / `audioTracks` lists,
 * and wires user selection back to `engine.nextLevel` and `engine.audioTrack`.
 *
 * Requires the media-tracks mixin (track-list infrastructure) to be applied earlier in the chain so the host exposes
 * `addVideoTrack`, `videoRenditions`, and friends.
 */
export function HlsJsMediaTracksMixin<Base extends Constructor<MediaTracksHost>>(BaseClass: Base) {
  class HlsJsMediaTracks extends (BaseClass as Constructor<MediaTracksHost>) {
    #levelIdMap = new Map<string, string>();
    #currentVideoTrack: VideoTrackLike | null = null;

    constructor(...args: any[]) {
      super(...args);

      const { engine } = this;
      if (!engine) return;

      engine.on(Hls.Events.MANIFEST_PARSED, this.#onManifestParsed);
      engine.on(Hls.Events.AUDIO_TRACKS_UPDATED, this.#onAudioTracksUpdated);
      engine.on(Hls.Events.AUDIO_TRACK_SWITCHING, this.#onAudioTrackSwitch);
      engine.on(Hls.Events.AUDIO_TRACK_SWITCHED, this.#onAudioTrackSwitch);
      engine.on(Hls.Events.LEVELS_UPDATED, this.#onLevelsUpdated);
      engine.on(Hls.Events.LEVEL_SWITCHED, this.#onLevelSwitched);
      engine.once(Hls.Events.DESTROYING, this.#teardown);

      this.audioTracks.addEventListener('change', this.#switchAudioTrack);
      this.videoRenditions.addEventListener('change', this.#switchRendition);
    }

    #onManifestParsed = (_event: string, data: { levels: HlsJsMediaTrackLevel[] }) => {
      this.#removeAllMediaTracks();
      this.#levelIdMap.clear();

      const videoTrack = this.addVideoTrack('main');

      this.#currentVideoTrack = videoTrack;
      videoTrack.selected = true;

      for (const [id, level] of data.levels.entries()) {
        const rendition = videoTrack.addRendition(
          level.url[0] ?? '',
          level.width,
          level.height,
          level.videoCodec,
          level.bitrate
        );

        this.#levelIdMap.set(getLevelKey(level), `${id}`);
        rendition.id = `${id}`;
      }
    };

    // hls.js re-emits this whenever the active audio group changes, which a
    // rendition switch can trigger mid-playback. Skip the rebuild when the set
    // is unchanged so the list (and its selection) survives the group switch.
    #onAudioTracksUpdated = (_event: string, data: { audioTracks: HlsJsMediaAudioTrack[] }) => {
      if (this.#audioTracksMatch(data.audioTracks)) return;

      this.#removeAudioTracks();

      for (const hlsAudioTrack of data.audioTracks) {
        const audioTrack = this.addAudioTrack(getAudioTrackKind(hlsAudioTrack), hlsAudioTrack.name, hlsAudioTrack.lang);

        audioTrack.id = `${hlsAudioTrack.id}`;
      }
    };

    // `enabled` is owned by the engine's switch events rather than seeded from
    // `.default`, because hls.js already carries a selection across audio groups
    // and re-announces it here.
    #onAudioTrackSwitch = (_event: string, data: { id: number }) => {
      const selectedId = `${data.id}`;

      for (const audioTrack of this.audioTracks) {
        audioTrack.enabled = audioTrack.id === selectedId;
      }
    };

    // hls.js reindexes track ids per audio group, so compare the identifying
    // attributes rather than relying on object identity or ids alone.
    #audioTracksMatch(hlsAudioTracks: HlsJsMediaAudioTrack[]): boolean {
      const currentTracks = [...this.audioTracks];
      if (currentTracks.length !== hlsAudioTracks.length) return false;

      return hlsAudioTracks.every((hlsAudioTrack, index) => {
        const audioTrack = currentTracks[index];

        return (
          audioTrack?.id === `${hlsAudioTrack.id}` &&
          audioTrack.kind === getAudioTrackKind(hlsAudioTrack) &&
          audioTrack.label === (hlsAudioTrack.name ?? '') &&
          audioTrack.language === (hlsAudioTrack.lang ?? '')
        );
      });
    }

    #switchAudioTrack = () => {
      const { engine } = this;
      if (!engine) return;

      // `enabled` is not exclusive like video `selected`, so prefer a newly
      // enabled track over the one that is already playing.
      const enabledTracks = [...this.audioTracks].filter((track) => track.enabled);
      const selectedTrack = enabledTracks.find((track) => Number(track.id) !== engine.audioTrack) ?? enabledTracks[0];
      if (!selectedTrack?.id) return;

      const audioTrackId = Number(selectedTrack.id);
      const availableIds = engine.audioTracks.map((track) => track.id);

      if (audioTrackId !== engine.audioTrack && availableIds.includes(audioTrackId)) {
        engine.audioTrack = audioTrackId;
      }

      // Disable the rest so future change events resolve unambiguously.
      for (const track of enabledTracks) {
        if (track !== selectedTrack) track.enabled = false;
      }
    };

    // hls.js renumbers its levels whenever the set changes, so the ids seeded at MANIFEST_PARSED go stale the moment
    // it does. Rebuild from the incoming levels so LEVEL_SWITCHED and rendition ids keep speaking one numbering.
    #onLevelsUpdated = (_event: string, data: { levels: HlsJsMediaTrackLevel[] }) => {
      const videoTrack = this.#currentVideoTrack;
      if (!videoTrack) return;

      const renditionByOldId = new Map<string, VideoRenditionLike>();

      for (const rendition of this.videoRenditions) {
        if (rendition.id) renditionByOldId.set(rendition.id, rendition);
      }

      const nextLevelIdMap = new Map<string, string>();
      const current = new Set<VideoRenditionLike>();

      for (const [index, level] of data.levels.entries()) {
        const key = getLevelKey(level);
        const id = `${index}`;
        const oldId = this.#levelIdMap.get(key);
        const existing = oldId === undefined ? undefined : renditionByOldId.get(oldId);

        // An incoming level with no rendition is new rather than gone: hls.js also replaces the set outright, on a
        // content-steering pathway switch, where every key misses and pruning alone would empty the list.
        const rendition =
          existing ??
          videoTrack.addRendition(level.url[0] ?? '', level.width, level.height, level.videoCodec, level.bitrate);

        rendition.id = id;
        current.add(rendition);
        nextLevelIdMap.set(key, id);
      }

      // Snapshot first: removeRendition mutates the collection being walked.
      for (const rendition of [...this.videoRenditions]) {
        if (rendition.id && !current.has(rendition)) videoTrack.removeRendition(rendition);
      }

      this.#levelIdMap = nextLevelIdMap;

      // hls.js rewrites its own manualLevelIndex when it drops a level, so a manual pick has to be re-asserted
      // against the new numbering or the menu keeps showing a choice the engine no longer honours.
      if (this.videoRenditions.selectedIndex >= 0) this.#switchRendition();
    };

    #onLevelSwitched = (_event: string, data: { level: number }) => {
      const activeId = `${data.level}`;

      for (const rendition of this.videoRenditions) {
        rendition.active = rendition.id === activeId;
      }
    };

    #switchRendition = () => {
      const { engine } = this;
      if (!engine) return;

      // The id carries the hls.js level index, which only coincides with the list position while the two are in step.
      const selected = [...this.videoRenditions][this.videoRenditions.selectedIndex];
      const level = selected?.id ? Number(selected.id) : this.videoRenditions.selectedIndex;

      // The `nextLevel` getter reports the next buffered fragment's level, not
      // the requested one, so compare against `manualLevel` (-1 in auto mode).
      if (level !== engine.manualLevel) engine.nextLevel = level;
    };

    #teardown = () => {
      const { engine } = this;

      engine?.off(Hls.Events.MANIFEST_PARSED, this.#onManifestParsed);
      engine?.off(Hls.Events.AUDIO_TRACKS_UPDATED, this.#onAudioTracksUpdated);
      engine?.off(Hls.Events.AUDIO_TRACK_SWITCHING, this.#onAudioTrackSwitch);
      engine?.off(Hls.Events.AUDIO_TRACK_SWITCHED, this.#onAudioTrackSwitch);
      engine?.off(Hls.Events.LEVELS_UPDATED, this.#onLevelsUpdated);
      engine?.off(Hls.Events.LEVEL_SWITCHED, this.#onLevelSwitched);
      engine?.off(Hls.Events.DESTROYING, this.#teardown);

      this.audioTracks.removeEventListener('change', this.#switchAudioTrack);
      this.videoRenditions.removeEventListener('change', this.#switchRendition);

      this.#removeAllMediaTracks();
      this.#levelIdMap.clear();
      this.#currentVideoTrack = null;
    };

    #removeAllMediaTracks() {
      this.#removeVideoTracks();
      this.#removeAudioTracks();
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

  return HlsJsMediaTracks as unknown as Base;
}
