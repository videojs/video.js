import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { Expression, ImportDeclaration, Node, Program } from '@oxc-project/types';
import { isFunction, isString } from '@videojs/utils/predicate';
import { walk } from 'oxc-walker';
import type { Plugin, RolldownMagicString } from 'rolldown';

import { type SourceEdit, sourceError } from '../ast';
import { insertModuleImports } from '../ast/imports';
import { compileStyles } from '../styles/compile';
import { type DesignSystem, loadDesignSystem } from '../styles/design-system';
import {
  diagnoseCompiledStyles,
  diagnoseStyles,
  formatStyleDiagnostic,
  type StyleDiagnostic,
  type StyleDiagnosticsOptions,
} from '../styles/diagnostics';
import { isStyleModulePath, resolveStyleModule, resolveStyleModuleFile } from '../styles/modules';
import type { StyleTransformOptions } from '../styles/options';
import {
  createResolvedStyles,
  type LoadedStyleModule,
  loadStyleModule,
  ruleForToken,
  type ResolvedStyles,
  type ResolvedStyleRule,
  utilityGroupsForRule,
} from '../styles/resolved';
import { moduleFilename, parseModuleId, type TransformModule, SCRIPT_MODULE_ID } from '../utils/module-id';
import { toPosixPath } from '../utils/path';

export type StylePluginConfig =
  | StyleTransformOptions
  | ((module: TransformModule) => StyleTransformOptions | null | Promise<StyleTransformOptions | null>);

interface CachedStyleModule {
  readonly module: LoadedStyleModule;
  readonly versions: ReadonlyMap<string, number>;
}

interface CachedDesignSystem {
  readonly design: DesignSystem;
  versions: ReadonlyMap<string, number>;
}

interface StyleBinding {
  readonly declaration: ImportDeclaration;
  readonly modulePath: string;
}

interface VirtualCssModule {
  source: string;
  readonly owners: Set<string>;
}

export interface StylePluginLifecycle {
  readonly retainReleasedCss: boolean;
  onCssChange(id: string): void;
  onOwnerTransform(id: string, watchFiles: readonly string[]): void;
}

export type StylePluginDiagnostics = StyleDiagnosticsOptions | false | (() => StyleDiagnosticsOptions | false);

/** Import specifier Tailwind entries use for the generated candidate manifest. */
export const CANDIDATES_ALIAS = 'vjsc:candidates';

/** Vite configuration fields the style plugin reads while registering the candidate manifest alias. */
interface ViteUserConfig {
  readonly root?: string | undefined;
  readonly cacheDir?: string | undefined;
}

/** Vite configuration that lets Tailwind entries import the candidate manifest and recompile when it changes. */
interface CandidateManifestViteConfig {
  readonly resolve: { readonly alias: Array<{ find: string; replacement: string }> };
  readonly server: { readonly watch: { readonly ignored: string[] } };
}

type StylePluginHooks = Plugin & {
  config?(config: ViteUserConfig): CandidateManifestViteConfig | null;
};

