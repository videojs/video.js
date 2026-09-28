import {
  REGISTRY_SKINS,
  REGISTRY_STYLINGS,
  REGISTRY_THEMES,
  REGISTRY_INSTALL_DIRECTORY,
  registryStylings,
} from '@videojs/installation';
import { describe, expect, it } from 'vite-plus/test';

import { skinCatalog } from '../../catalog.ts';
import { registryTargets } from '../targets.ts';

describe('installation registry contract', () => {
  it('describes every generated registry skin', () => {
    const byIdentity = (a: { item: string; theme: string }, b: { item: string; theme: string }) =>
      `${a.item}/${a.theme}`.localeCompare(`${b.item}/${b.theme}`);

    expect(
      REGISTRY_SKINS.map(({ item, preset, theme, directory }) => ({ item, preset, theme, directory })).sort(byIdentity)
    ).toEqual(
      skinCatalog
        .map(({ registryItem: item, preset, theme, directory }) => ({
          item,
          preset,
          theme,
          directory: `${REGISTRY_INSTALL_DIRECTORY}/${directory}`,
        }))
        .sort(byIdentity)
    );
  });

  it('describes every generated registry catalog', () => {
    expect(new Set(registryTargets.map(({ styling }) => styling))).toEqual(new Set(REGISTRY_STYLINGS));
    expect(new Set(registryTargets.map(({ theme }) => theme))).toEqual(new Set(REGISTRY_THEMES));
    expect(
      new Set(registryTargets.filter(({ framework }) => framework === 'react').map(({ styling }) => styling))
    ).toEqual(new Set(registryStylings('react')));
    expect(
      new Set(registryTargets.filter(({ framework }) => framework === 'html').map(({ styling }) => styling))
    ).toEqual(new Set(registryStylings('html')));
  });
});
