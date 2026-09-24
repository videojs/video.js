import type { Expression, ImportDeclaration, Node, Program } from '@oxc-project/types';
import { isString } from '@videojs/utils/predicate';
import { walk } from 'oxc-walker';
import type { RolldownMagicString } from 'rolldown';

import { type SourceEdit, sourceError } from '../ast';
import type { DesignSystem } from './design-system';
import { isStyleModulePath, resolveStyleModule, resolveStyleModuleFile } from './modules';
import type { StyleTransformOptions } from './options';
import type { StyleComposition } from './precedence';
import { ruleForToken, type ResolvedStyleRule, type ResolvedStyles, utilityGroupsForRule } from './resolved';

interface StyleBinding {
  readonly declaration: ImportDeclaration;
  readonly modulePath: string;
}

export interface TransformedStyleReferences {
  /** Semantic classes of every rule the source references. */
  readonly referencedRules: ReadonlySet<string>;
  /** Class lists that compose two or more style references on one element. */
  readonly compositions: readonly StyleComposition[];
}

type StyleReferenceContext = 'jsx' | 'list' | 'value';

/** The style modules a source imports, as absolute paths in import order. */
export function importedStyleFiles(filename: string, ast: Program): string[] {
  const files: string[] = [];

  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration') continue;

    const specifier = statement.source.value;
    if (!specifier.startsWith('.') || !isStyleModulePath(specifier)) continue;

    const file = resolveStyleModuleFile(filename, specifier);

    if (!file) {
      throw sourceError(`Cannot resolve style module \`${specifier}\` imported by \`${filename}\`.`, statement.start);
    }

    files.push(file);
  }

  return [...new Set(files)];
}

/**
 * Replace each static style reference, such as `styles.button.icon`, with its classes and remove the style imports. Any
 * other use of a style binding is an error, since the module is never loaded at runtime.
 */
export function transformStyleReferences(
  filename: string,
  ast: Program,
  magicString: RolldownMagicString,
  styles: ResolvedStyles,
  options: StyleTransformOptions,
  merge?: DesignSystem['merge']
): TransformedStyleReferences {
  const bindings = styleBindings(filename, ast, styles);
  if (bindings.size === 0) return { referencedRules: new Set(), compositions: [] };

  const edits: SourceEdit[] = [];
  const referencedRules = new Set<string>();
  const lists = new Map<Node, { readonly pos: number; readonly classNames: string[] }>();
  const transformedRanges: Array<readonly [number, number]> = [];

  walk(ast, {
    enter(node, parent) {
      if (node.type !== 'MemberExpression') return;

      const path = readAccessPath(node);
      const [root, ...tokenPath] = path ?? [];
      const binding = root ? bindings.get(root) : undefined;
      const rule = binding ? ruleForToken(styles, binding.modulePath, tokenPath) : undefined;
      if (!rule) return;

      const context = styleReferenceContext(node, parent);

      edits.push({ start: node.start, end: node.end, content: renderStyleRule(rule, options, context, merge) });
      referencedRules.add(rule.className);
      transformedRanges.push([node.start, node.end]);

      if (context === 'list' && parent) {
        const list = lists.get(parent) ?? { pos: parent.start, classNames: [] };

        list.classNames.push(rule.className);
        lists.set(parent, list);
      }

      this.skip();
    },
  });

  assertNoUntransformedReferences(ast, bindings, transformedRanges);

  for (const edit of edits) magicString.overwrite(edit.start, edit.end, edit.content);

  for (const binding of new Set(bindings.values())) {
    magicString.remove(binding.declaration.start, binding.declaration.end);
  }

  return {
    referencedRules,
    compositions: [...lists.values()].filter((list) => list.classNames.length > 1),
  };
}

function styleBindings(filename: string, ast: Program, styles: ResolvedStyles): ReadonlyMap<string, StyleBinding> {
  const bindings = new Map<string, StyleBinding>();

  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration' || !statement.source.value.startsWith('.')) continue;

    const modulePath = resolveStyleModule(filename, statement.source.value, styles);
    if (!modulePath) continue;

    const defaults = statement.specifiers.filter((specifier) => specifier.type === 'ImportDefaultSpecifier');

    if (defaults.length !== 1 || statement.specifiers.length !== 1) {
      throw sourceError(`Style import \`${statement.source.value}\` must use a default import.`, statement.start);
    }

    bindings.set(defaults[0]!.local.name, { declaration: statement, modulePath });
  }

  return bindings;
}

function readAccessPath(expression: Expression): string[] | undefined {
  if (expression.type === 'Identifier') return [expression.name];

  if (expression.type !== 'MemberExpression') return undefined;

  const object = readAccessPath(expression.object);
  if (!object) return undefined;

  if (!expression.computed) return [...object, expression.property.name];

  if (expression.property.type === 'Literal' && isString(expression.property.value)) {
    return [...object, expression.property.value];
  }

  return undefined;
}

function renderStyleRule(
  rule: ResolvedStyleRule,
  options: StyleTransformOptions,
  context: StyleReferenceContext,
  merge?: DesignSystem['merge']
): string {
  const utilityGroups = utilityGroupsForRule(rule, options.variants, merge);
  const groups = options.mode === 'css' || utilityGroups.length === 0 ? [rule.className] : utilityGroups;
  const values = groups.filter(Boolean);

  if (context === 'list') return values.length > 0 ? values.map((value) => JSON.stringify(value)).join(', ') : '""';

  if (context === 'jsx' && values.length > 1) {
    return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
  }

  return JSON.stringify(values.join(' '));
}

function styleReferenceContext(expression: Expression, parent: Node | null): StyleReferenceContext {
  const listItem =
    (parent?.type === 'ArrayExpression' && parent.elements.includes(expression)) ||
    (parent?.type === 'CallExpression' && parent.arguments.includes(expression));
  if (listItem) return 'list';

  return parent?.type === 'JSXExpressionContainer' ? 'jsx' : 'value';
}

function assertNoUntransformedReferences(
  ast: Program,
  bindings: ReadonlyMap<string, StyleBinding>,
  transformed: readonly (readonly [number, number])[]
): void {
  const unresolved = new Map<string, number[]>();

  walk(ast, {
    enter(node) {
      if (node.type !== 'Identifier' || !bindings.has(node.name)) return;

      const binding = bindings.get(node.name)!;
      const inImport = node.start >= binding.declaration.start && node.end <= binding.declaration.end;
      const inTransform = transformed.some(([start, end]) => node.start >= start && node.end <= end);

      if (!inImport && !inTransform) {
        const positions = unresolved.get(node.name) ?? [];

        positions.push(node.start);
        unresolved.set(node.name, positions);
      }
    },
  });

  if (unresolved.size > 0) {
    throw sourceError(
      `Styles must use static references. Could not transform: ${[...unresolved]
        .map(([name, positions]) => `${name} at ${positions.join(', ')}`)
        .join('; ')}.`,
      Math.min(...[...unresolved.values()].flat())
    );
  }
}
