import { resolve } from 'node:path';

import type { GraphModule } from 'vjsc/graph';

/**
 * Runtime modules the rendered templates need, resolved from workspace source because rendering runs outside the
 * browser build. Lives in a `.ts` module because the config loader only injects `import.meta.dirname` there.
 */
export const htmlRenderAliases: ReadonlyMap<string, string> = new Map([
  ['@videojs/core/i18n/text/menu', resolve(import.meta.dirname, '../../../core/src/core/i18n/text/menu.ts')],
  ['@videojs/utils/string', resolve(import.meta.dirname, '../../../utils/src/string/index.ts')],
]);

/** Icon bindings a compiled HTML module imports from `@videojs/html/icons`, keyed by local name. */
export function iconImports(module: GraphModule): ReadonlyMap<string, string> {
  const imports = new Map<string, string>();

  for (const reference of module.imports) {
    if (!/^@videojs\/html\/icons(?:\/neutral)?$/.test(reference.specifier)) continue;

    for (const { imported, local } of reference.bindings) {
      if (imported !== 'registerIcons') imports.set(local, imported);
    }
  }

  return imports;
}

/** A stand-in for the icon packages while rendering: registration is a no-op and every icon is an empty string. */
export function htmlIconModule(modules: readonly GraphModule[]): string {
  const bindings = new Set<string>(['registerIcons']);

  for (const module of modules) {
    for (const binding of iconImports(module).keys()) bindings.add(binding);
  }

  return [...bindings]
    .sort()
    .map((name) => `export const ${name} = ${name === 'registerIcons' ? '() => {}' : "''"};`)
    .join('\n');
}
