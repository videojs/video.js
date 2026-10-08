import type { GraphModule } from 'vjsc/graph';
import type { RegistryModuleItem } from 'vjsc/shadcn';

import type { SkinModuleMeta } from '../../../src/meta.ts';
import { skinModuleSourcePath } from '../../config.ts';
import type { VideojsRegistryMeta } from '../meta.ts';
import type { RegistryTarget } from '../targets.ts';

const privateModules = new Map([['components/menus/menu-chevron.tsx', '_menu-chevron']]);

export function privateModuleName(module: GraphModule<SkinModuleMeta>): string | undefined {
  return privateModules.get(skinModuleSourcePath(module.filename));
}

export function privateModuleItem(
  module: GraphModule<SkinModuleMeta>,
  name: string,
  target: RegistryTarget
): RegistryModuleItem<SkinModuleMeta> {
  const sourcePath = skinModuleSourcePath(module.filename);
  const output = sourcePath.slice('components/'.length);
  const registryMeta = {
    role: 'support',
    framework: target.framework,
    styling: target.styling,
    public: false,
  } satisfies VideojsRegistryMeta;

  return {
    name,
    type: 'registry:lib',
    title: 'Video.js Menu Chevron',
    description: 'Private menu direction indicator shared by editable Video.js menu components.',
    docs: 'Installed automatically by the Video.js menu components that use it.',
    registryDependencies: reactHelperDependency(target),
    meta: registryMeta,
    group: 'support',
    target: `ui/${output.slice(output.lastIndexOf('/') + 1)}`,
  };
}

export function utilsItem(target: RegistryTarget): RegistryModuleItem<SkinModuleMeta> {
  return {
    name: '_resolve-class-name',
    type: 'registry:lib',
    title: 'Video.js Utilities',
    description: 'Resolves state-aware class names used by editable Video.js React components.',
    docs: 'Installed automatically with React components and composed with the project Shadcn `cn` utility.',
    registryDependencies: ['utils'],
    meta: {
      role: 'support',
      framework: 'react',
      styling: target.styling,
      public: false,
    } satisfies VideojsRegistryMeta,
    group: 'support',
    filename: 'resolve-class-name.ts',
    target: 'resolve-class-name.ts',
    paths: { install: '@lib', import: '@/lib' },
  };
}

export function reactHelperDependency(target: RegistryTarget): string[] {
  return target.framework === 'react' ? ['@videojs/_resolve-class-name'] : [];
}
