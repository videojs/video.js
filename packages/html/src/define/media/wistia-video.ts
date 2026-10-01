import { WistiaVideo } from '../../media/wistia-video';
import { safeDefine } from '../../registration/safe-define';

export type { WistiaAdapter, WistiaAdapterProps, WistiaQuality, WistiaSource } from '@videojs/wistia-video';

export class WistiaVideoElement extends WistiaVideo {
  static readonly tagName = 'wistia-video';
}

safeDefine(WistiaVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [WistiaVideoElement.tagName]: WistiaVideoElement;
  }
}
