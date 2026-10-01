/**
 * Enforce the public API stability rule: an export a published package exposes is stable when a reference page
 * documents it or a stable export's public types name it, and experimental when only a page marked `stability:
 * unstable` or an experimental export's public types do. Every other export must say so in its JSDoc: `@internal`, or
 * `@deprecated`. A stable or experimental export must not carry a tag that contradicts its stability, and must be
 * importable from a framework-facing package rather than only from an internal or adapter one.
 *
 * The public surface is read from the built declarations each package's `exports` map points at, so run `pnpm
 * build:packages` first. Tags are read from (and `--fix` writes to) the matching `src/` declaration.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const scriptPath = fileURLToPath(import.meta.url);
const monorepoRoot = resolve(scriptPath, '..', '..', '..');

/** Tags that satisfy each required stability. */
const ACCEPTED_TAGS = {
  experimental: ['experimental', 'deprecated'],
  internal: ['internal', 'deprecated'],
} as const;

/** Suffixes of companion exports a page documents alongside its subject (prop/state tables, element classes, …). */
const COMPANION_SUFFIXES = ['Props', 'State', 'Element', 'Options', 'Result', 'Config'];

/** `@videojs/cdn` repackages `@videojs/html` as script-tag bundles, so html owns those declarations. */
const EXCLUDED_PACKAGES = new Set(['@videojs/cdn']);

/**
 * Packages whose declarations this check leaves alone. SPF is documented for media authors by its own maintainers;
 * store's public surface is still being decided.
 */
const UNCHECKED_PACKAGE_DIRECTORIES = ['packages/spf/', 'packages/store/'];

/**
 * Packages whose type aliases count as written out where a public type uses them. `@videojs/utils` is internal, and its
 * aliases (`Constructor`, `MixinReturn`, …) are type-level helpers that mixin declarations name everywhere; their
 * targets are checked instead, as if each use spelled the type out.
 */
const WRITTEN_OUT_ALIAS_DIRECTORIES = ['packages/utils/'];

/**
 * Whether a class or interface makes what it `extends` or `implements` stable. Flip this to keep base classes internal
 * while the members they add still make their own types stable.
 */
export const PROPAGATE_THROUGH_HERITAGE = true;

/** Packages docs examples must not import from; their public parts are re-exported by `@videojs/html` and `/react`. */
const INTERNAL_PACKAGE_PATTERN = /^@videojs\/(?:core|media|utils|element|icons|skins)(?:\/|$)/;

/** Packages whose declarations can be a documented subject's companion types. */
const COMPANION_PACKAGE_PATTERN = /[\\/]packages[\\/](?:react|html|extensions[\\/][^\\/]+)[\\/]/;

/** Packages readers import stable API from, besides the extension packages. */
const FRAMEWORK_PACKAGE_PATTERN = /^@videojs\/(?:react|html|store)(?:\/|$)/;

