import { KalturaVideo } from '../../media/kaltura-video';
import { safeDefine } from '../../registration/safe-define';

export type { KalturaSource, KalturaVideoAdapter, KalturaVideoAdapterProps } from '@videojs/kaltura-video';

/** Kaltura media component that plays Kaltura entries through hls.js, registered as `<kaltura-video>`. */
export class KalturaVideoElement extends KalturaVideo {
  static readonly tagName = 'kaltura-video';
}

safeDefine(KalturaVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [KalturaVideoElement.tagName]: KalturaVideoElement;
  }
}
