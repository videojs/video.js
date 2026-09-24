import { type Declaration, transform } from 'lightningcss';

import { sourceError } from '../ast/errors';
import type { DesignSystem } from './design-system';
import { isGroupMarker, type ResolvedStyleRule, utilitiesForRule } from './resolved';

const encoder = new TextEncoder();

/** Style references composed on one element, in authored order: later references are meant to override earlier ones. */
export interface StyleComposition {
  readonly classNames: readonly string[];
  /** Source offset of the composing list, such as a `className={[...]}` array. */
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
  const known = new Map<ResolvedStyleRule, ReadonlySet<string>>();
  const properties = (rule: ResolvedStyleRule): ReadonlySet<string> => {
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

/** Properties a rule sets under the selected variants, prefixed by the pseudo-element they style, if any. */
function ruleProperties(
  rule: ResolvedStyleRule,
  design: DesignSystem,
  variants: readonly string[]
): ReadonlySet<string> {
  const properties = new Set<string>();

  for (const candidate of utilitiesForRule(rule, variants, design.merge)) {
    if (isGroupMarker(candidate)) continue;

    for (const property of candidateProperties(design, candidate)) properties.add(property);
  }

  return properties;
}

const candidatePropertyCache = new WeakMap<DesignSystem, Map<string, ReadonlySet<string>>>();

function candidateProperties(design: DesignSystem, candidate: string): ReadonlySet<string> {
  const cache = candidatePropertyCache.get(design) ?? new Map<string, ReadonlySet<string>>();

  candidatePropertyCache.set(design, cache);

  const cached = cache.get(candidate);
  if (cached) return cached;

  const properties = new Set<string>();
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
            const block = rule.value.declarations;

            for (const declaration of [...(block?.declarations ?? []), ...(block?.importantDeclarations ?? [])]) {
              properties.add(`${target}${declarationProperty(declaration)}`);
            }
          },
        },
      },
    });
  }

  cache.set(candidate, properties);
  return properties;
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

function sharedProperties(left: ReadonlySet<string>, right: ReadonlySet<string>): string[] {
  const shared = new Set<string>();

  for (const a of left) {
    for (const b of right) {
      if (propertiesOverlap(a, b)) shared.add(a.length <= b.length ? a : b);
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