const MEMBER_PATTERN = /\b([A-Z][\w$]*)((?:\.[A-Z][\w$]*)+)/g;
const SELECTOR_PATTERN = /\bselect[A-Z][\w$]*/g;
const FENCE_PATTERN = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1\2[ \t]*$/gm;
const INLINE_CODE_PATTERN = /`([^`\n]+)`/g;
const CODE_HEADING_PATTERN = /^#{2,6}[ \t]+`([A-Za-z_$][\w$]*)`[ \t]*$/gm;
const CODE_NAME_PATTERN = /`([A-Za-z_$][\w$]*)`/g;
const IMPORT_PATTERN =
  /(?:import|export)\s+(?:type\s+)?(?:([\w$]+)\s*,?\s*)?(\*\s*(?:as\s+[\w$]+\s*)?)?(?:\{([^}]*)\})?\s*(?:from\s+)?['"](@videojs\/[^'"]+)['"]|import\(\s*['"](@videojs\/[^'"]+)['"]\s*\)/g;
const SUBJECT_ATTRIBUTE_PATTERN =
  /<(ComponentReference|UtilReference|MediaReference|ComponentImports|FeatureReference|FeatureImports|MediaImports|ModuleImports|ExtensionImports|SkinImports)\b([^>]*)>/g;

// ── Docs coverage ────────────────────────────────────────────────────────────

export interface Coverage {
  /** Names documented by stable reference pages. */
  stable: Set<string>;
  /** Names documented only by pages marked `stability: unstable`. */
  unstable: Set<string>;
  /** Module specifier patterns (`*` wildcard) whose default export a stable page documents. */
  stableModules: string[];
  unstableModules: string[];
}

export interface Frontmatter {
  title?: string;
  frameworkTitle: string[];
  stability?: string;
  apis: string[];
}

function walkFiles(directory: string, predicate: (path: string) => boolean): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walkFiles(path, predicate);

      return entry.isFile() && predicate(path) ? [path] : [];
    })
    .sort();
}

function pascalCase(kebab: string): string {
  return kebab
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join('');
}

function unquote(value: string): string {
  return value.trim().replace(/^(['"])(.*)\1$/, '$2');
}

/** Read the frontmatter fields this check needs. Astro validates the full schema; this only extracts values. */
export function parseFrontmatter(source: string): Frontmatter {
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const frontmatter: Frontmatter = { frameworkTitle: [], apis: [] };
  let list: string[] | undefined;

  for (const line of block.split('\n')) {
    const item = line.match(/^\s+-\s+(.+)$/);
    const nested = line.match(/^\s+[\w-]+:\s*(.+)$/);
    const field = line.match(/^([\w-]+):\s*(.*)$/);

    if (item && list) {
      list.push(unquote(item[1]!));
    } else if (nested && list === frontmatter.frameworkTitle) {
      list.push(unquote(nested[1]!));
    } else if (field) {
      const [, key, value = ''] = field;

      list = undefined;

      if (key === 'title') frontmatter.title = unquote(value);

      if (key === 'stability') frontmatter.stability = unquote(value);

      if (key === 'frameworkTitle') list = frontmatter.frameworkTitle;

      if (key === 'apis') {
        list = frontmatter.apis;

        const inline = value.match(/^\[(.*)\]$/);

        if (inline) list.push(...inline[1]!.split(',').map(unquote).filter(Boolean));
      }
    }
  }

  return frontmatter;
}

/** Code a page shows readers: fenced blocks and inline code spans. */
function pageCode(body: string): string {
  const blocks: string[] = [];
  const prose = body.replace(FENCE_PATTERN, (_match, _indent, _fence, code: string) => {
    blocks.push(code);
    return '';
  });

  for (const [, code] of prose.matchAll(INLINE_CODE_PATTERN)) blocks.push(code!);

  return blocks.join('\n');
}

/** A page's subject from its title, or from a framework title, where `media-play-button` names `PlayButton`. */
function subjectName(value: string, isFrameworkTitle = false): string {
  if (isFrameworkTitle && value.startsWith('media-')) return pascalCase(value.slice('media-'.length));

  return /^[A-Za-z_$][\w$]*$/.test(value) ? value : pascalCase(value);
}

/** Names in the first column of the tables under a page's `## Exports` heading. */
function exportsTableNames(prose: string): string[] {
  const section = prose.split(/^(?=## )/m).find((part) => /^## Exports[ \t]*$/m.test(part.split('\n', 1)[0]!));
  if (!section) return [];

  return section
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .flatMap((line) => [...line.split('|')[1]!.matchAll(CODE_NAME_PATTERN)].map((match) => match[1]!));
}

/**
 * Collect what one reference page documents: its subjects, their parts, feature selectors, the names its headings and
 * Exports tables give in code, and declared `apis`.
 */
export function collectPageCoverage(source: string): { names: Set<string>; modules: string[]; unstable: boolean } {
  const frontmatter = parseFrontmatter(source);
  const body = source.replace(/^---\n[\s\S]*?\n---/, '');
  const prose = body.replace(FENCE_PATTERN, '');
  const code = pageCode(body);
  const subjects = new Set<string>();
  const modules: string[] = [];
  let isFeaturePage = false;

  for (const [, component, attributes] of body.matchAll(SUBJECT_ATTRIBUTE_PATTERN)) {
    for (const [, key, single, list] of attributes!.matchAll(/\b(\w+)=(?:"([^"]*)"|\{\[([^\]]*)\]\})/g)) {
      const values = single !== undefined ? [single] : [...list!.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!);

      for (const value of values) {
        if (key === 'feature') {
          isFeaturePage = true;
          subjects.add(`${value}Feature`);
        } else if (['component', 'util', 'react'].includes(key!)) {
          subjects.add(value);
        } else if (key === 'media' || (key === 'html' && component === 'ComponentImports')) {
          subjects.add(pascalCase(value));
        }
      }
    }
  }

  // A feature page's title is a prose label (`Volume`, `Error`); its subject is the `*Feature` its reference names.
  for (const [title, isFrameworkTitle] of isFeaturePage
    ? []
    : [[frontmatter.title, false] as const, ...frontmatter.frameworkTitle.map((value) => [value, true] as const)]) {
    if (title && /^[A-Za-z_$][\w$-]*$/.test(title)) subjects.add(subjectName(title, isFrameworkTitle));
  }

  const names = new Set(subjects);

  // `<Slider.Thumbnail.Root>` documents the parts React namespaces flatten to `SliderThumbnail*`, `SliderThumbnailRoot*`.
  for (const [, owner, members] of code.matchAll(MEMBER_PATTERN)) {
    if (!subjects.has(owner!)) continue;

    let name = owner!;

    for (const member of members!.slice(1).split('.')) names.add((name += member));
  }

  if (isFeaturePage) for (const [selector] of code.matchAll(SELECTOR_PATTERN)) names.add(selector);

  for (const [, name] of prose.matchAll(CODE_HEADING_PATTERN)) names.add(name!);

  for (const name of exportsTableNames(prose)) names.add(name);

  for (const api of frontmatter.apis) {
    if (api.startsWith('@')) modules.push(api);
    else names.add(api);
  }

  return { names, modules, unstable: frontmatter.stability === 'unstable' };
}

function referencePages(siteDirectory: string): string[] {
  return walkFiles(join(siteDirectory, 'src/content/docs/reference'), (path) => path.endsWith('.mdx'));
}

export function collectCoverage(siteDirectory: string): Coverage {
  const coverage: Coverage = { stable: new Set(), unstable: new Set(), stableModules: [], unstableModules: [] };

  for (const file of referencePages(siteDirectory)) {
    const page = collectPageCoverage(readFileSync(file, 'utf8'));
    const names = page.unstable ? coverage.unstable : coverage.stable;

    for (const name of page.names) names.add(name);

    (page.unstable ? coverage.unstableModules : coverage.stableModules).push(...page.modules);
  }

  return coverage;
}

export interface StaleApi {
  file: string;
  api: string;
}

/**
 * Documented names that match nothing: an `apis` entry, code heading, or Exports-table name that no framework-facing
 * entry exports, or a module pattern that matches no entry. Renaming or removing an export leaves these behind.
 */
export function findStaleApis(
  pages: ReadonlyArray<{ file: string; apis: readonly string[] }>,
  surface: {
    exports: ReadonlyArray<Pick<PublicExport, 'name' | 'exportedNames' | 'specifiers'>>;
    unresolved: readonly string[];
  }
): StaleApi[] {
  const names = new Set<string>();
  const specifiers = new Set<string>();

  for (const key of surface.unresolved) {
    const separator = key.lastIndexOf('#');

    specifiers.add(key.slice(0, separator));
    names.add(key.slice(separator + 1));
  }

  for (const record of surface.exports) {
    const publicSpecifiers = [...record.specifiers].filter((specifier) => !INTERNAL_PACKAGE_PATTERN.test(specifier));
    if (publicSpecifiers.length === 0) continue;

    for (const name of [record.name, ...record.exportedNames]) names.add(name);

    for (const specifier of publicSpecifiers) specifiers.add(specifier);
  }

  const isStale = (api: string) =>
    api.startsWith('@')
      ? ![...specifiers].some((specifier) => matchesModulePattern(specifier, [api]))
      : !names.has(api);

  return pages.flatMap(({ file, apis }) => apis.filter(isStale).map((api) => ({ file, api })));
}

/** The names a page states outright: `apis` entries, code headings, and Exports-table names. Each must still exist. */
export function declaredApis(source: string): string[] {
  const prose = source.replace(/^---\n[\s\S]*?\n---/, '').replace(FENCE_PATTERN, '');
  const headings = [...prose.matchAll(CODE_HEADING_PATTERN)].map((match) => match[1]!);

  return [...new Set([...parseFrontmatter(source).apis, ...headings, ...exportsTableNames(prose)])];
}

function collectDeclaredApis(siteDirectory: string): Array<{ file: string; apis: string[] }> {
  return referencePages(siteDirectory).map((file) => ({ file, apis: declaredApis(readFileSync(file, 'utf8')) }));
}

/**
 * Whether a page covers `name`: by the name itself or, when `companions` holds, as a companion of a covered subject
 * (`PlayButtonProps` of `PlayButton`).
 */
export function isCoveredName(name: string, covered: ReadonlySet<string>, companions = true): boolean {
  const candidates = [name];

  for (const suffix of companions ? COMPANION_SUFFIXES : []) {
    if (name.length > suffix.length && name.endsWith(suffix)) candidates.push(name.slice(0, -suffix.length));
  }

  // A companion belongs to its hook: `UseHotkeyOptions` to `useHotkey`, `QualityOptionsResult` to
  // `useQualityOptions`. The name itself only matches exactly, so `PlayerContext` isn't covered by `playerContext`.
  return candidates.some(
    (candidate) =>
      covered.has(candidate) ||
      (candidate !== name &&
        (covered.has(candidate[0]!.toLowerCase() + candidate.slice(1)) || covered.has(`use${candidate}`)))
  );
}

export function matchesModulePattern(specifier: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => {
    const source = pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));

    return new RegExp(`^${source.join('[^/]+')}$`).test(specifier);
  });
}

// ── Public surface ───────────────────────────────────────────────────────────

export interface PublicEntry {
  /** Import specifier, e.g. `@videojs/html/ui/play-button`. */
  specifier: string;
  /** Absolute path of the built declaration file. */
  declarationFile: string;
}

type ExportTarget = string | { types?: string } | null;

function packageDirectories(): string[] {
  const packagesDirectory = join(monorepoRoot, 'packages');

  return readdirSync(packagesDirectory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];

    const directory = join(packagesDirectory, entry.name);
    if (existsSync(join(directory, 'package.json'))) return [directory];

    return readdirSync(directory, { withFileTypes: true })
      .filter((child) => child.isDirectory() && existsSync(join(directory, child.name, 'package.json')))
      .map((child) => join(directory, child.name));
  });
}

