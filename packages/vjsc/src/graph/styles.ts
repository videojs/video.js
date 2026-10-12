import { resolve } from 'node:path';

import { isObject } from '@videojs/utils/predicate';
import { type ReturnedRule, type Rule, type StyleSheet, transform as transformCss } from 'lightningcss';

import type { ModuleMeta } from '../components/meta';
import { hasNestedCssRules, withoutNullValues } from '../styles/css-ast';
import { flattenScopes } from '../styles/scope';
import { parseVirtualCssId } from '../styles/virtual-css';
import { setUnique } from '../utils/map';
import { isInsideRoot } from '../utils/path';
import { inlineLocalCssImports } from './css-imports';
import { traverseModules } from './modules';
import type { GraphModule, Graph } from './types';

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

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Package writers and registry catalogs bundle the same closures within one build; the assets map is per build.
const bundles = new WeakMap<ReadonlyMap<string, string>, Map<string, Promise<string>>>();

/** Merge exact authored and transformed styles used by a set of module graph modules. */
export function bundleStyles<Node extends ModuleMeta, Variant>(
  graph: Graph<Node, Variant>,
  modules: readonly GraphModule<Node, Variant>[],
  options: BundleStylesOptions
): Promise<string> {
  const cache = bundles.get(graph.assets) ?? new Map<string, Promise<string>>();
  const key = JSON.stringify([modules.map((module) => module.id), options]);
  let bundled = cache.get(key);

  if (!bundled) {
    bundled = bundleStylesUncached(graph, modules, options);
    cache.set(key, bundled);
    bundles.set(graph.assets, cache);
  }

  return bundled;
}

async function bundleStylesUncached<Node extends ModuleMeta, Variant>(
  graph: Graph<Node, Variant>,
  modules: readonly GraphModule<Node, Variant>[],
  options: BundleStylesOptions
): Promise<string> {
  const styles = new Map<string, string>();
  const owners = new Map<string, string>();

  for (const path of options.files ?? []) {
    const filename = resolve(graph.root, path);

    assertInsideRoot(graph.root, filename, path);
    setUnique(styles, path, await inlineLocalCssImports(filename, graph.root), () =>
      conflictingStyle(options.label, path)
    );
  }

  if (options.includeAssets !== false) {
    const ordered = orderByDependencies(modules);
    const rank = new Map(styleFileOrder(ordered).map((file, index) => [file, index]));
    const assets = ordered.flatMap((module) =>
      module.styles.assets.flatMap((id) => {
        const file = parseVirtualCssId(id)?.fileName;
        if (options.asset && file !== options.asset) return [];

        return [{ id, module, rank: file === undefined ? -1 : (rank.get(file) ?? -1) }];
      })
    );

    // Pieces of one file from different modules stay in dependency order, but files follow their cascade order: a
    // module emitted later must not move an earlier file's rules after a file that overrides them.
    for (const { id, module } of assets.sort((left, right) => left.rank - right.rank)) {
      const source = graph.assets.get(id);

      if (source === undefined) {
        throw new Error(`VJSC graph style \`${options.label}\` has no captured asset: \`${id}\`.`);
      }

      setUnique(styles, id, source, () => conflictingStyle(options.label, id));
      owners.set(id, [owners.get(id), module.sourcePath].filter(Boolean).join(', '));
    }
  }

  const pieces: StylePiece[] = [];

  for (const [id, content] of styles) {
    const css = content.trim();
    if (!css) continue;

    const owner = owners.get(id);

    pieces.push({ css, owner: owner ?? id, checked: owner !== undefined });
  }

  const merged = mergeStyles(graph.assets, pieces, options.label);

  return options.flattenScopes ? flattenScopes(merged) : merged;
}

/** One authored file or generated asset within a bundle. */
interface StylePiece {
  readonly css: string;
  readonly owner: string;
  /** Generated assets must agree on every semantic class; authored files may layer freely. */
  readonly checked: boolean;
}

/**
 * The one cascade order of the output files some modules emit. Modules compiled with a declared order carry it, and
 * every such module must agree. Otherwise each module's import sequence is merged, with name order between files no
 * module orders relative to each other; a cycle means two modules were compiled with conflicting orders.
 */
