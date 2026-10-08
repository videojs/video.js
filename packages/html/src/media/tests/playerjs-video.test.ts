import { describe, expect, it } from 'vite-plus/test';

import { PlayerJsVideo } from '../playerjs-video/adapter';

const SRC = 'https://play.gumlet.io/embed/64bfb0913ed6e5096d66dc1e';
const UNKNOWN_SRC = 'https://player.example.com/embed/abc123';

function iframeSrcOf(template: string): string | null {
  const src = / src="([^"]*)"/.exec(template)?.[1];

  return src ? src.replace(/&amp;/g, '&') : null;
}

describe('PlayerJsVideo', () => {
  it('renders the embed URL of a service it does not recognize untouched', () => {
    expect(iframeSrcOf(PlayerJsVideo.getTemplateHTML({ src: UNKNOWN_SRC, autoplay: '', muted: '' }))).toBe(UNKNOWN_SRC);
  });

  it('renders a recognized service with its chrome hidden, the way the adapter builds it', () => {
    const src = iframeSrcOf(PlayerJsVideo.getTemplateHTML({ src: SRC }));

    expect(src).toBe(`${SRC}?autoplay=false&loop=false&disable_player_controls=true`);
  });

  it('renders the attributes a recognized service reads from its URL', () => {
    const src = iframeSrcOf(PlayerJsVideo.getTemplateHTML({ src: SRC, autoplay: '', loop: '', controls: '' }));

    expect(src).toBe(`${SRC}?autoplay=true&loop=true`);
  });

  it('renders no embed for a src that is not an embed URL', () => {
    expect(iframeSrcOf(PlayerJsVideo.getTemplateHTML({ src: 'abc123' }))).toBe(null);
  });

  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('keeps the embed out of hit-testing without controls so the skin above it sees hover', () => {
    expect(PlayerJsVideo.getTemplateHTML({ src: SRC })).toMatch(
      /:host\(:not\(\[controls\]\)\)\s*\{\s*pointer-events:\s*none/
    );
  });
});
