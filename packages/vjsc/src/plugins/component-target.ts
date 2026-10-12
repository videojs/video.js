import { createHash } from 'node:crypto';
import { relative } from 'node:path';

import type { JSXElement, Node, Program } from '@oxc-project/types';
import { isFunction } from '@videojs/utils/predicate';
import { walk } from 'oxc-walker';

import {
  atSourcePosition,
  createSourceText,
  sourceError,
  jsxNamePath,
  type ModuleImports,
  renderSourceRange,
  type SourceEdit,
} from '../ast';
import type { ComponentPartDefinition, ComponentParts } from '../components/definition';
import { scopedIdPlaceholder } from '../html-runtime/scoped-id';
import {
  type CanonicalBindings,
  type CanonicalPath,
  canonicalPath,
  configuredRule,
  displayPath,
  type PrimitiveBinding,
  resolveTargetRule,
  type TargetBindings,
} from '../target/bindings';
import {
  type ComponentRewrite,
  type ComponentRewriteContext,
  type ComponentTarget,
  isTargetUnwrap,
  isTargetElement,
  type SourcePart,
  type SourcePartCollection,
  type SourcePartFor,
  type TargetOutput,
} from '../target/definition';
import type { TargetModule } from '../target/module';
import { isTargetNode, renderTargetElement, renderTargetOutput } from '../target/render';
import { createTargetReplacement, significantJsxChildren, sourceElement } from '../target/source';
import { moduleId, parseModuleId, type TransformModule } from '../utils/module-id';
import { toPosixPath } from '../utils/path';

export type ComponentTargetSelection =
  | readonly ComponentTarget[]
  | ((module: TransformModule) => readonly ComponentTarget[] | null | undefined);

export interface ComponentTargetPluginOptions {
  readonly targets: ComponentTargetSelection;
}

interface ComponentSourceScope {
  readonly root: JSXElement;
  readonly target: ComponentTarget;
  readonly prefix: string;
  used: boolean;
}

interface ComponentSourceScopes {
  readonly nodes: ReadonlyMap<JSXElement, ComponentSourceScope>;
}

type RuntimeComponentDefinition = ComponentPartDefinition<object, ComponentParts | undefined>;
type RuntimeSourceParts = ComponentRewriteContext<RuntimeComponentDefinition>['parts'];
type RuntimeSourcePart = SourcePartFor<RuntimeComponentDefinition>;

/**
 * Lower the module's canonical components and `vjsc/components` primitives in one bottom-up walk. Each element is
 * lowered after its children, so a rewrite receives the lowered output it wraps.
 *
 * @param root - Directory generated identifiers are keyed against, so they do not depend on the checkout path.
 */
export function lowerComponents(module: TargetModule, root: string): void {
  const { code, ast, bindings, imports } = module;
  if (bindings.namespaces.size === 0 && bindings.named.size === 0 && bindings.primitives.size === 0) return;

  const moduleKey = scopeKey(module.id, root);
  const scopes = collectComponentScopes(ast, bindings, moduleKey);
  const descendants = new Map<JSXElement, readonly SourceEdit[]>();
  let primitives = 0;

  const lowerPrimitive = (
    node: JSXElement,
    childEdits: readonly SourceEdit[],
    parent: Node | null,
    binding: PrimitiveBinding
  ): readonly SourceEdit[] => {
    const rule = binding.rule;

    if (isFunction(rule) && !isTargetElement(rule)) {
      const { props, children } = sourceElement(code, node, childEdits);
      const prefix = `${moduleKey}-p${(primitives++).toString(36)}`;
      const output = rule({ props, children, id: (name) => targetId(prefix, name) });
      const replacement = renderTargetOutput(output, { target: binding.target, imports });

      return [
        {
          start: node.start,
          end: node.end,
          content: jsxOutput(replacement, isSingleOutput(output), !isJsxChild(parent)),
        },
      ];
    }

    return isTargetElement(rule)
      ? renameElement(node, childEdits, renderTargetElement(rule, { target: binding.target, imports }))
      : childEdits;
  };

  const lowerCanonical = (
    node: JSXElement,
    childEdits: readonly SourceEdit[],
    parent: Node | null,
    path: CanonicalPath
  ): readonly SourceEdit[] => {
    const scope = scopes.nodes.get(node);
    if (!scope) throw new Error('Component target could not resolve the source component scope.');

    if (isUnwrapped(path)) return unwrapElement(node, childEdits, !isJsxChild(parent), bindings);

    const rule = resolveTargetRule(path);

    if (isFunction(rule) && !isTargetElement(rule)) {
      const { props, children } = sourceElement(code, node, childEdits, true);
      const context: ComponentRewriteContext<RuntimeComponentDefinition> = {
        props,
        children,
        parts: createSourceParts(code, node, path, bindings, scopes, descendants),
        id: (name) => sourceId(scope, name),
      };
      const output = (rule as ComponentRewrite<RuntimeComponentDefinition>)(context);
      let replacement = renderTargetOutput(output, { target: path.target, imports });
      let single = isSingleOutput(output);

      if (scope.root === node && scope.used && scope.target.jsx.scope) {
        replacement = renderSourceScope(replacement, scope, imports);
        single = true;
      }

      return [{ start: node.start, end: node.end, content: jsxOutput(replacement, single, !isJsxChild(parent)) }];
    }

    const nodeEdits = isTargetElement(rule)
      ? renameElement(node, childEdits, renderTargetElement(rule, { target: path.target, imports }))
      : childEdits;

    return wrapSourceScope(code, node, nodeEdits, scope, imports);
  };

  const edits = collectJsxEdits(ast, descendants, (node, childEdits, parent) =>
    atSourcePosition(node.start, () => {
      const primitive = primitiveBinding(node, bindings);
      if (primitive) return lowerPrimitive(node, childEdits, parent, primitive);

      const path = canonicalPath(node.openingElement.name, bindings);

      return path ? lowerCanonical(node, childEdits, parent, path) : childEdits;
    })
  );

  for (const edit of edits) module.magicString.overwrite(edit.start, edit.end, edit.content);
}

