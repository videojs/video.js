import type { SkinModuleMeta } from '../../../src/meta.ts';
import type { SkinGraphModule } from '../../variants.ts';
import type { SkinRegistryItem, VideojsItemMeta } from '../meta.ts';
import type { RegistryTarget } from '../targets.ts';

/** A shared helper module that the components using it install as a private dependency. */
export function supportModuleItem(
  module: SkinGraphModule,
  meta: Extract<SkinModuleMeta, { type: 'support' }>,
  target: RegistryTarget
): SkinRegistryItem {
  return {
    name: `_${meta.name}`,
    type: 'registry:lib',
    title: meta.title,
    description: meta.description,
    docs: 'Installed automatically by the Video.js components that use it.',
    registryDependencies: reactHelperDependency(target),
    meta: {
      role: 'support',
      public: false,
    } satisfies VideojsItemMeta,
    group: 'support',
    target: `ui/${module.sourcePath.slice(module.sourcePath.lastIndexOf('/') + 1)}`,
  };
}

export function utilsItem(): SkinRegistryItem {
  return {
    name: '_resolve-class-name',
    type: 'registry:lib',
    title: 'Video.js Utilities',
    description: 'Resolves state-aware class names used by editable Video.js React components.',
    docs: 'Installed automatically with React components and composed with the project Shadcn `cn` utility.',
    registryDependencies: ['utils'],
    meta: {
      role: 'support',
      public: false,
    } satisfies VideojsItemMeta,
    group: 'support',
    filename: 'resolve-class-name.ts',
    target: 'resolve-class-name.ts',
    paths: { install: '@lib', import: '@/lib' },
  };
}

export function reactHelperDependency(target: RegistryTarget): string[] {
  return target.framework === 'react' ? ['@videojs/_resolve-class-name'] : [];
}