export function stylePlugin(
  config: StylePluginConfig,
  diagnostics: StylePluginDiagnostics = {},
  lifecycle?: StylePluginLifecycle,
  candidates?: string | boolean
): Plugin {
  const designs = new Map<string, Promise<CachedDesignSystem>>();
  const styleCache = new Map<string, Promise<CachedStyleModule>>();
  const cssById = new Map<string, VirtualCssModule>();
  const cssByOwner = new Map<string, ReadonlySet<string>>();
  const reportedWarnings = new Set<string>();
  let manifest: CandidateManifest | undefined;
  let cwd = process.cwd();

  const useManifest = (root: string, cacheDir?: string): CandidateManifest | undefined => {
    if (!candidates) return undefined;

    manifest ??= createCandidateManifest(
      isString(candidates) ? resolve(root, candidates) : resolveCandidateManifestPath(root, cacheDir)
    );
    return manifest;
  };

  const plugin: StylePluginHooks = {
    name: 'vjsc:styles',
    config(userConfig) {
      const current = useManifest(resolve(userConfig.root ?? process.cwd()), userConfig.cacheDir);
      if (!current) return null;

      // Vite's watcher skips node_modules and its cache directory, so re-include the manifest; otherwise Tailwind
      // keeps the CSS it compiled before style modules recorded their utilities.
      return {
        resolve: { alias: [{ find: CANDIDATES_ALIAS, replacement: current.path }] },
        server: { watch: { ignored: [`!${escapeGlobPath(toPosixPath(current.path))}`] } },
      };
    },
    options(options) {
      cwd = resolve(options.cwd ?? process.cwd());
      useManifest(cwd);
      return null;
    },
    async buildStart() {
      reportedWarnings.clear();
      await manifest?.ensure();
    },
    resolveId(id) {
      return cssById.has(id) ? `\0${id}` : null;
    },
    load(id) {
      const publicId = id.startsWith('\0') ? id.slice(1) : id;

      return cssById.get(publicId)?.source ?? null;
    },
    transform: {
      filter: { id: SCRIPT_MODULE_ID, code: '.styles' },
      async handler(_code, id, transform) {
        const options: StyleTransformOptions | null = isFunction(config) ? await config(parseModuleId(id)) : config;

        if (!options || !transform.ast || !transform.magicString) {
          replaceVirtualCss(cssById, cssByOwner, id, [], lifecycle);
          return null;
        }

        lifecycle?.onOwnerTransform(id, []);

        const filename = moduleFilename(id);
        const files = importedStyleFiles(filename, transform.ast);

        if (files.length === 0) {
          replaceVirtualCss(cssById, cssByOwner, id, [], lifecycle);
          return null;
        }

        const styles = await cachedStyles(styleCache, files);

        await manifest?.record(styles);
        lifecycle?.onOwnerTransform(id, styles.watchFiles);

        if (styles.rules.length === 0) {
          replaceVirtualCss(cssById, cssByOwner, id, [], lifecycle);
          return null;
        }

        for (const file of styles.watchFiles) this.addWatchFile(file);

        const cachedDesign = options.stylesheet
          ? await cachedDesignSystem(designs, resolve(cwd, options.stylesheet.input))
          : undefined;

        if (cachedDesign) {
          lifecycle?.onOwnerTransform(id, [...new Set([...styles.watchFiles, ...cachedDesign.design.watchFiles])]);

          for (const file of cachedDesign.design.watchFiles) this.addWatchFile(file);
        }

        const diagnosticOptions = isFunction(diagnostics) ? diagnostics() : diagnostics;
        const styleDiagnostics = diagnosticOptions
          ? [...diagnoseStyles(styles, options.variants, cachedDesign?.design.merge)]
          : [];
        const report = () => {
          if (!diagnosticOptions) return;

          for (const diagnostic of mergeStyleDiagnostics(styleDiagnostics)) {
            reportStyleDiagnostic(diagnostic, diagnosticOptions, reportedWarnings, (message) => this.warn(message));
          }
        };

        const referencedRules = transformStyles(
          filename,
          transform.ast,
          transform.magicString,
          styles,
          options,
          cachedDesign?.design.merge
        );

        if (referencedRules.size === 0) {
          report();
          replaceVirtualCss(cssById, cssByOwner, id, [], lifecycle);
          return null;
        }

        if (options.mode === 'css' && options.stylesheet && cachedDesign) {
          const base = options.stylesheet.base ? resolve(cwd, options.stylesheet.base) : undefined;

          if (diagnosticOptions) {
            styleDiagnostics.push(
              ...diagnoseCompiledStyles(styles, cachedDesign.design, referencedRules, options.variants)
            );
          }

          report();
          const assets = await compileStyles({
            design: cachedDesign.design,
            styles,
            ...(options.stylesheet.scope ? { scope: options.stylesheet.scope } : {}),
            ...(options.variants ? { variants: options.variants } : {}),
            ruleClassNames: referencedRules,
          });

          cachedDesign.versions = await fileVersions(cachedDesign.design.watchFiles);

          lifecycle?.onOwnerTransform(id, [...new Set([...styles.watchFiles, ...cachedDesign.design.watchFiles])]);

          for (const file of cachedDesign.design.watchFiles) this.addWatchFile(file);

          const imports: string[] = [];
          const modules: Array<readonly [string, string]> = [];

          if (base) {
            this.addWatchFile(base);
            const source = `@import ${JSON.stringify(base.replaceAll('\\', '/'))};`;
            const publicId = cssVirtualId('base.css', source);

            modules.push([publicId, source]);
            imports.push(`import ${JSON.stringify(publicId)};`);
          }

          for (const [fileName, source] of assets) {
            const publicId = cssVirtualId(fileName, source);

            modules.push([publicId, source]);
            imports.push(`import ${JSON.stringify(publicId)};`);
          }

          replaceVirtualCss(cssById, cssByOwner, id, modules, lifecycle);
          insertModuleImports(transform.ast, transform.magicString, imports);
        } else {
          report();
          replaceVirtualCss(cssById, cssByOwner, id, [], lifecycle);
        }

        return {
          code: transform.magicString,
        };
      },
    },
  };

  return plugin;
}

