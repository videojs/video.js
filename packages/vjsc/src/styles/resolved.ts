import { realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInThisContext } from 'node:vm';

import { twMerge } from 'cn';
import { type OutputChunk, rolldown } from 'rolldown';

import { toArray } from '../utils/array';
import { splitClassNames } from './class-names';
import {
  getStyleDefinition,
  ruleClassName,
  type StyleDefinition,
  type StyleValue,
  validateStyleDefinition,
} from './define';
import type { DesignSystem } from './design-system';
import { visitStyleRules } from './tree';

const STYLE_RUNTIME_ENTRY = resolveStyleRuntimeEntry();

export interface ResolvedStyleRule {
  readonly modulePath: string;
  readonly tokenPath: readonly string[];
  readonly className: string;
  readonly file: string;
  readonly layer: string;
  readonly scopeRoot: boolean;
  readonly shadowHost: boolean;
  readonly utilityGroups: readonly string[];
  readonly utilities: readonly string[];
  readonly variantGroups: Readonly<Record<string, readonly string[]>>;
  readonly variants: Readonly<Record<string, readonly string[]>>;
}

export interface ResolvedStyles {
  readonly modules: ReadonlyMap<string, ReadonlyMap<string, ResolvedStyleRule>>;
  readonly rules: readonly ResolvedStyleRule[];
  readonly watchFiles: readonly string[];
}

/** One evaluated style module with its normalized rules, reusable across every set that imports it. */
export interface LoadedStyleModule {
  readonly modulePath: string;
  readonly definition: StyleDefinition;
  readonly rules: ReadonlyMap<string, ResolvedStyleRule>;
  readonly watchFiles: readonly string[];
}

/** Evaluate one style module and normalize its rules independently of the other modules a source imports. */
export async function loadStyleModule(file: string): Promise<LoadedStyleModule> {
  const modulePath = await realpath(resolve(file));
  const evaluated = await evaluateStyleModule(modulePath);
  const definition = getStyleDefinition(evaluated.module.default);
  if (!definition) throw new Error(`Style module \`${file}\` must default-export \`styles({...})\`.`);

  validateStyleDefinition(definition);

  return {
    modulePath,
    definition,
    rules: resolveModuleRules(definition, modulePath),
    watchFiles: evaluated.watchFiles,
  };
}

export function ruleForToken(
  styles: ResolvedStyles,
  modulePath: string,
  tokenPath: readonly string[]
): ResolvedStyleRule | undefined {
  return styles.modules.get(modulePath)?.get(tokenKey(tokenPath));
}

export function utilityGroupsForRule(
  rule: ResolvedStyleRule,
  variants: readonly string[] = [],
  merge: DesignSystem['merge'] = twMerge
): readonly string[] {
  const selected = variants.flatMap((variant) => rule.variantGroups[variant] ?? []);
  if (selected.length === 0) return rule.utilityGroups;

  return mergeUtilityGroups([...rule.utilityGroups, ...selected], merge);
}

/** Utilities per rule, by merge function and by the variants of the selection the rule defines. */
const ruleUtilities = new WeakMap<ResolvedStyleRule, WeakMap<DesignSystem['merge'], Map<string, readonly string[]>>>();

/**
 * The utilities one rule applies under a variant selection. Rules are immutable once resolved, and every compile,
 * reference, and diagnostic of an owner asks for the same rules, so results are shared; only the selected variants a
 * rule defines change them.
 */
export function utilitiesForRule(
  rule: ResolvedStyleRule,
  variants: readonly string[] = [],
  merge: DesignSystem['merge'] = twMerge
): readonly string[] {
  const byMerge = ruleUtilities.get(rule) ?? new WeakMap<DesignSystem['merge'], Map<string, readonly string[]>>();
  const byVariants = byMerge.get(merge) ?? new Map<string, readonly string[]>();
  const key = variants.filter((variant) => rule.variantGroups[variant]?.length).join('\0');
  const cached = byVariants.get(key);
  if (cached) return cached;

  const utilities = utilityGroupsForRule(rule, variants, merge).flatMap(splitClassNames);

  byVariants.set(key, utilities);
  byMerge.set(merge, byVariants);
  ruleUtilities.set(rule, byMerge);

  return utilities;
}

