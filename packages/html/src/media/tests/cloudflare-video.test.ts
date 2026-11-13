import { describe, expect, it } from 'vite-plus/test';

import { CloudflareVideo } from '../cloudflare-video/adapter';

const SRC = 'https://watch.cloudflarestream.com/ea95132c15732412d22c1476fa83f27a';

let tagCounter = 0;

function defineCloudflareVideo(): string {
  const tag = `test-cloudflare-video-${tagCounter++}`;

  customElements.define(tag, class extends CloudflareVideo {});
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

describe('CloudflareVideo', () => {
  it('renders the embed from its attributes', () => {
    expect(CloudflareVideo.getTemplateHTML({ src: SRC })).toContain(
      'src="https://iframe.videodelivery.net/ea95132c15732412d22c1476fa83f27a?'
    );
  });

  it('renders an empty frame under preload="none" until playback is requested', () => {
    expect(CloudflareVideo.getTemplateHTML({ src: SRC, preload: 'none' })).not.toMatch(/<iframe[^>]*\ssrc=/);
  });

  it('renders the embed under preload="none" when autoplay is set', () => {
    expect(CloudflareVideo.getTemplateHTML({ src: SRC, preload: 'none', autoplay: '' })).toContain('autoplay=1');
  });

  it('builds no embed under preload="none" set after src in the same task, as lazy-video sets it', async () => {
    const tag = defineCloudflareVideo();
    const element = document.createElement(tag) as HTMLElement & { engine: unknown };

    element.setAttribute('src', SRC);
    element.setAttribute('preload', 'none');
    await flushDeferredEmbed();

    expect(iframeSrc(element)).toBe('');
    expect(element.engine).toBe(null);
  });
});
