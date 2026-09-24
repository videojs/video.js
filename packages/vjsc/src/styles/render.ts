import {
  Features,
  type Rule,
  type Selector,
  type SelectorList,
  type StyleSheet,
  type TokenOrValue,
  transform,
} from 'lightningcss';

import { cloneCssAst, collectRuleClasses, hasNestedCssRules, withoutNullValues } from './css-ast';
import type { DesignSystem } from './design-system';
import type { StyleOutputFile } from './output';
import { renderPool } from './render-pool';
import { replaceRuleClasses } from './selectors';
import { collectTailwindDefaults, dedupeRuleDeclarations, inlinePrivateTailwindVariables } from './tailwind-values';

const encoder = new TextEncoder();

const decoder = new TextDecoder();

interface RenderStylesheetsOptions {
  design: DesignSystem;
  scope?: string | undefined;
  files: readonly StyleOutputFile[];
}

/**
 * Declared first in every semantic rule so Tailwind keeps variant output nested under the rule. Without a declaration
 * of its own, Tailwind hoists nested rules out as flat selectors and leaves no semantic root to recover.
 */
const ROOT_SENTINEL = '--vjsc-root';

/**
 * Rendered files per design system, keyed by everything one file's CSS depends on. Owners and variants that select the
 * same rules for a file share its output. Bounded because a development server keeps editing styles against one
 * design.
 */
const renderedFiles = new WeakMap<DesignSystem, Map<string, Promise<string>>>();
const RENDERED_FILE_LIMIT = 1024;

export async function renderStylesheets(options: RenderStylesheetsOptions): Promise<Map<string, string>> {
  // Files render independently, so a render pool can work on all of them at once; the map keeps their order.
  const rendered = await Promise.all(
    options.files.map((file) => renderStylesheet(options.design, options.scope, file))
  );

  return new Map(options.files.map((file, index) => [file.name, rendered[index]!]));
}

function renderStylesheet(design: DesignSystem, scope: string | undefined, file: StyleOutputFile): Promise<string> {
  const cache = renderedFiles.get(design) ?? new Map<string, Promise<string>>();
  const key = renderedFileKey(scope, file);
  const cached = cache.get(key);

  renderedFiles.set(design, cache);

  if (cached) return cached;

  const rendered = renderUncachedStylesheet(design, scope, file);

  cache.set(key, rendered);
  rendered.catch(() => {
    if (cache.get(key) === rendered) cache.delete(key);
  });

  for (const oldest of cache.keys()) {
    if (cache.size <= RENDERED_FILE_LIMIT) break;

    cache.delete(oldest);
  }

  return rendered;
}

/** A file's name only labels its output, so identical rules under different names render once. */
function renderedFileKey(scope: string | undefined, file: StyleOutputFile): string {
  return JSON.stringify([
    scope ?? null,
    file.layer,
    [...file.groupOwners].sort(([left], [right]) => left.localeCompare(right)),
    [...file.rules]
      .sort((left, right) => left.className.localeCompare(right.className))
      .map((rule) => [rule.className, rule.candidates, rule.scopeRoot, rule.shadowHost]),
  ]);
}

async function renderUncachedStylesheet(
  design: DesignSystem,
  scope: string | undefined,
  file: StyleOutputFile
): Promise<string> {
  const source = file.rules
    .map((rule) => `.${rule.className} {\n  ${ROOT_SENTINEL}: 0;\n  @apply ${rule.candidates.join(' ')};\n}`)
    .join('\n');
  // Tailwind compiles on the main thread, which owns the design system and the dependencies it discovers.
  const css = await design.compileCss(source);
  const render = (): string => renderCompiledFile(css, scope, file);
  const pool = renderPool();

  return pool ? pool.render({ css, scope, file }, render) : render();
}

/** Render one file's Tailwind output into its final CSS. Pure, so render workers can run it too. */
export function renderCompiledFile(css: string, scope: string | undefined, file: StyleOutputFile): string {
  return wrapFileCss(renderFile(analyzeCompiledFile(css, file), file), scope, file);
}

type StyleRuleNode = Extract<Rule, { type: 'style' }>;

const LOCATION = { source_index: 0, line: 0, column: 0 };

const NO_CLASSES: ReadonlySet<string> = new Set();

