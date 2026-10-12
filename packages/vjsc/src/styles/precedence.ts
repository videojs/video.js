import { type Declaration, type Selector, type SelectorComponent, transform } from 'lightningcss';

import { sourceError } from '../ast/errors';
import type { DesignSystem } from './design-system';
import { isGroupMarker, type ResolvedStyleRule, utilitiesForRule } from './resolved';

const encoder = new TextEncoder();

/** Style references composed on one element, in authored order: later references are meant to override earlier ones. */
export interface StyleComposition {
  readonly classNames: readonly string[];
  /** Source offset of the composing `className` or `class` array. */
  readonly pos: number;
}

/**
 * Compare output files by their cascade position. A configured order is authoritative and must list every file it
 * compares; without one, files are ordered by name so the result never depends on how a module composes its classes.
 */
export function compareStyleFiles(order: readonly string[] | undefined): (left: string, right: string) => number {
  if (!order) return (left, right) => left.localeCompare(right);

  const positions = new Map(order.map((file, index) => [file, index]));
  const position = (file: string): number => {
    const index = positions.get(file);

    if (index === undefined) {
      throw new Error(
        `Style output \`${file}\` is missing from \`stylesheet.order\`.\n` +
          'Reason: the cascade position of every emitted file must be declared so overrides do not depend on composition order.\n' +
          `Recommendation: add \`${file}\` to \`stylesheet.order\` after the files whose rules it overrides.`
      );
    }

    return index;
  };

  return (left, right) => position(left) - position(right);
}

/** A property a rule sets, and the attribute states its element must be in for the declaration to apply. */
interface RuleProperty {
  /** The property, prefixed by the pseudo-element it styles, if any, as in `::after background-color`. */
  readonly name: string;
  /** Attribute name → the value it must equal, `true` when it must be present, or `false` when it must be absent. */
  readonly attributes: ReadonlyMap<string, string | boolean>;
  /** Whether the declaration is `!important`, which beats a normal declaration wherever each is emitted. */
  readonly important: boolean;
  /** Specificity of the rule's selector, or `undefined` for a selector list, whose matching selector can vary. */
  readonly specificity: Specificity | undefined;
}

/** Selector specificity as ID, class, and type counts. */
type Specificity = readonly [ids: number, classes: number, types: number];

type AttributeComponent = Extract<SelectorComponent, { type: 'attribute' }>;
type PseudoClassComponent = Extract<SelectorComponent, { type: 'pseudo-class' }>;

export interface CompositionOrderOptions {
  readonly compositions: readonly StyleComposition[];
  readonly rules: readonly ResolvedStyleRule[];
  readonly design: DesignSystem;
  readonly variants?: readonly string[] | undefined;
  readonly order?: readonly string[] | undefined;
}

/**
 * Reject compositions whose later style would lose to an earlier one in the emitted CSS. Tailwind output resolves each
 * element's classes in authored order, while CSS output can only order whole files, and rules within a file by class
 * name; when two composed rules set the same property in opposite orders, the two outputs would style the element
 * differently.
 */
export function assertCompositionOrder(options: CompositionOrderOptions): void {
  const byClass = new Map(options.rules.map((rule) => [rule.className, rule]));
  const compareFiles = compareStyleFiles(options.order);
  const known = new Map<ResolvedStyleRule, readonly RuleProperty[]>();
  const properties = (rule: ResolvedStyleRule): readonly RuleProperty[] => {
    let set = known.get(rule);

    if (!set) {
      set = ruleProperties(rule, options.design, options.variants ?? []);
      known.set(rule, set);
    }

    return set;
  };

  for (const composition of options.compositions) {
    const rules = composition.classNames.flatMap((className) => byClass.get(className) ?? []);

    for (const [index, earlier] of rules.entries()) {
      for (const later of rules.slice(index + 1)) {
        if (later === earlier || !emittedBefore(later, earlier, compareFiles)) continue;

        const shared = sharedProperties(properties(earlier), properties(later));
        if (shared.length === 0) continue;

        throw sourceError(compositionMessage(earlier, later, shared), composition.pos);
      }
    }
  }
}

function emittedBefore(
  rule: ResolvedStyleRule,
  other: ResolvedStyleRule,
  compareFiles: (left: string, right: string) => number
): boolean {
  if (rule.file !== other.file) return compareFiles(rule.file, other.file) < 0;

  return rule.className.localeCompare(other.className) < 0;
}

