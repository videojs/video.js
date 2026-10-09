/**
 * Loads the package's TypeScript program and its public entry points. The entry map in `vite.config.ts` names every
 * public module and the source file behind it; `package.json`'s `exports` map must agree with it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';

export type Layer = 'engine' | 'feature' | 'behavior' | 'behavior-dom';

export interface EntryPoint {
  /** The entry key as `vite.config.ts` spells it, e.g. `behaviors/dom/load-segments`. */
  key: string;
  /** The import specifier, e.g. `@videojs/spf/behaviors/dom/load-segments`. */
  specifier: string;
  /** Absolute path of the entry's source file. */
  file: string;
  /** The reference layer the entry belongs to, or `undefined` for entries the reference does not cover. */
  layer: Layer | undefined;
  /** The page path under the reference root, e.g. `behaviors/dom/load-segments.md`. */
  page: string | undefined;
  /** The entry's short name within its layer, e.g. `load-segments` or `video`. */
  name: string;
}

export interface ReferenceProgram {
  packageDir: string;
  packageName: string;
  program: ts.Program;
  checker: ts.TypeChecker;
  entries: EntryPoint[];
}

const ENGINE_PREFIX = 'hls/';
const FEATURE_PREFIX = 'hls/features/';
const BEHAVIOR_PREFIX = 'behaviors/';
const DOM_BEHAVIOR_PREFIX = 'behaviors/dom/';

/** Which reference layer an entry key lands in, and the page it gets. Keys outside the covered layers get neither. */
function classifyEntry(key: string): Pick<EntryPoint, 'layer' | 'page' | 'name'> {
  if (key.startsWith(FEATURE_PREFIX)) {
    const name = key.slice(FEATURE_PREFIX.length);

    return { layer: 'feature', page: `features/${name}.md`, name };
  }

  if (key.startsWith(DOM_BEHAVIOR_PREFIX)) {
    const name = key.slice(DOM_BEHAVIOR_PREFIX.length);

    return { layer: 'behavior-dom', page: `behaviors/dom/${name}.md`, name };
  }

  if (key.startsWith(BEHAVIOR_PREFIX)) {
    const name = key.slice(BEHAVIOR_PREFIX.length);

    return { layer: 'behavior', page: `behaviors/${name}.md`, name };
  }

  if (key.startsWith(ENGINE_PREFIX) && !key.slice(ENGINE_PREFIX.length).includes('/')) {
    const name = key.slice(ENGINE_PREFIX.length);

    return { layer: 'engine', page: `engines/${name}.md`, name };
  }

  return { layer: undefined, page: undefined, name: key };
}

/** The `entry: { ... }` object literal in `vite.config.ts`, as key → source path. */
function readViteEntryMap(packageDir: string): Map<string, string> {
  const file = resolve(packageDir, 'vite.config.ts');
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const entries = new Map<string, string>();

  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'entry' &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteralLike(property.initializer)) continue;

        if (!ts.isIdentifier(property.name) && !ts.isStringLiteralLike(property.name)) continue;

        entries.set(property.name.text, property.initializer.text);
      }

      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(source);

  if (entries.size === 0) throw new Error(`No \`entry\` map found in ${file}`);

  return entries;
}

interface Manifest {
  name: string;
  exports: object;
}

function readManifest(packageDir: string): Manifest {
  // SAFETY: the manifest is this package's own `package.json`, which the workspace checks keep publishable with a
  // `name` and an `exports` map; a malformed one fails `pnpm install` before this script runs.
  const manifest = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8')) as Manifest;
  if (!manifest.exports) throw new Error(`${packageDir}/package.json has no \`exports\` map`);

  return manifest;
}

/** Cross-check the Vite entry map against `package.json`'s `exports` and build the entry list. */
export function readEntryPoints(packageDir: string, packageName: string): EntryPoint[] {
  const exportKeys = new Set(Object.keys(readManifest(packageDir).exports).map((key) => key.replace(/^\.\/?/, '')));
  const entries: EntryPoint[] = [];

  for (const [key, source] of readViteEntryMap(packageDir)) {
    const exportKey = key === 'index' ? '' : key;
    if (!exportKeys.has(exportKey)) throw new Error(`Entry \`${key}\` has no \`exports\` entry in package.json`);

    entries.push({
      key,
      specifier: exportKey ? `${packageName}/${exportKey}` : packageName,
      file: resolve(packageDir, source),
      ...classifyEntry(key),
    });
  }

  return entries;
}

/** Create the program over `src/` with the package's `tsconfig.json`, leaving tests out. */
export function loadProgram(packageDir: string): ReferenceProgram {
  const configFile = resolve(packageDir, 'tsconfig.json');
  const config = ts.getParsedCommandLineOfConfigFile(
    configFile,
    { noEmit: true },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      },
    }
  );
  if (!config) throw new Error(`Could not read ${configFile}`);

  const rootNames = config.fileNames.filter((file) => !/\.test(-d)?\.ts$/.test(file) && !file.includes('/tests/'));
  const program = ts.createProgram({ rootNames, options: config.options, projectReferences: config.projectReferences });
  const errors = ts.getPreEmitDiagnostics(program).filter((d) => d.category === ts.DiagnosticCategory.Error);

  if (errors.length > 0) {
    const messages = errors.slice(0, 5).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));

    throw new Error(
      `The program has ${errors.length} type error(s); the reference needs a clean build:\n${messages.join('\n')}`
    );
  }

  const packageName = readManifest(packageDir).name;

  return {
    packageDir,
    packageName,
    program,
    checker: program.getTypeChecker(),
    entries: readEntryPoints(packageDir, packageName),
  };
}
