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
    expect(parseVariant(new URLSearchParams('target=react&skin=default-video&style=vanilla&theme=default'))).toBeNull();
  });

  it('accepts theme-specific, skin-independent React component transforms', () => {
    expect(parseVariant(new URLSearchParams('target=react&style=css&theme=neutral'))).toEqual({
      target: 'react',
      style: 'css',
      theme: 'neutral',
    });
    expect(parseVariant(new URLSearchParams('target=html&style=css&theme=default'))).toBeNull();
    expect(parseVariant(new URLSearchParams('target=react&style=css'))).toBeNull();
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
});
