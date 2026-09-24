import type {
  Expression,
  ObjectExpression,
  Program,
  VariableDeclaration,
  VariableDeclarator,
} from '@oxc-project/types';
import { isBoolean, isNumber, isPlainObject, isString } from '@videojs/utils/predicate';
import type { Plugin, RolldownMagicString } from 'rolldown';

import { staticPropertyName } from '../ast/traverse';
import type { ComponentMeta } from '../components/meta';
import { mergeModuleBuildMeta } from '../graph/build-meta';
import { parseModuleId, SCRIPT_MODULE_ID, type TransformModule } from '../utils/module-id';

interface ExportedMeta {
  readonly declaration: VariableDeclaration;
  readonly declarator: VariableDeclarator;
  readonly statement: Program['body'][number];
}

export interface ComponentMetaPluginOptions {
  /** Metadata export to extract. Defaults to `meta`. */
  readonly exportName?: string | undefined;
  /**
   * Fields every module's metadata starts from, typically derived from its path. The authored export overrides them; a
   * module without an export still receives metadata when its defaults name it.
   */
  readonly defaults?: ((module: TransformModule) => Readonly<Record<string, unknown>>) | undefined;
  /** Check merged metadata, throwing when it is incomplete, and return the project's metadata shape. */
  readonly validate?: ((meta: Readonly<Record<string, unknown>>, module: TransformModule) => ComponentMeta) | undefined;
}

/**
 * Extract static component metadata and remove its export from runtime code. Use before source capture when registry
 * tooling needs a component's `meta` export.
 *
 * @example
 *   ```diff
 *   - export const meta = { name: 'play-button' };
 *   export function PlayButton() {}
 *   ```;
 */
export function componentMetaPlugin(options: string | ComponentMetaPluginOptions = {}): Plugin {
  const { exportName = 'meta', defaults, validate } = isString(options) ? { exportName: options } : options;

  return {
    name: 'vjsc:component-meta',
    transform: {
      // Without defaults, only a module that mentions the export can carry metadata.
      filter: defaults ? { id: SCRIPT_MODULE_ID } : { id: SCRIPT_MODULE_ID, code: exportName },
      handler(code, id, transform) {
        const module = parseModuleId(id);
        // Path defaults apply to every module, but only a module that mentions the export needs parsing. An identifier
        // can spell the name with Unicode escapes, so such modules are parsed too.
        const mentioned = code.includes(exportName) || code.includes('\\u');
        const exported = mentioned ? findExportedMeta(transform.ast, exportName) : undefined;
        const initial = defaults?.(module) ?? {};

        if (!exported?.declarator.init) {
          if (!isString(initial.name) || initial.name.length === 0) return null;

          const moduleMeta = validate ? validate(initial, module) : (initial as ComponentMeta);

          return { meta: mergeModuleBuildMeta(this.getModuleInfo(id)?.meta, { moduleMeta }) };
        }

        const merged = parseComponentMeta(exported.declarator.init, id, exportName, initial);
        const moduleMeta = validate ? validate(merged, module) : merged;
        const magicString = transform.magicString;
        if (!magicString) throw new Error('vjsc: Rolldown did not provide MagicString to the component metadata pass.');

        removeDeclarator(magicString, exported);

        return {
          code: magicString,
          meta: mergeModuleBuildMeta(this.getModuleInfo(id)?.meta, { moduleMeta }),
        };
      },
    },
  };
}

function findExportedMeta(ast: Program | undefined, exportName: string): ExportedMeta | undefined {
  if (!ast) return undefined;

  for (const statement of ast.body) {
    if (statement.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'VariableDeclaration') {
      continue;
    }

    const declarator = statement.declaration.declarations.find(
      (candidate) => candidate.id.type === 'Identifier' && candidate.id.name === exportName
    );
    if (declarator) return { declaration: statement.declaration, declarator, statement };
  }

  return undefined;
}

function removeDeclarator(magicString: RolldownMagicString, exported: ExportedMeta): void {
  const declarations = exported.declaration.declarations;
  const index = declarations.indexOf(exported.declarator);

  if (declarations.length === 1) {
    magicString.remove(exported.statement.start, exported.statement.end);
  } else if (index < declarations.length - 1) {
    magicString.remove(exported.declarator.start, declarations[index + 1]!.start);
  } else {
    magicString.remove(declarations[index - 1]!.end, exported.declarator.end);
  }
}

function parseComponentMeta(
  expression: Expression,
  id: string,
  exportName: string,
  defaults: Readonly<Record<string, unknown>> = {}
): ComponentMeta {
  const authored = staticValue(expression, id);
  if (!isPlainObject(authored)) throw nonStaticMeta(id);

  const value = { ...defaults, ...authored };

  if (!isString(value.name) || value.name.length === 0) {
    throw new Error(`Component metadata \`${exportName}\` in ${id} must contain a non-empty literal \`name\`.`);
  }

  return value as ComponentMeta;
}

function staticValue(expression: Expression, id: string): unknown {
  const value = unwrapExpression(expression);

  if (value.type === 'Literal') {
    if (isString(value.value) || isNumber(value.value) || isBoolean(value.value) || value.value === null) {
      return value.value;
    }

    throw nonStaticMeta(id);
  }

  if (value.type === 'UnaryExpression' && value.operator === '-') {
    const operand = staticValue(value.argument, id);
    if (isNumber(operand)) return -operand;
  }

  if (value.type === 'TemplateLiteral' && value.expressions.length === 0) {
    return value.quasis[0]?.value.cooked ?? value.quasis[0]?.value.raw ?? '';
  }

  if (value.type === 'ArrayExpression') {
    return value.elements.map((element) => {
      if (!element || element.type === 'SpreadElement') throw nonStaticMeta(id);

      return staticValue(element, id);
    });
  }

  if (value.type === 'ObjectExpression') return staticObject(value, id);

  throw nonStaticMeta(id);
}

function staticObject(expression: ObjectExpression, id: string): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    expression.properties.map((property) => {
      if (property.type !== 'Property' || property.kind !== 'init' || property.method) {
        throw nonStaticMeta(id);
      }

      const name = staticPropertyName(property);
      if (name === undefined) throw nonStaticMeta(id);

      return [name, staticValue(property.value, id)];
    })
  );
}

function unwrapExpression(expression: Expression): Expression {
  if (
    expression.type === 'ParenthesizedExpression' ||
    expression.type === 'TSAsExpression' ||
    expression.type === 'TSSatisfiesExpression' ||
    expression.type === 'TSTypeAssertion'
  ) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function nonStaticMeta(id: string): Error {
  return new Error(`Component metadata in ${id} must contain only static literal values.`);
}
