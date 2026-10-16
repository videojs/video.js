import '@app/styles.css';
import '@videojs/html/audio/player';
import '@videojs/html/media/soundcloud-audio';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

createHtmlSandbox({
  player: 'audio',
  render: ({ skinTag, src }) => html`
    <div class="mx-auto w-full max-w-xl">
      <audio-player>
        <${skinTag}>
          <soundcloud-audio${src}></soundcloud-audio>
        </${skinTag}>
      </audio-player>
    </div>
  `,
});
