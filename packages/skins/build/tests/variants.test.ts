import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { sourceDir } from '../source';
import { inheritVariant } from '../variants';

describe('inheritVariant', () => {
  const react = { target: 'react', style: 'css', theme: 'default', skin: 'default-video' } as const;

  it('compiles reusable React components once for every skin of a theme', () => {
    expect(inheritVariant(react, { filename: resolve(sourceDir, 'components/buttons/play-button.tsx') })).toEqual({
      target: 'react',
      style: 'css',
      theme: 'default',
    });
  });

  it('keeps the skin for skin-owned modules and for HTML', () => {
    const shared = { filename: resolve(sourceDir, 'skins/shared/video/controls.tsx') };
    const component = { filename: resolve(sourceDir, 'components/buttons/play-button.tsx') };
    const html = { ...react, target: 'html' } as const;

    expect(inheritVariant(react, shared)).toBe(react);
    expect(inheritVariant(html, component)).toBe(html);
  });
});