function compositionMessage(earlier: ResolvedStyleRule, later: ResolvedStyleRule, shared: readonly string[]): string {
  const properties = shared.map((property) => `\`${property}\``).join(', ');
  const context = `\`.${later.className}\` is composed after \`.${earlier.className}\` to override it`;

  if (later.file === earlier.file) {
    return (
      `${context}, but both are emitted to \`${later.file}\`, where \`.${earlier.className}\` sorts later and wins for ${properties}.\n` +
      'Reason: CSS output orders one file by class name, while Tailwind output applies classes in authored order.\n' +
      `Recommendation: move \`${later.tokenPath.join('.')}\` to a file emitted after \`${earlier.file}\`, or stop setting ${properties} in one of the rules.`
    );
  }

  return (
    `${context}, but \`${later.file}\` is emitted before \`${earlier.file}\`, so \`.${earlier.className}\` wins for ${properties}.\n` +
    'Reason: CSS output orders whole files, while Tailwind output applies classes in authored order.\n' +
    `Recommendation: list \`${later.file}\` after \`${earlier.file}\` in \`stylesheet.order\`, or move one of the rules.`
  );
}

/** Properties a rule sets under the selected variants. */
function ruleProperties(
  rule: ResolvedStyleRule,
  design: DesignSystem,
  variants: readonly string[]
): readonly RuleProperty[] {
  const properties: RuleProperty[] = [];

  for (const candidate of utilitiesForRule(rule, variants, design.merge)) {
    if (isGroupMarker(candidate)) continue;

    properties.push(...candidateProperties(design, candidate));
  }

  return properties;
}

const candidatePropertyCache = new WeakMap<DesignSystem, Map<string, readonly RuleProperty[]>>();

function candidateProperties(design: DesignSystem, candidate: string): readonly RuleProperty[] {
  const cache = candidatePropertyCache.get(design) ?? new Map<string, readonly RuleProperty[]>();

  candidatePropertyCache.set(design, cache);

  const cached = cache.get(candidate);
  if (cached) return cached;

  const properties: RuleProperty[] = [];
  const css = design.candidateCss(candidate);

  if (css) {
    transform({
      filename: 'candidate.css',
      code: encoder.encode(css),
      visitor: {
        Rule: {
          style(rule) {
            const pseudo = rule.value.selectors
              .flatMap((selector) => selector)
              .find((component) => component.type === 'pseudo-element');
            const target = pseudo ? `::${pseudo.kind} ` : '';
            const [selector, ...others] = rule.value.selectors;
            const single = selector && others.length === 0 ? selector : undefined;
            const attributes = single ? subjectAttributes(single) : new Map();
            const specificity = single ? selectorSpecificity(single) : undefined;
            const block = rule.value.declarations;

            for (const [important, declarations] of [
              [false, block?.declarations],
              [true, block?.importantDeclarations],
            ] as const) {
              for (const declaration of declarations ?? []) {
                properties.push({
                  name: `${target}${declarationProperty(declaration)}`,
                  attributes,
                  important,
                  specificity,
                });
              }
            }
          },
        },
      },
    });
  }

  cache.set(candidate, properties);
  return properties;
}

/**
 * Attribute states the element a selector matches must be in: equality and presence tests in its last compound, and
 * negated presence tests. Tests on other elements, and values compared case-insensitively, are left out, so a rule is
 * assumed to compete with any other unless both demand states no element can be in at once.
 */
function subjectAttributes(selector: Selector): ReadonlyMap<string, string | boolean> {
  const attributes = new Map<string, string | boolean>();
  let start = 0;

  for (const [index, component] of selector.entries()) if (component.type === 'combinator') start = index + 1;

  for (const component of selector.slice(start)) {
    if (component.type === 'attribute') {
      const state = attributeState(component);

      if (state !== undefined) constrainAttribute(attributes, component.name, state);
    } else if (component.type === 'pseudo-class' && component.kind === 'not') {
      const [negated, ...others] = component.selectors;
      const [test, ...rest] = negated ?? [];

      if (others.length === 0 && rest.length === 0 && test?.type === 'attribute' && attributeState(test) === true) {
        constrainAttribute(attributes, test.name, false);
      }
    }
  }

  return attributes;
}

/**
 * Selectors Level 4 specificity: `:where()` adds nothing, and `:is()`, `:not()`, and `:has()` add their most specific
 * argument.
 */
function selectorSpecificity(selector: Selector): Specificity {
  return selector.reduce<Specificity>(
    (total, component) => addSpecificity(total, componentSpecificity(component)),
    [0, 0, 0]
  );
}

function componentSpecificity(component: SelectorComponent): Specificity {
  switch (component.type) {
    case 'id':
      return [1, 0, 0];
    case 'class':
    case 'attribute':
      return [0, 1, 0];
    case 'type':
    case 'pseudo-element':
      return [0, 0, 1];
    case 'pseudo-class':
      return pseudoClassSpecificity(component);
    default:
      return [0, 0, 0];
  }
}

