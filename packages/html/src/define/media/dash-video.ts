import { DashVideo } from '../../media/dash-video';
import { safeDefine } from '../../registration/safe-define';

export type { DashAdapter, DashAdapterProps, DashEngineConfig, DashSource } from '@videojs/dash-video';

/**
 * MPEG-DASH media component powered by dash.js and registered as `<dash-video>`.
 *
 * @experimental
 */
export class DashVideoElement extends DashVideo {
  static readonly tagName = 'dash-video';
}

safeDefine(DashVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [DashVideoElement.tagName]: DashVideoElement;
  }
}
