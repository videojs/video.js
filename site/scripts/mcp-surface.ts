/**
 * Write the import surface the docs MCP server checks agent code against: each module specifier the published packages
 * export with the names it exports, the stylesheet specifiers, and the custom elements each module registers.
 *
 * The surface is read from the built declarations, so run `pnpm build:packages` first. The output is gitignored and
 * rebuilt by the `mcp-surface:generate` task.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isString } from 'es-toolkit/predicate';
import ts from 'typescript';

import type { McpSurface } from '../src/mcp/check-code';
import {
  collectPackageEntries,
  isModuleNamespace,
  isSyntheticNamespace,
  packageDirectories,
  type PublicEntry,
  resolveAlias,
  sourcePathFor,
  walkFiles,
} from './check-api-stability';

const scriptPath = fileURLToPath(import.meta.url);
const siteDirectory = resolve(scriptPath, '..', '..');

export const MCP_SURFACE_PATH = join(siteDirectory, 'src', 'content', 'generated-mcp-surface.json');

const COMPILER_OPTIONS: ts.CompilerOptions = {
  noEmit: true,
  skipLibCheck: true,
  types: [],
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
};

const SOURCE_COMPILER_OPTIONS: ts.CompilerOptions = {
  noEmit: true,
  skipLibCheck: true,
  types: [],
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
};

type ExportTarget = string | { types?: string; default?: string } | null;

function sortedRecord(record: Map<string, Set<string>>): Record<string, string[]> {
  return Object.fromEntries([...record.keys()].sort().map((key) => [key, [...record.get(key)!].sort()] as const));
}

function addExports(
  checker: ts.TypeChecker,
  moduleSymbol: ts.Symbol,
  prefix: string,
  names: Set<string>,
  namespaces: ReadonlySet<ts.Symbol>
): void {
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    // `index_parts_d_exports` re-exported under its own synthetic name is bundler output, not API.
    if (isSyntheticNamespace(exported.name)) continue;

    const symbol = resolveAlias(checker, exported);
    const name = `${prefix}${exported.name}`;

    names.add(name);

    if (isModuleNamespace(symbol) && !namespaces.has(symbol)) {
      addExports(checker, symbol, `${name}.`, names, new Set([...namespaces, symbol]));
    }
  }
}

/** Names each entry exports. A namespace export also lists its members as `Namespace.Member`. */
export function collectModuleExports(program: ts.Program, entries: readonly PublicEntry[]): Record<string, string[]> {
  const checker = program.getTypeChecker();
  const modules = new Map<string, Set<string>>();

  for (const entry of entries) {
    const names = modules.get(entry.specifier) ?? new Set<string>();
    const sourceFile = program.getSourceFile(entry.declarationFile);
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);

    // A side-effect module such as `@videojs/html/video/player` may export nothing and is still importable.
    if (moduleSymbol) addExports(checker, moduleSymbol, '', names, new Set());

    modules.set(entry.specifier, names);
  }

  return sortedRecord(modules);
}

/**
 * Tag names a file adds to `HTMLElementTagNameMap`, globally or inside `declare global`, or `undefined` when it doesn't
 * augment the map. Most defines key the map by `[Element.tagName]`, so a computed key is read from the literal type of
 * the element's static `tagName`, or from its initializer when the property is typed `string`.
 */
export function tagMapEntries(sourceFile: ts.SourceFile, checker: ts.TypeChecker): string[] | undefined {
  const tags: string[] = [];
  let augments = false;

  const tagName = (name: ts.PropertyName): string | undefined => {
    if (ts.isStringLiteral(name) || ts.isIdentifier(name)) return name.text;

    if (!ts.isComputedPropertyName(name)) return undefined;

    const type = checker.getTypeAtLocation(name.expression);
    if (type.isStringLiteral()) return type.value;

    const declaration = checker.getSymbolAtLocation(name.expression)?.valueDeclaration;

    return declaration && ts.isPropertyDeclaration(declaration) && declaration.initializer
      ? ts.isStringLiteralLike(declaration.initializer)
        ? declaration.initializer.text
        : undefined
      : undefined;
  };

  const visit = (node: ts.Node) => {
    if (ts.isInterfaceDeclaration(node)) {
      if (node.name.text !== 'HTMLElementTagNameMap') return;

      augments = true;

      for (const member of node.members) {
        const tag = ts.isPropertySignature(member) ? tagName(member.name) : undefined;

        if (tag) tags.push(tag);
      }

      return;
    }

    if (ts.isSourceFile(node) || ts.isModuleDeclaration(node) || ts.isModuleBlock(node)) ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return augments ? tags : undefined;
}

function isPackageDeclaration(fileName: string, root: string): boolean {
  const path = relative(root, fileName).split(sep).join('/');

  return path.startsWith('packages/') && !path.split('/').includes('node_modules') && fileName.endsWith('.d.ts');
}

/** Declaration files an entry reaches through its imports, within the workspace packages. */
function reachableDeclarations(entry: PublicEntry, options: ts.CompilerOptions, root: string): Set<string> {
  const reached = new Set<string>();
  const queue = [entry.declarationFile];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (reached.has(file) || !existsSync(file)) continue;

    reached.add(file);

    const { importedFiles, referencedFiles } = ts.preProcessFile(readFileSync(file, 'utf8'), true, true);

    for (const { fileName } of [...importedFiles, ...referencedFiles]) {
      const resolved = ts.resolveModuleName(fileName, file, options, ts.sys).resolvedModule?.resolvedFileName;

      if (resolved && isPackageDeclaration(resolved, root)) queue.push(resolved);
    }
  }

  return reached;
}

