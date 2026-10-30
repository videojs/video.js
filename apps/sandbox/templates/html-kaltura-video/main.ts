import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/kaltura-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

createHtmlSandbox({
  player: 'video',
  // The poster and the title come from the Kaltura entry, so the markup names neither.
  render: ({ playerTag, skinTag, src, attrs }) => html`
    <${playerTag}>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <kaltura-video${src} ${attrs} playsinline crossorigin></kaltura-video>
      </${skinTag}>
    </${playerTag}>
  `,
});