export function isGroupMarker(value: string): boolean {
  return value === 'group' || value.startsWith('group/');
}

const groupOwners = new WeakMap<
  readonly ResolvedStyleRule[],
  WeakMap<DesignSystem['merge'], Map<string, ReadonlyMap<string, readonly string[]>>>
>();

/** Map each named group marker to the semantic classes that declare it under the selected variants. */
export function collectGroupOwners(
  rules: readonly ResolvedStyleRule[],
  variants: readonly string[] = [],
  merge: DesignSystem['merge'] = twMerge
): ReadonlyMap<string, readonly string[]> {
  const byMerge = groupOwners.get(rules) ?? new WeakMap();
  const byVariants = byMerge.get(merge) ?? new Map<string, ReadonlyMap<string, readonly string[]>>();
  const key = variants.join('\0');
  const cached = byVariants.get(key);
  if (cached) return cached;

  const owners = collectUncachedGroupOwners(rules, variants, merge);

  byVariants.set(key, owners);
  byMerge.set(merge, byVariants);
  groupOwners.set(rules, byMerge);

  return owners;
}

function collectUncachedGroupOwners(
  rules: readonly ResolvedStyleRule[],
  variants: readonly string[],
  merge: DesignSystem['merge']
): ReadonlyMap<string, readonly string[]> {
  const owners = new Map<string, string[]>();

  for (const rule of rules) {
    for (const utility of utilitiesForRule(rule, variants, merge)) {
      if (!isGroupMarker(utility)) continue;

      const classNames = owners.get(utility) ?? [];

      if (!classNames.includes(rule.className)) classNames.push(rule.className);

      owners.set(utility, classNames);
    }
  }

  return owners;
}

/**
 * The `vjsc/styles` module that evaluated style modules import. From source it is the sibling authoring entry; from the
 * built package it is the public export, so the evaluator never carries a second copy of `styles()`.
 */
function resolveStyleRuntimeEntry(): string {
  const here = fileURLToPath(import.meta.url);

  return here.endsWith('.ts') ? resolve(dirname(here), 'index.ts') : fileURLToPath(import.meta.resolve('vjsc/styles'));
}

/** Merge loaded modules into one set, validating class and output-file ownership across the set. */
export function createResolvedStyles(loaded: readonly LoadedStyleModule[]): ResolvedStyles {
  const modules = new Map<string, ReadonlyMap<string, ResolvedStyleRule>>();
  const rules: ResolvedStyleRule[] = [];
  const classes = new Map<string, ResolvedStyleRule>();
  const files = new Map<string, string>();
  const watchFiles = new Set<string>();

  for (const module of loaded) {
    for (const file of module.watchFiles) watchFiles.add(file);

    const layer = module.definition.layer ?? 'components';
    const previousLayer = files.get(module.definition.file);

    if (previousLayer && previousLayer !== layer) {
      throw new Error(
        `Style output \`${module.definition.file}\` is assigned to both \`${previousLayer}\` and \`${layer}\`.`
      );
    }

    files.set(module.definition.file, layer);

    for (const resolvedRule of module.rules.values()) {
      const previous = classes.get(resolvedRule.className);

      if (previous) {
        throw new Error(
          `Style class \`${resolvedRule.className}\` is defined by both \`${displayRule(previous)}\` and \`${displayRule(resolvedRule)}\`.`
        );
      }

      classes.set(resolvedRule.className, resolvedRule);
      rules.push(resolvedRule);
    }

    modules.set(module.modulePath, module.rules);
  }

  return Object.freeze({
    modules,
    rules: Object.freeze(rules),
    watchFiles: Object.freeze([...watchFiles].sort()),
  });
}