/** Expand a package's `exports` map into one entry per declaration file a consumer can import. */
export function collectPackageEntries(packageDirectory: string): PublicEntry[] {
  // SAFETY: workspace manifests are validated by `pnpm check:workspace`; only these fields are read.
  const manifest = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8')) as {
    name: string;
    private?: boolean;
    exports?: Record<string, ExportTarget>;
  };
  if (manifest.private || EXCLUDED_PACKAGES.has(manifest.name) || typeof manifest.exports !== 'object') return [];

  const entries: PublicEntry[] = [];

  for (const [key, target] of Object.entries(manifest.exports)) {
    const types = typeof target === 'string' ? target : target?.types;
    if (!types?.endsWith('.d.ts')) continue;

    const subpath = key === '.' ? '' : key.slice(1);

    if (!types.includes('*')) {
      entries.push({ specifier: `${manifest.name}${subpath}`, declarationFile: join(packageDirectory, types) });
      continue;
    }

    // SAFETY: `types.includes('*')` was checked above, so the split has a prefix and a suffix.
    const [prefix, suffix] = types.split('*') as [string, string];
    const searchRoot = join(packageDirectory, dirname(`${prefix}x`));

    for (const file of walkFiles(searchRoot, (path) => path.endsWith('.d.ts'))) {
      const relativePath = `./${relative(packageDirectory, file).split(sep).join('/')}`;
      if (!relativePath.startsWith(prefix) || !relativePath.endsWith(suffix)) continue;

      const star = relativePath.slice(prefix.length, relativePath.length - suffix.length);

      if (star) entries.push({ specifier: `${manifest.name}${subpath.replace('*', star)}`, declarationFile: file });
    }
  }

  return entries;
}

export interface PublicExport {
  /** Declaration name in source; `default` for a module's default export. */
  name: string;
  /**
   * Names consumers import it by. A member of an `export * as Slider` namespace is named as its part is documented,
   * `SliderBuffer` for `Slider.Buffer`; a member of a lowercase namespace keeps the dot, `features.pip`.
   */
  exportedNames: Set<string>;
  specifiers: Set<string>;
  /** Source file owning the declaration, or the built declaration file when no source match exists. */
  file: string;
  /** Whether `file` is the authored source (and so fixable). */
  hasSource: boolean;
  /**
   * JSDoc tag names of each declaration that must carry the stability tag: every declaration of a merged name and every
   * overload signature, but not an overload implementation, which the built declarations drop.
   */
  declarationTags: Array<Set<string>>;
  /** Other public exports that this export's public type surface names directly, outside its heritage clauses. */
  references: Set<PublicExport>;
  /** Other public exports that this export's `extends` or `implements` clauses name. */
  heritageReferences: Set<PublicExport>;
}

export interface PublicSurface {
  exports: PublicExport[];
  /** `specifier#name` of exports that resolve to no declaration, such as a re-export of an unresolvable module. */
  unresolved: string[];
}

/** Bundled declaration files wrap `export * as X` namespaces in synthetic `*_exports` modules. */
function isSyntheticNamespace(name: string): boolean {
  return /_exports(?:\$\d+)?$/.test(name);
}

/** `Slider` + `Buffer` names the `Slider.Buffer` part `SliderBuffer`; any other member keeps the dot. */
function namespaceMemberName(namespace: string, member: string): string {
  return /^[A-Z]/.test(namespace) && /^[A-Z]/.test(member) ? `${namespace}${member}` : `${namespace}.${member}`;
}

/** Map `packages/<pkg>/dist[/dev|/default]/<path>.d.ts` back to its `src/` module. */
export function sourcePathFor(declarationFile: string): string | undefined {
  const match = declarationFile.match(/^(.*)[\\/]dist[\\/](?:dev[\\/]|default[\\/])?(.*)\.d\.ts$/);
  if (!match) return undefined;

  const base = join(match[1]!, 'src', match[2]!);

  return ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((extension) => `${base}${extension}`).find(existsSync);
}

const sourceFiles = new Map<string, ts.SourceFile>();
const authoredFiles = new Map<string, string[]>();

/** Every authored module under a package's `src/`, including private packages that others bundle. */
function authoredSourceFiles(root: string): string[] {
  let files = authoredFiles.get(root);

  if (!files) {
    files = walkFiles(join(root, 'packages'), (path) => /\.tsx?$/.test(path)).filter((path) => {
      const segments = relative(root, path).split(sep);

      return (
        segments.includes('src') &&
        !segments.includes('dist') &&
        !segments.includes('tests') &&
        !/\.test\.tsx?$/.test(path)
      );
    });
    authoredFiles.set(root, files);
  }

  return files;
}

/**
 * Find the authored declarations of `name` behind a built declaration file. Entries that a build renames or bundles
 * (`src/core/i18n/…` built to `dist/dev/i18n/…`, a private package copied into another's `dist/`) don't mirror `src/`,
 * so the path after the last `dist/` is matched against authored files that declare the name, and a match is used only
 * when it is unique.
 */
export function findSourceDeclarations(
  declarationFile: string,
  name: string,
  root = monorepoRoot
): { file: string; nodes: DocumentableNode[] } | undefined {
  const direct = sourcePathFor(declarationFile);
  const directNodes = direct ? findDeclarations(cachedSource(direct), name) : [];
  if (direct && directNodes.length > 0) return { file: direct, nodes: directNodes };

  const tail = declarationFile
    .split(sep)
    .join('/')
    .split('/dist/')
    .at(-1)!
    .replace(/^(?:dev|default)\//, '')
    .replace(/\.d\.ts$/, '');
  const suffixes = ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((extension) => `/${tail}${extension}`);
  const candidates = authoredSourceFiles(root)
    .filter((file) => suffixes.some((suffix) => file.split(sep).join('/').endsWith(suffix)))
    .map((file) => ({ file, nodes: findDeclarations(cachedSource(file), name) }))
    .filter((candidate) => candidate.nodes.length > 0);

  return candidates.length === 1 ? candidates[0] : undefined;
}

function parseSource(filePath: string, text = readFileSync(filePath, 'utf8')): ts.SourceFile {
  const kind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;

  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, kind);
}

function cachedSource(filePath: string): ts.SourceFile {
  let sourceFile = sourceFiles.get(filePath);

  if (!sourceFile) {
    sourceFile = parseSource(filePath);
    sourceFiles.set(filePath, sourceFile);
  }

  return sourceFile;
}

/** The statement a declaration's JSDoc attaches to. */
export type DocumentableNode = ts.Statement;

/**
 * Find the top-level statements declaring `name` in a source file. `default` finds `export default`; for `export
 * default x` it finds the declarations of `x`, which carry the JSDoc consumers see.
 */
export function findDeclarations(sourceFile: ts.SourceFile, name: string): DocumentableNode[] {
  if (name === 'default') {
    const assignment = sourceFile.statements.find(
      (statement): statement is ts.ExportAssignment => ts.isExportAssignment(statement) && !statement.isExportEquals
    );
    const target = assignment && ts.isIdentifier(assignment.expression) ? assignment.expression.text : undefined;
    const targetDeclarations = target ? findDeclarations(sourceFile, target) : [];
    if (targetDeclarations.length > 0) return targetDeclarations;
  }

  return sourceFile.statements.filter((statement) => {
    if (name === 'default') {
      if (ts.isExportAssignment(statement)) return !statement.isExportEquals;

      const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;

      return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false;
    }

    if (ts.isVariableStatement(statement)) {
      return statement.declarationList.declarations.some((declaration) => bindsName(declaration.name, name));
    }

    // SAFETY: only read after the kind guards below confirm a named declaration statement.
    const declarationName = (statement as ts.DeclarationStatement).name;

    return (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement) ||
        ts.isModuleDeclaration(statement)) &&
      declarationName !== undefined &&
      ts.isIdentifier(declarationName) &&
      declarationName.text === name
    );
  });
}

/**
 * Whether a declaration's name binds `name`, directly or through a destructuring pattern such as `{ Player: VideoPlayer
 * }`.
 */
function bindsName(binding: ts.BindingName, name: string): boolean {
  if (ts.isIdentifier(binding)) return binding.text === name;

  return binding.elements.some((element) => !ts.isOmittedExpression(element) && bindsName(element.name, name));
}

