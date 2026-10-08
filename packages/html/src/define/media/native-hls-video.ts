import { NativeHlsVideo } from '../../media/native-hls-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  NativeHlsAdapter,
  NativeHlsAdapterProps,
  NativeHlsConfig,
  NativeHlsEngineConfig,
  NativeHlsSource,
  PreloadType,
  StreamType,
} from '@videojs/native-hls-video';

/** Browser-native HLS media component registered as `<native-hls-video>`. */
export class NativeHlsVideoElement extends NativeHlsVideo {
  static readonly tagName = 'native-hls-video';
}

safeDefine(NativeHlsVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [NativeHlsVideoElement.tagName]: NativeHlsVideoElement;
  }
}
