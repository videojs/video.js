import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/live-video/player';
import '@videojs/html/extensions/google-cast';
import '@videojs/html/extensions/mux-data';
import '@videojs/html/media/mux-video';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

// `<mux-video>` as it is imported by default: the SPF-backed flavor. The
// hls.js-backed one is in `html-mux-video-hls-js`, with the same element
// behavior — derived poster, storyboard track, `poster-time`.
//
// This flavor composes `mpegTsTransmuxFeature`, so a plus- or basic-tier playback
// ID (MPEG-TS) plays by transmuxing to fMP4 on the client; the plain `<hls-video>`
// has no transmuxer and refuses it. DRM plays here — `source.drm` licenses it —
// except for the deliberately unlicensed asset, which is in the picker to be
// refused.
//
// Mux Data and Cast both work here, as on the hls.js-backed page. Cast is
// engine-agnostic — it hands the URL to the receiver. Mux Data monitors this
// flavor from the media element alone: its engine integrations are hls.js and
// dash.js, so an SPF engine gets element-level data and says so in dev.

createHtmlSandbox({
  player: 'video',
  live: true,
  render: ({ playerTag, skinTag, src, attrs, chapters, poster, placeholder }) => html`
    <${playerTag}${poster ? ` poster="${poster}"` : ''}>
      <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
        <!-- The player fills in the poster; the slotted image paints a blurred placeholder underneath while it loads. -->
        ${placeholder ? html`<img slot="poster" alt="" crossorigin style="background: url('${placeholder}') var(--media-object-position, center) / contain no-repeat" />` : ''}
        <!-- The storyboard track is derived automatically from the Mux src. The slotted image replaces the skin's
             preview image so it can carry its own loading hints; the skin still fills in the frame under the pointer. -->
        <img slot="thumbnail" alt="" decoding="async" fetchpriority="low" />
        <mux-video${src} ${attrs} playsinline crossorigin>${chapters}</mux-video>
        <!-- Mux Data and Cast are opt-in media components; no env key is needed for Mux-hosted sources. -->
        <mux-data player-software-name="mux-video"></mux-data>
        <google-cast></google-cast>
      </${skinTag}>
    </${playerTag}>
  `,
  // A source carrying signed tokens has no room in the `src` attribute, so it is
  // assigned as an object instead. A Mux `source.drm.token` becomes the FairPlay /
  // Widevine / PlayReady license servers; the playback, poster, and storyboard
  // tokens sign the rest.
  attach: ({ source }) => {
    if (source) document.querySelector('mux-video')!.source = source;
  },
});
