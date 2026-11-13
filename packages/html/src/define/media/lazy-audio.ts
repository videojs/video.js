import { LazyAudio } from '../../media/lazy-audio';
import { safeDefine } from '../../registration/safe-define';

/**
 * Plays audio from any supported source, loading only the media element it needs. Registered as `<lazy-audio>`.
 *
 * @experimental
 */
export class LazyAudioElement extends LazyAudio {
  static readonly tagName = 'lazy-audio';
}

safeDefine(LazyAudioElement);

declare global {
  interface HTMLElementTagNameMap {
    [LazyAudioElement.tagName]: LazyAudioElement;
  }
}
