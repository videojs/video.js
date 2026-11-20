import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/cloudflare-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { CLOUDFLARE_VIDEO_SRC } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, attrs }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <cloudflare-video src="${CLOUDFLARE_VIDEO_SRC}" ${attrs} playsinline></cloudflare-video>
      </${skinTag}>
    </video-player>
  `,
});
