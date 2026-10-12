import { describe, expect, it } from 'vite-plus/test';

import { skinSource } from '../source';

describe('skinSource', () => {
  it('classifies reusable components by category', () => {
    expect(skinSource('components/buttons/play-button.tsx')).toEqual({
      kind: 'component',
      path: 'components/buttons/play-button.tsx',
      category: 'buttons',
      file: 'play-button.tsx',
    });
  });

  it('names the skin that owns a module, and the group of a shared one', () => {
    expect(skinSource('skins/neutral/live-video/layout/controls.tsx')).toMatchObject({
      kind: 'skin',
      skin: 'neutral-live-video',
      file: 'layout/controls.tsx',
    });
    expect(skinSource('skins/compat/audio/skin.tsx')).toMatchObject({ kind: 'skin', skin: 'compat-audio' });
    expect(skinSource('skins/scaffold/live-video/skin.tsx')).toMatchObject({
      kind: 'skin',
      skin: 'scaffold-live-video',
    });
    expect(skinSource('skins/shared/behaviors/playback-hotkeys.tsx')).toMatchObject({
      kind: 'shared',
      group: 'behaviors',
      file: 'playback-hotkeys.tsx',
    });
  });

  it('names the theme of a module its skins share', () => {
    expect(skinSource('skins/compat/shared/controls.tsx')).toEqual({
      kind: 'theme',
      path: 'skins/compat/shared/controls.tsx',
      theme: 'compat',
      file: 'controls.tsx',
    });
    expect(skinSource('skins/scaffold/shared/layout/controls.tsx')).toMatchObject({
      kind: 'theme',
      theme: 'scaffold',
      file: 'layout/controls.tsx',
    });
  });

  it('leaves anything outside the skin layout unclassified', () => {
    expect(skinSource('utils.ts')).toEqual({ kind: 'other', path: 'utils.ts' });
    expect(skinSource('skins/unknown/video/skin.tsx')).toEqual({ kind: 'other', path: 'skins/unknown/video/skin.tsx' });
    expect(skinSource('skins/unknown/shared/controls.tsx')).toEqual({
      kind: 'other',
      path: 'skins/unknown/shared/controls.tsx',
    });
  });
});
