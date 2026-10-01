import { describe, expect, it } from 'vite-plus/test';

import { cdnBaseForVersion, generateCdnCode, rendererSupportsCdn } from '../index';

const CDN_BASE = cdnBaseForVersion();

describe('generateCdnCode', () => {
  // Media subpaths that ship a CDN build. The media script is emitted only for
  // renderers whose subpath is in this set. Extensions such as Mux Data are not
  // part of this manifest.
  const manifest = ['hlsjs-video', 'dash-video', 'mux-video', 'mux-audio'];

  it('generates video preset CDN tags for html5-video', () => {
    expect(generateCdnCode('default-video', 'video', 'html5-video', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/video.js"></script>`
    );
  });

  it('includes hls media bundle when renderer is hls', () => {
    expect(generateCdnCode('default-video', 'neutral-video', 'hls', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/video-neutral.js"></script>
<script type="module" src="${CDN_BASE}/media/hlsjs-video.js"></script>`
    );
  });

  it('includes the dash media bundle when renderer is dash', () => {
    expect(generateCdnCode('default-video', 'video', 'dash', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/video.js"></script>
<script type="module" src="${CDN_BASE}/media/dash-video.js"></script>`
    );
  });

  it('includes selected extension bundles', () => {
    expect(generateCdnCode('default-video', 'video', 'hls', manifest, CDN_BASE, ['google-cast'])).toEqual(
      `<script type="module" src="${CDN_BASE}/video.js"></script>
<script type="module" src="${CDN_BASE}/media/hlsjs-video.js"></script>
<script type="module" src="${CDN_BASE}/extensions/google-cast.js"></script>`
    );
  });

  it('includes the mux media bundle and the Mux Data extension bundle when renderer is mux-video', () => {
    expect(generateCdnCode('default-video', 'video', 'mux-video', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/video.js"></script>
<script type="module" src="${CDN_BASE}/media/mux-video.js"></script>
<script type="module" src="${CDN_BASE}/extensions/mux-data.js"></script>`
    );
  });

  it('omits the media script for a media renderer absent from the manifest', () => {
    expect(generateCdnCode('default-video', 'video', 'vimeo', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/video.js"></script>`
    );
  });

  it('generates background preset CDN tags', () => {
    expect(generateCdnCode('background-video', 'video', 'background-video', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/background.js"></script>`
    );
  });

  it('generates the skinless video CDN tag when skin is none', () => {
    expect(generateCdnCode('default-video', 'none', 'html5-video', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/video-player.js"></script>
<script type="module" src="${CDN_BASE}/ui/container.js"></script>`
    );
  });

  it('generates the skinless audio CDN tag when skin is none', () => {
    expect(generateCdnCode('default-audio', 'none', 'html5-audio', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/audio-player.js"></script>
<script type="module" src="${CDN_BASE}/ui/container.js"></script>`
    );
  });

  it('generates live video CDN tags alongside the media bundle', () => {
    expect(generateCdnCode('live-video', 'video', 'hls', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/live-video.js"></script>
<script type="module" src="${CDN_BASE}/media/hlsjs-video.js"></script>`
    );
  });

  it('generates the neutral live video CDN tag', () => {
    expect(generateCdnCode('live-video', 'neutral-video', 'mux-video', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/live-video-neutral.js"></script>
<script type="module" src="${CDN_BASE}/media/mux-video.js"></script>
<script type="module" src="${CDN_BASE}/extensions/mux-data.js"></script>`
    );
  });

  it('generates the skinless live video CDN tag when skin is none', () => {
    expect(generateCdnCode('live-video', 'none', 'hls', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/live-video-player.js"></script>
<script type="module" src="${CDN_BASE}/ui/container.js"></script>
<script type="module" src="${CDN_BASE}/media/hlsjs-video.js"></script>`
    );
  });

  it('generates live audio CDN tags for each skin variant', () => {
    expect(generateCdnCode('live-audio', 'audio', 'mux-audio', manifest)).toEqual(
      `<script type="module" src="${CDN_BASE}/live-audio.js"></script>
<script type="module" src="${CDN_BASE}/media/mux-audio.js"></script>
<script type="module" src="${CDN_BASE}/extensions/mux-data.js"></script>`
    );
    expect(generateCdnCode('live-audio', 'neutral-audio', 'mux-audio', manifest)).toContain('/live-audio-neutral.js');
    expect(generateCdnCode('live-audio', 'none', 'mux-audio', manifest)).toContain('/live-audio-player.js');
  });
});

describe('rendererSupportsCdn', () => {
  // Mirrors the manifest entries that ship a CDN build.
  const manifest = ['hlsjs-video', 'dash-video', 'mux-video', 'mux-audio'];

  it('returns true for preset renderers (covered by the preset bundle, no media subpath)', () => {
    expect(rendererSupportsCdn('html5-video', manifest)).toBe(true);
    expect(rendererSupportsCdn('html5-audio', manifest)).toBe(true);
    expect(rendererSupportsCdn('background-video', manifest)).toBe(true);
  });

  it('returns true for media renderers whose subpath is in the manifest', () => {
    expect(rendererSupportsCdn('hls', manifest)).toBe(true);
    expect(rendererSupportsCdn('dash', manifest)).toBe(true);
    expect(rendererSupportsCdn('mux-video', manifest)).toBe(true);
    expect(rendererSupportsCdn('mux-audio', manifest)).toBe(true);
  });

  it('returns false for a media renderer absent from the manifest', () => {
    expect(rendererSupportsCdn('vimeo', manifest)).toBe(false);
  });
});
