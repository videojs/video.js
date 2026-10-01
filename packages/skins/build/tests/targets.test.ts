import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import coreSchema from '@videojs/core/vjsc';
import { isNil } from '@videojs/utils/predicate';
import { describe, expect, it } from 'vite-plus/test';
import type { ComponentPartDefinition, ComponentParts } from 'vjsc/components';
import { type ComponentPath, isTargetElement, readTargetReference } from 'vjsc/target';

import { htmlComponentTarget } from '../target/html.tsx';
import { reactComponentTarget } from '../target/react.tsx';

const workspaceDir = resolve(import.meta.dirname, '../../../..');
const resolveReact = createRequire(resolve(workspaceDir, 'packages/react/package.json')).resolve;
const htmlElementsDir = resolve(workspaceDir, 'packages/html/src/define/ui');

/** Every canonical component and nested part path the Core schema declares. */
function componentPaths(): ComponentPath[] {
  const paths: ComponentPath[] = [];
  const visit = (component: string, parts: ComponentParts | undefined, prefix: string | null): void => {
    for (const [name, part] of Object.entries(parts ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;

      paths.push({ component, part: path });
      visit(component, (part as ComponentPartDefinition<object, ComponentParts | undefined>).parts, path);
    }
  };

  for (const [component, definition] of Object.entries(coreSchema.definitions)) {
    paths.push({ component, part: null });
    visit(component, (definition as ComponentPartDefinition<object, ComponentParts | undefined>).parts, null);
  }

  return paths;
}

/** The targets live apart from the packages they mirror, so pin every mapping to a real runtime module. */
describe('htmlComponentTarget', () => {
  it('maps every canonical component and part to a registered custom element', () => {
    const missing: string[] = [];
    let checked = 0;

    for (const path of componentPaths()) {
      const rule = htmlComponentTarget.components.resolve(path);
      if (!isTargetElement(rule)) continue;

      const reference = readTargetReference(rule);
      if (reference.kind !== 'element' || !reference.import) continue;

      const tag = reference.import.from.replace('@videojs/html/ui/', '');

      checked += 1;

      if (!existsSync(resolve(htmlElementsDir, `${tag}.ts`))) missing.push(`${path.component}.${path.part} -> ${tag}`);
    }

    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(40);
  });
});

describe('reactComponentTarget', () => {
  it('imports every canonical component from a real React export', async () => {
    const modules = new Map<string, Record<string, unknown>>();
    const missing: string[] = [];
    let checked = 0;

    for (const path of componentPaths()) {
      const rule = reactComponentTarget.components.resolve(path);
      if (!isTargetElement(rule)) continue;

      const reference = readTargetReference(rule);
      if (reference.kind !== 'import') continue;

      checked += 1;

      const { from, name, path: members = [] } = reference.import;
      let module = modules.get(from);

      if (!module) {
        module = (await import(pathToFileURL(resolveReact(from)).href)) as Record<string, unknown>;
        modules.set(from, module);
      }

      let value: unknown = module[name];

      for (const member of members) {
        value = isNil(value) ? undefined : (value as Record<string, unknown>)[member];
      }

      if (value === undefined)
        missing.push(`${path.component}.${path.part} -> ${from}#${[name, ...members].join('.')}`);
    }

    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(40);
  });
});
