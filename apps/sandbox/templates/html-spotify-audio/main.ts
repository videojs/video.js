import '@app/styles.css';
import '@videojs/html/audio/player';
import '@videojs/html/media/spotify-audio';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { SPOTIFY_AUDIO_SRC } from '@app/shared/sources';

createHtmlSandbox({
  player: 'audio',
  render: ({ skinTag, attrs }) => html`
    <div class="mx-auto w-full max-w-xl">
      <audio-player>
        <${skinTag}>
          <!-- Hidden unless it is showing Spotify's own chrome, so it takes no room and needs no size. -->
          <spotify-audio src="${SPOTIFY_AUDIO_SRC}" ${attrs}></spotify-audio>
        </${skinTag}>
      </audio-player>
    </div>
  `,
});
