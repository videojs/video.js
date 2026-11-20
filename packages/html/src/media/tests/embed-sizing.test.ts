import { describe, expect, it } from 'vite-plus/test';

import { CloudflareVideo } from '../cloudflare-video/adapter';
import { DailymotionVideo } from '../dailymotion-video/adapter';
import { PlayerJsVideo } from '../playerjs-video/adapter';
import { TikTokVideo } from '../tiktok-video/adapter';
import { TwitchVideo } from '../twitch-video/adapter';
import { VimeoVideo } from '../vimeo-video/adapter';
import { YouTubeVideo } from '../youtube-video/adapter';

// Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed style.
function hostStyles(html: string): string {
  return html.match(/:host\s*\{([^}]*)\}/)?.[1] ?? '';
}

describe.each([
  ['YouTubeVideo', YouTubeVideo],
  ['VimeoVideo', VimeoVideo],
  ['TwitchVideo', TwitchVideo],
  ['CloudflareVideo', CloudflareVideo],
  ['PlayerJsVideo', PlayerJsVideo],
  ['DailymotionVideo', DailymotionVideo],
] as const)('%s sizing', (_, Embed) => {
  it('sizes the host like a replaced <video> so a skin can stretch it', () => {
    const host = hostStyles(Embed.getTemplateHTML({}));

    expect(host).toContain('width: 300px;');
    expect(host).toContain('aspect-ratio: 16 / 9;');
    // A floor would keep the embed from shrinking with the skin or following an author-set width.
    expect(host).not.toMatch(/min-(width|height):/);
  });
});

describe('TikTokVideo sizing', () => {
  it('keeps the portrait floor the TikTok player needs for its chrome', () => {
    const host = hostStyles(TikTokVideo.getTemplateHTML({}));

    expect(host).toContain('min-width: 325px;');
    expect(host).toContain('min-height: 578px;');
    expect(host).toContain('aspect-ratio: 9 / 16;');
  });
});