export function styleFileOrder<Node extends ModuleMeta>(modules: readonly GraphModule<Node>[]): string[] {
  const declared = declaredStyleOrder(modules);
  if (declared) return declared;

  const predecessors = new Map<string, Set<string>>();

  for (const module of modules) {
    for (const [index, file] of module.styles.files.entries()) {
      const before = predecessors.get(file) ?? new Set<string>();

      if (index > 0) before.add(module.styles.files[index - 1]!);

      predecessors.set(file, before);
    }
  }

  const ordered: string[] = [];

  while (predecessors.size > 0) {
    const next = [...predecessors]
      .filter(([, before]) => [...before].every((file) => !predecessors.has(file)))
      .map(([file]) => file)
      .sort()[0];

    if (next === undefined) {
      throw new Error(
        `VJSC graph modules disagree on the cascade order of ${[...predecessors.keys()]
          .sort()
          .map((file) => `\`${file}\``)
          .join(', ')}.`
      );
    }

    ordered.push(next);
    predecessors.delete(next);
  }

  return ordered;
}

function declaredStyleOrder<Node extends ModuleMeta>(modules: readonly GraphModule<Node>[]): string[] | undefined {
  let declared: { readonly order: readonly string[]; readonly owner: string } | undefined;

  for (const module of modules) {
    const order = module.styles.order;
    if (!order) continue;

    if (declared && declared.order.join('\n') !== order.join('\n')) {
      throw new Error(
        `VJSC graph modules \`${declared.owner}\` and \`${module.sourcePath}\` were compiled with different style orders.`
      );
    }

    declared ??= { order, owner: module.sourcePath };
  }

  if (!declared) return undefined;

  const listed = new Set(declared.order);

  for (const module of modules) {
    for (const file of module.styles.files) {
      if (!listed.has(file)) {
        throw new Error(
          `VJSC graph style \`${file}\` from \`${module.sourcePath}\` is missing from the declared style order.`
        );
      }
    }
  }

  const used = new Set(modules.flatMap((module) => module.styles.files));

  return declared.order.filter((file) => used.has(file));
}

/** Order modules so dependencies precede their importers and composed styles override the primitives they extend. */
function orderByDependencies<Node extends ModuleMeta>(modules: readonly GraphModule<Node>[]): GraphModule<Node>[] {
  return traverseModules(new Map(modules.map((module) => [module.id, module])), modules, { order: 'post' });
}

/** A piece's rules in visiting order, read once per build however many bundles include the piece. */
interface AnalyzedPiece {
  readonly rules: readonly AnalyzedRule[];
  /** The piece printed without the rules one bundle dropped, keyed by the dropped rule indices. */
  readonly pruned: Map<string, string>;
}

interface AnalyzedRule {
  /** Identity of the rule's whole subtree within its parents. Grouping at-rules have none and are always kept. */
  readonly key: string | undefined;
  /** Index just past the rule's subtree, where visiting resumes when the rule is dropped. */
  readonly end: number;
  /** A style rule outside any other style rule, whose declarations generated pieces must agree on. */
  readonly declared: { readonly selector: string; readonly declarations: string; readonly name: string } | undefined;
}

const analyzedPieces = new WeakMap<ReadonlyMap<string, string>, Map<string, AnalyzedPiece>>();

/**
 * Concatenate pieces, dropping every rule that repeats an earlier one within the same parents, and reject generated
 * pieces that declare one selector differently. Each piece's rules are read once per build, however many bundles
 * include it; a bundle prints its stylesheet once, natively, so Lightning CSS merges its layers as one sheet.
 */
function mergeStyles(assets: ReadonlyMap<string, string>, pieces: readonly StylePiece[], label: string): string {
  const analyzed = analyzedPieces.get(assets) ?? new Map<string, AnalyzedPiece>();
  const seen = new Set<string>();
  const declared = new Map<string, { readonly declarations: string; readonly owner: string }>();
  const kept: string[] = [];

  analyzedPieces.set(assets, analyzed);

  for (const piece of pieces) {
    const analysis = analyzed.get(piece.css) ?? analyzePiece(piece.css, piece.owner);
    const dropped = new Set<number>();

    analyzed.set(piece.css, analysis);

    for (let index = 0; index < analysis.rules.length;) {
      const rule = analysis.rules[index]!;

      if (piece.checked && rule.declared) {
        const previous = declared.get(rule.declared.selector);

        if (previous && previous.declarations !== rule.declared.declarations) {
          throw new Error(
            `VJSC graph style \`${label}\` defines \`${rule.declared.name}\` with different declarations in \`${previous.owner}\` and \`${piece.owner}\`.`
          );
        }

        declared.set(rule.declared.selector, { declarations: rule.declared.declarations, owner: piece.owner });
      }

      if (rule.key !== undefined && seen.has(rule.key)) {
        dropped.add(index);
        index = rule.end;
        continue;
      }

      if (rule.key !== undefined) seen.add(rule.key);

      index += 1;
    }

    kept.push(dropped.size === 0 ? piece.css : pruned(piece, analysis, dropped));
  }

  const source = `${kept.filter(Boolean).join('\n\n')}\n`;

  return decoder.decode(transformCss({ filename: `${label}.css`, code: encoder.encode(source), minify: false }).code);
}

