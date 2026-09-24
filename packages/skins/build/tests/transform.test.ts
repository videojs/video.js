import { describe, expect, it } from 'vite-plus/test';

import { createStyleOptions } from '../transform';
import { parseVariant } from '../variants';

describe('parseVariant', () => {
  it('accepts css style output', () => {
    expect(parseVariant(new URLSearchParams('target=react&skin=default-video&style=css&theme=default'))).toEqual({
      target: 'react',
      skin: 'default-video',
      style: 'css',
      theme: 'default',
    });
  });

  it('rejects the former vanilla style name', () => {
    expect(() =>
      parseVariant(new URLSearchParams('target=react&skin=default-video&style=vanilla&theme=default'))
    ).toThrow('needs `style=css` or `style=tailwind`');
  });

  it('leaves queries without variant parameters to other tools', () => {
    expect(parseVariant(new URLSearchParams('raw'))).toBeNull();
    expect(parseVariant(new URLSearchParams())).toBeNull();
  });

  it('accepts theme-specific, skin-independent React component transforms', () => {
    expect(parseVariant(new URLSearchParams('target=react&style=css&theme=neutral'))).toEqual({
      target: 'react',
      style: 'css',
      theme: 'neutral',
    });
    expect(() => parseVariant(new URLSearchParams('target=html&style=css&theme=default'))).toThrow('needs a `skin`');
    expect(() => parseVariant(new URLSearchParams('target=react&style=css'))).toThrow(
      'needs a `theme` of default, neutral, compat, scaffold'
    );
    expect(() => parseVariant(new URLSearchParams('target=react&skin=neutral-video&style=css&theme=default'))).toThrow(
      'wrong theme'
    );
  });
});

describe('createStyleOptions', () => {
  it('adds the Shadow DOM variant only to HTML targets', () => {
    expect(createStyleOptions({ target: 'react', style: 'css', theme: 'neutral' }, 'theme')).toMatchObject({
      variants: ['neutral'],
      stylesheet: { scope: '.media-skin[data-theme="neutral"]' },
    });

    expect(
      createStyleOptions({ target: 'react', skin: 'default-video', style: 'tailwind', theme: 'default' }).variants
    ).toEqual(['default', 'video']);
    expect(
      createStyleOptions({ target: 'html', skin: 'neutral-video', style: 'tailwind', theme: 'neutral' }).variants
    ).toEqual(['neutral', 'video', 'shadow-dom']);
    expect(
      createStyleOptions({ target: 'react', skin: 'default-audio', style: 'tailwind', theme: 'default' }).variants
    ).toEqual(['default', 'audio']);
    expect(
      createStyleOptions({ target: 'html', skin: 'neutral-audio', style: 'tailwind', theme: 'neutral' }).variants
    ).toEqual(['neutral', 'audio', 'shadow-dom']);
    expect(
      createStyleOptions({ target: 'react', skin: 'default-live-video', style: 'tailwind', theme: 'default' }).variants
    ).toEqual(['default', 'live-video']);
    expect(
      createStyleOptions({ target: 'html', skin: 'neutral-live-video', style: 'tailwind', theme: 'neutral' }).variants
    ).toEqual(['neutral', 'live-video', 'shadow-dom']);
    expect(
      createStyleOptions({ target: 'react', skin: 'default-live-audio', style: 'tailwind', theme: 'default' }).variants
    ).toEqual(['default', 'live-audio']);
    expect(
      createStyleOptions({ target: 'html', skin: 'neutral-live-audio', style: 'tailwind', theme: 'neutral' }).variants
    ).toEqual(['neutral', 'live-audio', 'shadow-dom']);
  });

  it('styles reusable components for their theme alone, whichever skin compiles them', () => {
    expect(
      createStyleOptions({ target: 'html', skin: 'neutral-audio', style: 'css', theme: 'neutral' }, 'theme')
    ).toMatchObject({
      variants: ['neutral', 'shadow-dom'],
      stylesheet: { scope: '.media-skin[data-theme="neutral"]' },
    });
  });

  it('requires a skin for skin-scoped styles instead of guessing one', () => {
    expect(() => createStyleOptions({ target: 'react', style: 'css', theme: 'default' })).toThrow(
      'Skin-scoped styles need a variant that names its skin'
    );
  });
});
