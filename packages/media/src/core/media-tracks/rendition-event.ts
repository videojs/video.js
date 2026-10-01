import type { AudioRendition } from './audio-rendition';
import type { VideoRendition } from './video-rendition';

/** @internal */
export class RenditionEvent extends Event {
  rendition: AudioRendition | VideoRendition;

  constructor(type: string, init: { rendition: AudioRendition | VideoRendition }) {
    super(type);
    this.rendition = init.rendition;
  }
}