export function selectComponentTargets(selection: ComponentTargetSelection, id: string): readonly ComponentTarget[] {
  if (!isFunction(selection)) return selection;

  return selection(parseModuleId(id)) ?? [];
}

/** Hash a module identity relative to the scope root so generated identifiers do not depend on the checkout path. */
export function scopeKey(id: string, root: string): string {
  const module = parseModuleId(id);
  const identity = moduleId(toPosixPath(relative(root, module.filename)), module.params);

  return createHash('sha256').update(identity).digest('base64url').slice(0, 8);
}

function collectComponentScopes(ast: Program, bindings: CanonicalBindings, moduleKey: string): ComponentSourceScopes {
  const nodes = new Map<JSXElement, ComponentSourceScope>();
  const stack: { readonly path: CanonicalPath; readonly scope: ComponentSourceScope }[] = [];
  let ordinal = 0;

  walk(ast, {
    enter(node) {
      if (node.type !== 'JSXElement') return;

      const path = canonicalPath(node.openingElement.name, bindings);
      if (!path) return;

      const isRoot = path.parts.length === 0 || (path.parts.length === 1 && path.parts[0] === 'Root');
      const unwrapped = isRoot && isUnwrapped(path);
      const owner = unwrapped ? stack.at(-1)?.scope : isRoot ? undefined : enclosingScope(stack, path);
      const scope: ComponentSourceScope = owner ?? {
        root: node,
        target: path.target,
        // Number scopes in source order rather than by byte offset so unrelated edits do not churn generated ids.
        prefix: `${moduleKey}-${(ordinal++).toString(36)}`,
        used: false,
      };

      nodes.set(node, scope);

      if ((isRoot && !unwrapped) || !owner) stack.push({ path, scope });
    },
    leave(node) {
      if (node.type !== 'JSXElement') return;

      const scope = nodes.get(node);

      if (scope?.root === node) stack.pop();
    },
  });

  return { nodes };
}

function enclosingScope(
  stack: readonly { readonly path: CanonicalPath; readonly scope: ComponentSourceScope }[],
  path: CanonicalPath
): ComponentSourceScope | undefined {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const entry = stack[index]!;
    if (entry.path.target === path.target && entry.path.component === path.component) return entry.scope;
  }

  return undefined;
}

interface CollectedPart {
  readonly value: SourcePart<object>;
  readonly children: Map<string, CollectedPartGroup>;
}

interface CollectedPartGroup {
  readonly values: CollectedPart[];
  readonly children: Map<string, CollectedPartGroup>;
}

