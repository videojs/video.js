import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import coreSchema from '@videojs/core/vjsc';
import { describe, expect, it } from 'vite-plus/test';
import type { ComponentPartDefinition, ComponentParts } from 'vjsc/components';
import { type ComponentPath, isTargetElement, readTargetReference } from 'vjsc/target';

import { htmlComponentTarget } from '../target/html.tsx';
import { reactComponentTarget } from '../target/react.tsx';

const workspaceDir = resolve(import.meta.dirname, '../../../..');
const htmlElementsDir = resolve(workspaceDir, 'packages/html/src/define/ui');
const reactBarrel = readFileSync(resolve(workspaceDir, 'packages/react/src/index.ts'), 'utf8');
const reactExports = Object.keys(
  (JSON.parse(readFileSync(resolve(workspaceDir, 'packages/react/package.json'), 'utf8')) as { exports: object })
    .exports
);

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
  it('imports every canonical component from a real React export', () => {
    const missing: string[] = [];
    let checked = 0;

    for (const path of componentPaths()) {
      const rule = reactComponentTarget.components.resolve(path);
      if (!isTargetElement(rule)) continue;

      const reference = readTargetReference(rule);
      if (reference.kind !== 'import') continue;

      checked += 1;

      const { from, name } = reference.import;
      const exported =
        from === '@videojs/react'
          ? new RegExp(`\\b${name}\\b`).test(reactBarrel)
          : reactExports.some((subpath) => matchesExport(subpath, from.replace('@videojs/react', '.')));

      if (!exported) missing.push(`${path.component}.${path.part} -> ${from}#${name}`);
    }

    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(40);
  });
});

function matchesExport(pattern: string, subpath: string): boolean {
  if (!pattern.includes('*')) return pattern === subpath;

  const [prefix, suffix] = pattern.split('*');

  return subpath.startsWith(prefix!) && subpath.endsWith(suffix!);
}
