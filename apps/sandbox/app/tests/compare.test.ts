import { describe, expect, it } from 'vite-plus/test';

import { compareAvailable, comparePanels, otherSkinSource, type SkinSelection, summarizeSelection } from '../compare';

const react: SkinSelection = {
  platform: 'react',
  styling: 'css',
  skins: undefined,
  skin: 'default',
  skinless: false,
  media: 'video',
};

describe('comparePanels', () => {
  it('renders one panel with the resolved source when comparing is off', () => {
    expect(comparePanels(react, 'off')).toEqual([
      { id: 'single', label: '', platform: 'react', styling: 'css', skins: 'package', skin: 'default' },
    ]);
    expect(comparePanels({ ...react, styling: 'tailwind' }, 'off')[0]?.skins).toBe('registry');
  });

  it('resolves each styling to the source that publishes it', () => {
    const [css, tailwind] = comparePanels({ ...react, skins: 'package' }, 'styling');

    expect(css).toMatchObject({ id: 'css', label: 'CSS', styling: 'css', skins: 'package' });
    // The package has no Tailwind skin, so that panel falls back to the styling's default source.
    expect(tailwind).toMatchObject({ id: 'tailwind', label: 'Tailwind', styling: 'tailwind', skins: 'registry' });
  });

  it('puts the current source beside the next one that can load the styling', () => {
    expect(comparePanels(react, 'skins').map((panel) => panel.skins)).toEqual(['package', 'registry']);
    expect(otherSkinSource('html', 'css', 'registry')).toBe('package');
    expect(otherSkinSource('cdn', 'css', 'package')).toBeUndefined();
  });

  it('keeps a styling the other platform cannot show out of its panel', () => {
    const selection: SkinSelection = { ...react, styling: 'tailwind', media: 'video' };
    const [html, reactPanel] = comparePanels(selection, 'platform');

    expect(reactPanel).toMatchObject({ platform: 'react', styling: 'tailwind', skins: 'registry' });
    // The html registry is CSS; without the workspace only CSS remains, with it the authored Tailwind skin does.
    expect(html?.platform).toBe('html');
    expect(html?.styling === 'css' || html?.skins === 'authored').toBe(true);
  });

  it('labels the skin panels', () => {
    expect(comparePanels(react, 'skin').map((panel) => [panel.id, panel.label, panel.skin])).toEqual([
      ['default', 'Default', 'default'],
      ['neutral', 'Neutral', 'neutral'],
    ]);
  });
});

describe('compareAvailable', () => {
  it('needs a skin choice for the skin and source axes and Tailwind for the styling axis', () => {
    const background: SkinSelection = { ...react, media: 'background-video' };

    expect(compareAvailable('skin', react)).toBe(true);
    expect(compareAvailable('skin', background)).toBe(false);
    expect(compareAvailable('skins', background)).toBe(false);
    expect(compareAvailable('styling', react)).toBe(true);
    expect(compareAvailable('styling', { ...react, platform: 'cdn' })).toBe(false);
    expect(compareAvailable('platform', { ...react, platform: 'cdn' })).toBe(true);
  });

  it('leaves only the platform axis without a skin', () => {
    const skinless: SkinSelection = { ...react, skinless: true };

    expect(compareAvailable('skin', skinless)).toBe(false);
    expect(compareAvailable('skins', skinless)).toBe(false);
    expect(compareAvailable('styling', skinless)).toBe(false);
    expect(compareAvailable('platform', skinless)).toBe(true);
  });
});

describe('summarizeSelection', () => {
  it('reads the whole selection in words', () => {
    expect(
      summarizeSelection({
        platform: 'react',
        media: 'mux-video-hls-js',
        skin: 'neutral',
        skinless: false,
        styling: 'tailwind',
        skins: 'registry',
        width: 672,
        source: 'mp4-1',
      })
    ).toBe('React · Mux Video (hls.js) · Neutral · Tailwind · from the registry · 672px · MP4 - Dancing Dude');
  });

  it('leaves the skin out for a background media', () => {
    expect(
      summarizeSelection({
        platform: 'html',
        media: 'background-video',
        skin: 'default',
        skinless: false,
        styling: 'css',
        skins: 'package',
        width: 896,
        source: 'hls-1',
      })
    ).toBe('HTML · Background Video · fixed source');
  });

  it('names no skin in place of the skin selections', () => {
    expect(
      summarizeSelection({
        platform: 'html',
        media: 'dailymotion-video',
        skin: 'default',
        skinless: true,
        styling: 'css',
        skins: 'package',
        width: 896,
        source: 'dailymotion-default',
      })
    ).toMatch(/^HTML · Dailymotion Video · no skin · 896px · /);
  });
});
