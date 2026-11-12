import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/hyperframes-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { HYPERFRAMES_VIDEO_SRC } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, attrs }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <hyperframes-video class="block h-full w-full" src="${HYPERFRAMES_VIDEO_SRC}" ${attrs} playsinline></hyperframes-video>
      </${skinTag}>
    </video-player>
  `,
});
