import '@app/styles.css';
import '@videojs/html/audio/player';
import '@videojs/html/live-audio/player';
import '@videojs/html/extensions/google-cast';
import '@videojs/html/media/mux-audio';
import '@videojs/html/extensions/mux-data';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

// `<mux-audio>` as it is imported by default: the SPF-backed flavor, over the
// *audio-only* engine, so only the audio renditions of the playback ID are
// fetched. The hls.js-backed one in `html-mux-audio-hls-js` runs the full engine
// and downloads video renditions it never plays.
//
// This flavor composes `mpegTsAudioTransmuxFeature`, so an audio-only MPEG-TS
// playback ID plays by transmuxing to fMP4 on the client. A plus-tier *video*
// asset plays too: Mux muxes its audio into the video segments, so this flavor
// fetches the lowest-bandwidth variant's segments and keeps only their AAC.

createHtmlSandbox({
  player: 'audio',
  live: true,
  render: ({ playerTag, skinTag, src, attrs }) => html`
    <div class="mx-auto w-full max-w-xl">
      <${playerTag}>
        <${skinTag}>
          <mux-audio${src} ${attrs} crossorigin></mux-audio>
          <!--
            Both are opt-in media components, and no env key is needed for Mux-hosted sources.
            Mux Data monitors this flavor from the media element alone: its engine integrations are
            hls.js and dash.js, so an SPF engine gets element-level data and says so in dev.
          -->
          <mux-data player-software-name="mux-audio"></mux-data>
          <google-cast></google-cast>
        </${skinTag}>
      </${playerTag}>
    </div>
  `,
  // A source carrying signed tokens has no room in the `src` attribute, so it is
  // assigned as an object instead — the same way `html-mux-video` does.
  // `source.drm` is accepted but inert here: the audio-only engine composes no
  // EME, and Mux leaves audio renditions clear.
  attach: ({ source }) => {
    if (source) document.querySelector('mux-audio')!.source = source;
  },
});
