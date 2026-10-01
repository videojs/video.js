import { describe, expect, it } from 'vite-plus/test';
import type { GraphModule } from 'vjsc/graph';

import type { SkinModuleMeta } from '../../../src/meta.ts';
import { skinModuleTarget } from '../items/skins.ts';

function graphModule(sourcePath: string): GraphModule<SkinModuleMeta> {
  return {
    id: sourcePath,
    filename: `/skins/src/${sourcePath}`,
    sourcePath,
    params: {},
    source: '',
    imports: [],
    styles: { files: [], assets: [] },
  };
}

describe('skinModuleTarget', () => {
  const root = graphModule('skins/neutral/audio/skin.tsx');

  it('places the skin root under its stable preset directory', () => {
    expect(skinModuleTarget(root, root, 'neutral-audio')).toBe('audio/skin.tsx');
  });

  it('requires reusable components to be independent registry items', () => {
    expect(() => skinModuleTarget(graphModule('components/sliders/slider.tsx'), root, 'neutral-audio')).toThrow(
      'Reusable registry component was not published independently'
    );
  });

  it('keeps a skin-owned module in its owner directory', () => {
    expect(skinModuleTarget(graphModule('skins/neutral/audio/layout/controls.tsx'), root, 'neutral-audio')).toBe(
      'audio/layout/controls.tsx'
    );
  });

  it('places preset-shared modules under the stable preset directory', () => {
    const timeSlider = graphModule('skins/shared/audio/sliders/time-slider.tsx');

    expect(skinModuleTarget(timeSlider, root, 'neutral-audio')).toBe('audio/sliders/time-slider.tsx');
    expect(skinModuleTarget(timeSlider, graphModule('skins/default/audio/skin.tsx'), 'default-audio')).toBe(
      'audio/sliders/time-slider.tsx'
    );
  });

  it('places globally shared modules beside the block that installs them', () => {
    expect(skinModuleTarget(graphModule('skins/shared/behaviors/playback-hotkeys.tsx'), root, 'neutral-audio')).toBe(
      'audio/behaviors/playback-hotkeys.tsx'
    );
  });
});
