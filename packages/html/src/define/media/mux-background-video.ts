import { MuxBackgroundVideo } from '../../media/mux-background-video';
import { safeDefine } from '../../registration/safe-define';

/**
 * `<mux-background-video>` — the Mux-flavored tag for `<hls-background-video>`.
 *
 * A distinct subclass rather than a re-export because a custom-element class can hold one tag name: registering the
 * same class twice throws. The behavior is entirely `MuxBackgroundVideo`'s.
 */
export class MuxBackgroundVideoElement extends MuxBackgroundVideo {
  static readonly tagName = 'mux-background-video';
}

safeDefine(MuxBackgroundVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [MuxBackgroundVideoElement.tagName]: MuxBackgroundVideoElement;
  }
}
