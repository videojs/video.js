import { globSync, readFileSync } from 'node:fs';

import type { CallExpression, ExportDefaultDeclaration, ObjectProperty } from '@oxc-project/types';
import { isObject, isString } from '@videojs/utils/predicate';
import { parseSync } from 'oxc-parser';

import { parseError } from '../../ast/errors';
import { staticPropertyName } from '../../ast/traverse';
import { toArray } from '../../utils/array';
import { absolutePath, fileStem } from '../../utils/path';
import type { ComponentDefinition, ComponentPartDefinition, ComponentParts } from '../definition';

export interface ComponentFileSet {
  readonly include: string;
  readonly exclude?: string | readonly string[] | undefined;
  readonly name: (filename: string) => string;
}

export type ComponentInput = string | ComponentFileSet;

export interface DiscoverSchemaOptions {
  readonly cwd: string;
  readonly include: readonly ComponentInput[];
  readonly exclude?: string | readonly string[] | undefined;
}

export interface DefinedSchemaComponent {
  readonly kind: 'definition';
  readonly fileName: string;
  readonly name: string;
  readonly definition: ComponentDefinition<object, ComponentParts | undefined>;
}

export interface FileSchemaComponent {
  readonly kind: 'file';
  readonly fileName: string;
  readonly name: string;
  readonly definition: ComponentDefinition<object, undefined>;
}

export type SchemaComponent = DefinedSchemaComponent | FileSchemaComponent;

export interface DiscoveredSchema {
  readonly components: readonly SchemaComponent[];
  readonly watchFiles: readonly string[];
}

/** Discover component definitions and their watched source files. */
export function discoverSchema(options: DiscoverSchemaOptions): DiscoveredSchema {
  const components = options.include.flatMap<SchemaComponent>((source) =>
    isString(source) ? discoverDefinitions(source, options.exclude, options.cwd) : discoverFiles(source, options.cwd)
  );

  return {
    components,
    watchFiles: [...new Set(components.map((component) => component.fileName))].sort(),
  };
}

function discoverDefinitions(
  pattern: string,
  exclude: string | readonly string[] | undefined,
  cwd: string
): DefinedSchemaComponent[] {
  return globSync(pattern, { cwd, ...(exclude ? { exclude: toArray(exclude) } : {}) }).map((path) => {
    const fileName = absolutePath(cwd, path);

    return { kind: 'definition', fileName, ...parseComponentDefinitionFile(fileName) };
  });
}

function discoverFiles(source: ComponentFileSet, cwd: string): FileSchemaComponent[] {
  return globSync(source.include, {
    cwd,
    ...(source.exclude ? { exclude: toArray(source.exclude) } : {}),
  }).map((path) => {
    const fileName = absolutePath(cwd, path);
    const name = source.name(fileStem(path));

    return { kind: 'file', fileName, name, definition: { name } };
  });
}

function parseComponentDefinitionFile(fileName: string): Pick<DefinedSchemaComponent, 'definition' | 'name'> {
  const source = readFileSync(fileName, 'utf8');
  const parsed = parseSync(fileName, source);

  if (parsed.errors.length > 0)
    throw parseError('Cannot read a component definition.', fileName, source, parsed.errors);

  const exported = parsed.program.body.find(
    (statement): statement is ExportDefaultDeclaration =>
      statement.type === 'ExportDefaultDeclaration' && isDefineComponentCall(statement.declaration)
  );
  if (!exported) throw new Error(`No \`export default defineComponent(...)\` found in ${fileName}`);

  const definition = parseComponentDefinition(exported.declaration as CallExpression, fileName);
  if (!definition.name) throw new Error(`defineComponent() in ${fileName} is missing a literal \`name:\` field`);

  return {
    name: definition.name,
    definition: definition as ComponentDefinition<object, ComponentParts | undefined>,
  };
}

function isDefineComponentCall(node: unknown): node is CallExpression {
  if (!isObject(node)) return false;

  const candidate = node as { readonly type?: unknown; readonly callee?: unknown };
  if (candidate.type !== 'CallExpression' || !isObject(candidate.callee)) return false;

  const callee = candidate.callee as { readonly type?: unknown; readonly name?: unknown };

  return callee.type === 'Identifier' && callee.name === 'defineComponent';
}

function parseComponentDefinition(call: CallExpression, fileName: string): ParsedComponentDefinition {
  const argument = call.arguments[0];
  if (!argument) return {};

  if (argument.type !== 'ObjectExpression') {
    throw new Error(`defineComponent() in ${fileName} must take an object literal`);
  }

  const definition: {
    name?: string;
    root?: string;
    parts?: ComponentParts;
  } = {};

  for (const property of argument.properties) {
    if (property.type !== 'Property' || property.kind !== 'init' || property.method) continue;

    const name = requireStaticName(property);

    if (name === 'name' || name === 'root') {
      if (property.value.type !== 'Literal' || !isString(property.value.value)) {
        throw new Error(`defineComponent() in ${fileName} requires a literal \`${name}:\` field`);
      }

      definition[name] = property.value.value;
      continue;
    }

    if (name !== 'parts') continue;

    if (property.value.type !== 'ObjectExpression') {
      throw new Error(`defineComponent() in ${fileName} requires an object literal \`parts:\` field`);
    }

    definition.parts = Object.fromEntries(
      property.value.properties.map((part) => {
        if (part.type !== 'Property' || part.kind !== 'init' || part.method || !isDefineComponentCall(part.value)) {
          throw new Error(`defineComponent() in ${fileName} requires literal component parts`);
        }

        return [requireStaticName(part), parseComponentDefinition(part.value, fileName)];
      })
    );
  }

  return definition as ParsedComponentDefinition;
}

type ParsedComponentDefinition = ComponentPartDefinition<object, ComponentParts | undefined> & {
  readonly name?: string | undefined;
};

function requireStaticName(property: ObjectProperty): string {
  const name = staticPropertyName(property);
  if (name === undefined) throw new Error('Component definition property names must be static.');

  return name;
}
