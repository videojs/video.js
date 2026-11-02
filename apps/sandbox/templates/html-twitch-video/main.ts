import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/twitch-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { TWITCH_VIDEO_SRC } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, attrs }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <twitch-video class="block h-full w-full" src="${TWITCH_VIDEO_SRC}" ${attrs} playsinline></twitch-video>
      </${skinTag}>
    </video-player>
  `,
});
