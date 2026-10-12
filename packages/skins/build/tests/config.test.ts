import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { skinMetaDefaults, validateSkinMeta } from '../config';
import { sourceDir } from '../source';

function module(path: string) {
  const filename = resolve(sourceDir, path);

  return { id: filename, filename, params: new URLSearchParams(), variant: null };
}

describe('skinMetaDefaults', () => {
  it('names skins by directory and components by file, with their category', () => {
    expect(skinMetaDefaults(module('skins/neutral/live-video/skin.tsx'))).toEqual({
      name: 'neutral-live-video',
      type: 'skin',
    });
    expect(skinMetaDefaults(module('skins/compat/audio/skin.tsx'))).toEqual({ name: 'compat-audio', type: 'skin' });
    expect(skinMetaDefaults(module('skins/scaffold/video/skin.tsx'))).toEqual({ name: 'scaffold-video', type: 'skin' });
    expect(skinMetaDefaults(module('components/buttons/play-button.tsx'))).toEqual({
      name: 'play-button',
      type: 'component',
      category: 'buttons',
    });
    expect(skinMetaDefaults(module('skins/shared/audio/skin.styles.ts'))).toEqual({});
    expect(skinMetaDefaults(module('skins/compat/shared/button.tsx'))).toEqual({});
  });
});

describe('validateSkinMeta', () => {
  const component = {
    name: 'play-button',
    type: 'component',
    category: 'buttons',
    title: 'Play',
    description: 'Plays.',
  };

  it('accepts complete component, skin, and support metadata', () => {
    expect(validateSkinMeta(component, module('components/buttons/play-button.tsx'))).toBe(component);
    expect(() =>
      validateSkinMeta(
        { name: 'default-video', type: 'skin', title: 'Video', description: 'Video.' },
        module('skins/default/video/skin.tsx')
      )
    ).not.toThrow();
    expect(() =>
      validateSkinMeta(
        { name: 'menu-chevron', type: 'support', title: 'Chevron', description: 'Chevron.' },
        module('components/menus/menu-chevron.tsx')
      )
    ).not.toThrow();
  });

  it('names the module whose metadata is incomplete', () => {
    expect(() =>
      validateSkinMeta({ ...component, description: '' }, module('components/buttons/play-button.tsx'))
    ).toThrow('Skin module metadata in `components/buttons/play-button.tsx` needs a `description`.');
    expect(() =>
      validateSkinMeta(
        { name: 'constructor', type: 'skin', title: 'T', description: 'D.' },
        module('skins/default/video/skin.tsx')
      )
    ).toThrow('names an unknown skin `constructor`');
    expect(() =>
      validateSkinMeta({ ...component, type: 'widget' }, module('components/buttons/play-button.tsx'))
    ).toThrow('has an unknown `type` `widget`');
  });
});
