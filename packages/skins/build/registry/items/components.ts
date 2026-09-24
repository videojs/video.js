import type { SkinModuleMeta } from '../../../src/meta.ts';
import type { SkinGraphModule } from '../../variants.ts';
import { registryDocsUrl } from '../docs.ts';
import type { SkinRegistryItem, VideojsItemMeta } from '../meta.ts';
import type { RegistryTarget } from '../targets.ts';
import { reactHelperDependency } from './support.ts';

const customizationOnlyComponents = new Set([
  'audio-track-menu',
  'button',
  'button-tooltip',
  'captions-menu',
  'captions-submenu',
  'playback-rate-submenu',
  'quality-menu',
  'radio-item',
  'settings-menu',
]);

export function componentItem(
  module: SkinGraphModule,
  meta: Extract<SkinModuleMeta, { type: 'component' }>,
  target: RegistryTarget
): SkinRegistryItem {
  const registryMeta = {
    role: 'component',
    public: true,
  } satisfies VideojsItemMeta;

  return {
    name: meta.name,
    type: 'registry:ui',
    title: meta.title,
    description: meta.description,
    categories: ['media', meta.category],
    docs: componentDocs(module, meta, target),
    registryDependencies: reactHelperDependency(target),
    meta: registryMeta,
    group: 'ui',
    directives: ['use client'],
    target: `ui/${meta.name}.tsx`,
    theme: [
      ...(target.theme === 'neutral' ? ['styles/themes/neutral.css'] : []),
      'styles/base.css',
      'styles/audio/theme.css',
      'styles/video/captions.css',
      'styles/video/theme.css',
    ],
  };
}

/** The component a registry module leads with, such as `PlayButton`: its first exported component. */
export function exportedComponentName(module: SkinGraphModule): string {
  const component = module.exports.find((name) => /^[A-Z]/.test(name));
  if (!component) throw new Error(`Registry module \`${module.sourcePath}\` exports no component.`);

  return component;
}

function componentDocs(
  module: SkinGraphModule,
  meta: Extract<SkinModuleMeta, { type: 'component' }>,
  target: RegistryTarget
): string {
  const component = exportedComponentName(module);

  if (customizationOnlyComponents.has(meta.name)) {
    return `See [Customize skins](${registryDocsUrl(target, 'how-to/customize-skins')}).`;
  }

  const slug = meta.name === 'container' ? 'player-container' : meta.name;

  return `[\`${component}\` reference](${registryDocsUrl(target, `reference/${slug}`)}).`;
}