function mergeStyleDiagnostics(diagnostics: readonly StyleDiagnostic[]): readonly StyleDiagnostic[] {
  const merged = new Map<string, StyleDiagnostic>();

  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.code}:${diagnostic.rule.modulePath}:${diagnostic.rule.tokenPath.join('.')}`;
    const previous = merged.get(key);

    if (!previous) {
      merged.set(key, diagnostic);
      continue;
    }

    merged.set(key, {
      ...previous,
      utilities: [...new Set([...previous.utilities, ...diagnostic.utilities])],
    });
  }

  return [...merged.values()];
}

function reportStyleDiagnostic(
  diagnostic: StyleDiagnostic,
  options: StyleDiagnosticsOptions,
  reportedWarnings: Set<string>,
  warn: (message: string) => void
): void {
  const message = formatStyleDiagnostic(diagnostic);
  const level = options.complexSelectors ?? 'warn';
  if (diagnostic.kind === 'error' || level === 'error') throw new Error(message);

  if (level === 'off' || reportedWarnings.has(message)) return;

  reportedWarnings.add(message);
  warn(message);
}

function replaceVirtualCss(
  cssById: Map<string, VirtualCssModule>,
  cssByOwner: Map<string, ReadonlySet<string>>,
  owner: string,
  modules: readonly (readonly [id: string, source: string])[],
  lifecycle?: StylePluginLifecycle
): void {
  const nextIds = new Set(modules.map(([id]) => id));

  for (const id of cssByOwner.get(owner) ?? []) {
    if (nextIds.has(id)) continue;

    const module = cssById.get(id);

    module?.owners.delete(owner);

    if (module?.owners.size !== 0) continue;

    if (module && lifecycle?.retainReleasedCss) {
      if (module.source !== '') {
        module.source = '';
        lifecycle.onCssChange(id);
      }
    } else {
      cssById.delete(id);
    }
  }

  for (const [id, source] of modules) {
    const module = cssById.get(id);

    if (module) {
      module.owners.add(owner);

      if (module.source !== source) {
        module.source = source;
        lifecycle?.onCssChange(id);
      }
    } else {
      cssById.set(id, { source, owners: new Set([owner]) });
      lifecycle?.onCssChange(id);
    }
  }

  if (nextIds.size > 0) cssByOwner.set(owner, nextIds);
  else cssByOwner.delete(owner);
}

function transformStyles(
  filename: string,
  ast: Program,
  magicString: RolldownMagicString,
  styles: ResolvedStyles,
  options: StyleTransformOptions,
  merge?: DesignSystem['merge']
): ReadonlySet<string> {
  const bindings = styleBindings(filename, ast, styles);
  if (bindings.size === 0) return new Set();

  const edits: SourceEdit[] = [];
  const referencedRules = new Set<string>();
  const transformedRanges: Array<readonly [number, number]> = [];

  walk(ast, {
    enter(node, parent) {
      if (node.type !== 'MemberExpression') return;

      const path = readAccessPath(node);
      const [root, ...tokenPath] = path ?? [];
      const binding = root ? bindings.get(root) : undefined;
      const rule = binding ? ruleForToken(styles, binding.modulePath, tokenPath) : undefined;
      if (!rule) return;

      edits.push({
        start: node.start,
        end: node.end,
        content: renderStyleRule(rule, options, styleReferenceContext(node, parent), merge),
      });
      referencedRules.add(rule.className);
      transformedRanges.push([node.start, node.end]);
      this.skip();
    },
  });

  assertNoUntransformedReferences(ast, bindings, transformedRanges);

  for (const edit of edits) magicString.overwrite(edit.start, edit.end, edit.content);

  for (const binding of new Set(bindings.values())) {
    magicString.remove(binding.declaration.start, binding.declaration.end);
  }

  return referencedRules;
}

function styleBindings(filename: string, ast: Program, styles: ResolvedStyles): ReadonlyMap<string, StyleBinding> {
  const bindings = new Map<string, StyleBinding>();

  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration' || !statement.source.value.startsWith('.')) continue;

    const modulePath = resolveStyleModule(filename, statement.source.value, styles);
    if (!modulePath) continue;

    const defaults = statement.specifiers.filter((specifier) => specifier.type === 'ImportDefaultSpecifier');

    if (defaults.length !== 1 || statement.specifiers.length !== 1) {
      throw sourceError(`Style import \`${statement.source.value}\` must use a default import.`, statement.start);
    }

    bindings.set(defaults[0]!.local.name, { declaration: statement, modulePath });
  }

  return bindings;
}

