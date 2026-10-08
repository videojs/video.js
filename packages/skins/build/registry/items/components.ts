import type { GraphModule } from 'vjsc/graph';
import type { RegistryModuleItem } from 'vjsc/shadcn';

import type { SkinModuleMeta } from '../../../src/meta.ts';
import { skinModuleSourcePath } from '../../config.ts';
import { registryDocsUrl } from '../docs.ts';
import type { VideojsRegistryMeta } from '../meta.ts';
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
  module: GraphModule<SkinModuleMeta>,
  meta: Extract<SkinModuleMeta, { type: 'component' }>,
  target: RegistryTarget
): RegistryModuleItem<SkinModuleMeta> {
  const category = componentCategory(module.filename);
  const registryMeta = {
    role: 'component',
    framework: 'react',
    styling: target.styling,
    theme: target.theme,
    public: true,
  } satisfies VideojsRegistryMeta;

  return {
    name: meta.name,
    type: 'registry:ui',
    title: meta.title,
    description: meta.description,
    categories: ['media', category],
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

export function exportedComponentName(module: GraphModule<SkinModuleMeta>): string {
  const match = /\bexport\s+(?:const|function)\s+([A-Z][A-Za-z0-9]*)/.exec(module.source);

  if (!match) {
    throw new Error(`Registry component has no exported component: \`${skinModuleSourcePath(module.filename)}\`.`);
  }

  return match[1]!;
}

function componentCategory(filename: string): string {
  const match = /\/components\/([^/]+)\//.exec(filename);

  return match?.[1] ?? 'shared';
}

function componentDocs(
  module: GraphModule<SkinModuleMeta>,
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
