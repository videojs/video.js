import { type Rule, type Selector, type SelectorComponent, type SelectorList, transform } from 'lightningcss';

import { cloneCssAst, withoutNullValues } from './css-ast';

const encoder = new TextEncoder();

const decoder = new TextDecoder();

type WhereComponent = Extract<SelectorComponent, { type: 'pseudo-class'; kind: 'where' }>;

/**
 * Rewrite every `@scope (<root>) { … }` block into ordinary rules that carry the root as `:where(<root>)`, which adds
 * no specificity. Scoped selectors match descendants of the root, `:scope` and a scope-level `&` match the root itself,
 * and a nested scope resolves its root inside the outer one. Scope proximity is lost, so a component nested inside
 * itself resolves by source order instead; scope limits (`to (…)`) have no selector equivalent and are rejected.
 */
export function flattenScopes(css: string): string {
  if (!css.includes('@scope')) return css;

  return decoder.decode(
    transform({
      filename: 'flattened.css',
      code: encoder.encode(css),
      visitor: {
        StyleSheet(stylesheet) {
          return withoutNullValues({
            ...cloneCssAst(stylesheet),
            rules: flattenRules(stylesheet.rules, undefined, false),
          });
        },
      },
    }).code
  );
}

/** `root` is the enclosing scope as a `:where()` component; `nested` marks rules inside a style rule, relative to it. */
function flattenRules(rules: readonly Rule[], root: WhereComponent | undefined, nested: boolean): Rule[] {
  return rules.flatMap((rule) => flattenRule(rule, root, nested));
}

function flattenRule(rule: Rule, root: WhereComponent | undefined, nested: boolean): Rule[] {
  if (rule.type === 'scope') {
    if (rule.value.scopeEnd) throw new Error('`@scope` limits (`to (…)`) cannot be flattened into selectors.');

    if (nested) throw new Error('`@scope` inside a style rule cannot be flattened into selectors.');

    const scopeStart = rule.value.scopeStart;
    if (!scopeStart) throw new Error('`@scope` without a root selector cannot be flattened into selectors.');

    const start = root ? scopeStart.map((selector) => scopedSelector(selector, root, false)) : scopeStart;

    return flattenRules(rule.value.rules, where(start), false);
  }

  const clone = cloneCssAst(rule);

  if (clone.type === 'style') {
    if (root) clone.value.selectors = clone.value.selectors.map((selector) => scopedSelector(selector, root, nested));

    clone.value.rules = flattenRules(clone.value.rules ?? [], root, true);
    return [clone];
  }

  if (clone.type === 'nesting') {
    if (root) {
      clone.value.style.selectors = clone.value.style.selectors.map((selector) => scopedSelector(selector, root, true));
    }

    clone.value.style.rules = flattenRules(clone.value.style.rules ?? [], root, true);
    return [clone];
  }

  const value = (clone as { value?: { rules?: Rule[] } }).value;

  if (value && Array.isArray(value.rules)) value.rules = flattenRules(value.rules, root, nested);

  return [clone];
}

function scopedSelector(selector: Selector, root: WhereComponent, nested: boolean): Selector {
  if (someComponent(selector, isScope)) return replaceComponents(selector, isScope, root);

  // A selector nested in a style rule is relative to that rule, which already carries the root.
  if (nested) return selector;

  if (someComponent(selector, isNesting)) return replaceComponents(selector, isNesting, root);

  if (selector[0]?.type === 'combinator') return [cloneCssAst(root), ...selector];

  return [cloneCssAst(root), { type: 'combinator', value: 'descendant' }, ...selector];
}

function where(selectors: SelectorList): WhereComponent {
  return { type: 'pseudo-class', kind: 'where', selectors };
}

function isScope(component: SelectorComponent): boolean {
  return component.type === 'pseudo-class' && component.kind === 'scope';
}

function isNesting(component: SelectorComponent): boolean {
  return component.type === 'nesting';
}

function someComponent(selector: Selector, match: (component: SelectorComponent) => boolean): boolean {
  return selector.some(
    (component) => match(component) || nestedSelectorsOf(component).some((nested) => someComponent(nested, match))
  );
}

function replaceComponents(
  selector: Selector,
  match: (component: SelectorComponent) => boolean,
  replacement: SelectorComponent
): Selector {
  return selector.map((component) => {
    if (match(component)) return cloneCssAst(replacement);

    return mapNestedSelectors(component, (nested) => replaceComponents(nested, match, replacement));
  });
}

/** Selector arguments a component carries, such as the lists inside `:is()`, `:not()`, `:has()`, or `::slotted()`. */
function nestedSelectorsOf(component: SelectorComponent): readonly Selector[] {
  if (component.type === 'pseudo-class') {
    if (
      component.kind === 'not' ||
      component.kind === 'where' ||
      component.kind === 'is' ||
      component.kind === 'any' ||
      component.kind === 'has'
    ) {
      return component.selectors;
    }

    if (component.kind === 'host') return component.selectors ? [component.selectors] : [];

    if (component.kind === 'nth-child' || component.kind === 'nth-last-child') return component.of ?? [];
  }

  if (component.type === 'pseudo-element' && component.kind === 'slotted') return [component.selector];

  return [];
}

function mapNestedSelectors(component: SelectorComponent, map: (selector: Selector) => Selector): SelectorComponent {
  if (component.type === 'pseudo-class') {
    if (
      component.kind === 'not' ||
      component.kind === 'where' ||
      component.kind === 'is' ||
      component.kind === 'any' ||
      component.kind === 'has'
    ) {
      return { ...component, selectors: component.selectors.map(map) };
    }

    if (component.kind === 'host' && component.selectors) return { ...component, selectors: map(component.selectors) };

    if ((component.kind === 'nth-child' || component.kind === 'nth-last-child') && component.of) {
      return { ...component, of: component.of.map(map) };
    }
  }

  if (component.type === 'pseudo-element' && component.kind === 'slotted') {
    return { ...component, selector: map(component.selector) };
  }

  return component;
}
