import { generateHtmlSkins } from '../../packages/html.ts';
import type { SkinRegistryItems } from '../meta.ts';
import type { RegistryTarget } from '../targets.ts';
import { htmlSkinItem } from './skins.ts';

/** HTML publishes rendered templates: one created item per skin, and no source modules. */
export function htmlRegistryItems(target: RegistryTarget & { framework: 'html' }): SkinRegistryItems {
  return {
    async create({ graph }) {
      const skins = await generateHtmlSkins(graph, { styling: target.styling });

      return Promise.all(
        skins.filter((skin) => skin.theme === target.theme).map((skin) => htmlSkinItem(skin, graph, target))
      );
    },
  };
}
