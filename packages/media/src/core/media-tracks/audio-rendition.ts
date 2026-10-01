import { selectedChanged } from './audio-rendition-list';

/**
 * The consumer should use the `selected` setter to select one or multiple renditions that the engine is allowed to
 * play.
 *
 * @internal
 */
export class AudioRendition {
  src: string | undefined;
  id: string | undefined;
  bitrate: number | undefined;
  codec: string | undefined;
  #selected = false;

  get selected(): boolean {
    return this.#selected;
  }

  set selected(value: boolean) {
    if (this.#selected === value) return;

    this.#selected = value;

    selectedChanged(this);
  }
}
