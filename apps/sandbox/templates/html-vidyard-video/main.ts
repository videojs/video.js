import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/vidyard-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { SOURCES } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  render: ({ skinTag, src, attrs, state }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <vidyard-video${src} ${attrs}${SOURCES[state.source].controls ? ' controls' : ''} playsinline></vidyard-video>
      </${skinTag}>
    </video-player>
  `,
});
