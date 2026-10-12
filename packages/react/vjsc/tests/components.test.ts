import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import coreSchema from '@videojs/core/vjsc';
import { isNil } from '@videojs/utils/predicate';
import { describe, expect, it } from 'vite-plus/test';

import { reactComponentModule } from '../components';

interface SchemaPart {
  readonly parts?: Readonly<Record<string, SchemaPart>> | undefined;
}

const resolvePackage = createRequire(resolve(import.meta.dirname, '../../package.json')).resolve;

/** Every canonical component and nested part path the Core schema declares. */
function componentPaths(): Array<{ readonly component: string; readonly parts: readonly string[] }> {
  const paths: Array<{ readonly component: string; readonly parts: readonly string[] }> = [];
  const visit = (component: string, parts: SchemaPart['parts'], prefix: readonly string[]): void => {
    for (const [name, part] of Object.entries(parts ?? {})) {
      const path = [...prefix, name];

      paths.push({ component, parts: path });
      visit(component, part.parts, path);
    }
  };

  for (const [component, definition] of Object.entries(coreSchema.definitions as Record<string, SchemaPart>)) {
    paths.push({ component, parts: [] });
    visit(component, definition.parts, []);
  }

  return paths;
}

describe('reactComponentModule', () => {
  it('names a real export for every canonical component and part', async () => {
    const modules = new Map<string, Record<string, unknown>>();
    const missing: string[] = [];
    let checked = 0;

    for (const { component, parts } of componentPaths()) {
      const from = reactComponentModule(component);
      let module = modules.get(from);

      if (!module) {
        module = (await import(pathToFileURL(resolvePackage(from)).href)) as Record<string, unknown>;
        modules.set(from, module);
      }

      let value: unknown = module[component];

      for (const part of parts) {
        value = isNil(value) ? undefined : (value as Record<string, unknown>)[part];
      }

      checked += 1;

      if (value === undefined) missing.push(`${[component, ...parts].join('.')} -> ${from}`);
    }

    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(40);
  });
});