/** Drop the implementation of an overloaded function: consumers only see its overload signatures. */
function signatureDeclarations(nodes: readonly DocumentableNode[]): DocumentableNode[] {
  const isOverloaded = nodes.some((node) => ts.isFunctionDeclaration(node) && !node.body);

  return nodes.filter((node) => !(isOverloaded && ts.isFunctionDeclaration(node) && node.body));
}

function jsDocTagNames(node: ts.Node): Set<string> {
  const target = ts.isVariableStatement(node) ? node.declarationList.declarations[0]! : node;

  return new Set(ts.getJSDocTags(target).map((tag) => tag.tagName.text));
}

function isCheckedDeclaration(fileName: string, root: string): boolean {
  const relativePath = relative(root, fileName).split(sep).join('/');

  return (
    relativePath.startsWith('packages/') &&
    !relativePath.split('/').includes('node_modules') &&
    !UNCHECKED_PACKAGE_DIRECTORIES.some((directory) => relativePath.startsWith(directory))
  );
}

function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

/** A module namespace: a bundled `*_exports` wrapper, or the module an unbundled `export * as X` points at. */
function isModuleNamespace(symbol: ts.Symbol): boolean {
  return isSyntheticNamespace(symbol.name) || (symbol.declarations?.some(ts.isSourceFile) ?? false);
}

function hasTag(node: ts.Node, name: string): boolean {
  return ts.getJSDocTags(node).some((tag) => tag.tagName.text === name);
}

function isPublicMember(member: ts.ClassElement | ts.TypeElement): boolean {
  const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
  // Protected members stay: they are the contract a subclass overrides or implements.
  const isPrivate = modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword);
  if (isPrivate || (member.name && ts.isPrivateIdentifier(member.name))) return false;

  return !hasTag(member, 'internal');
}

/**
 * Whether a protected member re-declares one a base class already declares, as `PlayButtonElement`'s `core` implements
 * `MediaButtonElement`'s abstract `core`. The base's declaration is the contract a subclass works against; the narrower
 * type the subclass gives it is an implementation detail.
 */
function isInheritedProtected(member: ts.ClassElement | ts.TypeElement, checker: ts.TypeChecker): boolean {
  const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
  const name = member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;
  if (!name || !modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ProtectedKeyword)) return false;

  const type = checker.getTypeAtLocation(member.parent);

  return (checker.getBaseTypes(type as ts.InterfaceType) ?? []).some((base) => checker.getPropertyOfType(base, name));
}

/**
 * The parts of a built declaration a consumer's code can name: heritage clauses and public and protected members of an
 * interface or class, the aliased type, a function's parameters, return type, and type parameters, and a variable's
 * declared type.
 */
function publicSurface(declaration: ts.Declaration, checker: ts.TypeChecker): readonly ts.Node[] {
  if (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration)) {
    const members: ReadonlyArray<ts.ClassElement | ts.TypeElement> = declaration.members;

    return [
      ...(declaration.typeParameters ?? []),
      ...(declaration.heritageClauses ?? []),
      ...members.filter((member) => isPublicMember(member) && !isInheritedProtected(member, checker)),
    ];
  }

  if (ts.isTypeAliasDeclaration(declaration)) return [...(declaration.typeParameters ?? []), declaration.type];

  if (ts.isFunctionDeclaration(declaration)) {
    return [
      ...(declaration.typeParameters ?? []),
      ...declaration.parameters,
      ...(declaration.type ? [declaration.type] : []),
    ];
  }

  if (ts.isVariableDeclaration(declaration)) return declaration.type ? [declaration.type] : [];

  if (ts.isModuleDeclaration(declaration) && declaration.body && ts.isModuleBlock(declaration.body)) {
    return declaration.body.statements.filter((statement) => !hasTag(statement, 'internal'));
  }

  return [];
}

/** Identifiers of a type or heritage name, rightmost first: `SliderCore.Props` yields `Props`, then `SliderCore`. */
function nameParts(name: ts.Node): ts.Identifier[] {
  if (ts.isIdentifier(name)) return [name];

  if (ts.isQualifiedName(name)) return [name.right, ...nameParts(name.left)];

  if (ts.isPropertyAccessExpression(name) && ts.isIdentifier(name.name)) {
    return [name.name, ...nameParts(name.expression)];
  }

  return [];
}

/**
 * Call `visit` with the name parts of every type reference, heritage clause, and `typeof` query under `node`, and
 * whether the name is the base a heritage clause extends or implements. Type arguments of a heritage clause aren't.
 */
function forEachTypeName(node: ts.Node, visit: (parts: ts.Identifier[], isHeritage: boolean) => void): void {
  if (ts.isTypeReferenceNode(node)) visit(nameParts(node.typeName), false);
  else if (ts.isExpressionWithTypeArguments(node)) visit(nameParts(node.expression), ts.isHeritageClause(node.parent));
  else if (ts.isTypeQueryNode(node)) visit(nameParts(node.exprName), false);
  else if (ts.isImportTypeNode(node) && node.qualifier) visit(nameParts(node.qualifier), false);

  ts.forEachChild(node, (child) => forEachTypeName(child, visit));
}

