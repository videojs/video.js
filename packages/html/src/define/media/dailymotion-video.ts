import { DailymotionVideo } from '../../media/dailymotion-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  DailymotionAdapter,
  DailymotionAdapterProps,
  DailymotionEngineConfig,
  DailymotionPlayerApi,
  DailymotionPlayerError,
  DailymotionPlayerState,
  DailymotionSource,
  DailymotionSourceEngineConfig,
} from '@videojs/dailymotion-video';

export class DailymotionVideoElement extends DailymotionVideo {
  static readonly tagName = 'dailymotion-video';
}

safeDefine(DailymotionVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [DailymotionVideoElement.tagName]: DailymotionVideoElement;
  }
}
