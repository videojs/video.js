import { describe, expect, it } from 'vite-plus/test';

import { CloudflareVideo } from '../cloudflare-video/adapter';
import { TikTokVideo } from '../tiktok-video/adapter';
import { TwitchVideo } from '../twitch-video/adapter';
import { VimeoVideo } from '../vimeo-video/adapter';
import { YouTubeVideo } from '../youtube-video/adapter';

// PlayerJS asserts its rule beside its other template tests.
describe.each([
  ['YouTubeVideo', YouTubeVideo],
  ['VimeoVideo', VimeoVideo],
  ['TwitchVideo', TwitchVideo],
  ['CloudflareVideo', CloudflareVideo],
  ['TikTokVideo', TikTokVideo],
] as const)('%s pointer events', (_, Embed) => {
  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed style.
  it('keeps a chromeless embed out of hit-testing so the skin above it sees hover and clicks', () => {
    expect(Embed.getTemplateHTML({})).toMatch(/:host\(:not\(\[controls\]\)\)\s*\{\s*pointer-events:\s*none/);
  });
});
