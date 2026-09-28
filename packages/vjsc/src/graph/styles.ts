import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { type ReturnedRule, transform as transformCss } from 'lightningcss';

import type { ModuleMeta } from '../components/meta';
import { flattenScopes } from '../styles/scope';
import { setUnique } from '../utils/map';
import { isInsideRoot } from '../utils/path';
import type { GraphModule, Graph } from './types';

const LOCAL_CSS_IMPORT = /@import\s+["'](\.[^"']+)["']\s*;/g;

export interface BundleStylesOptions {
  /** Human-readable owner used in diagnostics and the generated CSS filename. */
  readonly label: string;
  /** Additional authored CSS files relative to the module graph root. */
  readonly files?: readonly string[] | undefined;
  /** Include only the virtual stylesheet asset with this decoded filename. */
  readonly asset?: string | undefined;
  /** Whether captured virtual stylesheet assets should be included. */
  readonly includeAssets?: boolean | undefined;
  /**
   * Rewrite `@scope` blocks into zero-specificity `:where()` selectors, for bundles that must render in browsers
   * without `@scope`. Registry output keeps `@scope`, which reads better in the files consumers edit.
   */
  readonly flattenScopes?: boolean | undefined;
}

/** Merge exact authored and transformed styles used by a set of module graph modules. */
export async function bundleStyles<Node extends ModuleMeta>(
  graph: Graph<Node>,
  modules: readonly GraphModule<Node>[],
  options: BundleStylesOptions
): Promise<string> {
  const styles = new Map<string, string>();
  const owners = new Map<string, string>();

  for (const path of options.files ?? []) {
    const filename = resolve(graph.root, path);

    assertInsideRoot(graph.root, filename, path);
    setUnique(styles, path, await inlineLocalCssImports(filename, graph.root, new Set()), () =>
      conflictingStyle(options.label, path)
    );
  }

  if (options.includeAssets !== false) {
    for (const module of orderByDependencies(modules)) {
      for (const id of module.styles.assets) {
        if (id.endsWith('/base.css')) continue;

        if (options.asset && virtualStyleFilename(id) !== options.asset) continue;

        const source = graph.assets.get(id);

        if (source === undefined) {
          throw new Error(`VJSC graph style \`${options.label}\` has no captured asset: \`${id}\`.`);
        }

        setUnique(styles, id, source, () => conflictingStyle(options.label, id));
        owners.set(id, [owners.get(id), module.sourcePath].filter(Boolean).join(', '));
      }
    }
  }

  const pieces: StylePiece[] = [];
  let source = '';

  for (const [id, content] of styles) {
    const trimmed = content.trim();
    if (!trimmed) continue;

    const owner = owners.get(id);

    pieces.push({ startLine: source.split('\n').length - 1, owner: owner ?? id, checked: owner !== undefined });
    source += `${trimmed}\n\n`;
  }

  const merged = mergeStyles(source.trimEnd() + '\n', `${options.label}.css`, options.label, pieces);

  return options.flattenScopes ? flattenScopes(merged) : merged;
}

/** One authored file or generated asset within a bundle, located by the line where its CSS starts. */
interface StylePiece {
  readonly startLine: number;
  readonly owner: string;
  /** Generated assets must agree on every semantic class; authored files may layer freely. */
  readonly checked: boolean;
}

/** Order modules so dependencies precede their importers and composed styles override the primitives they extend. */
function orderByDependencies<Node extends ModuleMeta>(modules: readonly GraphModule<Node>[]): GraphModule<Node>[] {
  const selected = new Map(modules.map((module) => [module.id, module]));
  const ordered: GraphModule<Node>[] = [];
  const visited = new Set<string>();

  const visit = (module: GraphModule<Node>): void => {
    if (visited.has(module.id)) return;

    visited.add(module.id);

    for (const reference of module.imports) {
      const dependency = reference.resolvedId ? selected.get(reference.resolvedId) : undefined;

      if (dependency) visit(dependency);
    }

    ordered.push(module);
  };

  for (const module of modules) visit(module);

  return ordered;
}

