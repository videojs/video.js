import { HlsJsVideo } from '../../media/hlsjs-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  HlsEngineConfig,
  HlsJsAdapter,
  HlsJsAdapterProps,
  HlsSource,
  PlaybackType,
  PreloadType,
  SourceType,
  StreamType,
} from '@videojs/hlsjs-video';

/** Cross-browser HLS media component powered by hls.js and registered as `<hlsjs-video>`. */
export class HlsJsVideoElement extends HlsJsVideo {
  static readonly tagName = 'hlsjs-video';
}

safeDefine(HlsJsVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [HlsJsVideoElement.tagName]: HlsJsVideoElement;
  }
}
