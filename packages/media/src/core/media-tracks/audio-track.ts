import { AudioRendition } from './audio-rendition';
import { addRendition, removeRendition } from './audio-rendition-list';
import { enabledChanged } from './audio-track-list';

/** @internal */
export const AudioTrackKind = {
  alternative: 'alternative',
  descriptions: 'descriptions',
  main: 'main',
  'main-desc': 'main-desc',
  translation: 'translation',
  commentary: 'commentary',
};

/** @internal */
export class AudioTrack {
  id: string | undefined;
  kind: string | undefined;
  label = '';
  language = '';
  sourceBuffer: unknown;
  #enabled = false;

  addRendition(src: string, codec?: string, bitrate?: number) {
    const rendition = new AudioRendition();

    rendition.src = src;
    rendition.codec = codec;
    rendition.bitrate = bitrate;
    addRendition(this, rendition);
    return rendition;
  }

  removeRendition(rendition: AudioRendition) {
    removeRendition(rendition);
  }

  get enabled(): boolean {
    return this.#enabled;
  }

  set enabled(value: boolean) {
    if (this.#enabled === value) return;

    this.#enabled = value;

    enabledChanged(this);
  }
}