function analyzePiece(css: string, filename: string): AnalyzedPiece {
  const rules: Array<{ key: string | undefined; end: number; declared: AnalyzedRule['declared'] }> = [];

  // Read the tree through one stylesheet visitor: a rule visitor would serialize every rule again with its subtree.
  const visit = (rule: Rule, context: readonly string[], styleDepth: number): void => {
    const nested = hasNestedRules(rule);
    const index = rules.length;
    // A duplicate must match its whole subtree within the same parents: nested rules differ between otherwise
    // equal parents, and equal nested rules under different parents select different elements.
    const key = rule.type === 'style' || !nested ? JSON.stringify([context, rule], omitLocation) : undefined;
    const declared =
      rule.type === 'style' && styleDepth === 0
        ? {
            selector: JSON.stringify([context, rule.value.selectors], omitRuleDetails),
            declarations: JSON.stringify(rule.value.declarations, omitRuleDetails),
            name: describeSelectors(rule.value.selectors),
          }
        : undefined;
    const record = { key, end: index + 1, declared };

    rules.push(record);

    const children = childRules(rule);
    if (!children) return;

    const inner = [
      ...context,
      rule.type === 'style'
        ? JSON.stringify(rule.value.selectors, omitRuleDetails)
        : JSON.stringify(rule, omitRuleDetails),
    ];

    for (const child of children) visit(child, inner, rule.type === 'style' ? styleDepth + 1 : styleDepth);

    record.end = rules.length;
  };

  for (const rule of parseStylesheet(css, filename).rules) visit(rule, [], 0);

  return { rules, pruned: new Map() };
}

/** A piece printed without the rules a bundle dropped, skipping each dropped rule's subtree as the analysis did. */
function pruned(piece: StylePiece, analysis: AnalyzedPiece, dropped: ReadonlySet<number>): string {
  const key = [...dropped].join(',');
  const cached = analysis.pruned.get(key);
  if (cached !== undefined) return cached;

  let index = 0;
  const prune = (rules: readonly Rule[]): Rule[] =>
    rules.flatMap((rule) => {
      const current = index;

      if (dropped.has(current)) {
        index = analysis.rules[current]!.end;
        return [];
      }

      index += 1;

      const children = childRules(rule);
      if (!children) return [rule];

      // `childRules` returns only rules whose value holds nested rules.
      (rule as unknown as { value: { rules: Rule[] } }).value.rules = prune(children);

      return [rule];
    });

  const result = transformCss({
    filename: piece.owner,
    code: encoder.encode(piece.css),
    minify: false,
    visitor: {
      StyleSheet(stylesheet) {
        return withoutNullValues({ ...stylesheet, rules: prune(stylesheet.rules) });
      },
    },
  });
  const css = decoder.decode(result.code).trim();

  analysis.pruned.set(key, css);
  return css;
}

function parseStylesheet(css: string, filename: string): StyleSheet {
  let parsed: StyleSheet | undefined;

  transformCss({
    filename,
    code: encoder.encode(css),
    minify: false,
    visitor: {
      StyleSheet(stylesheet) {
        parsed = stylesheet;
      },
    },
  });

  if (!parsed) throw new Error(`Lightning CSS did not return a stylesheet for \`${filename}\`.`);

  return parsed;
}

/** The rules nested in a rule, in the order a Lightning CSS rule visitor reaches them. */
function childRules(rule: Rule): readonly Rule[] | undefined {
  if (rule.type === 'style') return rule.value.rules ?? undefined;

  return hasNestedCssRules(rule) ? rule.value.rules : undefined;
}

function describeSelectors(selectors: readonly (readonly { type: string; name?: string }[])[]): string {
  return selectors
    .map((selector) => selector.map((component) => (component.type === 'class' ? `.${component.name}` : '')).join(''))
    .join(', ');
}

function hasNestedRules(rule: Rule | ReturnedRule): boolean {
  if (!('value' in rule)) return false;

  const value = rule.value;

  return Boolean(isObject(value) && 'rules' in value && Array.isArray(value.rules));
}

function omitRuleDetails(key: string, value: unknown): unknown {
  return key === 'loc' || key === 'rules' ? undefined : value;
}

function omitLocation(key: string, value: unknown): unknown {
  return key === 'loc' ? undefined : value;
}

function assertInsideRoot(root: string, filename: string, source: string): void {
  if (!isInsideRoot(root, filename)) throw new Error(`VJSC graph style is outside its root: \`${source}\`.`);
}

function conflictingStyle(label: string, path: string): string {
  return `VJSC graph style \`${label}\` has conflicting contents for \`${path}\`.`;
}
