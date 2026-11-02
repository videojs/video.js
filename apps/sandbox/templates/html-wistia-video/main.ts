import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/wistia-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { WISTIA_VIDEO_SRC } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, attrs }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <wistia-video class="block h-full w-full" src="${WISTIA_VIDEO_SRC}" ${attrs} playsinline></wistia-video>
      </${skinTag}>
    </video-player>
  `,
});
