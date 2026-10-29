import '@app/styles.css';
import '@videojs/html/audio/player';
import '@videojs/html/media/mixcloud-audio';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { SOURCES } from '@app/shared/sources';

createHtmlSandbox({
  player: 'audio',
  render: ({ skinTag, src, state }) => html`
    <div class="mx-auto w-full max-w-xl">
      <audio-player>
        <${skinTag}>
          <!-- Hidden unless it is showing Mixcloud's own chrome, so it takes no room and needs no size. -->
          <mixcloud-audio${src}${SOURCES[state.source].controls ? ' controls' : ''}></mixcloud-audio>
        </${skinTag}>
      </audio-player>
    </div>
  `,
});