/** Resolve every export of every public entry to its authored declaration, deduplicated across re-exports. */
export function collectPublicExports(entries: readonly PublicEntry[], root = monorepoRoot): PublicSurface {
  const program = ts.createProgram(
    entries.map((entry) => entry.declarationFile),
    {
      noEmit: true,
      skipLibCheck: true,
      types: [],
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    }
  );
  const checker = program.getTypeChecker();
  const exports = new Map<string, PublicExport>();
  const bySymbol = new Map<ts.Symbol, PublicExport>();
  const unresolved: string[] = [];

  const checkedDeclarations = (symbol: ts.Symbol) =>
    (symbol.declarations ?? []).filter((node) => isCheckedDeclaration(node.getSourceFile().fileName, root));

  const isWrittenOut = (symbol: ts.Symbol) =>
    (symbol.flags & ts.SymbolFlags.TypeAlias) !== 0 &&
    (symbol.declarations ?? []).some((node) => {
      const path = relative(root, node.getSourceFile().fileName).split(sep).join('/');

      return WRITTEN_OUT_ALIAS_DIRECTORIES.some((directory) => path.startsWith(directory));
    });

  const collect = (exported: ts.Symbol, exportedName: string, entry: PublicEntry, namespaces: Set<ts.Symbol>) => {
    // `index_parts_d_exports` re-exported under its own synthetic name is bundler output, not API.
    if (isSyntheticNamespace(exportedName)) return;

    const symbol = resolveAlias(checker, exported);

    if (!symbol.declarations?.length) {
      unresolved.push(`${entry.specifier}#${exportedName}`);
      return;
    }

    const declarations = checkedDeclarations(symbol);
    if (declarations.length === 0) return;

    // Consumers never see JSDoc on `export * as Slider`, so a namespace is checked through its members.
    if (isModuleNamespace(symbol)) {
      if (namespaces.has(symbol)) return;

      const nested = new Set([...namespaces, symbol]);

      for (const member of checker.getExportsOfModule(symbol)) {
        collect(member, namespaceMemberName(exportedName, member.name), entry, nested);
      }

      return;
    }

    // Bundled declarations rename default exports to `_default` and suffix colliding names, e.g. `IconProps$1`.
    const isDefault = exported.name === 'default' || symbol.name === '_default';
    const name = isDefault ? 'default' : symbol.name.replace(/\$\d+$/, '');
    const declarationFile = declarations[0]!.getSourceFile().fileName;
    const source = findSourceDeclarations(declarationFile, name, root);
    const file = source?.file ?? declarationFile;
    const key = `${file}#${name}`;

    let record = exports.get(key);

    if (!record) {
      const tagged = source ? signatureDeclarations(source.nodes) : declarations;

      record = {
        name,
        exportedNames: new Set(),
        specifiers: new Set(),
        file,
        hasSource: source !== undefined,
        declarationTags: tagged.map(jsDocTagNames),
        references: new Set(),
        heritageReferences: new Set(),
      };
      exports.set(key, record);
    }

    record.exportedNames.add(exportedName);
    record.specifiers.add(entry.specifier);
    bySymbol.set(symbol, record);
  };

  for (const entry of entries) {
    const sourceFile = program.getSourceFile(entry.declarationFile);
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) continue;

    for (const exported of checker.getExportsOfModule(moduleSymbol)) collect(exported, exported.name, entry, new Set());
  }

  // A reference may name another bundle's copy of an export, so symbols no entry exported are matched by source.
  const bySource = new Map<ts.Symbol, PublicExport | undefined>();

  const recordOf = (identifier: ts.Identifier): PublicExport | undefined => {
    const located = checker.getSymbolAtLocation(identifier);
    if (!located) return undefined;

    const symbol = resolveAlias(checker, located);
    if (bySymbol.has(symbol)) return bySymbol.get(symbol);

    if (!bySource.has(symbol)) {
      const declaration = checkedDeclarations(symbol)[0];
      const name = symbol.name.replace(/\$\d+$/, '');
      const source = declaration && findSourceDeclarations(declaration.getSourceFile().fileName, name, root);

      bySource.set(symbol, source ? exports.get(`${source.file}#${name}`) : undefined);
    }

    return bySource.get(symbol);
  };

  // A type no entry exports (a local helper, a mixin's `_base` constant) is still part of the surface that names it, so
  // its own references count as the referrer's, through its heritage when the helper was reached through heritage. A
  // written-out alias is expanded the same way even though an entry exports it. A global the packages only augment, such
  // as `HTMLElementTagNameMap`, isn't a helper: naming it doesn't expose every element registered on it.
  for (const [symbol, record] of bySymbol) {
    const visited = new Set([symbol]);

    const walk = (nodes: readonly ts.Node[], throughHeritage: boolean) => {
      for (const node of nodes) {
        forEachTypeName(node, (parts, isHeritage) => {
          const heritage = throughHeritage || isHeritage;
          const located = parts[0] && checker.getSymbolAtLocation(parts[0]);
          const helper = located && resolveAlias(checker, located);
          const reference =
            helper && isWrittenOut(helper)
              ? undefined
              : parts.map(recordOf).find((candidate) => candidate !== undefined);

          if (reference) {
            if (reference !== record) (heritage ? record.heritageReferences : record.references).add(reference);

            return;
          }

          if (!helper || visited.has(helper)) return;

          visited.add(helper);

          const declarations = checkedDeclarations(helper);
          if (declarations.length < (helper.declarations?.length ?? 0)) return;

          walk(
            declarations.flatMap((declaration) => publicSurface(declaration, checker)),
            heritage
          );
        });
      }
    };

    walk(
      checkedDeclarations(symbol).flatMap((declaration) => publicSurface(declaration, checker)),
      false
    );
  }

  return { exports: [...exports.values()], unresolved };
}

// ── Classification ───────────────────────────────────────────────────────────

export type Stability = 'stable' | 'experimental' | 'internal';

export type StabilityTag = 'experimental' | 'internal';

/**
 * The stability the docs give an export: stable or experimental when a page documents it, internal otherwise. An export
 * only internal packages expose is internal whatever its name: pages document what `@videojs/react`, `@videojs/html`,
 * and the other framework-facing packages expose, not the core they build on. {@link resolveStabilities} starts from
 * this.
 */
export function documentedStability(
  record: Pick<PublicExport, 'name' | 'exportedNames' | 'specifiers'> & Partial<Pick<PublicExport, 'file'>>,
  coverage: Coverage
): Stability {
  const specifiers = [...record.specifiers].filter((specifier) => !INTERNAL_PACKAGE_PATTERN.test(specifier));
  if (specifiers.length === 0) return 'internal';

  const names = [record.name, ...record.exportedNames].filter((name) => name !== 'default');
  // Companions are the subject's own types, declared beside it. A same-named type from core or store, such as core's
  // `MenuOptions` for the `Menu` page, is the contract of an internal building block, not part of the subject.
  const companions = record.file === undefined || COMPANION_PACKAGE_PATTERN.test(record.file);
  // An exact entry point documents everything it exports; a `*` pattern documents each matched module's default export.
  const coversModule = (pattern: string) =>
    (record.name === 'default' || !pattern.includes('*')) &&
    specifiers.some((specifier) => matchesModulePattern(specifier, [pattern]));
  const covers = (set: ReadonlySet<string>, patterns: readonly string[]) =>
    names.some((name) => isCoveredName(name, set, companions)) || patterns.some(coversModule);
  if (covers(coverage.stable, coverage.stableModules)) return 'stable';

  if (covers(coverage.unstable, coverage.unstableModules)) return 'experimental';

  return 'internal';
}

/** The entry a report names an export by: a framework-facing one when there is one. */
function primarySpecifier(record: Pick<PublicExport, 'specifiers'>): string {
  const specifiers = [...record.specifiers].sort();

  return specifiers.find((specifier) => !INTERNAL_PACKAGE_PATTERN.test(specifier)) ?? specifiers[0]!;
}

function label(record: Pick<PublicExport, 'name' | 'specifiers'>): string {
  return `${record.name} (${primarySpecifier(record)})`;
}

/** `@videojs/react` for `@videojs/react/ui/play-button`. */
function packageName(specifier: string): string {
  return specifier.split('/').slice(0, 2).join('/');
}

const STABILITY_RANK = { internal: 0, experimental: 1, stable: 2 } satisfies Record<Stability, number>;

/** An export's stability, and the exports whose public types gave it that stability when the docs didn't. */
export interface ResolvedStability {
  stability: Stability;
  /**
   * Exports of the same stability whose public types name this one, documented ones first; empty when the docs give the
   * export its stability.
   */
  referrers: PublicExport[];
}

export interface PropagationOptions {
  /** Whether `extends` and `implements` clauses pass stability to their base. Defaults to `PROPAGATE_THROUGH_HERITAGE`. */
  heritage?: boolean;
}

/**
 * Give each export its stability. The docs set the starting point, and stability is transitive through public types: an
 * export a stable export's public surface names is stable, and one that only experimental exports name is experimental,
 * whichever package exposes it.
 */
export function resolveStabilities(
  records: readonly PublicExport[],
  coverage: Coverage,
  { heritage = PROPAGATE_THROUGH_HERITAGE }: PropagationOptions = {}
): Map<PublicExport, ResolvedStability> {
  const documented = new Map(records.map((record) => [record, documentedStability(record, coverage)]));
  const stabilities = new Map(documented);
  const referencesOf = (record: PublicExport) =>
    heritage ? [...record.references, ...record.heritageReferences] : [...record.references];

  // Stable first, so an export both levels reach is stable. The queue grows as references raise exports.
  for (const level of ['stable', 'experimental'] as const) {
    const queue = records.filter((record) => stabilities.get(record) === level);

    for (const record of queue) {
      for (const reference of referencesOf(record)) {
        const current = stabilities.get(reference);
        if (current === undefined || STABILITY_RANK[current] >= STABILITY_RANK[level]) continue;

        stabilities.set(reference, level);
        queue.push(reference);
      }
    }
  }

  const referrers = new Map<PublicExport, PublicExport[]>();

  for (const record of records) {
    for (const reference of new Set(referencesOf(record))) {
      const stability = stabilities.get(reference);
      if (stability === documented.get(reference) || stability !== stabilities.get(record)) continue;

      referrers.set(reference, [...(referrers.get(reference) ?? []), record]);
    }
  }

  const isDocumented = (record: PublicExport) => documented.get(record) === stabilities.get(record);
  const byReason = (a: PublicExport, b: PublicExport) =>
    Number(isDocumented(b)) - Number(isDocumented(a)) || label(a).localeCompare(label(b));

  return new Map(
    records.map((record) => [
      record,
      { stability: stabilities.get(record)!, referrers: (referrers.get(record) ?? []).sort(byReason) },
    ])
  );
}

