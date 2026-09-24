import type { SkinRegistryItems } from '../meta.ts';
import type { RegistryTarget } from '../targets.ts';
import { htmlRegistryItems } from './html.ts';
import { reactRegistryItems } from './react.ts';

export function registryItems(target: RegistryTarget): SkinRegistryItems {
  return target.framework === 'html' ? htmlRegistryItems(target) : reactRegistryItems(target);
}
