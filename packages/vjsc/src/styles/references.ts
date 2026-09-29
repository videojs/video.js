import type {
  Expression,
  ImportDeclaration,
  JSXAttribute,
  LogicalExpression,
  Node,
  Program,
  SpreadElement,
} from '@oxc-project/types';
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
  /**
   * `className` and `class` arrays that compose two or more style references on one element. Other arrays and call
   * arguments can hold alternatives, which never meet on one element, so they compose nothing.
   */
  readonly compositions: readonly StyleComposition[];
}

type StyleReferenceContext = 'jsx' | 'list' | 'value';

const CLASS_ATTRIBUTES: ReadonlySet<string> = new Set(['className', 'class']);

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
  const classLists = new Map<Node, Node>();
  const lists = new Map<Node, { readonly pos: number; readonly classNames: string[] }>();
  const transformedRanges: Array<readonly [number, number]> = [];

  walk(ast, {
    enter(node, parent) {
      if (node.type === 'JSXAttribute') {
        collectClassLists(node, classLists);
        return;
      }

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

      const classList = parent ? classLists.get(parent) : undefined;

      if (classList) {
        const list = lists.get(classList) ?? { pos: classList.start, classNames: [] };

        list.classNames.push(rule.className);
        lists.set(classList, list);
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

/**
 * Map every array a `className` or `class` attribute composes on one element, and every type wrapper inside one, to the
 * class list it belongs to. Nested and spread arrays join their enclosing list, and each branch of a conditional is a
 * list of its own.
 */
function collectClassLists(attribute: JSXAttribute, lists: Map<Node, Node>): void {
  if (attribute.name.type !== 'JSXIdentifier' || !CLASS_ATTRIBUTES.has(attribute.name.name)) return;

  if (attribute.value?.type === 'JSXExpressionContainer' && attribute.value.expression.type !== 'JSXEmptyExpression') {
    collectClassList(attribute.value.expression, lists, undefined);
  }
}

function collectClassList(
  expression: Expression | SpreadElement,
  lists: Map<Node, Node>,
  list: Node | undefined
): void {
  switch (expression.type) {
    case 'ArrayExpression': {
      const owner = list ?? expression;

      lists.set(expression, owner);

      for (const element of expression.elements) if (element) collectClassList(element, lists, owner);

      return;
    }
    case 'SpreadElement':
      if (list) collectClassList(expression.argument, lists, list);

      return;
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
      // A wrapped reference still belongs to the list around it.
      if (list) lists.set(expression, list);

      collectClassList(expression.expression, lists, list);
      return;
    case 'ConditionalExpression':
      // Branches are alternatives, so each is a list of its own and none joins the list around it.
      collectClassList(expression.consequent, lists, undefined);
      collectClassList(expression.alternate, lists, undefined);
      return;
    case 'LogicalExpression':
      for (const operand of valueOperands(expression)) collectClassList(operand, lists, undefined);

      return;
  }
}

/** Operands that can be a logical expression's value. An array literal is truthy and never nullish. */
function valueOperands(expression: LogicalExpression): readonly Expression[] {
  if (withoutTypeWrappers(expression.left).type !== 'ArrayExpression') return [expression.left, expression.right];

  return expression.operator === '&&' ? [expression.right] : [expression.left];
}

function withoutTypeWrappers(expression: Expression): Expression {
  switch (expression.type) {
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
      return withoutTypeWrappers(expression.expression);
    default:
      return expression;
  }
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
