import { describe, expect, it } from 'vite-plus/test';

import { TikTokVideo } from '../tiktok-video/adapter';

const SRC = 'https://www.tiktok.com/@videojs/video/7273420104193772846';
const EMBED = 'https://www.tiktok.com/player/v1/7273420104193772846';

let tagCounter = 0;

function defineTikTokVideo(): string {
  const tag = `test-tiktok-video-${tagCounter++}`;

  customElements.define(tag, class extends TikTokVideo {});
  return tag;
}

function iframeSrc(element: HTMLElement): string {
  return element.shadowRoot?.querySelector('iframe')?.getAttribute('src') ?? '';
}

/** Flush the microtask a deferred embed waits on so it sees every attribute. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('TikTokVideo', () => {
  it('builds the embed for a src set after the element is created', async () => {
    const tag = defineTikTokVideo();
    const element = document.createElement(tag);

    element.setAttribute('src', SRC);
    await flushDeferredEmbed();

    expect(iframeSrc(element)).toContain(EMBED);
  });

  it('builds no embed under preload="none" set after src in the same task, as lazy-video sets it', async () => {
    const tag = defineTikTokVideo();
    const element = document.createElement(tag);

    element.setAttribute('src', SRC);
    element.setAttribute('preload', 'none');
    await flushDeferredEmbed();

    expect(iframeSrc(element)).toBe('');
  });

  it('renders the embed with a bootstrap autoplay unless it shows its own controls', () => {
    // `autoplay=1` is the embed parameter; the `allow` attribute names the feature policy and carries it either way.
    expect(TikTokVideo.getTemplateHTML({ src: SRC })).toContain('autoplay=1');
    expect(TikTokVideo.getTemplateHTML({ src: SRC, controls: '' })).not.toContain('autoplay=1');
  });

  it('renders an empty frame from markup with preload="none"', () => {
    expect(TikTokVideo.getTemplateHTML({ src: SRC, preload: 'none' })).not.toMatch(/<iframe[^>]*\ssrc=/);
  });

  it('renders the embed under preload="none" when autoplay is set', () => {
    expect(TikTokVideo.getTemplateHTML({ src: SRC, preload: 'none', autoplay: '' })).toContain(`src="${EMBED}`);
  });

  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('keeps a preload="none" frame out of hit-testing like any other', () => {
    // The frame is empty until `play()` builds the embed, so it has nothing to click, and the embed `play()` builds
    // already answers the skin's commands.
    expect(TikTokVideo.getTemplateHTML({ src: SRC, preload: 'none' })).not.toMatch(/pointer-events:\s*auto/);
  });
});
