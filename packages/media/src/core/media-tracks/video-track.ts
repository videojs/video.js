import { VideoRendition } from './video-rendition';
import { addRendition, removeRendition } from './video-rendition-list';
import { selectedChanged } from './video-track-list';

/** @internal */
export const VideoTrackKind = {
  alternative: 'alternative',
  captions: 'captions',
  main: 'main',
  sign: 'sign',
  subtitles: 'subtitles',
  commentary: 'commentary',
};

/** @internal */
export class VideoTrack {
  id: string | undefined;
  kind: string | undefined;
  label = '';
  language = '';
  sourceBuffer: unknown;
  #selected = false;

  addRendition(src: string, width?: number, height?: number, codec?: string, bitrate?: number, frameRate?: number) {
    const rendition = new VideoRendition();

    rendition.src = src;
    rendition.width = width;
    rendition.height = height;
    rendition.frameRate = frameRate;
    rendition.bitrate = bitrate;
    rendition.codec = codec;
    addRendition(this, rendition);
    return rendition;
  }

  removeRendition(rendition: VideoRendition) {
    removeRendition(rendition);
  }

  get selected(): boolean {
    return this.#selected;
  }

  set selected(value: boolean) {
    if (this.#selected === value) return;

    this.#selected = value;

    if (value !== true) return;

    selectedChanged(this);
  }
}
