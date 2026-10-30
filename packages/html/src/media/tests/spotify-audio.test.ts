import { describe, expect, it } from 'vite-plus/test';

import { SpotifyAudio } from '../spotify-audio/adapter';

const SRC = 'https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M';

let tagCounter = 0;

function defineSpotifyAudio(): typeof SpotifyAudio {
  const TestSpotifyAudio = class extends SpotifyAudio {};

  customElements.define(`test-spotify-audio-${tagCounter++}`, TestSpotifyAudio);
  return TestSpotifyAudio;
}

function iframeSrc(element: HTMLElement): string {
  return element.shadowRoot?.querySelector('iframe')?.getAttribute('src') ?? '';
}

/** Flush the microtask a deferred embed waits on so it sees every attribute. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('SpotifyAudio', () => {
  it('hides the embed unless it is showing Spotify’s own chrome', () => {
    const template = SpotifyAudio.getTemplateHTML({ src: SRC });

    // Left visible, Spotify's own player UI shows through the skin drawn over it.
    // Asserted against the template because no DOM implementation the tests run
    // in resolves `:host` for a computed style.
    expect(template).toMatch(/:host\(:not\(\[controls\]\)\)\s*\{\s*display:\s*none\s*!important/);
  });

  it('renders the embed from its attributes', () => {
    expect(SpotifyAudio.getTemplateHTML({ src: SRC })).toContain(
      'src="https://open.spotify.com/embed/track/1301WleyT98MSxVHPZCA6M"'
    );
  });

  it('renders the embed under preload="none", since WebKit only plays one that was up before play', () => {
    expect(SpotifyAudio.getTemplateHTML({ src: SRC, preload: 'none' })).toContain(
      'src="https://open.spotify.com/embed/track/'
    );
  });

  it('builds the embed under preload="none" set after src in the same task, as lazy-audio sets it', async () => {
    const TestSpotifyAudio = defineSpotifyAudio();
    const element = new TestSpotifyAudio();

    element.setAttribute('src', SRC);
    element.setAttribute('preload', 'none');
    await flushDeferredEmbed();

    expect(iframeSrc(element)).toContain('https://open.spotify.com/embed/track/');
  });
});
