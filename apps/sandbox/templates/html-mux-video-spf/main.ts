import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/live-video/player';
import '@videojs/html/extensions/google-cast';
import '@videojs/html/extensions/mux-data';
import '@videojs/html/media/mux-video/spf';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

// The SPF-backed `<mux-video>`, alongside the hls.js-backed `<mux-video>` in
// `html-mux-video`. Same element behavior — derived poster, storyboard track,
// `poster-time` — over the SPF engine.
//
// What differs is what it can play. This flavor composes `mpegTsTransmuxFeature`,
// so a plus- or basic-tier playback ID (MPEG-TS) plays by transmuxing to fMP4 on
// the client; the plain `<hls-video>` has no transmuxer and refuses it. DRM does
// play here — `source.drm` licenses it — except for the deliberately unlicensed
// asset, which is in the picker to be refused.
//
// Mux Data and Cast both work here, as on the hls.js-backed page. Cast is
// engine-agnostic — it hands the URL to the receiver. Mux Data monitors this
// flavor from the media element alone: its engine integrations are hls.js and
// dash.js, so an SPF engine gets element-level data and says so in dev.

createHtmlSandbox({
  player: 'video',
  live: true,
  render: ({ playerTag, skinTag, src, attrs, poster, placeholder }) => html`
    <${playerTag}${poster ? ` poster="${poster}"` : ''}>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <!-- The player fills in the poster; the slotted image paints a blurred placeholder underneath while it loads. -->
        ${placeholder ? html`<img slot="poster" alt="" crossorigin style="background: url('${placeholder}') var(--media-object-position, center) / contain no-repeat" />` : ''}
        <!-- The storyboard track is derived automatically from the Mux src. -->
        <mux-video${src} ${attrs} playsinline crossorigin></mux-video>
        <!-- Opt-in media components; no env key is needed for Mux-hosted sources. -->
        <mux-data player-software-name="mux-video"></mux-data>
        <google-cast></google-cast>
      </${skinTag}>
    </${playerTag}>
  `,
  // A source carrying signed tokens has no room in the `src` attribute, so it is
  // assigned as an object instead. A `drm.token` on the source is what licenses the
  // protected assets: the Adapter derives Mux's license servers from it.
  attach: ({ source }) => {
    if (source) document.querySelector('mux-video')!.source = source;
  },
});
