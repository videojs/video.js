import '@app/styles.css';
// Media woofer sandbox: the player shakes along with the bass once playback starts from a click.
// http://localhost:5173/media-woofer-html/?source=hls-5 (a bass-heavy trailer)
import '@videojs/html/video/player';
import '@videojs/html/media/hls-video';
import '@videojs/html/extensions/media-woofer';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, src, attrs, chapters, storyboard, poster }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <hls-video${src} ${attrs} playsinline crossorigin>
          ${chapters}
          ${storyboard}
        </hls-video>
        ${poster ? html`<img slot="poster" src="${poster}" alt="Video poster" crossorigin />` : ''}
        <media-woofer></media-woofer>
      </${skinTag}>
    </video-player>
  `,
});
