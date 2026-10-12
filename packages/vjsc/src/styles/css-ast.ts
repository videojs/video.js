import { isObject } from '@videojs/utils/predicate';
import type { Rule, Selector, SelectorComponent } from 'lightningcss';

/**
 * Deep-clone a Lightning CSS AST fragment. The AST is plain JSON data, and this runs on every rule, selector, and token
 * the renderer touches, where `structuredClone` spends most of its time in per-call overhead.
 */
export function cloneCssAst<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneCssAst) as T;

  if (!isObject(value)) return value;

  const clone: Record<string, unknown> = {};

  for (const key of Object.keys(value)) clone[key] = cloneCssAst((value as Record<string, unknown>)[key]);

  return clone as T;
}

/**
 * Lightning CSS serializes optional AST fields as `null`, but its returned-AST deserializer accepts them only when
 * omitted.
 */
export function withoutNullValues<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutNullValues) as T;

  if (!isObject(value)) return value;

  const record = value as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (record[key] === null) delete record[key];
    else record[key] = withoutNullValues(record[key]);
  }

  return value;
}

export function collectRuleClasses(rule: Rule, classes: Set<string>): Set<string> {
  visitCssRules([rule], (candidate) => {
    if (candidate.type === 'style') {
      for (const selector of candidate.value.selectors) collectSelectorClasses(selector, classes);
    } else if (candidate.type === 'nesting') {
      for (const selector of candidate.value.style.selectors) collectSelectorClasses(selector, classes);
    }
  });

  return classes;
}

export function visitCssRules(rules: readonly Rule[], visit: (rule: Rule) => void): void {
  for (const rule of rules) {
    visit(rule);

    if (rule.type === 'style') visitCssRules(rule.value.rules ?? [], visit);
    else if (rule.type === 'nesting') visitCssRules(rule.value.style.rules ?? [], visit);
    else if (hasNestedCssRules(rule)) visitCssRules(rule.value.rules, visit);
  }
}

export function hasNestedCssRules(
  rule: Rule
): rule is Extract<
  Rule,
  { type: 'media' | 'container' | 'supports' | 'layer-block' | 'moz-document' | 'scope' | 'starting-style' }
> {
  return (
    rule.type === 'media' ||
    rule.type === 'container' ||
    rule.type === 'supports' ||
    rule.type === 'layer-block' ||
    rule.type === 'moz-document' ||
    rule.type === 'scope' ||
    rule.type === 'starting-style'
  );
}

function collectSelectorClasses(selector: Selector, classes: Set<string>): void {
  for (const component of selector) {
    if (component.type === 'class') classes.add(component.name);

    for (const nested of nestedSelectors(component)) collectSelectorClasses(nested, classes);
  }
}

/** The selectors nested in a component, such as the arguments of `:is()`, `:host()`, or `::slotted()`. */
export function nestedSelectors(component: SelectorComponent): readonly Selector[] {
  if (component.type === 'pseudo-class') {
    switch (component.kind) {
      case 'not':
      case 'where':
      case 'is':
      case 'any':
      case 'has':
        return component.selectors;
      case 'host':
        return component.selectors ? [component.selectors] : [];
      case 'nth-child':
      case 'nth-last-child':
        return component.of ?? [];
      case 'local':
      case 'global':
        return [component.selector];
      default:
        return [];
    }
  }

  if (component.type === 'pseudo-element' && hasNestedSelector(component)) return [component.selector];

  return [];
}

/** A copy of a component with every selector nested in it mapped. Components without nested selectors are returned. */
export function mapNestedSelectors(
  component: SelectorComponent,
  map: (selector: Selector) => Selector
): SelectorComponent {
  if (component.type === 'pseudo-class') {
    switch (component.kind) {
      case 'not':
      case 'where':
      case 'is':
      case 'any':
      case 'has':
        return { ...component, selectors: component.selectors.map(map) };
      case 'host':
        return component.selectors ? { ...component, selectors: map(component.selectors) } : component;
      case 'nth-child':
      case 'nth-last-child':
        return component.of ? { ...component, of: component.of.map(map) } : component;
      case 'local':
      case 'global':
        return { ...component, selector: map(component.selector) };
      default:
        return component;
    }
  }

  if (component.type === 'pseudo-element' && hasNestedSelector(component)) {
    return { ...component, selector: map(component.selector) };
  }

  return component;
}

function hasNestedSelector(
  component: Extract<SelectorComponent, { type: 'pseudo-element' }>
): component is Extract<
  SelectorComponent,
  { type: 'pseudo-element'; kind: 'slotted' | 'cue-function' | 'cue-region-function' }
> {
  return component.kind === 'slotted' || component.kind === 'cue-function' || component.kind === 'cue-region-function';
}
