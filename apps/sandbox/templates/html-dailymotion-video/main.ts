import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/dailymotion-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { DAILYMOTION_VIDEO_SRC } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <dailymotion-video class="block h-full w-full" src="${DAILYMOTION_VIDEO_SRC}" playsinline></dailymotion-video>
      </${skinTag}>
    </video-player>
  `,
});