/** How one declaration's tags must change to match its stability. */
export interface TagChange {
  add?: StabilityTag;
  remove: StabilityTag[];
}

/**
 * The change one declaration's tags need, or `undefined` when they comply. Stability wins over a tag: a stable or
 * experimental export loses a contradicting `@internal`, and a stable or internal one `@experimental`, which only a
 * `stability: unstable` page or an experimental export's types can earn.
 */
export function tagChange(tags: ReadonlySet<string>, stability: Stability): TagChange | undefined {
  if (stability === 'stable') {
    const remove = (['internal', 'experimental'] as const).filter((tag) => tags.has(tag));

    return remove.length > 0 ? { remove } : undefined;
  }

  const contradicting = stability === 'experimental' ? 'internal' : 'experimental';
  const remove: StabilityTag[] = tags.has(contradicting) ? [contradicting] : [];
  const add = ACCEPTED_TAGS[stability].some((tag) => tags.has(tag)) ? undefined : stability;
  if (!add && remove.length === 0) return undefined;

  return add ? { add, remove } : { remove };
}

/** `PlayButtonProps (@videojs/react) references it`, naming the first referrer and counting the rest. */
function referenceReason(referrers: ReadonlyArray<Pick<PublicExport, 'name' | 'specifiers'>>): string {
  const more = referrers.length > 1 ? ` (+${referrers.length - 1} more)` : '';

  return `${label(referrers[0]!)} references it${more}`;
}

/**
 * Why `record` fails the tag rule at `stability`, or `undefined` when every declaration complies. `referrers` are the
 * exports that gave it that stability, when the docs didn't.
 */
export function tagViolation(
  record: Pick<PublicExport, 'declarationTags'>,
  stability: Stability,
  referrers: ReadonlyArray<Pick<PublicExport, 'name' | 'specifiers'>> = []
): string | undefined {
  const changes = record.declarationTags.map((tags) => tagChange(tags, stability));
  const removed = [...new Set(changes.flatMap((change) => change?.remove ?? []))];
  const untagged = changes.filter((change) => change?.add).length;
  const reason = referrers.length > 0 ? referenceReason(referrers) : undefined;

  if (removed.length > 0) {
    const tags = removed.map((tag) => `@${tag}`).join(' and ');

    if (stability === 'stable') {
      return reason
        ? `is stable because ${reason} — remove ${tags}`
        : `is documented on a reference page but tagged ${tags} — remove the tag`;
    }

    if (stability === 'internal') return `is neither documented nor referenced but tagged ${tags} — use @internal`;

    return reason
      ? `is experimental because ${reason} — use @experimental instead of ${tags}`
      : `is documented on an unstable page but tagged ${tags} — use @experimental`;
  }

  if (untagged === 0) return undefined;

  const scope = untagged < changes.length ? ` on ${untagged} of ${changes.length} declarations` : '';

  return `needs @${stability}${scope}${reason ? ` because ${reason}` : ''}`;
}

export interface UnexportedExport {
  record: PublicExport;
  reason: string;
}

export interface PackageKinds {
  /** Playback adapter packages, whose types the framework packages re-export from `/media/*`. */
  adapters: ReadonlySet<string>;
  /** Extension packages, which readers import from directly. */
  extensions: ReadonlySet<string>;
}

/**
 * Stable and experimental exports that no framework-facing package exports: only `@videojs/react`, `@videojs/html`,
 * `@videojs/store`, and the extension packages count. Readers import the API from those, which re-export an adapter's
 * types from their `/media/*` entry, so a person has to add the re-export or change the signature; `--fix` leaves these
 * alone.
 */
export function findUnexportedExports(
  resolved: ReadonlyMap<PublicExport, ResolvedStability>,
  { adapters: adapterPackages, extensions }: PackageKinds
): UnexportedExport[] {
  const isAdapter = (specifier: string) => adapterPackages.has(packageName(specifier));
  const isImportable = (specifier: string) =>
    FRAMEWORK_PACKAGE_PATTERN.test(specifier) || extensions.has(packageName(specifier));

  return [...resolved].flatMap(([record, { stability, referrers }]) => {
    if (stability === 'internal' || [...record.specifiers].some(isImportable)) return [];

    const adapters = [...new Set([...record.specifiers].filter(isAdapter).map(packageName))].sort();
    const more = referrers.length > 1 ? `, +${referrers.length - 1} more` : '';
    const why = referrers.length > 0 ? `${referrers[0]!.name} references it${more}` : 'documented';
    const exporter =
      adapters.length > 0
        ? `only ${adapters.join(' and ')} ${adapters.length === 1 ? 'exports' : 'export'} it`
        : 'no framework-facing package exports it';
    const targets =
      adapters.length > 0
        ? adapters
            .map((adapter) => adapter.slice('@videojs/'.length))
            .map((media) => `@videojs/react/media/${media} / @videojs/html/media/${media}`)
            .join(' and ')
        : '@videojs/react / @videojs/html';

    return [{ record, reason: `is ${stability} (${why}) but ${exporter} — re-export it from ${targets}` }];
  });
}

// ── Fix ──────────────────────────────────────────────────────────────────────

/** `vp fmt` wraps JSDoc at this width and collapses a one-line comment that fits onto a single line. */
const PRINT_WIDTH = 120;

/** Block tags the formatter sorts after `@internal` and `@experimental`; it keeps every other tag's order. */
const TRAILING_TAGS = new Set(['see', 'todo']);

/** A JSDoc comment's content lines, without the comment markers, leading `*`, or surrounding blank lines. */
function commentLines(comment: string): string[] {
  const lines = comment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trimEnd());

  return trimBlankLines(lines);
}

function trimBlankLines(lines: readonly string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start]!.trim()) start++;

  while (end > start && !lines[end - 1]!.trim()) end--;

  return lines.slice(start, end);
}

/** Block tags that start a line outside fenced code, with the line each starts on. */
function blockTags(lines: readonly string[]): Array<{ index: number; tag: string }> {
  const tags: Array<{ index: number; tag: string }> = [];
  let fence: string | undefined;

  lines.forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];

    if (marker && (!fence || (marker[0] === fence[0] && marker.length >= fence.length))) {
      fence = fence ? undefined : marker;
    } else if (!fence) {
      const tag = line.match(/^@([\w-]+)/)?.[1];

      if (tag) tags.push({ index, tag });
    }
  });

  return tags;
}

/**
 * Remove each `@tag` block, from its tag line to the next tag, without leaving doubled blank lines. Text the tag
 * carried moves to the end of the description, so dropping a tag drops no prose.
 */
function removeTagBlocks(lines: readonly string[], tag: string): string[] {
  const result = [...lines];
  const carried: string[] = [];
  let tags = blockTags(result);
  let at = tags.findIndex((candidate) => candidate.tag === tag);

  while (at !== -1) {
    const start = tags[at]!.index;
    const end = tags[at + 1]?.index ?? result.length;
    const text = trimBlankLines(
      [result[start]!.replace(/^@[\w-]+\s*/, ''), ...result.slice(start + 1, end)].map((line) => line.trim())
    );

    if (text.length > 0) carried.push(...(carried.length > 0 ? [''] : []), ...text);

    result.splice(start, end - start);

    if (start > 0 && start < result.length && !result[start - 1] && !result[start]) result.splice(start, 1);

    tags = blockTags(result);
    at = tags.findIndex((candidate) => candidate.tag === tag);
  }

  const kept = trimBlankLines(result);

  if (carried.length === 0) return kept;

  const descriptionEnd = blockTags(kept)[0]?.index ?? kept.length;
  const description = trimBlankLines(kept.slice(0, descriptionEnd));
  const rest = kept.slice(descriptionEnd);

  return [
    ...description,
    ...(description.length > 0 ? [''] : []),
    ...carried,
    ...(rest.length > 0 ? ['', ...rest] : []),
  ];
}