function resolveModuleRules(definition: StyleDefinition, modulePath: string): ReadonlyMap<string, ResolvedStyleRule> {
  const layer = definition.layer ?? 'components';
  const moduleRules = new Map<string, ResolvedStyleRule>();

  visitStyleRules(definition.rules, (tokenPath, rule) => {
    const utilityGroups = splitUtilityGroups(rule.utilities);
    const variantGroups: Record<string, readonly string[]> = {};

    for (const [name, value] of Object.entries(rule.variants ?? {})) {
      if (value !== undefined) variantGroups[name] = Object.freeze(splitUtilityGroups(value));
    }

    moduleRules.set(
      tokenKey(tokenPath),
      Object.freeze({
        modulePath,
        tokenPath: Object.freeze(tokenPath),
        className: ruleClassName(definition, tokenPath, rule),
        file: definition.file,
        layer,
        scopeRoot: rule.scopeRoot ?? false,
        shadowHost: rule.shadowHost ?? false,
        utilityGroups: Object.freeze(utilityGroups),
        utilities: Object.freeze(utilityGroups.flatMap(splitClassNames)),
        variantGroups: Object.freeze(variantGroups),
        variants: Object.freeze(
          Object.fromEntries(
            Object.entries(variantGroups).map(([name, groups]) => [
              name,
              Object.freeze(groups.flatMap(splitClassNames)),
            ])
          )
        ),
      })
    );
  });

  return moduleRules;
}

function splitUtilityGroups(value: StyleValue): string[] {
  const values = toArray(value);

  return values.map((part) => part.trim().replace(/\s+/g, ' ')).filter(Boolean);
}

/** Preserve authored groups while removing utilities superseded by the selected variants. */
function mergeUtilityGroups(groups: readonly string[], merge: DesignSystem['merge']): readonly string[] {
  const merged = merge(groups.join(' ')).split(/\s+/).filter(Boolean);
  const retained = new Map<string, number>();

  for (const utility of merged) retained.set(utility, (retained.get(utility) ?? 0) + 1);

  const output = Array.from({ length: groups.length }, () => [] as string[]);
  const indexedGroups = groups.map((group, index) => ({ index, utilities: splitClassNames(group) }));

  for (const { index, utilities } of indexedGroups.reverse()) {
    const outputGroup = output[index];
    if (!outputGroup) throw new Error('Failed to preserve a style utility group.');

    for (const utility of utilities.reverse()) {
      const remaining = retained.get(utility) ?? 0;
      if (remaining === 0) continue;

      outputGroup.unshift(utility);
      retained.set(utility, remaining - 1);
    }
  }

  return output.map((group) => group.join(' ')).filter(Boolean);
}

function tokenKey(path: readonly string[]): string {
  return path.join('.');
}

function displayRule(rule: ResolvedStyleRule): string {
  return `${rule.modulePath}#${rule.tokenPath.join('.')}`;
}

/**
 * Bundle a style module with its imports and run it as a script. A style module is plain data, so it runs as CommonJS
 * in a function scope that is collected once its definition is replaced; importing it as an ES module would keep every
 * evaluated version in Node's module map for the life of the process.
 */
async function evaluateStyleModule(
  modulePath: string
): Promise<{ module: { default?: unknown }; watchFiles: readonly string[] }> {
  const bundle = await rolldown({
    input: modulePath,
    platform: 'node',
    experimental: {
      attachDebugInfo: 'none',
      nativeMagicString: true,
    },
    plugins: [
      {
        name: 'vjsc:styles-runtime',
        resolveId(source) {
          return source === 'vjsc/styles' ? STYLE_RUNTIME_ENTRY : null;
        },
      },
    ],
  });

  try {
    const output = await bundle.generate({ format: 'cjs', exports: 'named', codeSplitting: false });
    const chunks = output.output.filter((item): item is OutputChunk => item.type === 'chunk');

    if (chunks.length !== 1 || !chunks[0]) {
      throw new Error(`Style module \`${modulePath}\` compiled to ${chunks.length} chunks.`);
    }

    const module: { exports: { default?: unknown } } = { exports: {} };
    const run = runInThisContext(`(function (exports, require, module, __filename, __dirname) {${chunks[0].code}\n})`, {
      filename: modulePath,
    }) as (...args: unknown[]) => void;

    run(module.exports, createRequire(modulePath), module, modulePath, dirname(modulePath));

    return { module: module.exports, watchFiles: await bundle.watchFiles };
  } finally {
    await bundle.close();
  }
}
