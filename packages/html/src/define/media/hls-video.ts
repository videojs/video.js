import { HlsVideo } from '../../media/hls-video';
import { safeDefine } from '../../registration/safe-define';

/** Lightweight SPF-backed HLS media component registered as `<hls-video>`. */
export class HlsVideoElement extends HlsVideo {
  static readonly tagName = 'hls-video';
}

safeDefine(HlsVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [HlsVideoElement.tagName]: HlsVideoElement;
  }
}