/**
 * Insert `@tag` where the formatter keeps it: after the other tags but before `@see` and `@todo`, separated by a blank
 * line from the description and from an `@example`.
 */
function insertTag(lines: readonly string[], tag: string): string[] {
  const tags = blockTags(lines);
  const at = tags.find((candidate) => TRAILING_TAGS.has(candidate.tag))?.index ?? lines.length;
  const previous = tags.filter((candidate) => candidate.index < at).at(-1);
  const before = lines.slice(0, at);
  const isSeparated = before.length > 0 && (!previous || previous.tag === 'example');

  if (isSeparated && before.at(-1)) before.push('');

  return [...before, `@${tag}`, ...lines.slice(at)];
}

function renderComment(lines: readonly string[], indent: string): string {
  if (lines.length === 0) return '';

  if (lines.length === 1 && `${indent}/** ${lines[0]} */`.length <= PRINT_WIDTH) return `/** ${lines[0]} */`;

  return ['/**', ...lines.map((line) => (line ? `${indent} * ${line}` : `${indent} *`)), `${indent} */`].join('\n');
}

/** Line comments that apply to the next line; a JSDoc block goes above them. */
const DIRECTIVE_PATTERN = /^\/\/\s*(?:@ts-|eslint-|oxlint-|biome-ignore|prettier-ignore)/;

/** Where the directive comments directly above `node` begin, or `start` when there are none. */
function directiveStart(source: string, node: ts.Node, start: number): number {
  let at = start;

  for (const range of (ts.getLeadingCommentRanges(source, node.pos) ?? []).reverse()) {
    const text = source.slice(range.pos, range.end);
    if (!DIRECTIVE_PATTERN.test(text) || source.slice(range.end, at).trim()) break;

    at = range.pos;
  }

  return at;
}

/**
 * Return `source` with the JSDoc of `node` changed as `change` says: a replaced tag becomes the added one in place, a
 * comment left empty is deleted, and a new comment is created when needed, above any directive comments such as `//
 * @ts-expect-error` so they keep applying to the declaration. The result is formatter-clean when `source` is.
 */
export function applyTagChange(
  source: string,
  sourceFile: ts.SourceFile,
  node: DocumentableNode,
  change: TagChange
): string {
  const start = node.getStart(sourceFile);
  const indent = source.slice(source.lastIndexOf('\n', start - 1) + 1, start).match(/^[ \t]*/)![0];
  const comments = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);

  if (comments.length === 0) {
    if (!change.add) return source;

    const at = directiveStart(source, node, start);

    return `${source.slice(0, at)}/** @${change.add} */\n${indent}${source.slice(at)}`;
  }

  let add = change.add;
  let result = source;

  // Edit the last comment first so earlier offsets stay valid; a new tag goes in the last comment, next to the node.
  for (const [index, comment] of [...comments.entries()].reverse()) {
    const commentStart = comment.getStart(sourceFile);
    let lines = commentLines(source.slice(commentStart, comment.end));
    const replaced = add && blockTags(lines).find((tag) => change.remove.includes(tag.tag as StabilityTag));

    if (replaced) {
      lines[replaced.index] = lines[replaced.index]!.replace(`@${replaced.tag}`, `@${add}`);
      add = undefined;
    }

    for (const tag of change.remove) lines = removeTagBlocks(lines, tag);

    if (add && index === comments.length - 1) lines = insertTag(lines, add);

    const rendered = renderComment(lines, indent);
    const end = rendered ? comment.end : comment.end + source.slice(comment.end).match(/^\s*/)![0].length;

    result = `${result.slice(0, commentStart)}${rendered}${result.slice(end)}`;
  }

  return result;
}

/**
 * Bring the stability tags of the named declarations in one source file in line with their stability, applying edits
 * bottom-up so offsets stay valid. Every declaration of a name is checked except an overload implementation, which
 * consumers never see. Returns the number of declarations changed.
 */
export function fixSourceFile(filePath: string, fixes: ReadonlyMap<string, Stability>): number {
  let source = readFileSync(filePath, 'utf8');
  const sourceFile = parseSource(filePath, source);
  const edits = [...fixes]
    .flatMap(([name, stability]) =>
      signatureDeclarations(findDeclarations(sourceFile, name)).flatMap((node) => {
        const change = tagChange(jsDocTagNames(node), stability);

        return change ? [{ node, change }] : [];
      })
    )
    .filter((edit, index, all) => all.findIndex((other) => other.node === edit.node) === index)
    .sort((a, b) => b.node.getStart(sourceFile) - a.node.getStart(sourceFile));

  for (const { node, change } of edits) source = applyTagChange(source, sourceFile, node, change);

  if (edits.length > 0) writeFileSync(filePath, source);

  return edits.length;
}

// ── Docs imports ─────────────────────────────────────────────────────────────

export interface DocsImport {
  file: string;
  name: string;
  specifier: string;
}

/**
 * Collect `@videojs/*` imports and re-exports from docs code and demo sources. `default` stands for a default or
 * dynamic import, `*` for a namespace or side-effect import.
 */
export function collectImports(source: string, file: string): DocsImport[] {
  const imports: DocsImport[] = [];

  for (const [, defaultName, namespace, specifiers, staticSpecifier, dynamicSpecifier] of source.matchAll(
    IMPORT_PATTERN
  )) {
    const specifier = (staticSpecifier ?? dynamicSpecifier)!;

    if (defaultName || dynamicSpecifier) imports.push({ file, name: 'default', specifier });

    // A namespace or side-effect import names no export, but still reaches the module.
    if (namespace || (!defaultName && !specifiers && staticSpecifier)) imports.push({ file, name: '*', specifier });

    for (const part of specifiers?.split(',') ?? []) {
      const name = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0];

      if (name) imports.push({ file, name, specifier });
    }
  }

  return imports;
}

function collectDocsImports(siteDirectory: string): DocsImport[] {
  const docsDirectory = join(siteDirectory, 'src/content/docs');
  const pages = walkFiles(docsDirectory, (path) => path.endsWith('.mdx')).filter(
    (path) => !relative(docsDirectory, path).startsWith('writing-style')
  );
  const demos = walkFiles(join(siteDirectory, 'src/components/docs/demos'), (path) =>
    /\.(?:[jt]sx?|astro|html)$/.test(path)
  );

  return [...pages, ...demos].flatMap((file) => collectImports(readFileSync(file, 'utf8'), file));
}

/** Docs imports of internal packages or of exports the docs don't make stable. */
export function findUnstableImports(
  imports: readonly DocsImport[],
  stabilities: ReadonlyMap<string, Stability>
): Array<DocsImport & { reason: string }> {
  return imports.flatMap((entry) => {
    if (INTERNAL_PACKAGE_PATTERN.test(entry.specifier)) return [{ ...entry, reason: 'internal package' }];

    const key = `${entry.specifier}#${entry.name}`;
    const stability = stabilities.get(key);

    return stability && stability !== 'stable' ? [{ ...entry, reason: stability }] : [];
  });
}

// ── CLI ──────────────────────────────────────────────────────────────────────

