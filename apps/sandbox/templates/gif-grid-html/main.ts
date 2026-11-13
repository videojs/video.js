import '@app/styles.css';
// A grid of GIFs that play on hover — HTML
// http://localhost:5173/gif-grid-html/
//
// Each tile is its own <gif-player>; hovering or focusing a tile plays it,
// leaving pauses and rewinds it through the player's store.
import '@app/usecases/gif-video/element';
import '@app/usecases/gif-video/skin/html';
import type { GifPlayerElement } from '@app/usecases/gif-video/skin/html';
import { GIF_SOURCES } from '@app/usecases/gif-video/sources';
import { escapeHtml } from '@videojs/utils/string';

const html = String.raw;
const root = document.getElementById('root')!;

root.innerHTML = html`
  <div class="grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
    ${[...GIF_SOURCES, ...GIF_SOURCES]
      .map(
        (source) => html`
          <gif-player tabindex="0" class="block aspect-square">
            <gif-skin minimal class="h-full">
              <gif-video
                class="block h-full w-full"
                style="--media-object-fit: cover"
                src="${escapeHtml(source.url)}"
                loop
                preload="auto"
              ></gif-video>
            </gif-skin>
          </gif-player>
        `
      )
      .join('')}
  </div>
`;

// A wall of tiles animating under the cursor is what the motion preference exists to stop; a tap still plays.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

for (const player of root.querySelectorAll<GifPlayerElement>('gif-player')) {
  const play = () => {
    if (!reducedMotion.matches) void player.store.play().catch(() => undefined);
  };
  // Seeking by frame pauses first, so this both stops the tile and puts it back on its first frame.
  const rewind = () => player.store.seekToFrame(0);

  player.addEventListener('pointerenter', play);
  player.addEventListener('focus', play);
  player.addEventListener('pointerleave', rewind);
  player.addEventListener('blur', rewind);
}
