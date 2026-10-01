import type { AudioTrack } from './audio-track';
import type { VideoTrack } from './video-track';

/** @internal */
export class TrackEvent extends Event {
  track: AudioTrack | VideoTrack;

  constructor(type: string, init: { track: AudioTrack | VideoTrack }) {
    super(type);
    this.track = init.track;
  }
}
