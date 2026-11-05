import { LazyVideo } from '../../media/lazy-video';
import { safeDefine } from '../../registration/safe-define';

/**
 * Plays a video from any supported source, loading only the media element it needs. Registered as `<lazy-video>`.
 *
 * @experimental
 */
export class LazyVideoElement extends LazyVideo {
  static readonly tagName = 'lazy-video';
}

safeDefine(LazyVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [LazyVideoElement.tagName]: LazyVideoElement;
  }
}
