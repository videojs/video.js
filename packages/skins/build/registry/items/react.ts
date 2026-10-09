import type { VjscRegistryOptions } from 'vjsc/shadcn';

import type { SkinModuleMeta } from '../../../src/meta.ts';
import { skinUtils } from '../../config.ts';
import { parseVariant } from '../../variants.ts';
import type { RegistryTarget } from '../targets.ts';
import { componentItem } from './components.ts';
import { skinItem } from './skins.ts';
import { privateModuleItem, privateModuleName, utilsItem } from './support.ts';

/** React publishes transformed source modules: every skin, component, and private helper is its own item. */
export function reactRegistryItems(
  target: RegistryTarget & { framework: 'react' }
): VjscRegistryOptions<SkinModuleMeta>['items'] {
  return {
    resolve({ module }) {
      if (module.filename === skinUtils) return utilsItem(target);

      const variant = parseVariant(new URLSearchParams(module.params));

      if (
        !variant ||
        variant.target !== target.framework ||
        variant.style !== target.styling ||
        variant.theme !== target.theme
      ) {
        return null;
      }

      const meta = module.meta;
      if (meta?.type === 'skin') return variant.skin === meta.name ? skinItem(module, meta, target) : null;

      if (meta?.type === 'component') {
        if (variant.skin !== undefined) return null;

        return componentItem(module, meta, target);
      }

      if (variant.skin !== undefined) return null;

      const name = privateModuleName(module);

      return name ? privateModuleItem(module, name, target) : null;
    },
  };
}
