import '@app/styles.css';
// Animated GIF as a Video.js media — HTML
// http://localhost:5173/gif-video-html/
//
// `<gif-video>` fetches and decodes the GIF itself and paints frames onto a
// canvas on its own clock, so the player can pause, seek, loop, and change
// rate. The plain `<img>` beside it is the browser's rendering of the same
// file, which does none of that.
import '@videojs/html/video/player';
import '@app/usecases/gif-video/element';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { GIF_VIDEO_SRC } from '@app/usecases/gif-video/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag }) => html`
    <div class="flex flex-col items-center gap-6">
      <video-player>
        <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
          <gif-video class="block h-full w-full" src="${GIF_VIDEO_SRC}" loop></gif-video>
        </${skinTag}>
      </video-player>
      <figure class="flex flex-col items-center gap-2 text-sm opacity-70">
        <img class="h-32 w-auto rounded" src="${GIF_VIDEO_SRC}" alt="The same GIF rendered by the browser" />
        <figcaption>The same file as an <code>&lt;img&gt;</code>: it just loops.</figcaption>
      </figure>
    </div>
  `,
});
