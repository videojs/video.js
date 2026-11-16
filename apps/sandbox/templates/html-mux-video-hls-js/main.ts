import '@app/styles.css';
import '@videojs/html/video/player';
import '@videojs/html/live-video/player';
import '@videojs/html/extensions/google-cast';
import '@videojs/html/extensions/mux-data';
import '@videojs/html/media/mux-video/hls-js';
import { createHtmlSandbox, html } from '@app/shared/html/sandbox';

// The hls.js-backed `<mux-video>`, alongside the default SPF-backed one in
// `html-mux-video`. Same element behavior — derived poster, storyboard track,
// `poster-time` — over hls.js, which is what the `hls-js` subpath selects.
//
// What differs is the engine surface: this flavor takes `source.engine`,
// `preferPlayback`, and the rendition caps, which is why the query-string
// playback overrides are folded in here and not on the default page.

createHtmlSandbox({
  player: 'video',
  live: true,
  // A source carrying signed tokens has no room in the `src` attribute, so it is
  // assigned as an object below instead. Query-string playback overrides need the
  // object for the same reason, and need it before the first load so the engine is
  // built with them rather than reconfigured afterwards.
  playbackOverrides: true,
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
  // A Mux `source.drm.token` becomes the FairPlay / Widevine / PlayReady license
  // servers; the playback, poster, and storyboard tokens sign the rest.
  attach: ({ source }) => {
    if (source) document.querySelector('mux-video')!.source = source;
  },
});
