import { TwitchVideo } from '../../media/twitch-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  TwitchAdapter,
  TwitchAdapterProps,
  TwitchEngineConfig,
  TwitchSource,
  TwitchSourceEngineConfig,
} from '@videojs/twitch-video';

export class TwitchVideoElement extends TwitchVideo {
  static readonly tagName = 'twitch-video';
}

safeDefine(TwitchVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [TwitchVideoElement.tagName]: TwitchVideoElement;
  }
}
