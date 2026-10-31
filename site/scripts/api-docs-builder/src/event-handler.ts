import type { ArrayExpression, Node } from 'oxc-parser';

import type { OxcProject, SourceFile } from './oxc-project.js';
import { parseJSDoc, sourceText, staticName, unwrapExpression, walkAst } from './oxc-project.js';

/** Collect event descriptions declared with `@fires event-name - Description`. */
export function collectFires(files: readonly string[], project: OxcProject): Map<string, string> {
  const fires = new Map<string, string>();

  for (const filePath of files) {
    const file = project.source(filePath);
    if (!file) continue;

    for (const comment of file.comments) {
      if (comment.type !== 'Block' || !comment.value.startsWith('*')) continue;

      for (const value of parseJSDoc(comment.value).tags.get('fires') ?? []) {
        const match = value.match(/^(\S+)\s*(?:-\s*)?(.*)$/s);

        if (match?.[1] && !fires.has(match[1])) fires.set(match[1], match[2]?.trim() ?? '');
      }
    }
  }

  return fires;
}

/** Collect literal event names dispatched by the given source files. */
export function collectDispatchedEvents(files: readonly string[], project: OxcProject): Set<string> {
  const events = new Set<string>();

  for (const filePath of files) {
    const file = project.source(filePath);
    if (!file) continue;

    const helpers = collectDispatchHelpers(file);
    const arrays = collectConstArrays(file);
    const dispatches = (callee: string) => callee === 'emit' || helpers.has(callee);

    walkAst(file.program, (node) => {
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && dispatches(node.callee.name)) {
        const argument = node.arguments[0];
        const eventName = argument?.type === 'Literal' ? staticName(argument) : undefined;

        if (eventName) events.add(eventName);
      }

      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        !node.callee.computed &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'dispatchEvent'
      ) {
        const event = node.arguments[0];

        if (
          event?.type !== 'NewExpression' ||
          event.callee.type !== 'Identifier' ||
          !['Event', 'CustomEvent'].includes(event.callee.name)
        ) {
          return;
        }

        const argument = event.arguments[0];
        const eventName = argument?.type === 'Literal' ? staticName(argument) : undefined;

        if (eventName) events.add(eventName);
      }

      if (node.type === 'ForOfStatement') {
        const array =
          node.right.type === 'ArrayExpression'
            ? node.right
            : node.right.type === 'Identifier'
              ? arrays.get(node.right.name)
              : undefined;
        const variable =
          node.left.type === 'VariableDeclaration'
            ? staticName(node.left.declarations[0]?.id)
            : node.left.type === 'Identifier'
              ? node.left.name
              : undefined;
        if (!array || !variable) return;

        if (
          !sourceText(file, node.body).includes(`Event(${variable})`) &&
          !callsWith(node.body, variable, dispatches)
        ) {
          return;
        }

        for (const element of array.elements) {
          const eventName = element?.type === 'Literal' ? staticName(element) : undefined;

          if (eventName) events.add(eventName);
        }
      }
    });
  }

  return events;
}

/** Local helpers that dispatch the event their first parameter names, such as `const on = (type) => … new Event(type)`. */
function collectDispatchHelpers(file: SourceFile): Set<string> {
  const helpers = new Set<string>();

  walkAst(file.program, (node) => {
    if (node.type !== 'VariableDeclarator') return;

    if (node.init?.type !== 'ArrowFunctionExpression' && node.init?.type !== 'FunctionExpression') return;

    const name = staticName(node.id);
    const parameter = node.init.params[0];
    const parameterName = parameter?.type === 'Identifier' ? parameter.name : undefined;

    if (
      name &&
      parameterName &&
      node.init.body &&
      sourceText(file, node.init.body).includes(`Event(${parameterName})`)
    ) {
      helpers.add(name);
    }
  });

  return helpers;
}

/** Top-level `const` arrays, so a loop over a named list such as `for (const type of EVENTS) on(type)` resolves. */
function collectConstArrays(file: SourceFile): Map<string, ArrayExpression> {
  const arrays = new Map<string, ArrayExpression>();

  for (const statement of file.program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'VariableDeclaration' || declaration.kind !== 'const') continue;

    for (const declarator of declaration.declarations) {
      const name = staticName(declarator.id);
      const init = declarator.init ? unwrapExpression(declarator.init) : undefined;

      if (name && init?.type === 'ArrayExpression') arrays.set(name, init);
    }
  }

  return arrays;
}

/** Whether `root` calls a dispatching function with `variable` as its first argument. */
function callsWith(root: Node, variable: string, dispatches: (callee: string) => boolean): boolean {
  let found = false;

  walkAst(root, (node) => {
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      dispatches(node.callee.name) &&
      node.arguments[0]?.type === 'Identifier' &&
      node.arguments[0].name === variable
    ) {
      found = true;
    }
  });

  return found;
}
