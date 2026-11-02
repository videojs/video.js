import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/tiktok-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { TIKTOK_VIDEO_SRC } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, attrs }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <!-- The host element floors itself at TikTok's portrait 325x578; clear that so it fits a landscape box. -->
        <tiktok-video class="block h-full min-h-0 w-full min-w-0" src="${TIKTOK_VIDEO_SRC}" ${attrs} playsinline></tiktok-video>
      </${skinTag}>
    </video-player>
  `,
});
