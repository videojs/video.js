import { TikTokVideo } from '../../media/tiktok-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  TikTokAdapter,
  TikTokAdapterProps,
  TikTokEngineConfig,
  TikTokSource,
  TikTokSourceEngineConfig,
} from '@videojs/tiktok-video';

export class TikTokVideoElement extends TikTokVideo {
  static readonly tagName = 'tiktok-video';
}

safeDefine(TikTokVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [TikTokVideoElement.tagName]: TikTokVideoElement;
  }
}
