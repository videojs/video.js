import { describe, expect, it } from 'vite-plus/test';

import { resolveMovedAnchors } from '../movedAnchors';
import { findMovedAnchorTarget } from '../movedAnchorTarget';

describe('resolveMovedAnchors', () => {
  it("resolves each target to the page's framework, keeping its anchor", () => {
    expect(
      resolveMovedAnchors(
        { 'signed-playback': 'guides/mux#play-signed-assets', 'load-a-source': 'guides/hls' },
        'react'
      )
    ).toEqual({
      'signed-playback': '/docs/framework/react/guides/mux#play-signed-assets',
      'load-a-source': '/docs/framework/react/guides/hls',
    });
  });

  it('rejects a target no page has', () => {
    expect(() => resolveMovedAnchors({ gone: 'guides/not-a-guide#x' }, 'html')).toThrow(
      'movedAnchors "gone" points to "guides/not-a-guide#x", but no page has that slug'
    );
  });
});

describe('findMovedAnchorTarget', () => {
  const resolved = { 'signed-playback': '/docs/framework/html/guides/mux#play-signed-assets' };
  const nothingOnPage = () => false;

  it('sends a moved fragment to its new home', () => {
    expect(findMovedAnchorTarget(resolved, '#signed-playback', nothingOnPage)).toBe(
      '/docs/framework/html/guides/mux#play-signed-assets'
    );
  });

  it('stays when the heading is still on the page', () => {
    expect(findMovedAnchorTarget(resolved, '#signed-playback', (id) => id === 'signed-playback')).toBeNull();
  });

  it('stays for fragments it does not know, an empty hash, or a malformed one', () => {
    expect(findMovedAnchorTarget(resolved, '#import', nothingOnPage)).toBeNull();
    expect(findMovedAnchorTarget(resolved, '', nothingOnPage)).toBeNull();
    expect(findMovedAnchorTarget(resolved, '#%E0%A4%A', nothingOnPage)).toBeNull();
  });
});
