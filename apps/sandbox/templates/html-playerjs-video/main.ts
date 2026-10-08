import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/playerjs-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, src }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <playerjs-video class="block h-full w-full"${src} playsinline></playerjs-video>
      </${skinTag}>
    </video-player>
  `,
});
