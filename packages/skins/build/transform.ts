import { resolve } from 'node:path';

import type { VariantModule } from 'vjsc/plugins';
import type { StyleTransformOptions, StyleVariantName } from 'vjsc/styles';
import type { ComponentTarget } from 'vjsc/target';

import { type SkinStyle, skinScope, skinStyles } from '../src/meta.ts';
import { skinBaseStylesheet } from './skin.ts';
import { skinSourceOf, sourceDir } from './source.ts';
import { createComponentTargets } from './target/index.ts';
import type { SkinVariant } from './variants.ts';

const stylesDir = resolve(sourceDir, 'styles');

/**
 * Cascade order of every CSS output file, earliest first. A file overrides the files before it wherever their rules
 * style one element, so shared component files come first and skin-specific files last.
 */
export const skinStyleOrder = [
  'container.css',
  'buttons.css',
  'dialog.css',
  'indicators.css',
  'poster.css',
  'display.css',
  'video/status-indicators.css',
  'audio/error-dialog.css',
  'popups.css',
  'sliders.css',
  'audio/play-button.css',
  'menus.css',
  'audio/settings-menu.css',
  'audio/time-slider.css',
  'video/controls.css',
  'live-video/controls.css',
  'audio/controls.css',
  'time.css',
  'video/skin.css',
  'audio/skin.css',
] as const;

export function resolveSkinComponents(module: VariantModule<SkinVariant>): readonly ComponentTarget[] | null {
  return module.variant ? createComponentTargets(module.variant) : null;
}

export function resolveSkinStyles(module: VariantModule<SkinVariant>): StyleTransformOptions | null {
  if (!module.variant) return null;

  // Reusable components scope their styles to the theme; everything a skin owns scopes to that skin.
  return createStyleOptions(module.variant, skinSourceOf(module.filename).kind === 'component' ? 'theme' : 'skin');
}

export function createStyleOptions(config: SkinVariant, scope: 'skin' | 'theme' = 'skin'): StyleTransformOptions {
  // Reusable components style for their theme alone, so one compile serves every skin of that theme; everything else
  // styles for the one skin that owns it.
  const owner = scope === 'skin' ? skinStyle(config) : undefined;
  const variants: StyleVariantName[] = [config.theme];

  if (owner) variants.push(owner.preset);

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
          base: resolve(stylesDir, owner ? skinBaseStylesheet(owner.preset, owner.theme) : 'base.css'),
          scope: owner?.scope ?? skinScope(config.theme),
          order: skinStyleOrder,
          // Only HTML renders the poster and thumbnail as custom elements with shadow roots.
          shadowHosts: config.target === 'html',
        },
      };
}

function skinStyle(config: SkinVariant): SkinStyle {
  if (!config.skin)
    throw new Error(`Skin-scoped styles need a variant that names its skin: \`${JSON.stringify(config)}\`.`);

  return skinStyles[config.skin];
}
