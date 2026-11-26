import { describe, expect, it } from 'vite-plus/test';

import { resolveVidyardRenderOptions } from '../source';

const UUID = 'YBvcF2BEfvKdowmfrRwk57';
const SRC = `https://share.vidyard.com/watch/${UUID}`;

describe('resolveVidyardRenderOptions', () => {
  it('hides Vidyard controls, calls to action, and share button without controls', () => {
    expect(resolveVidyardRenderOptions(SRC)).toEqual({
      uuid: UUID,
      params: { disable_ctas: '1', viral_sharing: '0', hidden_controls: '1' },
    });
  });

  it("shows Vidyard's controls with controls, and leaves the rest to the player's settings", () => {
    expect(resolveVidyardRenderOptions(SRC, { controls: true })?.params).toEqual({ hidden_controls: '0' });
  });

  it('asks Vidyard to autoplay only with sound, and leaves a muted autoplay to the media', () => {
    expect(resolveVidyardRenderOptions(SRC, { autoplay: true })?.params.autoplay).toBe('2');
    expect(resolveVidyardRenderOptions(SRC, { autoplay: true, muted: true })?.params).not.toHaveProperty('autoplay');
  });

  it('passes player parameters through, winning over the URL query', () => {
    const options = resolveVidyardRenderOptions(`${SRC}?second=10&quality=480p&cc=en`, {
      source: { engine: { vidyard: { second: 30, jwt: 'token', disable_analytics: true, cc: null } } },
    });

    expect(options?.params).toEqual({
      disable_ctas: '1',
      viral_sharing: '0',
      second: '30',
      quality: '480p',
      jwt: 'token',
      disable_analytics: '1',
      hidden_controls: '1',
    });
  });

  it('keeps out the parameters the props and the media decide', () => {
    const options = resolveVidyardRenderOptions(`${SRC}?autoplay=1&muted=1&loop=1&hidden_controls=0&type=lightbox`, {
      source: { engine: { vidyard: { aspect: 'portrait', width: 640, height: 360, v: '3', uuid: 'other' } } },
    });

    expect(options).toEqual({ uuid: UUID, params: { disable_ctas: '1', viral_sharing: '0', hidden_controls: '1' } });
  });

  it('returns null for a source that is not Vidyard', () => {
    expect(resolveVidyardRenderOptions('https://example.com/watch/video')).toBe(null);
    expect(resolveVidyardRenderOptions('')).toBe(null);
  });
});
