import { readFileSync } from 'node:fs';

import type { Expression, ObjectExpression, Program } from '@oxc-project/types';
import { parseSync } from 'oxc-parser';
import { walk } from 'oxc-walker';

import { staticPropertyName } from '../ast/traverse';
import type { ResolvedStyleRule } from './resolved';

/**
 * Where a style rule is authored, as `path:line:column`, or the module path when its source cannot be traced. Style
 * modules are evaluated rather than parsed, so this reads the source again, which is fine for the rare diagnostic.
 */
export function styleRuleLocation(rule: Pick<ResolvedStyleRule, 'modulePath' | 'tokenPath'>): string {
  let source: string;

  try {
    source = readFileSync(rule.modulePath, 'utf8');
  } catch {
    return rule.modulePath;
  }

  const parsed = parseSync(rule.modulePath, source);
  const offset = parsed.errors.length === 0 ? ruleOffset(parsed.program, rule.tokenPath) : undefined;
  if (offset === undefined) return rule.modulePath;

  const lines = source.slice(0, offset).split('\n');

  return `${rule.modulePath}:${lines.length}:${lines.at(-1)!.length + 1}`;
}

function ruleOffset(program: Program, tokenPath: readonly string[]): number | undefined {
  let rules: ObjectExpression | undefined;

  walk(program, {
    enter(node) {
      if (rules || node.type !== 'CallExpression') return;

      const [definition] = node.arguments;
      const value = definition?.type === 'ObjectExpression' ? propertyValue(definition, 'rules') : undefined;

      rules = value && objectValue(program, value);
    },
  });

  let tree = rules;
  let offset: number | undefined;

  for (const token of tokenPath) {
    const property = tree?.properties.find(
      (candidate) => candidate.type === 'Property' && staticPropertyName(candidate) === token
    );
    if (property?.type !== 'Property') return undefined;

    offset = property.key.start;
    tree = objectValue(program, property.value);
  }

  return offset;
}

function propertyValue(object: ObjectExpression, name: string): Expression | undefined {
  for (const property of object.properties) {
    if (property.type === 'Property' && staticPropertyName(property) === name) return property.value;
  }

  return undefined;
}

/** An object literal, or the literal a top-level `const` binds to it. */
function objectValue(program: Program, expression: Expression): ObjectExpression | undefined {
  if (expression.type === 'ObjectExpression') return expression;

  if (expression.type !== 'Identifier') return undefined;

  for (const statement of program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'VariableDeclaration') continue;

    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== 'Identifier' || declarator.id.name !== expression.name) continue;

      return declarator.init?.type === 'ObjectExpression' ? declarator.init : undefined;
    }
  }

  return undefined;
}
