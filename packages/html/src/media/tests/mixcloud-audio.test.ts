import { buildMixcloudIframeSrc } from '@videojs/mixcloud-audio';
import { describe, expect, it } from 'vite-plus/test';

import { MixcloudAudio } from '../mixcloud-audio/adapter';

const SHOW = 'https://www.mixcloud.com/spartacus/lambiance/';

function iframeSrcOf(template: string): string | null {
  const src = / src="([^"]*)"/.exec(template)?.[1];

  return src ? src.replace(/&amp;/g, '&') : null;
}

describe('MixcloudAudio', () => {
  it('renders the widget the way the media builds it, so attaching does not reload it', () => {
    expect(iframeSrcOf(MixcloudAudio.getTemplateHTML({ src: SHOW }))).toBe(buildMixcloudIframeSrc(SHOW));
  });

  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('hides the widget unless it is showing as controls, and leaves it taking input when it shows', () => {
    const template = MixcloudAudio.getTemplateHTML({ src: SHOW });

    expect(template).toMatch(/:host\(:not\(\[controls\]\)\)\s*\{\s*display:\s*none\s*!important/);
    expect(template).not.toMatch(/pointer-events:\s*none/);
    expect(template).toMatch(/:host\s*\{[^}]*height:\s*120px/);
  });

  it('renders an empty frame under preload="none" until playback is requested', () => {
    expect(MixcloudAudio.getTemplateHTML({ src: SHOW, preload: 'none' })).not.toMatch(/<iframe[^>]*\ssrc=/);
  });

  it.each(['autoplay', 'controls'])('renders the widget under preload="none" when %s is set', (attr) => {
    expect(iframeSrcOf(MixcloudAudio.getTemplateHTML({ src: SHOW, preload: 'none', [attr]: '' }))).toBe(
      buildMixcloudIframeSrc(SHOW)
    );
  });

  it('lets the widget autoplay and play protected streams', () => {
    expect(MixcloudAudio.getTemplateHTML({ src: SHOW })).toContain('allow="autoplay; encrypted-media"');
  });
});
