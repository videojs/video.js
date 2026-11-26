import '@app/styles.css';
// A skin built for GIFs — HTML
// http://localhost:5173/gif-skin-html/
//
// HTML equivalent of gif-skin-react: `<gif-player>` owns a store with the GIF
// feature, `<gif-skin>` is a shadow-DOM skin composed from the stock media-*
// elements plus three buttons of its own, and `<gif-video>` is the media.
import '@app/usecases/gif-video/element';
import '@app/usecases/gif-video/skin/html';
import { GIF_SOURCES } from '@app/usecases/gif-video/sources';
import { escapeHtml } from '@videojs/utils/string';

const html = String.raw;
// Autoplay follows the viewer's motion preference; the skin shows why it waited.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const root = document.getElementById('root')!;

root.innerHTML = html`
  <div class="flex w-full max-w-2xl flex-col items-stretch gap-4">
    <gif-player>
      <gif-skin class="w-full">
        <gif-video
          class="block max-h-[70vh] w-full"
          src="${GIF_SOURCES[0]!.url}"
          ${reducedMotion ? '' : 'autoplay'}
          loop
        ></gif-video>
      </gif-skin>
    </gif-player>
    <div class="flex flex-wrap items-center justify-center gap-2 text-sm" id="sources">
      ${GIF_SOURCES.map(
        (source, index) => html`
          <button
            type="button"
            class="rounded-full border px-3 py-1 aria-pressed:bg-neutral-900 aria-pressed:text-white dark:aria-pressed:bg-white dark:aria-pressed:text-black"
            aria-pressed="${index === 0}"
            data-src="${escapeHtml(source.url)}"
          >
            ${escapeHtml(source.label)}
          </button>
        `
      ).join('')}
    </div>
    <p class="text-center text-sm opacity-70">
      Tap the GIF to pause it. Step frames while paused, drag the bar to scrub, copy the frame you land on.
    </p>
  </div>
`;

root.querySelector('#sources')!.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-src]') : null;
  if (!button) return;

  for (const sibling of button.parentElement!.querySelectorAll('button')) {
    sibling.setAttribute('aria-pressed', String(sibling === button));
  }

  root.querySelector('gif-video')!.setAttribute('src', button.dataset.src!);
});
