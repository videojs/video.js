import type { ArrayExpression, JSXElementName } from '@oxc-project/types';
import { walk } from 'oxc-walker';

import { type SourceEdit, sourceError } from '../ast';
import type { TargetBindings } from '../target/bindings';
import type { JsxClassNameOptions } from '../target/definition';
import type { TargetModule } from '../target/module';

/**
 * Lower `className={[...]}` arrays through the class-name runtime of the target that asks for it. An array that
 * forwards `className` to an element accepting a state callback becomes that callback, so the element can resolve the
 * forwarded value against its state. Returns the edits rather than applying them, so templates can render them.
 */
export function lowerClassNames(module: TargetModule): readonly SourceEdit[] {
  const targets = module.targets.filter((target) => target.jsx.className);
  if (targets.length === 0 || !module.code.includes('className')) return [];

  if (targets.length > 1) throw new Error('Only one component target per module may lower `className` arrays.');

  const className = targets[0]!.jsx.className!;
  const { code, bindings, imports } = module;
  const edits: SourceEdit[] = [];

  walk(module.ast, {
    enter(node, parent) {
      if (
        node.type !== 'JSXAttribute' ||
        node.name.type !== 'JSXIdentifier' ||
        node.name.name !== 'className' ||
        node.value?.type !== 'JSXExpressionContainer' ||
        node.value.expression.type !== 'ArrayExpression' ||
        parent?.type !== 'JSXOpeningElement'
      ) {
        return;
      }

      const array = node.value.expression;
      const values = array.elements.filter((value) => value !== null);
      const forwarded = values.find((value) => value.type === 'Identifier' && value.name === 'className');
      const callback = Boolean(forwarded && acceptsClassNameCallback(parent.name, bindings, className));
      const cn = imports.reference(className.merge);
      const args = values.filter((value) => value !== forwarded).map((value) => code.slice(value.start, value.end));
      let replacement: string;

      if (callback) {
        if (!className.resolve) {
          throw sourceError(
            'The component target marks an element as state-aware but has no `className.resolve`.',
            node.start
          );
        }

        // The callback's parameter must not shadow a binding the class list itself reads.
        const state = referencesName(array, 'state') ? freshName('state', module.names) : 'state';

        args.push(`${imports.reference(className.resolve)}(className, ${state})`);
        replacement = `{${state} => ${cn}(${args.join(', ')})}`;
      } else {
        if (forwarded) args.push('className');

        replacement = `{${cn}(${args.join(', ')})}`;
      }

      edits.push({ start: node.value.start, end: node.value.end, content: replacement });
    },
  });

  return edits;
}

function acceptsClassNameCallback(
  name: JSXElementName,
  bindings: TargetBindings,
  className: JsxClassNameOptions
): boolean {
  const root = jsxNameRoot(name);
  const binding = root ? bindings.imports.get(root) : undefined;

  return Boolean(binding && !binding.type && className.stateAware?.(binding));
}

function jsxNameRoot(name: JSXElementName): string | undefined {
  if (name.type === 'JSXIdentifier') return name.name;

  if (name.type === 'JSXNamespacedName') return undefined;

  return jsxNameRoot(name.object);
}

function referencesName(array: ArrayExpression, name: string): boolean {
  let found = false;

  walk(array, {
    enter(node) {
      if (node.type === 'Identifier' && node.name === name) found = true;
    },
  });

  return found;
}

function freshName(base: string, names: Set<string>): string {
  let suffix = 2;

  while (names.has(`${base}${suffix}`)) suffix += 1;

  names.add(`${base}${suffix}`);
  return `${base}${suffix}`;
}
