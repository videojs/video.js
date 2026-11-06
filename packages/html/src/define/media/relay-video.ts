import { RelayVideo } from '../../media/relay-video';
import { safeDefine } from '../../registration/safe-define';

export type { RelaySource, RelaySubscriberView, RelayVideoAdapter } from '@videojs/relay-video';

/**
 * `<relay-video>`: plays a live Mux Relay broadcast from a subscriber the application holds, assigned through `source`.
 *
 * @internal
 */
export class RelayVideoElement extends RelayVideo {
  static readonly tagName = 'relay-video';
}

safeDefine(RelayVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [RelayVideoElement.tagName]: RelayVideoElement;
  }
}