function createSourceParts(
  code: string,
  root: JSXElement,
  rootPath: CanonicalPath,
  bindings: CanonicalBindings,
  scopes: ComponentSourceScopes,
  descendants: ReadonlyMap<JSXElement, readonly SourceEdit[]>
): RuntimeSourceParts {
  const groups = new Map<string, CollectedPartGroup>();
  const rootScope = scopes.nodes.get(root);
  const rootEdits = descendants.get(root) ?? [];
  const claimedBranches = new Map<string, string>();

  walk(root, {
    enter(node) {
      if (node === root || node.type !== 'JSXElement') return;

      const path = canonicalPath(node.openingElement.name, bindings);

      if (
        !path ||
        path.target !== rootPath.target ||
        path.component !== rootPath.component ||
        path.parts.length === 0
      ) {
        return;
      }

      if (scopes.nodes.get(node) !== rootScope) {
        this.skip();
        return;
      }

      const names = path.parts;
      const name = displayPath(path);
      const branch = findSourceBranch(root, node, bindings);
      if (!branch) throw sourceError(`vjsc: <${name}> is not contained by its component root.`, node.start);

      let current = groups;
      let group: CollectedPartGroup | undefined;

      for (const name of names) {
        group = current.get(name);

        if (!group) {
          group = { values: [], children: new Map() };
          current.set(name, group);
        }

        current = group.children;
      }

      const { props, children } = sourceElement(code, node, descendants.get(node) ?? [], true);

      group!.values.push({
        value: {
          props,
          children,
          replaceWith(output) {
            const branchKey = `${branch.start}:${branch.end}`;
            const claimed = claimedBranches.get(branchKey);

            if (claimed) {
              throw sourceError(
                `vjsc: <${name}> cannot preserve the same source branch as <${claimed}>.\n` +
                  'Reason: replacing both parts would duplicate their shared wrapper.\n' +
                  'Recommendation: place each replaced part in a separate child branch of the component root.',
                node.start
              );
            }

            const enclosingEdit = rootEdits.find(
              (edit) =>
                edit.start < node.end && edit.end > node.start && (edit.start < node.start || edit.end > node.end)
            );

            if (enclosingEdit) {
              throw sourceError(
                `vjsc: <${name}> cannot preserve a source branch rewritten by another component or primitive.\n` +
                  'Reason: the enclosing rewrite already owns the part source.\n' +
                  'Recommendation: move the wrapper into a separately compiled component or avoid overlapping compound rewrites.',
                node.start
              );
            }

            claimedBranches.set(branchKey, name);

            const branchSource = createSourceText(
              code,
              rootEdits.filter((edit) => edit.end <= node.start || edit.start >= node.end)
            );

            return createTargetReplacement(branchSource, branch.start, branch.end, node.start, node.end, output);
          },
        },
        children: group!.children,
      });
    },
  });

  return Object.fromEntries([...groups].map(([name, group]) => [name, sourcePartCollection(name, group)]));
}

function findSourceBranch(root: JSXElement, node: JSXElement, bindings: CanonicalBindings) {
  let branch = root.children.find((child) => child.start <= node.start && child.end >= node.end);

  while (branch?.type === 'JSXElement') {
    const path = canonicalPath(branch.openingElement.name, bindings);
    if (!path || !isUnwrapped(path)) break;

    branch = branch.children.find((child) => child.start <= node.start && child.end >= node.end);
  }

  return branch;
}

function isUnwrapped(path: CanonicalPath): boolean {
  return isTargetUnwrap(configuredRule(path));
}

/** Whether a JSX element sits among JSX children, where sibling output needs no wrapper. */
function isJsxChild(parent: Node | null): boolean {
  return parent?.type === 'JSXElement' || parent?.type === 'JSXFragment';
}

/** Whether rendered output is one JSX node, which stays valid wherever the original element was. */
function isSingleOutput(output: TargetOutput): boolean {
  return isTargetNode(output) || Array.isArray(output);
}

/** Keep lowered output valid in expression position, such as a return value or attribute. */
function jsxOutput(content: string, single: boolean, expression: boolean): string {
  if (!expression) return content;

  if (!content.trim()) return 'null';

  return single ? content : `<>${content}</>`;
}

/** Remove an element's own tags while retaining its lowered children. */
function unwrapElement(
  node: JSXElement,
  childEdits: readonly SourceEdit[],
  expression: boolean,
  bindings: CanonicalBindings
): readonly SourceEdit[] {
  const children = significantJsxChildren(node);

  if (!node.closingElement || (expression && children.length === 0)) {
    return [{ start: node.start, end: node.end, content: expression ? 'null' : '' }];
  }

  const only = children.length === 1 ? children[0] : undefined;
  // Intrinsic and non-canonical elements lower to exactly one node; canonical ones may expand into siblings.
  const single =
    only?.type === 'JSXFragment' || (only?.type === 'JSXElement' && !canonicalPath(only.openingElement.name, bindings));
  const fragment = expression && !single;

  return [
    ...childEdits,
    { start: node.openingElement.start, end: node.openingElement.end, content: fragment ? '<>' : '' },
    { start: node.closingElement.start, end: node.closingElement.end, content: fragment ? '</>' : '' },
  ];
}

