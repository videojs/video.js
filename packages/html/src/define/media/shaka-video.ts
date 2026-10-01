import { ShakaVideo } from '../../media/shaka-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  ShakaAdapter,
  ShakaAdapterProps,
  ShakaConfig,
  ShakaEngineConfig,
  ShakaSource,
} from '@videojs/shaka-video';

export class ShakaVideoElement extends ShakaVideo {
  static readonly tagName = 'shaka-video';
}

safeDefine(ShakaVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [ShakaVideoElement.tagName]: ShakaVideoElement;
  }
}