/** Custom elements each entry registers in `HTMLElementTagNameMap`, through the declarations it imports. */
export function collectElements(
  program: ts.Program,
  entries: readonly PublicEntry[],
  root: string
): Record<string, string[]> {
  const checker = program.getTypeChecker();
  const tagsByFile = new Map<string, Set<string>>();
  const declarationsBySource = new Map<string, string>();

  for (const sourceFile of program.getSourceFiles()) {
    if (!isPackageDeclaration(sourceFile.fileName, root)) continue;

    const tags = tagMapEntries(sourceFile, checker);
    if (!tags) continue;

    const file = resolve(sourceFile.fileName);
    const source = sourcePathFor(file);

    tagsByFile.set(file, new Set(tags));

    if (source) declarationsBySource.set(source, file);
  }

  // An element whose static `tagName` is typed `string`, so a subclass can rename it, loses its map key in the built
  // declaration, so each augmenting file's source is read too.
  const sourceProgram = ts.createProgram([...declarationsBySource.keys()], SOURCE_COMPILER_OPTIONS);
  const sourceChecker = sourceProgram.getTypeChecker();

  for (const [source, declaration] of declarationsBySource) {
    const sourceFile = sourceProgram.getSourceFile(source);
    const tags = sourceFile && tagMapEntries(sourceFile, sourceChecker);

    for (const tag of tags ?? []) tagsByFile.get(declaration)!.add(tag);
  }

  const elements = new Map<string, Set<string>>();

  for (const entry of entries) {
    for (const file of reachableDeclarations(entry, program.getCompilerOptions(), root)) {
      for (const tag of tagsByFile.get(resolve(file)) ?? []) {
        const specifiers = elements.get(tag) ?? new Set<string>();

        specifiers.add(entry.specifier);
        elements.set(tag, specifiers);
      }
    }
  }

  return sortedRecord(elements);
}

/** Stylesheet specifiers a package's `exports` map publishes, with wildcard keys expanded against its files. */
export function collectAssets(packageDirectory: string): string[] {
  // SAFETY: workspace manifests are validated by `pnpm check:workspace`; only these fields are read.
  const manifest = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8')) as {
    name: string;
    private?: boolean;
    exports?: Record<string, ExportTarget>;
  };
  if (manifest.private || !manifest.exports) return [];

  const assets: string[] = [];

  for (const [key, target] of Object.entries(manifest.exports)) {
    const file = isString(target) ? target : target?.default;
    if (!file?.endsWith('.css')) continue;

    const subpath = key.slice(1);

    if (!file.includes('*')) {
      assets.push(`${manifest.name}${subpath}`);
      continue;
    }

    // SAFETY: `file.includes('*')` was checked above, so the split has a prefix and a suffix.
    const [prefix, suffix] = file.split('*') as [string, string];
    const searchRoot = join(packageDirectory, dirname(`${prefix}x`));

    for (const path of walkFiles(searchRoot, (candidate) => candidate.endsWith(suffix))) {
      const relativePath = `./${relative(packageDirectory, path).split(sep).join('/')}`;
      if (!relativePath.startsWith(prefix)) continue;

      const star = relativePath.slice(prefix.length, relativePath.length - suffix.length);

      if (star) assets.push(`${manifest.name}${subpath.replace('*', star)}`);
    }
  }

  return assets;
}

export function collectSurface(
  entries: readonly PublicEntry[],
  directories: readonly string[],
  root = resolve(siteDirectory, '..')
): McpSurface {
  const program = ts.createProgram(
    entries.map((entry) => entry.declarationFile),
    COMPILER_OPTIONS
  );

  return {
    modules: collectModuleExports(program, entries),
    assets: [...new Set(directories.flatMap(collectAssets))].sort(),
    elements: collectElements(program, entries, root),
  };
}

function main(): void {
  const directories = packageDirectories();
  const entries = directories.flatMap(collectPackageEntries);
  const missing = entries.filter((entry) => !existsSync(entry.declarationFile));

  if (missing.length > 0) {
    console.error(`✗ ${missing.length} declaration entry points are missing — run \`pnpm build:packages\` first.`);

    for (const entry of missing.slice(0, 10)) console.error(`  ${entry.specifier}`);

    process.exit(1);
  }

  const surface = collectSurface(entries, directories);

  mkdirSync(dirname(MCP_SURFACE_PATH), { recursive: true });
  writeFileSync(MCP_SURFACE_PATH, `${JSON.stringify(surface, null, 2)}\n`);

  console.log(
    `✓ Wrote ${Object.keys(surface.modules).length} modules, ${surface.assets.length} stylesheets, and ` +
      `${Object.keys(surface.elements).length} elements to ${relative(siteDirectory, MCP_SURFACE_PATH)}.`
  );
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);

if (isEntrypoint) main();
