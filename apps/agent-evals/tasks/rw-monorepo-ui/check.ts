import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { TaskCheck } from '../../src/grade/browser.ts';
import { assertion } from '../../src/grade/task-checks.ts';

const CODE = /\.(?:[cm]?[jt]sx?)$/;
// `Button` and its props are what @acme/ui exported before the task.
const EXISTING_EXPORTS = new Set(['Button', 'ButtonProps']);

interface Import {
  specifier: string;
  /** Local binding names; empty for a side-effect import, `*` for a namespace or dynamic import. */
  names: string[];
}

/** Value imports and re-exports in a module. Type-only imports don't bring a component in, so they are left out. */
function imports(text: string): Import[] {
  const found: Import[] = [];
  const statements =
    /\b(import|export)\s+(?!type\b)([\w*${}\s,]*?)\s*from\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]/g;

  for (const [, , clause = '', specifier, sideEffect] of text.matchAll(statements)) {
    if (sideEffect) {
      found.push({ specifier: sideEffect, names: [] });
      continue;
    }

    const names = clause
      .replace(/[{}]/g, ',')
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name && !name.startsWith('type '))
      .map((name) => (name.startsWith('*') ? '*' : name.split(/\s+as\s+/)[0]!.trim()));

    found.push({ specifier: specifier!, names });
  }

  for (const [, specifier] of text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    found.push({ specifier: specifier!, names: ['*'] });
  }

  return found;
}

function dependencyFields(manifest: string): string[] {
  if (!existsSync(manifest)) return [];

  const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as Record<string, Record<string, string> | undefined>;

  return ['dependencies', 'peerDependencies'].filter((field) => pkg[field]?.['@videojs/react'] !== undefined);
}

/**
 * The player lives in the shared package: @acme/ui declares Video.js and composes the player, and the web app takes it
 * from @acme/ui rather than building one of its own.
 */
export const project: TaskCheck['project'] = ({ appDir, files }) => {
  const code = (prefix: string) =>
    files
      .filter((file) => file.startsWith(prefix) && CODE.test(file))
      .map((file) => ({ file, imports: imports(readFileSync(join(appDir, file), 'utf8')) }));
  const videojs = (specifier: string) => /^@videojs\/react(?:\/|$)/.test(specifier) && !/\.css$/.test(specifier);
  const ui = code('packages/ui/');
  const web = code('apps/web/');
  const declared = dependencyFields(join(appDir, 'packages/ui/package.json'));
  const playerFiles = ui.filter(({ imports }) =>
    imports.some(({ specifier, names }) => videojs(specifier) && names.length > 0)
  );
  const fromUi = web.flatMap(({ file, imports }) =>
    imports
      .filter(({ specifier }) => /^@acme\/ui(?:\/|$)/.test(specifier))
      .filter(({ specifier, names }) => specifier !== '@acme/ui' || names.some((name) => !EXISTING_EXPORTS.has(name)))
      .map(({ specifier, names }) => `${file}: ${names.join(', ')} from ${specifier}`)
  );
  const ownPlayer = web.filter(({ imports }) =>
    imports.some(({ specifier, names }) => videojs(specifier) && names.length > 0)
  );

  return [
    assertion('@acme/ui depends on @videojs/react', declared.length > 0, declared.join(', ') || undefined),
    assertion(
      'player component in packages/ui',
      playerFiles.length > 0,
      playerFiles.map(({ file }) => file).join(', ') || undefined
    ),
    assertion('web imports the player from @acme/ui', fromUi.length > 0, fromUi[0]),
    assertion(
      'web has no player of its own',
      ownPlayer.length === 0,
      ownPlayer.map(({ file }) => file).join(', ') || undefined
    ),
  ];
};
