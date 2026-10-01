import { activeChanged, selectedChanged } from './video-rendition-list';

/**
 * The consumer should use the `selected` setter to select one or multiple renditions that the engine is allowed to
 * play.
 *
 * @internal
 */
export class VideoRendition {
  src: string | undefined;
  id: string | undefined;
  width: number | undefined;
  height: number | undefined;
  bitrate: number | undefined;
  frameRate: number | undefined;
  codec: string | undefined;
  #selected = false;
  #active = false;

  get selected(): boolean {
    return this.#selected;
  }

  set selected(value: boolean) {
    if (this.#selected === value) return;

    this.#selected = value;

    selectedChanged(this);
  }

  get active(): boolean {
    return this.#active;
  }

  set active(value: boolean) {
    if (this.#active === value) return;

    this.#active = value;

    activeChanged(this);
  }
}