function mergeStyles(source: string, filename: string, label: string, pieces: readonly StylePiece[]): string {
  const context: string[] = [];
  const rules = new Set<string>();
  const declarationsBySelector = new Map<string, { readonly declarations: string; readonly owner: string }>();
  let styleDepth = 0;

  const result = transformCss({
    filename,
    code: new TextEncoder().encode(source),
    minify: false,
    visitor: {
      Rule(rule) {
        const nested = hasNestedRules(rule);

        if (rule.type === 'style' && styleDepth === 0) {
          const piece = pieceAtLine(pieces, rule.value.loc.line);

          if (piece?.checked) {
            const selector = JSON.stringify([context, rule.value.selectors], omitRuleDetails);
            const declarations = JSON.stringify(rule.value.declarations, omitRuleDetails);
            const previous = declarationsBySelector.get(selector);

            if (previous && previous.declarations !== declarations) {
              throw new Error(
                `VJSC graph style \`${label}\` defines \`${describeSelectors(rule.value.selectors)}\` with different declarations in \`${previous.owner}\` and \`${piece.owner}\`.`
              );
            }

            declarationsBySelector.set(selector, { declarations, owner: piece.owner });
          }
        }

        if (rule.type === 'style' || !nested) {
          const key = JSON.stringify([context, rule], omitRuleDetails);
          if (rules.has(key)) return [];

          rules.add(key);
        }

        if (rule.type === 'style') styleDepth += 1;
        else if (nested) context.push(JSON.stringify(rule, omitRuleDetails));

        return undefined;
      },
      RuleExit(rule) {
        if (rule.type === 'style') styleDepth -= 1;
        else if (hasNestedRules(rule)) context.pop();
      },
    },
  });

  return new TextDecoder().decode(result.code);
}

function pieceAtLine(pieces: readonly StylePiece[], line: number): StylePiece | undefined {
  let match: StylePiece | undefined;

  for (const piece of pieces) {
    if (piece.startLine > line) break;

    match = piece;
  }

  return match;
}

function describeSelectors(selectors: readonly (readonly { type: string; name?: string }[])[]): string {
  return selectors
    .map((selector) => selector.map((component) => (component.type === 'class' ? `.${component.name}` : '')).join(''))
    .join(', ');
}

function hasNestedRules(rule: ReturnedRule): boolean {
  if (!('value' in rule)) return false;

  const value = rule.value;

  return Boolean(value && typeof value === 'object' && 'rules' in value && Array.isArray(value.rules));
}

function omitRuleDetails(key: string, value: unknown): unknown {
  return key === 'loc' || key === 'rules' ? undefined : value;
}

function virtualStyleFilename(id: string): string | undefined {
  if (!id.startsWith('virtual:vjsc/css/')) return undefined;

  return decodeURIComponent(id.slice(id.lastIndexOf('/') + 1));
}

async function inlineLocalCssImports(filename: string, root: string, stack: Set<string>): Promise<string> {
  if (stack.has(filename)) throw new Error(`Circular module graph stylesheet import: \`${filename}\`.`);

  const source = await readFile(filename, 'utf8');
  const imports = [...source.matchAll(LOCAL_CSS_IMPORT)];
  if (imports.length === 0) return source;

  stack.add(filename);
  let output = source;

  for (const match of imports.reverse()) {
    const specifier = match[1];
    const start = match.index;
    if (!specifier || start === undefined) continue;

    const imported = resolve(dirname(filename), specifier);

    assertInsideRoot(root, imported, specifier);
    const content = await inlineLocalCssImports(imported, root, stack);

    output = output.slice(0, start) + content.trim() + output.slice(start + match[0].length);
  }

  stack.delete(filename);
  return output;
}

function assertInsideRoot(root: string, filename: string, source: string): void {
  if (!isInsideRoot(root, filename)) throw new Error(`VJSC graph style is outside its root: \`${source}\`.`);
}

function conflictingStyle(label: string, path: string): string {
  return `VJSC graph style \`${label}\` has conflicting contents for \`${path}\`.`;
}
