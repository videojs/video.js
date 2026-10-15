import { buildSoundCloudIframeSrc } from '@videojs/soundcloud-audio';
import { describe, expect, it } from 'vite-plus/test';

import { SoundCloudAudio } from '../soundcloud-audio/adapter';

const TRACK = 'https://soundcloud.com/forss/flickermood';

function iframeSrcOf(template: string): string | null {
  const src = / src="([^"]*)"/.exec(template)?.[1];

  return src ? src.replace(/&amp;/g, '&') : null;
}

describe('SoundCloudAudio', () => {
  it('renders the widget the way the media builds it, so attaching does not reload it', () => {
    expect(iframeSrcOf(SoundCloudAudio.getTemplateHTML({ src: TRACK }))).toBe(buildSoundCloudIframeSrc(TRACK));
  });

  it('renders no widget for a short link, which the media resolves first', () => {
    expect(iframeSrcOf(SoundCloudAudio.getTemplateHTML({ src: 'https://on.soundcloud.com/9zRpu' }))).toBe(null);
  });

  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('keeps the widget visible and taking input without controls, for the attribution it carries', () => {
    const template = SoundCloudAudio.getTemplateHTML({ src: TRACK });

    expect(template).not.toMatch(/pointer-events:\s*none/);
    expect(template).not.toMatch(/display:\s*none/);
    expect(template).toMatch(/:host\s*\{[^}]*height:\s*166px/);
  });

  it('lets the widget autoplay and play protected streams', () => {
    expect(SoundCloudAudio.getTemplateHTML({ src: TRACK })).toContain('allow="autoplay; encrypted-media"');
  });
});