function importedStyleFiles(filename: string, ast: Program): string[] {
  const files: string[] = [];

  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration') continue;

    const specifier = statement.source.value;
    if (!specifier.startsWith('.') || !isStyleModulePath(specifier)) continue;

    const file = resolveStyleModuleFile(filename, specifier);

    if (!file) {
      throw sourceError(`Cannot resolve style module \`${specifier}\` imported by \`${filename}\`.`, statement.start);
    }

    files.push(file);
  }

  return [...new Set(files)];
}

function readAccessPath(expression: Expression): string[] | undefined {
  if (expression.type === 'Identifier') return [expression.name];

  if (expression.type !== 'MemberExpression') return undefined;

  const object = readAccessPath(expression.object);
  if (!object) return undefined;

  if (!expression.computed) return [...object, expression.property.name];

  if (expression.property.type === 'Literal' && typeof expression.property.value === 'string') {
    return [...object, expression.property.value];
  }

  return undefined;
}

type StyleReferenceContext = 'jsx' | 'list' | 'value';

function renderStyleRule(
  rule: ResolvedStyleRule,
  options: StyleTransformOptions,
  context: StyleReferenceContext,
  merge?: DesignSystem['merge']
): string {
  const utilityGroups = utilityGroupsForRule(rule, options.variants, merge);
  const groups = options.mode === 'css' || utilityGroups.length === 0 ? [rule.className] : utilityGroups;
  const values = groups.filter(Boolean);

  if (context === 'list') return values.length > 0 ? values.map((value) => JSON.stringify(value)).join(', ') : '""';

  if (context === 'jsx' && values.length > 1) {
    return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
  }

  return JSON.stringify(values.join(' '));
}

function styleReferenceContext(expression: Expression, parent: Node | null): StyleReferenceContext {
  const listItem =
    (parent?.type === 'ArrayExpression' && parent.elements.includes(expression)) ||
    (parent?.type === 'CallExpression' && parent.arguments.includes(expression));
  if (listItem) return 'list';

  return parent?.type === 'JSXExpressionContainer' ? 'jsx' : 'value';
}

function assertNoUntransformedReferences(
  ast: Program,
  bindings: ReadonlyMap<string, StyleBinding>,
  transformed: readonly (readonly [number, number])[]
): void {
  const unresolved = new Map<string, number[]>();

  walk(ast, {
    enter(node) {
      if (node.type !== 'Identifier' || !bindings.has(node.name)) return;

      const binding = bindings.get(node.name)!;
      const inImport = node.start >= binding.declaration.start && node.end <= binding.declaration.end;
      const inTransform = transformed.some(([start, end]) => node.start >= start && node.end <= end);

      if (!inImport && !inTransform) {
        const positions = unresolved.get(node.name) ?? [];

        positions.push(node.start);
        unresolved.set(node.name, positions);
      }
    },
  });

  if (unresolved.size > 0) {
    throw sourceError(
      `Styles must use static references. Could not transform: ${[...unresolved]
        .map(([name, positions]) => `${name} at ${positions.join(', ')}`)
        .join('; ')}.`,
      Math.min(...[...unresolved.values()].flat())
    );
  }
}

/** Merge the requested modules from a per-file cache so a shared style module is evaluated once per build. */
async function cachedStyles(
  cache: Map<string, Promise<CachedStyleModule>>,
  files: readonly string[]
): Promise<ResolvedStyles> {
  const moduleFiles = [...new Set(files.map((file) => resolve(file)))].sort();

  return createResolvedStyles(await Promise.all(moduleFiles.map((file) => cachedStyleModule(cache, file))));
}

async function cachedStyleModule(
  cache: Map<string, Promise<CachedStyleModule>>,
  file: string
): Promise<LoadedStyleModule> {
  const cached = await cache.get(file);
  if (cached && (await versionsMatch(cached.versions))) return cached.module;

  const loading = loadStyleModule(file).then(async (module) => ({
    module,
    versions: await fileVersions(module.watchFiles),
  }));

  cache.set(file, loading);
  return (await loading).module;
}

async function fileVersions(files: Iterable<string>): Promise<ReadonlyMap<string, number>> {
  return new Map(await Promise.all([...files].map(async (file) => [file, (await stat(file)).mtimeMs] as const)));
}