function sourcePartCollection(name: string, group: CollectedPartGroup): RuntimeSourcePart {
  const collection = {
    one() {
      if (group.values.length !== 1) {
        throw new Error(`Component rewrite expected one <${name}> part, found ${group.values.length}.`);
      }

      return group.values[0]!.value;
    },
    all() {
      return group.values.map((item) => item.value);
    },
    replaceWith(output: TargetOutput) {
      return collection.one().replaceWith(output);
    },
  } as unknown as SourcePartCollection<object> & Record<string, RuntimeSourcePart>;

  Object.defineProperties(collection, {
    props: { enumerable: true, get: () => collection.one().props },
    children: { enumerable: true, get: () => collection.one().children },
  });

  for (const [childName, child] of group.children) {
    collection[childName] = sourcePartCollection(`${name}.${childName}`, child);
  }

  return collection;
}

/**
 * An id for an element a rule generates, `vjsc-<prefix>-<name>`. Prefixes combine the module key with the lowering's
 * occurrence, so ids from different modules and occurrences never collide in one document.
 */
export function targetId(prefix: string, name: string): string {
  assertIdName(name);

  return `vjsc-${prefix}-${name}`;
}

/**
 * An id scoped to one lowered component root. A target with a scope runtime renders each root instance under its own
 * prefix, so the id is a placeholder that runtime resolves; otherwise it is final.
 */
function sourceId(scope: ComponentSourceScope, name: string): string {
  assertIdName(name);

  scope.used = true;
  return scope.target.jsx.scope ? scopedIdPlaceholder(scope.prefix, name) : targetId(scope.prefix, name);
}

function assertIdName(name: string): void {
  if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(name)) {
    throw new Error('Target identifier names must start with a letter and contain only letters, numbers, or dashes.');
  }
}

/** Rename an element's opening and closing tags, keeping its attributes and lowered children. */
function renameElement(node: JSXElement, childEdits: readonly SourceEdit[], name: string): readonly SourceEdit[] {
  const edits = [
    ...childEdits,
    { start: node.openingElement.name.start, end: node.openingElement.name.end, content: name },
  ];

  if (node.closingElement) {
    edits.push({ start: node.closingElement.name.start, end: node.closingElement.name.end, content: name });
  }

  return edits;
}

function primitiveBinding(node: JSXElement, bindings: TargetBindings): PrimitiveBinding | undefined {
  const path = jsxNamePath(node.openingElement.name);

  return path.length === 1 ? bindings.primitives.get(path[0]!) : undefined;
}

function renderSourceScope(source: string, scope: ComponentSourceScope, imports: ModuleImports): string {
  const runtime = scope.target.jsx.scope;
  if (!runtime) return source;

  const name = imports.reference(runtime);

  return `<${name} prefix=${JSON.stringify(scope.prefix)}>${source}</${name}>`;
}

function wrapSourceScope(
  code: string,
  node: JSXElement,
  edits: readonly SourceEdit[],
  scope: ComponentSourceScope,
  imports: ModuleImports
): readonly SourceEdit[] {
  if (scope.root !== node || !scope.used || !scope.target.jsx.scope) return edits;

  const source = renderSourceRange(createSourceText(code, edits), node.start, node.end).value;

  return [{ start: node.start, end: node.end, content: renderSourceScope(source, scope, imports) }];
}

function collectJsxEdits(
  ast: Program,
  descendants: Map<JSXElement, readonly SourceEdit[]>,
  transform: (node: JSXElement, descendants: readonly SourceEdit[], parent: Node | null) => readonly SourceEdit[]
): SourceEdit[] {
  const pending = new Map<JSXElement, SourceEdit[]>();
  const roots: SourceEdit[] = [];
  const stack: JSXElement[] = [];

  walk(ast, {
    enter(node) {
      if (node.type !== 'JSXElement') return;

      stack.push(node);
      pending.set(node, []);
    },
    leave(node, parent) {
      if (node.type !== 'JSXElement') return;

      if (stack.pop() !== node) throw new Error('vjsc: JSX traversal stack became unbalanced.');

      const childEdits = pending.get(node) ?? [];

      descendants.set(node, childEdits);
      const edits = transform(node, childEdits, parent);
      const owner = stack.at(-1);

      if (owner) pending.get(owner)!.push(...edits);
      else roots.push(...edits);
    },
  });

  return roots.sort((left, right) => left.start - right.start);
}
