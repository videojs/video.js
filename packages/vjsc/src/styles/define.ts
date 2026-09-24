import { isObject } from '@videojs/utils/predicate';
import { kebabCase } from '@videojs/utils/string';

import type { StyleVariantName } from './index';
import { isStyleRule, visitStyleRules } from './tree';

const styleDefinition = Symbol.for('vjsc/styles/definition');

export type StyleValue = string | readonly string[];

export interface StyleRule {
  /**
   * The stable semantic class emitted for CSS output. Defaults to the module `prefix` for a `root` rule and to
   * `prefix-<kebab-case path>` for every other rule.
   */
  readonly className?: string | undefined;
  /** Also match this class when it is colocated on the configured CSS scope root. */
  readonly scopeRoot?: boolean | undefined;
  /**
   * The styled element hosts a shadow root, or is a light-DOM child composed through one. WebKit does not match
   * `@scope` rules whose subject hosts a shadow root or is slotted into one, so these rules are also emitted outside
   * the scope block with the scope root as an ancestor.
   */
  readonly shadowHost?: boolean | undefined;
  /** Tailwind utilities shared by every configured variant. */
  readonly utilities: StyleValue;
  /** Utilities appended when a source transform selects a matching variant. */
  readonly variants?: Readonly<Partial<Record<StyleVariantName, StyleValue>>> | undefined;
}

export type StyleTree = {
  readonly [name: string]: StyleRule | StyleTree;
};

export interface StyleDefinition<Rules extends StyleTree = StyleTree> {
  /** CSS asset path used when the style transform emits CSS. */
  readonly file: string;
  /** Class-name prefix rules derive their `className` from when they do not declare one. */
  readonly prefix?: string | undefined;
  /** Cascade layer containing the emitted rules. Defaults to `components`. */
  readonly layer?: string | undefined;
  readonly description?: string | undefined;
  readonly rules: Rules;
}

export type StyleReferences<Rules extends StyleTree> = {
  readonly [Name in keyof Rules]: Rules[Name] extends StyleRule
    ? string
    : Rules[Name] extends StyleTree
      ? StyleReferences<Rules[Name]>
      : never;
};

type DefinedStyles<Rules extends StyleTree> = StyleReferences<Rules> & {
  readonly [styleDefinition]: StyleDefinition<Rules>;
};

/** Define statically transformable styles while exposing semantic class references to consumers. */
export function styles<const Rules extends StyleTree>(definition: StyleDefinition<Rules>): StyleReferences<Rules> {
  validateStyleDefinition(definition);

  const references = createReferences(definition, definition.rules) as DefinedStyles<Rules>;

  Object.defineProperty(references, styleDefinition, {
    configurable: false,
    enumerable: false,
    value: Object.freeze({ ...definition }),
    writable: false,
  });

  return freezeReferences(references);
}

export function getStyleDefinition(value: unknown): StyleDefinition | undefined {
  if (!isObject(value)) return undefined;

  return (value as Partial<DefinedStyles<StyleTree>>)[styleDefinition];
}

/** Resolve the class a rule emits, deriving it from the module prefix when the rule declares none. */
export function ruleClassName(
  definition: Pick<StyleDefinition, 'prefix'>,
  path: readonly string[],
  rule: StyleRule
): string {
  if (rule.className !== undefined) return rule.className;

  if (definition.prefix === undefined) {
    throw new Error(
      `Style rule \`${path.join('.')}\` needs a \`className\` or a module \`prefix\` to derive one from.`
    );
  }

  if (path.length === 1 && path[0] === 'root') return definition.prefix;

  return `${definition.prefix}-${path.map(kebabCase).join('-')}`;
}

function createReferences(
  definition: Pick<StyleDefinition, 'prefix'>,
  tree: StyleTree,
  path: readonly string[] = []
): Record<string, unknown> {
  const references: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(tree)) {
    const rulePath = [...path, name];

    references[name] = isStyleRule(value)
      ? ruleClassName(definition, rulePath, value)
      : createReferences(definition, value, rulePath);
  }

  return references;
}

function freezeReferences<Rules extends StyleTree>(references: DefinedStyles<Rules>): DefinedStyles<Rules> {
  return freezeReferenceValue(references) as DefinedStyles<Rules>;
}

function freezeReferenceValue(value: object): object {
  for (const child of Object.values(value)) {
    if (isObject(child)) freezeReferenceValue(child);
  }

  return Object.freeze(value);
}

export function validateStyleDefinition(definition: StyleDefinition): void {
  const fileSegments = definition.file.split('/');

  if (
    !definition.file.endsWith('.css') ||
    definition.file.startsWith('/') ||
    definition.file.includes('\\') ||
    fileSegments.includes('..')
  ) {
    throw new Error(`Style output file \`${definition.file}\` must be a relative CSS asset path.`);
  }

  const layer = definition.layer ?? 'components';

  if (!/^[-_a-zA-Z][-_a-zA-Z0-9]*(?:\.[-_a-zA-Z][-_a-zA-Z0-9]*)*$/.test(layer)) {
    throw new Error(`Style layer \`${layer}\` must be a CSS layer name.`);
  }

  if (definition.prefix !== undefined && !/^[_a-zA-Z][-_a-zA-Z0-9]*$/.test(definition.prefix)) {
    throw new Error(`Style prefix \`${definition.prefix}\` must be one unprefixed CSS class name.`);
  }

  visitStyleRules(definition.rules, (path, rule) => {
    if (!/^[_a-zA-Z][-_a-zA-Z0-9]*$/.test(ruleClassName(definition, path, rule))) {
      throw new Error(`Style rule \`${path.join('.')}\` must declare one unprefixed CSS class name.`);
    }
  });
}
