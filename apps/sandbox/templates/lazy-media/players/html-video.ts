// The player, skin, and `<lazy-video>`, split out so light mode loads none of them until play is pressed.
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/video/skin.css';
import '@videojs/html/media/lazy-video';
import type { MountLazyPlayer } from '@app/shared/lazy-sources';

import { mountHtmlPlayer } from './html';

export const mount: MountLazyPlayer = (stage, options) =>
  mountHtmlPlayer(stage, options, {
    player: 'video-player',
    skin: 'video-skin',
    media: 'lazy-video',
    skinClass: 'sandbox-video-frame',
  });