/**
 * Wrap one file's rules in its layer and scope. The CSS is parsed once and the `@layer` and `@scope` blocks are built
 * as AST nodes, so rules kept outside the scope never receive `:scope` selectors that could not match there.
 */
function wrapFileCss(css: string, scope: string | undefined, file: StyleOutputFile): string {
  const relationshipOwners = new Set(file.groupOwners.values());
  const scopeRootClasses = new Set(file.rules.filter((rule) => rule.scopeRoot).map((rule) => rule.className));
  const shadowHostClasses = new Set(file.rules.filter((rule) => rule.shadowHost).map((rule) => rule.className));
  const rules = parseCssRules(css);
  const unscopedRule = (rule: StyleRuleNode) => relationshipScope(rule, relationshipOwners, NO_CLASSES) ?? rule;
  let layered: Rule[];

  if (scope) {
    const scopedRule = (rule: StyleRuleNode) =>
      relationshipScope(rule, relationshipOwners, scopeRootClasses) ?? withScopeRootSelectors(rule, scopeRootClasses);
    const isShadowHostRule = (rule: Rule) =>
      !isSlottedStyleRule(rule) && isShadowHostStyleRule(rule, shadowHostClasses);
    const scoped = filterNestedRules(rules, (rule) => !isSlottedStyleRule(rule));
    const slotted = filterNestedRules(rules, isSlottedStyleRule);
    const shadowHosts = prefixScope(filterNestedRules(rules, isShadowHostRule), scope);

    layered = [
      {
        type: 'scope',
        value: { loc: LOCATION, scopeStart: parseSelectorList(scope), rules: mapStyleRules(scoped, scopedRule) },
      },
      ...mapStyleRules([...slotted, ...shadowHosts], unscopedRule),
    ];
  } else {
    layered = mapStyleRules(rules, unscopedRule);
  }

  // Inlining Tailwind's private variables can make two declarations of one rule identical, so dedupe once, last.
  dedupeRuleDeclarations(layered);

  return serializeRules([
    { type: 'layer-block', value: { loc: LOCATION, name: file.layer.split('.'), rules: layered } },
  ]);
}

/*
 * Rules `@scope` cannot serve stay outside the scope block. Slotted nodes sit outside a shadow tree's CSS scope, so
 * their rules move out. WebKit never matches a scoped rule whose subject hosts a shadow root or is slotted into one, so
 * a rule on a shadow host class is emitted twice: the scoped rule stays for engines that match it, and a copy with the
 * scope root as a zero-specificity ancestor follows for WebKit. The copy never outranks the original, so the cascade
 * elsewhere is unchanged. Conditional at-rules retain their conditions when their matching rules move or copy.
 */

/** Prefix every selector with the scope root as a zero-specificity ancestor, standing in for the `@scope` block. */
function prefixScope(rules: readonly Rule[], scope: string): Rule[] {
  const root = parseSelectorList(`:where(${scope})`)[0]!;

  return mapStyleRules(rules, (rule) => ({
    ...rule,
    value: {
      ...rule.value,
      selectors: rule.value.selectors.map((selector) => [
        ...root.map(cloneCssAst),
        { type: 'combinator', value: 'descendant' } as const,
        ...selector,
      ]),
    },
  }));
}

const selectorLists = new Map<string, SelectorList>();

function parseSelectorList(text: string): SelectorList {
  const cached = selectorLists.get(text);
  if (cached) return cloneCssAst(cached);

  const [rule] = parseCssRules(`${text} { --vjsc: 0; }`);
  if (rule?.type !== 'style') throw new Error(`Could not parse the CSS selector '${text}'.`);

  selectorLists.set(text, rule.value.selectors);
  return cloneCssAst(rule.value.selectors);
}

function parseCssRules(css: string): Rule[] {
  let rules: Rule[] = [];

  transform({
    filename: 'semantic.css',
    code: encoder.encode(css),
    visitor: {
      StyleSheet(stylesheet) {
        rules = cloneCssAst(stylesheet.rules);
      },
    },
  });

  return rules;
}

function serializeRules(rules: Rule[]): string {
  return decoder
    .decode(
      transform({
        filename: 'emitted.css',
        code: encoder.encode(''),
        visitor: {
          StyleSheet(stylesheet) {
            return withoutNullValues({ ...stylesheet, rules });
          },
        },
      }).code
    )
    .trim();
}

