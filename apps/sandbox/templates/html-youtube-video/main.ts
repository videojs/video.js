import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/media/youtube-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';
import { getYouTubeSource } from '@app/shared/sources';

createHtmlSandbox({
  player: 'video',
  // A source carrying YouTube player parameters has no room in the `src` attribute, so it is assigned as an object
  // below instead.
  render: ({ skinTag, src, state }) => html`
    <video-player>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <youtube-video class="block h-full w-full"${getYouTubeSource(state.source) ? '' : src} playsinline></youtube-video>
      </${skinTag}>
    </video-player>
  `,
  attach: ({ state }) => {
    const source = getYouTubeSource(state.source);

    if (source) document.querySelector('youtube-video')!.source = source;
  },
});
