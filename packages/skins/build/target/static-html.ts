import { resolve } from 'node:path';

import type { GraphModule, StaticHtmlOptions } from 'vjsc/graph';

import { isHtmlRegistrationModule } from '../../../html/vjsc/elements.ts';
import { htmlIconSource, readIconRegistration } from '../../../icons/vjsc/target.ts';

/**
 * How compiled HTML skins render to static markup: which runtime modules they need, which imports do nothing outside a
 * browser, and the icon stand-ins. Lives in a `.ts` module because the config loader only injects `import.meta.dirname`
 * there.
 */
export function staticHtmlOptions(modules: readonly GraphModule[]): StaticHtmlOptions {
  const icons = htmlIconModule(modules);
  const families = new Set([
    'default',
    ...modules.flatMap((module) => readIconRegistration(module.annotations)?.family ?? []),
  ]);

  return {
    aliases: htmlRenderAliases,
    // Element registrations and locale setup have no effect on static markup.
    empty: isHtmlRegistrationModule,
    // Every icon family the modules register renders through the same stand-in.
    modules: new Map([...families].map((family) => [htmlIconSource(family), icons])),
  };
}

/** Runtime modules the rendered templates need, resolved from workspace source because rendering runs outside the build. */
const htmlRenderAliases: ReadonlyMap<string, string> = new Map([
  ['@videojs/core/i18n/text/menu', resolve(import.meta.dirname, '../../../core/src/core/i18n/text/menu.ts')],
  ['@videojs/utils/string', resolve(import.meta.dirname, '../../../utils/src/string/index.ts')],
]);

/** A stand-in for the icon packages while rendering: registration is a no-op and every icon is an empty string. */
function htmlIconModule(modules: readonly GraphModule[]): string {
  const bindings = new Set<string>(['registerIcons']);

  for (const module of modules) {
    for (const exportName of Object.values(readIconRegistration(module.annotations)?.icons ?? {})) {
      bindings.add(exportName);
    }
  }

  return [...bindings]
    .sort()
    .map((name) => `export const ${name} = ${name === 'registerIcons' ? '() => {}' : "''"};`)
    .join('\n');
}
