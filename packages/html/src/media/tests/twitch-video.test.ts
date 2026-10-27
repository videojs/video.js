import { describe, expect, it } from 'vite-plus/test';

import { TwitchVideo } from '../twitch-video/adapter';

const SRC = 'https://www.twitch.tv/videos/123456789';

let tagCounter = 0;

function defineTwitchVideo(): string {
  const tag = `test-twitch-video-${tagCounter++}`;

  customElements.define(tag, class extends TwitchVideo {});
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

describe('TwitchVideo', () => {
  it('builds the embed for a src set after the element is created', async () => {
    const tag = defineTwitchVideo();
    const element = document.createElement(tag);

    element.setAttribute('src', SRC);
    await flushDeferredEmbed();

    expect(iframeSrc(element)).toContain('https://player.twitch.tv/?video=v123456789');
  });

  it('builds no embed under preload="none" set after src in the same task, as lazy-video sets it', async () => {
    const tag = defineTwitchVideo();
    const element = document.createElement(tag);

    element.setAttribute('src', SRC);
    element.setAttribute('preload', 'none');
    await flushDeferredEmbed();

    expect(iframeSrc(element)).toBe('');
  });

  it('renders the embed from its attributes', () => {
    expect(TwitchVideo.getTemplateHTML({ src: SRC })).toContain('src="https://player.twitch.tv/?video=v123456789');
  });

  it('renders an empty frame from markup with preload="none"', () => {
    expect(TwitchVideo.getTemplateHTML({ src: SRC, preload: 'none' })).not.toMatch(/<iframe[^>]*\ssrc=/);
  });

  it('renders the embed under preload="none" when autoplay is set', () => {
    expect(TwitchVideo.getTemplateHTML({ src: SRC, preload: 'none', autoplay: '' })).toContain(
      'src="https://player.twitch.tv/?video=v123456789'
    );
  });
});