async function versionsMatch(versions: ReadonlyMap<string, number>): Promise<boolean> {
  try {
    for (const [file, mtimeMs] of versions) {
      if ((await stat(file)).mtimeMs !== mtimeMs) return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function cachedDesignSystem(
  cache: Map<string, Promise<CachedDesignSystem>>,
  input: string
): Promise<CachedDesignSystem> {
  const cached = await cache.get(input);
  if (cached && (await versionsMatch(cached.versions))) return cached;

  const loading = loadDesignSystem(input).then(async (design) => ({
    design,
    versions: await fileVersions(design.watchFiles),
  }));

  cache.set(input, loading);
  return loading;
}

interface CandidateManifest {
  readonly path: string;
  /** Create the manifest when it does not exist so Tailwind entries can import it before any module resolves. */
  ensure(): Promise<void>;
  /** Merge one resolved style set and rewrite the manifest when its candidates change. */
  record(styles: ResolvedStyles): Promise<void>;
}

/**
 * Render every utility of the given rules, including variant utilities, as Tailwind `@source inline()` entries. Extra
 * candidates carry over entries from an earlier session so a restart never shrinks the manifest.
 */
export function renderCandidateManifest(rules: Iterable<ResolvedStyleRule>, extra: Iterable<string> = []): string {
  const candidates = new Set<string>(extra);

  for (const rule of rules) {
    for (const utility of rule.utilities) candidates.add(utility);

    for (const utilities of Object.values(rule.variants)) {
      for (const utility of utilities) candidates.add(utility);
    }
  }

  const lines = [...candidates].sort().map((candidate) => `@source inline(${JSON.stringify(candidate)});`);

  return ['/* Generated by vjsc. Style module utilities for Tailwind source scanning. */', ...lines, ''].join('\n');
}

/** Default manifest location: the Vite cache directory of the package that owns `root`. */
export function resolveCandidateManifestPath(root: string, cacheDir?: string): string {
  const cache = cacheDir ? resolve(root, cacheDir) : resolve(packageRoot(root), 'node_modules/.vite');

  return resolve(cache, 'vjsc/candidates.css');
}

function packageRoot(root: string): string {
  let directory = resolve(root);

  while (!existsSync(resolve(directory, 'package.json'))) {
    const parent = dirname(directory);
    if (parent === directory) return resolve(root);

    directory = parent;
  }

  return directory;
}

/** Read the candidates an existing manifest lists. */
export function parseCandidateManifest(content: string): string[] {
  return [...content.matchAll(/^@source inline\(("(?:[^"\\]|\\.)*")\);$/gm)].map(([, json]) => JSON.parse(json!));
}

function escapeGlobPath(path: string): string {
  return path.replace(/[[\]{}()*?!]/g, '\\$&');
}

export function createCandidateManifest(path: string): CandidateManifest {
  const rulesByModule = new Map<string, ReadonlyMap<string, ResolvedStyleRule>>();
  const persisted = new Set<string>();
  let written: string | undefined;
  let queue = Promise.resolve();

  // Modules compile in parallel, so writes queue up and land through a rename: two overlapping writes would interleave
  // their bytes, and Tailwind must never read a half-written manifest.
  const write = (content: string): Promise<void> => {
    queue = queue.then(async () => {
      if (content === written) return;

      const staging = `${path}.${process.pid}.tmp`;

      await mkdir(dirname(path), { recursive: true });
      await writeFile(staging, content);
      await rename(staging, path);
      written = content;
    });

    return queue;
  };

  return {
    path,
    async ensure() {
      if (written !== undefined) return;

      written = await readFile(path, 'utf8').catch(() => undefined);

      if (written === undefined) await write(renderCandidateManifest([]));
      else for (const candidate of parseCandidateManifest(written)) persisted.add(candidate);
    },
    async record(styles) {
      let changed = written === undefined;

      for (const [modulePath, rules] of styles.modules) {
        if (rulesByModule.get(modulePath) === rules) continue;

        rulesByModule.set(modulePath, rules);
        changed = true;
      }

      if (!changed) return;

      const rules = [...rulesByModule.values()].flatMap((moduleRules) => [...moduleRules.values()]);

      await write(renderCandidateManifest(rules, persisted));
    },
  };
}

function cssVirtualId(fileName: string, source: string): string {
  const hash = createHash('sha256').update(fileName).update('\0').update(source).digest('hex').slice(0, 12);

  return `virtual:vjsc/css/${hash}/${encodeURIComponent(fileName)}`;
}
