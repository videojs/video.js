// The player, skin, and `<lazy-audio>`, split out so light mode loads none of them until play is pressed.
import '@videojs/html/audio/player';
import '@videojs/html/audio/skin';
import '@videojs/html/audio/skin.css';
import '@videojs/html/media/lazy-audio';
import { LAZY_DEMO_CLASSES, type MountLazyPlayer } from '@app/shared/lazy-sources';

import { mountHtmlPlayer } from './html';

export const mount: MountLazyPlayer = (stage, options) =>
  mountHtmlPlayer(stage, options, {
    player: 'audio-player',
    skin: 'audio-skin',
    media: 'lazy-audio',
    skinClass: LAZY_DEMO_CLASSES.audioFrame,
  });
