import { describe, expect, it } from 'vite-plus/test';

import { CloudflareVideo } from '../cloudflare-video/adapter';
import { TwitchVideo } from '../twitch-video/adapter';
import { VimeoVideo } from '../vimeo-video/adapter';
import { YouTubeVideo } from '../youtube-video/adapter';

// PlayerJS and TikTok assert theirs beside their other template tests, and TikTok's rule differs.
describe.each([
  ['YouTubeVideo', YouTubeVideo],
  ['VimeoVideo', VimeoVideo],
  ['TwitchVideo', TwitchVideo],
  ['CloudflareVideo', CloudflareVideo],
] as const)('%s pointer events', (_, Embed) => {
  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed style.
  it('keeps a chromeless embed out of hit-testing so the skin above it sees hover and clicks', () => {
    expect(Embed.getTemplateHTML({})).toMatch(/:host\(:not\(\[controls\]\)\)\s*\{\s*pointer-events:\s*none/);
  });
});
