import { resolve } from 'node:path';

import type { TransformModule } from 'vjsc/plugins';
import type { StyleTransformOptions } from 'vjsc/styles';
import type { ComponentTarget } from 'vjsc/target';

import { skinStyles } from '../src/meta.ts';
import { skinBaseStylesheet } from './skin.ts';
import { createComponentTargets } from './target/index.ts';
import { parseVariant, type SkinVariant } from './variants.ts';

export type SkinTransformConfig = SkinVariant;

const stylesDir = resolve(import.meta.dirname, '../src/styles');

export function resolveSkinComponents(module: TransformModule): readonly ComponentTarget[] | null {
  const config = parseVariant(module.params);

  return config ? createComponentTargets(config) : null;
}

export function resolveSkinStyles(module: TransformModule): StyleTransformOptions | null {
  const config = parseVariant(module.params);

  return config ? createStyleOptions(config, module.filename.includes('/components/') ? 'theme' : 'skin') : null;
}

export function createStyleOptions(
  config: SkinTransformConfig,
  scope: 'skin' | 'theme' = 'skin'
): StyleTransformOptions {
  const skin = config.skin ? skinStyles[config.skin] : undefined;
  const variants: string[] = [config.theme];

  if (skin) variants.push(skin.preset);

  if (config.target === 'html') variants.push('shadow-dom');

  return config.style === 'tailwind'
    ? {
        mode: 'tailwind',
        variants,
        stylesheet: { input: resolve(stylesDir, 'tailwind.compiler.css') },
      }
    : {
        mode: 'css',
        variants,
        stylesheet: {
          input: resolve(stylesDir, 'tailwind.compiler.css'),
          base: resolve(
            stylesDir,
            scope === 'theme' ? 'base.css' : skinBaseStylesheet(skin?.preset ?? 'video', skin?.theme)
          ),
          scope: scope === 'theme' ? `.media-skin[data-theme="${config.theme}"]` : (skin?.scope ?? '.media-skin'),
        },
      };
}