/** Map every style rule, including those inside conditional and grouping at-rules. */
function mapStyleRules(rules: readonly Rule[], map: (rule: StyleRuleNode) => Rule): Rule[] {
  return rules.map((rule) => {
    if (rule.type === 'style') return map(rule);

    if (!hasNestedCssRules(rule)) return rule;

    return { ...rule, value: { ...rule.value, rules: mapStyleRules(rule.value.rules, map) } } as Rule;
  });
}

function filterNestedRules(rules: readonly Rule[], include: (rule: Rule) => boolean): Rule[] {
  const filtered: Rule[] = [];

  for (const rule of rules) {
    if (hasNestedCssRules(rule)) {
      const nested = filterNestedRules(rule.value.rules, include);

      if (nested.length > 0) {
        const cloned = cloneCssAst(rule);

        cloned.value.rules = nested;
        filtered.push(withoutNullValues(cloned));
      }

      continue;
    }

    if (include(rule)) filtered.push(cloneCssAst(rule));
  }

  return filtered;
}

/**
 * A rule with a selector whose subject carries a shadow host class. The subject is the last compound, so a relationship
 * selector such as `:where(.owner)[data-x] .subject` counts by its `.subject`, and a pseudo-element on the subject is
 * looked past.
 */
function isShadowHostStyleRule(rule: Rule, shadowHostClasses: ReadonlySet<string>): boolean {
  return (
    rule.type === 'style' &&
    rule.value.selectors.some((selector) =>
      subjectCompound(selector).some((component) => component.type === 'class' && shadowHostClasses.has(component.name))
    )
  );
}

function subjectCompound(selector: Selector): Selector {
  let start = 0;

  for (const [index, component] of selector.entries()) {
    if (component.type === 'combinator') start = index + 1;
  }

  return selector.slice(start).filter((component) => component.type !== 'pseudo-element');
}

function isSlottedStyleRule(rule: Rule): boolean {
  return (
    rule.type === 'style' &&
    rule.value.selectors.some((selector) =>
      selector.some((component) => component.type === 'pseudo-element' && component.kind === 'slotted')
    )
  );
}

function withScopeRootSelectors(rule: StyleRuleNode, scopeRootClasses: ReadonlySet<string>): Rule {
  const selectors = includeScopeRootSelectors(rule.value.selectors, scopeRootClasses);

  return selectors === rule.value.selectors ? rule : { ...rule, value: { ...rule.value, selectors } };
}

/** Include a scoped rule when its semantic class is colocated on the scope root. */
function includeScopeRootSelectors(selectors: SelectorList, scopeRootClasses: ReadonlySet<string>): SelectorList {
  if (!selectors.some((selector) => selector[0]?.type === 'class' && scopeRootClasses.has(selector[0].name))) {
    return selectors;
  }

  return selectors.flatMap((selector) => {
    if (selector[0]?.type !== 'class' || !scopeRootClasses.has(selector[0].name)) return [selector];

    return [selector, [{ type: 'pseudo-class', kind: 'scope' } as const, ...selector.map(cloneCssAst)]];
  });
}

function relationshipScope(
  rule: StyleRuleNode,
  relationshipOwners: ReadonlySet<string>,
  scopeRootClasses: ReadonlySet<string>
): Rule | undefined {
  const relationships = rule.value.selectors.map((selector) => scopedRelationship(selector, relationshipOwners));
  const owner = relationships[0]?.owner;
  if (!owner || relationships.some((relationship) => relationship?.owner !== owner)) return;

  const style = cloneCssAst(rule);

  style.value.selectors = relationships.map((relationship) => relationship!.selector);

  return withoutNullValues({
    type: 'scope',
    value: {
      loc: cloneCssAst(rule.value.loc),
      scopeStart: includeScopeRootSelectors([[{ type: 'class', name: owner }]], scopeRootClasses),
      rules: [style],
    },
  });
}