function pseudoClassSpecificity(component: PseudoClassComponent): Specificity {
  switch (component.kind) {
    case 'where':
      return [0, 0, 0];
    case 'is':
    case 'not':
    case 'has':
    case 'any':
      return maxSpecificity(component.selectors);
    case 'nth-child':
    case 'nth-last-child':
      return addSpecificity([0, 1, 0], maxSpecificity(component.of ?? []));
    default:
      return [0, 1, 0];
  }
}

function maxSpecificity(selectors: readonly Selector[]): Specificity {
  return selectors
    .map(selectorSpecificity)
    .reduce<Specificity>((max, next) => (compareSpecificity(next, max) > 0 ? next : max), [0, 0, 0]);
}

function addSpecificity(left: Specificity, right: Specificity): Specificity {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function compareSpecificity(left: Specificity, right: Specificity): number {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

/** Whether source order decides between two declarations: the cascade compares importance, then specificity, first. */
function orderDecides(left: RuleProperty, right: RuleProperty): boolean {
  if (left.important !== right.important) return false;

  return !left.specificity || !right.specificity || compareSpecificity(left.specificity, right.specificity) === 0;
}

/** Add one attribute test, keeping the stronger of two: a value or absence already implies whether it is present. */
function constrainAttribute(attributes: Map<string, string | boolean>, name: string, state: string | boolean): void {
  const current = attributes.get(name);

  if (current === undefined || current === true) attributes.set(name, state);
}

function attributeState(component: AttributeComponent): string | true | undefined {
  if (component.namespace) return undefined;

  const operation = component.operation;
  if (!operation) return true;

  const exact =
    operation.caseSensitivity === 'case-sensitive' || operation.caseSensitivity === 'explicit-case-sensitive';

  return operation.operator === 'equal' && exact ? operation.value : undefined;
}

/** Whether no element can be in both attribute states at once, so declarations under them never compete. */
function exclusiveAttributes(
  left: ReadonlyMap<string, string | boolean>,
  right: ReadonlyMap<string, string | boolean>
): boolean {
  for (const [name, state] of left) {
    const other = right.get(name);
    if (other === undefined || other === state) continue;

    // Absence rules out presence and every value; presence allows any value.
    if (state === false || other === false) return true;

    if (state !== true && other !== true) return true;
  }

  return false;
}

/** The property a declaration sets. Values Lightning CSS cannot type, such as `var()` references, arrive unparsed. */
function declarationProperty(declaration: Declaration): string {
  if (declaration.property === 'custom') return declaration.value.name;

  if (declaration.property === 'unparsed') return declaration.value.propertyId.property;

  return declaration.property;
}

/** Longhands a shorthand sets that do not share its name as a prefix. */
const SHORTHAND_LONGHANDS: Readonly<Record<string, readonly string[]>> = {
  inset: ['top', 'right', 'bottom', 'left'],
  gap: ['row-gap', 'column-gap'],
  'place-items': ['align-items', 'justify-items'],
  'place-content': ['align-content', 'justify-content'],
  'place-self': ['align-self', 'justify-self'],
};

function sharedProperties(left: readonly RuleProperty[], right: readonly RuleProperty[]): string[] {
  const shared = new Set<string>();

  for (const a of left) {
    for (const b of right) {
      if (
        !propertiesOverlap(a.name, b.name) ||
        !orderDecides(a, b) ||
        exclusiveAttributes(a.attributes, b.attributes)
      ) {
        continue;
      }

      shared.add(a.name.length <= b.name.length ? a.name : b.name);
    }
  }

  return [...shared].sort();
}

function propertiesOverlap(left: string, right: string): boolean {
  if (left === right) return true;

  const [leftTarget, leftName] = splitTarget(left);
  const [rightTarget, rightName] = splitTarget(right);
  if (leftTarget !== rightTarget) return false;

  return covers(leftName, rightName) || covers(rightName, leftName);
}

function covers(shorthand: string, longhand: string): boolean {
  if (shorthand.startsWith('--')) return false;

  return longhand.startsWith(`${shorthand}-`) || (SHORTHAND_LONGHANDS[shorthand]?.includes(longhand) ?? false);
}

/** Split a `::after background-color` key into the pseudo-element it styles and the property name. */
function splitTarget(property: string): readonly [target: string, name: string] {
  const space = property.indexOf(' ');

  return space < 0 ? ['', property] : [property.slice(0, space), property.slice(space + 1)];
}
