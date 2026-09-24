import { skinUtils } from '../../config.ts';
import type { SkinRegistryItems } from '../meta.ts';
import type { RegistryTarget } from '../targets.ts';
import { componentItem } from './components.ts';
import { skinItem } from './skins.ts';
import { supportModuleItem, utilsItem } from './support.ts';

/** React publishes transformed source modules: every skin, component, and private helper is its own item. */
export function reactRegistryItems(target: RegistryTarget & { framework: 'react' }): SkinRegistryItems {
  return {
    resolve({ module }) {
      if (module.filename === skinUtils) return utilsItem();

      const variant = module.variant;

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

      // Reusable modules publish from their skin-free compilation; skin compilations only feed skin items.
      if (!meta || variant.skin !== undefined) return null;

      if (meta.type === 'support') return supportModuleItem(module, meta, target);

      return componentItem(module, meta, target);
    },
  };
}