function scopedRelationship(
  selector: Selector,
  relationshipOwners: ReadonlySet<string>
): { owner: string; selector: Selector } | undefined {
  const owner = selector[0];

  if (
    owner?.type !== 'pseudo-class' ||
    owner.kind !== 'where' ||
    owner.selectors.length !== 1 ||
    owner.selectors[0]?.length !== 1 ||
    owner.selectors[0][0]?.type !== 'class' ||
    !relationshipOwners.has(owner.selectors[0][0].name)
  ) {
    return;
  }

  const descendant = selector.findIndex(
    (component, index) => index > 0 && component.type === 'combinator' && component.value === 'descendant'
  );
  if (descendant < 0) return;

  return {
    owner: owner.selectors[0][0].name,
    selector: [{ type: 'nesting' }, ...selector.slice(1).map(cloneCssAst)],
  };
}

interface AnalyzedFile {
  template: StyleSheet;
  semanticRules: ReadonlyMap<string, Rule>;
  tailwindDefaults: ReadonlyMap<string, readonly TokenOrValue[]>;
}

function renderFile(analyzed: AnalyzedFile, file: StyleOutputFile): string {
  const relationshipOwners = file.groupOwners;
  const rules = [...file.rules]
    .sort((a, b) => a.className.localeCompare(b.className))
    .map((rule) => {
      const source = analyzed.semanticRules.get(rule.className);
      if (!source) throw new Error(`Tailwind did not emit the semantic style '.${rule.className}'.`);

      const renderedRule = replaceRuleClasses(source, relationshipOwners);

      assertNoRelationshipMarkers(renderedRule, relationshipOwners);

      return renderedRule;
    });

  return inlinePrivateTailwindVariables(renderRuleSet(analyzed.template, rules), analyzed.tailwindDefaults);
}

function analyzeCompiledFile(css: string, file: StyleOutputFile): AnalyzedFile {
  const semanticClassNames = new Set(file.rules.map((rule) => rule.className));
  let analyzed: AnalyzedFile | undefined;

  transform({
    filename: 'tailwind.css',
    code: encoder.encode(css),
    include: Features.Nesting,
    visitor: {
      StyleSheet(stylesheet) {
        const semanticRules = new Map<string, Rule>();

        for (const rule of stylesheet.rules) {
          const className = semanticRootClass(rule, semanticClassNames);
          if (!className) continue;

          if (semanticRules.has(className)) throw new Error(`Tailwind emitted '.${className}' more than once.`);

          semanticRules.set(className, withoutRootSentinel(cloneCssAst(rule)));
        }

        analyzed = {
          template: cloneCssAst(stylesheet),
          semanticRules,
          tailwindDefaults: collectTailwindDefaults(stylesheet.rules),
        };

        return withoutNullValues({ ...stylesheet, rules: [] });
      },
    },
  });

  if (!analyzed) throw new Error('Lightning CSS did not return a stylesheet during style emission.');

  return analyzed;
}

function withoutRootSentinel(rule: Rule): Rule {
  if (rule.type !== 'style') return rule;

  const block = rule.value.declarations;

  if (block?.declarations) {
    block.declarations = block.declarations.filter(
      (declaration) => declaration.property !== 'custom' || declaration.value.name !== ROOT_SENTINEL
    );
  }

  return rule;
}

function semanticRootClass(rule: Rule, semanticClassNames: ReadonlySet<string>): string | undefined {
  if (rule.type !== 'style' || rule.value.selectors.length !== 1) return;

  const selector = rule.value.selectors[0];
  if (selector?.length !== 1 || selector[0]?.type !== 'class') return;

  return semanticClassNames.has(selector[0].name) ? selector[0].name : undefined;
}

function renderRuleSet(template: StyleSheet, rules: readonly Rule[]): string {
  const cloned = rules.map(cloneCssAst);
  const result = transform({
    filename: 'rendered.css',
    code: encoder.encode(''),
    include: Features.Nesting,
    visitor: {
      StyleSheet() {
        return withoutNullValues({
          ...cloneCssAst(template),
          rules: cloned,
          licenseComments: [],
        });
      },
    },
  });

  return decoder.decode(result.code).trim();
}

function assertNoRelationshipMarkers(rule: Rule, bindings: ReadonlyMap<string, string>): void {
  const remaining = [...collectRuleClasses(rule, new Set())].filter((className) => bindings.has(className));
  if (remaining.length === 0) return;

  throw new Error(`style emission: relationship markers leaked into semantic CSS: ${remaining.join(', ')}`);
}