/** Names of the packages in one `packages/<group>/` directory, such as the playback adapters or the extensions. */
function packageNamesIn(group: string): Set<string> {
  const directories = packageDirectories().filter(
    (directory) => relative(monorepoRoot, directory).split(sep)[1] === group
  );

  // SAFETY: workspace manifests are validated by `pnpm check:workspace`; only `name` is read.
  return new Set(
    directories.map(
      (directory) => (JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as { name: string }).name
    )
  );
}

/** Print stable and experimental exports no framework-facing entry exports, grouped by package. */
function reportUnexported(unexported: readonly UnexportedExport[]): void {
  const byPackage = new Map<string, UnexportedExport[]>();

  for (const entry of unexported) {
    const name = packageName(primarySpecifier(entry.record));

    byPackage.set(name, [...(byPackage.get(name) ?? []), entry]);
  }

  for (const [name, entries] of [...byPackage].sort(([a], [b]) => a.localeCompare(b))) {
    console.error(`✗ ${name}  ${entries.length} ${entries.length === 1 ? 'export' : 'exports'}`);

    for (const { record, reason } of entries.sort((a, b) => a.record.name.localeCompare(b.record.name))) {
      console.error(`  ${label(record)} ${reason}`);
    }
  }

  console.error(
    `\n✗ ${unexported.length} stable or experimental exports can't be imported from a framework-facing package.\n` +
      '  Re-export each from `@videojs/react` and `@videojs/html` (an adapter type from their `/media/*` entry), or\n' +
      "  change the signature that makes it stable. `--fix` doesn't resolve these.\n"
  );
}

/** List the exports a reference made stable or experimental, by package, so a reviewer sees what propagation reached. */
function reportPropagated(resolved: ReadonlyMap<PublicExport, ResolvedStability>): void {
  for (const level of ['stable', 'experimental'] as const) {
    const propagated = [...resolved].filter(
      ([, { stability, referrers }]) => stability === level && referrers.length > 0
    );
    if (propagated.length === 0) continue;

    const byPackage = new Map<string, Array<[PublicExport, ResolvedStability]>>();

    for (const entry of propagated) {
      const name = packageName(primarySpecifier(entry[0]));

      byPackage.set(name, [...(byPackage.get(name) ?? []), entry]);
    }

    console.log(`\n${level === 'stable' ? 'Stable' : 'Experimental'} by reference: ${propagated.length} exports`);

    for (const [name, entries] of [...byPackage].sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`  ${name} (${entries.length})`);

      for (const [record, { referrers }] of entries.sort(([a], [b]) => a.name.localeCompare(b.name))) {
        console.log(`    ${record.name}  ← ${referenceReason(referrers)}`);
      }
    }
  }

  console.log('');
}

function reportStaleApis(stale: readonly StaleApi[]): void {
  for (const { file, api } of stale) {
    console.error(`✗ ${relative(monorepoRoot, file)}  ${api} matches no public export`);
  }

  console.error(
    `\n✗ ${stale.length} documented names match no public export. Rename the \`apis\` entry, code heading, or Exports-table\n` +
      '  row to match the export, or remove it.\n'
  );
}

function main(): void {
  const fix = process.argv.includes('--fix');
  const siteDirectory = resolve(scriptPath, '..', '..');
  const entries = packageDirectories().flatMap(collectPackageEntries);
  const missing = entries.filter((entry) => !existsSync(entry.declarationFile));

  if (missing.length > 0) {
    console.error(`✗ ${missing.length} declaration entry points are missing — run \`pnpm build:packages\` first.`);

    for (const entry of missing.slice(0, 10)) console.error(`  ${entry.specifier}`);

    process.exit(1);
  }

  const coverage = collectCoverage(siteDirectory);
  const surface = collectPublicExports(entries);
  const { exports, unresolved } = surface;
  const resolved = resolveStabilities(exports, coverage);
  const importStabilities = new Map<string, Stability>();
  const violations: Array<{ record: PublicExport; stability: Stability; reason: string }> = [];

  for (const [record, { stability, referrers }] of resolved) {
    const reason = tagViolation(record, stability, referrers);

    for (const specifier of record.specifiers) {
      for (const name of record.exportedNames) importStabilities.set(`${specifier}#${name}`, stability);
    }

    if (reason) violations.push({ record, stability, reason });
  }

  const warnings = findUnstableImports(collectDocsImports(siteDirectory), importStabilities);

  for (const warning of warnings) {
    console.warn(
      `⚠ ${relative(monorepoRoot, warning.file)}  imports ${warning.name} from ${warning.specifier} (${warning.reason})`
    );
  }

  if (warnings.length > 0) console.warn(`⚠ ${warnings.length} docs imports use APIs that aren't stable.\n`);

  for (const name of unresolved) console.warn(`⚠ ${name}  resolves to no declaration`);

  if (unresolved.length > 0)
    console.warn(`⚠ ${unresolved.length} public exports can't be resolved, so aren't checked.\n`);

  const unexported = findUnexportedExports(resolved, {
    adapters: packageNamesIn('adapters'),
    extensions: packageNamesIn('extensions'),
  });

  const stale = findStaleApis(collectDeclaredApis(siteDirectory), surface);

  reportPropagated(resolved);

  const counts = { stable: 0, experimental: 0, internal: 0 };

  for (const { stability } of resolved.values()) counts[stability]++;

  console.log(
    `${exports.length} checked public exports: ${counts.stable} stable, ${counts.experimental} experimental, ` +
      `${counts.internal} internal.`
  );

  violations.sort((a, b) => a.record.file.localeCompare(b.record.file) || a.record.name.localeCompare(b.record.name));

  if (violations.length === 0 && unexported.length === 0 && stale.length === 0) {
    console.log(`✓ All ${exports.length} checked public exports are documented, referenced, or tagged.`);
    return;
  }

  if (fix && violations.length > 0) {
    const byFile = new Map<string, Map<string, Stability>>();
    let fixed = 0;

    for (const { record, stability } of violations) {
      if (!record.hasSource) continue;

      const fixes = byFile.get(record.file) ?? new Map<string, Stability>();

      fixes.set(record.name, stability);
      byFile.set(record.file, fixes);
    }

    for (const [file, fixes] of byFile) fixed += fixSourceFile(file, fixes);

    console.log(`✓ Fixed the stability tags of ${fixed} declarations in ${byFile.size} files.`);

    const unfixable = violations.filter(({ record }) => !record.hasSource);

    if (unfixable.length > 0) {
      console.error(`✗ ${unfixable.length} exports have no matching source declaration; fix their tags by hand:`);

      for (const { record, reason } of unfixable) {
        console.error(`  ${relative(monorepoRoot, record.file)}  ${label(record)} ${reason}`);
      }
    }

    if (unexported.length > 0) reportUnexported(unexported);

    if (stale.length > 0) reportStaleApis(stale);

    if (unfixable.length > 0 || unexported.length > 0 || stale.length > 0) process.exit(1);

    return;
  }

  for (const { record, reason } of violations) {
    console.error(`✗ ${relative(monorepoRoot, record.file)}  ${label(record)} ${reason}`);
  }

  if (violations.length > 0) {
    console.error(
      `\n✗ ${violations.length} public exports have the wrong stability tag.\n` +
        "  Exports are stable when a reference page documents them or a stable export's public types name them (see\n" +
        '  writing-style/write-references). Tag the rest `@internal`, or `@experimental` when only a `stability:\n' +
        '  unstable` page or an experimental export makes them experimental, and drop the tag from stable ones.\n' +
        '  `pnpm -F site check:api-stability --fix` corrects the tags.\n'
    );
  }

  if (unexported.length > 0) reportUnexported(unexported);

  if (stale.length > 0) reportStaleApis(stale);

  process.exit(1);
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);

if (isEntrypoint) main();
