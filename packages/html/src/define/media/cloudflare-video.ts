import { CloudflareVideo } from '../../media/cloudflare-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  CloudflareAdapter,
  CloudflareAdapterProps,
  CloudflareEngineConfig,
  CloudflareSource,
  CloudflareSourceEngineConfig,
  CloudflareStreamPlayerApi,
} from '@videojs/cloudflare-video';

export class CloudflareVideoElement extends CloudflareVideo {
  static readonly tagName = 'cloudflare-video';
}

safeDefine(CloudflareVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [CloudflareVideoElement.tagName]: CloudflareVideoElement;
  }
}
