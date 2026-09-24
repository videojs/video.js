import type { Rule, Selector, SelectorComponent, SelectorList } from 'lightningcss';

import { cloneCssAst, mapNestedSelectors, visitCssRules } from './css-ast';

function cloneSelectorList(selectors: SelectorList): SelectorList {
  return selectors.map(cloneSelector);
}

export function replaceSelectorClasses(
  selectors: SelectorList,
  replacements: ReadonlyMap<string, string>
): SelectorList {
  if (replacements.size === 0) return cloneSelectorList(selectors);

  return mapSelectorList(selectors, (component) => {
    if (component.type !== 'class') return component;

    const replacement = replacements.get(component.name);

    return replacement ? { ...component, name: replacement } : component;
  });
}

export function replaceRuleClasses(rule: Rule, replacements: ReadonlyMap<string, string>): Rule {
  const clone = cloneCssAst(rule);

  visitCssRules([clone], (candidate) => {
    if (candidate.type === 'style') {
      candidate.value.selectors = replaceSelectorClasses(candidate.value.selectors, replacements);
    } else if (candidate.type === 'nesting') {
      candidate.value.style.selectors = replaceSelectorClasses(candidate.value.style.selectors, replacements);
    }
  });

  return clone;
}

/**
 * Render Tailwind group descendants in the component-oriented form a person would normally author, while retaining
 * Tailwind's zero-specificity owner.
 */
export function foldGroupDescendantSelectors(selectors: SelectorList): SelectorList {
  return selectors.map((selector) => {
    const relationships = selector.flatMap((component) => {
      const relationship = groupDescendantRelationship(component);

      return relationship ? [relationship] : [];
    });
    if (relationships.length === 0) return cloneSelector(selector);

    const owner = JSON.stringify(relationships[0]?.owner);

    if (relationships.some((relationship) => JSON.stringify(relationship.owner) !== owner)) {
      return cloneSelector(selector);
    }

    const relationshipComponents = new Set(relationships.map((relationship) => relationship.component));
    const subject = selector.filter((component) => !relationshipComponents.has(component)).map(cloneSelectorComponent);

    return [
      cloneSelectorComponent(relationships[0]!.owner),
      ...relationships.flatMap((relationship) => relationship.conditions.map(cloneSelectorComponent)),
      { type: 'combinator', value: 'descendant' },
      ...subject,
    ];
  });
}

interface GroupDescendantRelationship {
  component: SelectorComponent;
  owner: SelectorComponent;
  conditions: readonly SelectorComponent[];
}

function groupDescendantRelationship(component: SelectorComponent): GroupDescendantRelationship | undefined {
  if (component.type !== 'pseudo-class' || component.kind !== 'is' || component.selectors.length !== 1) return;

  const selector = component.selectors[0]!;
  if (selector.length < 3) return;

  const owner = selector[0];
  const combinator = selector.at(-2);
  const target = selector.at(-1);

  if (
    owner?.type !== 'pseudo-class' ||
    owner.kind !== 'where' ||
    owner.selectors.length !== 1 ||
    owner.selectors[0]?.length !== 1 ||
    owner.selectors[0][0]?.type !== 'class' ||
    combinator?.type !== 'combinator' ||
    combinator.value !== 'descendant' ||
    target?.type !== 'universal'
  ) {
    return;
  }

  const conditions = selector.slice(1, -2);
  if (conditions.some((condition) => condition.type === 'combinator' || condition.type === 'nesting')) return;

  return { component, owner, conditions };
}

function cloneSelector(selector: Selector): Selector {
  return selector.map(cloneSelectorComponent);
}

function cloneSelectorComponent(component: SelectorComponent): SelectorComponent {
  return cloneCssAst(component);
}

function mapSelectorList(
  selectors: SelectorList,
  map: (component: SelectorComponent) => SelectorComponent
): SelectorList {
  return selectors.map((selector) => mapSelector(selector, map));
}

function mapSelector(selector: Selector, map: (component: SelectorComponent) => SelectorComponent): Selector {
  return selector.map((component) => mapNestedSelectors(map(component), (nested) => mapSelector(nested, map)));
}
