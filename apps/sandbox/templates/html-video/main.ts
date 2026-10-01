import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/extensions/google-cast';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, src, attrs, chapters, storyboard, poster }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <video${src} ${attrs} playsinline crossorigin>
          ${chapters}
          ${storyboard}
        </video>
        ${poster ? html`<img slot="poster" src="${poster}" alt="Video poster" crossorigin />` : ''}
        <!-- Cast works with a plain <video>; the extension goes anywhere inside the player. -->
        <google-cast></google-cast>
      </${skinTag}>
    </video-player>
  `,
});
