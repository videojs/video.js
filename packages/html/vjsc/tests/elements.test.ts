import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import coreSchema from '@videojs/core/vjsc';
import { describe, expect, it } from 'vite-plus/test';

import {
  htmlElementModule,
  htmlElementName,
  htmlI18nModule,
  htmlPackageModule,
  htmlPublicName,
  isHtmlRegistrationModule,
} from '../elements';

interface SchemaPart {
  readonly parts?: Readonly<Record<string, SchemaPart>> | undefined;
}

const defineDir = resolve(import.meta.dirname, '../../src/define/ui');

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

describe('htmlElementName', () => {
  it('maps canonical components and parts to elements this package registers', () => {
    const missing: string[] = [];
    let checked = 0;

    for (const { component, parts } of componentPaths()) {
      const name = htmlElementName(component, parts);
      if (!name) continue;

      const module = htmlElementModule(htmlPublicName(name)).replace('@videojs/html/ui/', '');

      checked += 1;

      if (!existsSync(resolve(defineDir, `${module}.ts`)))
        missing.push(`${[component, ...parts].join('.')} -> ${module}`);
    }

    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(40);
  });
});

describe('htmlPackageModule', () => {
  const sourceDir = resolve(import.meta.dirname, '../../src');

  it('maps public registration and icon modules to package sources that exist', () => {
    for (const specifier of [
      htmlElementModule('play-button'),
      htmlI18nModule,
      '@videojs/html/icons',
      '@videojs/html/icons/neutral',
      '@videojs/html/icons/compat',
      '@videojs/html/icons/scaffold',
    ]) {
      const path = htmlPackageModule(specifier);

      expect(existsSync(resolve(sourceDir, `${path}.ts`)) || existsSync(resolve(sourceDir, path, 'index.ts'))).toBe(
        true
      );
    }
  });

  it('rejects modules generated package code has no source for', () => {
    expect(() => htmlPackageModule('@videojs/core')).toThrow('has no module generated package code can import');
  });
});

describe('isHtmlRegistrationModule', () => {
  it('recognizes element and locale registrations only', () => {
    expect(isHtmlRegistrationModule(htmlElementModule('menu'))).toBe(true);
    expect(isHtmlRegistrationModule(htmlI18nModule)).toBe(true);
    expect(isHtmlRegistrationModule('@videojs/html/icons')).toBe(false);
  });
});
