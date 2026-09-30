import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  BindingPattern,
  CallExpression,
  Class,
  ArrowFunctionExpression,
  Function as OxcFunction,
  MethodDefinition,
  ParamPattern,
  TSFunctionType,
  TSType,
  TSTypeParameterDeclaration,
} from 'oxc-parser';

import type {
  ParamDef,
  ReturnValue,
  UtilOverload,
  UtilReference,
  UtilTypeParameter,
} from '../../../src/types/util-reference.js';
import { utilReferenceSlug } from '../../../src/utils/utilReferenceSlug.js';
import { abbreviateType, formatDetailedType, formatType } from './formatter.js';
import type { NamedDeclaration, ResolvedType, SourceFile } from './oxc-project.js';
import {
  getJSDoc,
  isOptionalParameter,
  OxcProject,
  parameterPattern,
  parameterTypeAnnotation,
  sourceText,
  staticName,
  unwrapExpression,
} from './oxc-project.js';
import { log } from './utils.js';

export interface UtilEntry {
  slug: string;
  data: UtilReference;
  framework: 'react' | 'html' | null;
}

interface EntryPoint {
  index: string;
  framework: UtilEntry['framework'];
}

const UTIL_ENTRY_POINTS: EntryPoint[] = [
  { index: 'packages/react/src/index.ts', framework: 'react' },
  { index: 'packages/react/src/i18n/index.ts', framework: 'react' },
  { index: 'packages/store/src/react/hooks/index.ts', framework: 'react' },
  { index: 'packages/html/src/index.ts', framework: 'html' },
  { index: 'packages/store/src/html/controllers/index.ts', framework: 'html' },
  { index: 'packages/core/src/core/i18n/index.ts', framework: null },
  { index: 'packages/core/src/dom/store/selectors.ts', framework: null },
  { index: 'packages/core/src/dom/store/features/orientation-lock.ts', framework: null },
  { index: 'packages/media/src/core/source/adapter-type.ts', framework: null },
  { index: 'packages/store/src/core/selector.ts', framework: null },
];

/** Discover and extract the public utility API using Oxc syntax trees. */
export function getUtilEntries(monorepoRoot: string): UtilEntry[] {
  const project = new OxcProject(monorepoRoot);
  const entries: UtilEntry[] = [];
  const seenKeys = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const entryPoint of UTIL_ENTRY_POINTS) {
    const indexPath = path.join(monorepoRoot, entryPoint.index);

    if (!fs.existsSync(indexPath)) {
      log.warn(`Entry point not found: ${indexPath}`);
      continue;
    }

    for (const name of collectVisibleExportNames(indexPath, project)) {
      const resolved = project.resolveExport(indexPath, name);
      if (!resolved) continue;

      const ownerRoot = path.join(monorepoRoot, ...entryPoint.index.split('/').slice(0, 2));
      if (entryPoint.framework && !resolved.file.filePath.startsWith(`${ownerRoot}${path.sep}`)) continue;

      const key = `${entryPoint.framework}:${name}`;
      if (seenKeys.has(key) || !isUtil(name, resolved.file, resolved.declaration)) continue;

      const displayName = name.startsWith('create') && name.includes('Mixin') ? name.slice('create'.length) : name;
      const slug = resolveSlugCollision(utilReferenceSlug(displayName), entryPoint.framework, seenSlugs);
      const overloads = extractOverloads(project, resolved.file, resolved.declaration, name);

      if (overloads.length === 0) {
        log.warn(`No overloads extracted for ${name}, skipping`);
        continue;
      }

      const documentation = getJSDoc(resolved.file, resolved.declaration);
      const description = documentation?.description || documentation?.tags.get('public')?.at(-1) || undefined;
      const data: UtilReference = { name: displayName, overloads };

      if (description) data.description = description;

      entries.push({ slug, data, framework: entryPoint.framework });
      seenKeys.add(key);
    }
  }

  return entries;
}

function collectVisibleExportNames(filePath: string, project: OxcProject, visited = new Set<string>()): Set<string> {
  const names = new Set<string>();
  const absolute = path.resolve(filePath);
  if (visited.has(absolute)) return names;

  visited.add(absolute);

  const file = project.source(absolute);
  if (!file) return names;

  for (const statement of file.program.body) {
    if (statement.type === 'ExportAllDeclaration') {
      if (statement.exported) continue;

      if (!statement.source.value.startsWith('.')) continue;

      const target = project.resolveModule(file.filePath, statement.source.value);

      if (target) {
        for (const name of collectVisibleExportNames(target, project, visited)) names.add(name);
      }

      continue;
    }

    if (statement.type !== 'ExportNamedDeclaration') continue;

    if (statement.declaration) {
      for (const name of declarationNames(statement.declaration)) names.add(name);
    }

    if (statement.source && !statement.source.value.startsWith('.')) continue;

    if (statement.source && !project.resolveModule(file.filePath, statement.source.value)) continue;

    for (const specifier of statement.specifiers) {
      if (specifier.exportKind !== 'type') names.add(moduleName(specifier.exported));
    }
  }

  return names;
}

function isUtil(name: string, file: SourceFile, declaration: NamedDeclaration): boolean {
  const functionLike =
    isFunctionDeclaration(declaration) ||
    variableFunction(declaration) !== undefined ||
    (name.startsWith('select') && variableCall(declaration) !== undefined);
  if (name.startsWith('select') && isUpper(name[6]) && functionLike) return true;

  if (name.startsWith('use') && isUpper(name[3]) && functionLike) return true;

  if (name.endsWith('Controller') && declaration.type === 'ClassDeclaration') return true;

  if (name.startsWith('create') && functionLike) return true;

  return getJSDoc(file, declaration)?.tags.has('public') ?? false;
}

function extractOverloads(
  project: OxcProject,
  file: SourceFile,
  declaration: NamedDeclaration,
  exportedName: string
): UtilOverload[] {
  if (declaration.type === 'ClassDeclaration') return extractController(project, file, declaration);

  const fn = isFunctionDeclaration(declaration) ? declaration : variableFunction(declaration);

  if (fn) {
    const declaredName = declarationName(declaration) ?? exportedName;
    const declarations = project
      .declarations(file.filePath, declaredName)
      .map((entry) => entry.declaration)
      .filter(isFunctionDeclaration);
    const signatures = declarations.filter((entry) => !entry.body);

    return (signatures.length > 0 ? signatures : declarations.length > 0 ? declarations : [fn]).map((signature) =>
      buildFunctionOverload(project, file, signature)
    );
  }

  if (exportedName.startsWith('select') && variableCall(declaration)) {
    return [
      {
        parameters: { state: { type: 'object', required: true } },
        returnValue: { type: 'object | undefined' },
      },
    ];
  }

  const memberFunction = memberFunctionType(project, file, declaration);

  if (memberFunction) {
    return [buildFunctionOverload(project, memberFunction.file, memberFunction.type, getJSDoc(file, declaration))];
  }

  return [{ parameters: {}, returnValue: inferContextReturn(project, file, declaration) }];
}

/**
 * The function type behind an export such as `export const I18nProvider = defaultI18n.I18nProvider`, where
 * `defaultI18n` holds the result of a factory call whose declared return type lists the member.
 */
function memberFunctionType(
  project: OxcProject,
  file: SourceFile,
  declaration: NamedDeclaration
): { file: SourceFile; type: TSFunctionType } | undefined {
  if (declaration.type !== 'VariableDeclarator' || !declaration.init) return undefined;

  const initializer = unwrapExpression(declaration.init);
  if (initializer.type !== 'MemberExpression' || initializer.computed) return undefined;

  const { object, property } = initializer;
  if (object.type !== 'Identifier' || property.type !== 'Identifier') return undefined;

  const owner = project.resolveName(file.filePath, object.name);
  if (owner?.declaration.type !== 'VariableDeclarator' || !owner.declaration.init) return undefined;

  const call = unwrapExpression(owner.declaration.init);
  if (call.type !== 'CallExpression' || call.callee.type !== 'Identifier') return undefined;

  const factory = project.resolveName(owner.file.filePath, call.callee.name);
  const fn =
    factory &&
    (isFunctionDeclaration(factory.declaration) ? factory.declaration : variableFunction(factory.declaration));
  const returnType = fn?.returnType?.typeAnnotation;
  if (!factory || !returnType) return undefined;

  const resolved = project
    .interfaceMembers({ file: factory.file, type: returnType })
    .find(({ member }) => member.type === 'TSPropertySignature' && staticName(member.key) === property.name);
  const annotation =
    resolved?.member.type === 'TSPropertySignature' ? resolved.member.typeAnnotation?.typeAnnotation : undefined;

  return resolved && annotation?.type === 'TSFunctionType' ? { file: resolved.file, type: annotation } : undefined;
}

function buildFunctionOverload(
  project: OxcProject,
  file: SourceFile,
  fn: OxcFunction | ArrowFunctionExpression | TSFunctionType,
  documentation = getJSDoc(file, fn)
): UtilOverload {
  const parameters: Record<string, ParamDef> = {};

  for (const parameter of fn.params) {
    const definition = buildParameter(project, file, parameter, documentation?.params);

    if (definition) parameters[definition.name] = definition.value;
  }

  const returnType = fn.returnType?.typeAnnotation;
  const overload: UtilOverload = {
    typeParameters: buildTypeParameters(project, file, fn.typeParameters),
    returnType: returnType ? formatType({ file, type: returnType }, false, project) : 'unknown',
    parameters,
    returnValue: returnType ? buildReturnValue(project, { file, type: returnType }) : { type: 'unknown' },
  };
  const label = documentation?.tags.get('label')?.at(-1);

  if (label) overload.label = label;

  if (documentation?.description) overload.description = documentation.description;

  return overload;
}

function buildTypeParameters(
  project: OxcProject,
  file: SourceFile,
  declaration: TSTypeParameterDeclaration | null | undefined
): UtilTypeParameter[] {
  return (
    declaration?.params.map((parameter) => {
      const typeParameter: UtilTypeParameter = { name: parameter.name.name };

      if (parameter.constraint)
        typeParameter.constraint = formatType({ file, type: parameter.constraint }, false, project);

      if (parameter.default) typeParameter.default = formatType({ file, type: parameter.default }, false, project);

      if (parameter.const) typeParameter.const = true;

      return typeParameter;
    }) ?? []
  );
}

function buildParameter(
  project: OxcProject,
  file: SourceFile,
  parameter: ParamPattern,
  descriptions?: ReadonlyMap<string, string>
): { name: string; value: ParamDef } | undefined {
  const pattern = parameterPattern(parameter);
  const name = bindingName(pattern);
  if (!name) return undefined;

  const annotation = parameterTypeAnnotation(parameter);
  const optional = isOptionalParameter(parameter);
  const type = annotation ? formatDetailedType(project, { file, type: annotation }, optional) : 'unknown';
  const abbreviated = abbreviateType(name, type);
  const value: ParamDef = { type: abbreviated ?? type };

  if (abbreviated && abbreviated !== type) value.detailedType = type;

  if (pattern.type === 'AssignmentPattern') value.default = sourceText(file, pattern.right).replace(/\s+/g, ' ').trim();

  if (parameter.type === 'RestElement') value.rest = true;

  if (!optional) value.required = true;

  const description = descriptions?.get(name)?.replace(/^-\s*/, '');

  if (description) value.description = description;

  return { name, value };
}

function buildReturnValue(project: OxcProject, type: ResolvedType): ReturnValue {
  const formatted = formatDetailedType(project, type, false);
  const abbreviated = abbreviateType('return', formatted);
  const value: ReturnValue = { type: abbreviated ?? formatted };

  if (abbreviated && abbreviated !== formatted) value.detailedType = formatted;

  // A callable type such as `Selector` (a function carrying a `displayName`) is its signature, not a bag of properties.
  const callable = project
    .interfaceMembers(type)
    .some(
      ({ member }) => member.type === 'TSCallSignatureDeclaration' || member.type === 'TSConstructSignatureDeclaration'
    );
  if (callable) return value;

  const fields = buildTypeFields(project, type);

  if (Object.keys(fields).length > 0) value.fields = fields;

  return value;
}

function buildTypeFields(project: OxcProject, type: ResolvedType): NonNullable<ReturnValue['fields']> {
  const fields: NonNullable<ReturnValue['fields']> = {};

  for (const resolved of project.interfaceMembers(type)) {
    const member = resolved.member;
    const name = 'key' in member ? staticName(member.key) : undefined;
    if (!name) continue;

    let memberType: TSType | undefined;

    if (member.type === 'TSPropertySignature') memberType = member.typeAnnotation?.typeAnnotation;

    if (member.type === 'TSMethodSignature' && member.returnType) {
      memberType = {
        type: 'TSFunctionType',
        typeParameters: member.typeParameters,
        params: member.params,
        returnType: member.returnType,
        start: member.start,
        end: member.end,
      };
    }

    if (!memberType) continue;

    const detailed = formatDetailedType(
      project,
      {
        file: resolved.file,
        type: memberType,
        ...(resolved.substitutions ? { substitutions: resolved.substitutions } : {}),
      },
      false
    );
    const formatted = 'optional' in member && member.optional ? withUndefined(detailed) : detailed;
    const abbreviated = abbreviateType(name, formatted);
    const field: NonNullable<ReturnValue['fields']>[string] = { type: abbreviated ?? formatted };

    if (abbreviated && abbreviated !== formatted) field.detailedType = formatted;

    const description = getJSDoc(resolved.file, member)?.description;

    if (description) field.description = description;

    fields[name] = field;
  }

  return fields;
}

function extractController(project: OxcProject, file: SourceFile, declaration: Class): UtilOverload[] {
  const constructors = declaration.body.body.filter(
    (member): member is MethodDefinition => member.type === 'MethodDefinition' && member.kind === 'constructor'
  );
  const signatures = constructors.filter((member) => !member.value.body);
  const selected = signatures.length > 0 ? signatures : constructors.slice(0, 1);
  const returnValue = buildControllerReturn(project, file, declaration);
  const typeParameters = buildTypeParameters(project, file, declaration.typeParameters);

  if (selected.length === 0) return [{ construct: true, typeParameters, parameters: {}, returnValue }];

  return selected.map((constructor) => {
    const documentation = getJSDoc(file, constructor);
    const parameters: Record<string, ParamDef> = {};

    for (const parameter of constructor.value.params) {
      const definition = buildParameter(project, file, parameter, documentation?.params);

      if (definition) parameters[definition.name] = definition.value;
    }

    const overload: UtilOverload = { construct: true, typeParameters, parameters, returnValue };
    const label = documentation?.tags.get('label')?.at(-1);

    if (label) overload.label = label;

    if (documentation?.description) overload.description = documentation.description;

    return overload;
  });
}

const REACTIVE_CONTROLLER_CALLBACKS = new Set(['hostConnected', 'hostDisconnected', 'hostUpdate', 'hostUpdated']);

/** An optional field may be absent, which a reader of the value sees as `undefined`. */
function withUndefined(type: string): string {
  return /(?:^|\| )undefined$/.test(type) ? type : `${type} | undefined`;
}

function buildControllerReturn(project: OxcProject, file: SourceFile, declaration: Class): ReturnValue {
  const typeParameters = declaration.typeParameters?.params.map((parameter) => parameter.name.name) ?? [];
  const returnValue: ReturnValue = {
    type: `${declaration.id?.name ?? 'Controller'}${typeParameters.length > 0 ? `<${typeParameters.join(', ')}>` : ''}`,
  };
  const fields: NonNullable<ReturnValue['fields']> = {};

  for (const member of declaration.body.body) {
    if (member.type !== 'PropertyDefinition' && member.type !== 'MethodDefinition') {
      continue;
    }

    if (member.static || member.accessibility === 'private' || member.accessibility === 'protected') continue;

    const name = staticName(member.key);
    if (!name || name === 'constructor' || member.key.type === 'PrivateIdentifier') continue;

    // The host calls these; they are not part of the controller's API.
    if (REACTIVE_CONTROLLER_CALLBACKS.has(name)) continue;

    let type = 'unknown';

    if (member.type === 'PropertyDefinition' && member.typeAnnotation) {
      const detailed = formatDetailedType(project, { file, type: member.typeAnnotation.typeAnnotation }, false);

      type = member.optional ? withUndefined(detailed) : detailed;
    } else if (member.type === 'MethodDefinition') {
      const typeParameters = member.value.typeParameters
        ? sourceText(file, member.value.typeParameters).replace(/\s+/g, ' ').trim()
        : '';
      const params = member.value.params.map((parameter) => parameterText(project, file, parameter)).join(', ');
      const returns = member.value.returnType
        ? formatDetailedType(project, { file, type: member.value.returnType.typeAnnotation }, false)
        : 'void';

      type = member.kind === 'get' ? returns : `(${typeParameters}(${params}) => ${returns})`;
    }

    const abbreviated = abbreviateType(name, type);
    const field: NonNullable<ReturnValue['fields']>[string] = { type: abbreviated ?? type };

    if (abbreviated && abbreviated !== type) field.detailedType = type;

    const description = getJSDoc(file, member)?.description;

    if (description) field.description = description;

    fields[name] = field;
  }

  if (Object.keys(fields).length > 0) returnValue.fields = fields;

  return returnValue;
}

function parameterText(project: OxcProject, file: SourceFile, parameter: ParamPattern): string {
  const name = bindingName(parameterPattern(parameter)) ?? '...';
  const annotation = parameterTypeAnnotation(parameter);
  // A rest parameter is optional by nature but reads `...name`, not `...name?`.
  const optional = parameter.type !== 'RestElement' && isOptionalParameter(parameter);
  const type = annotation ? formatDetailedType(project, { file, type: annotation }, optional) : 'unknown';

  return `${parameter.type === 'RestElement' ? '...' : ''}${name}${optional ? '?' : ''}: ${type}`;
}

function inferContextReturn(project: OxcProject, file: SourceFile, declaration: NamedDeclaration): ReturnValue {
  if (declaration.type === 'VariableDeclarator') {
    const annotation = declaration.id.typeAnnotation?.typeAnnotation;
    if (annotation) return buildReturnValue(project, { file, type: annotation });

    if (declaration.init) {
      const initializer = unwrapExpression(declaration.init);
      if (initializer.type === 'ObjectExpression') return { type: 'object' };

      if (initializer.type === 'CallExpression' && initializer.typeArguments?.params[0]) {
        return buildReturnValue(project, { file, type: initializer.typeArguments.params[0] });
      }

      return { type: sourceText(file, initializer).replace(/\s+/g, ' ').trim() || 'unknown' };
    }
  }

  const type = declaration.type === 'TSTypeAliasDeclaration' ? declaration.typeAnnotation : undefined;

  return type ? buildReturnValue(project, { file, type }) : { type: 'unknown' };
}

function variableFunction(declaration: NamedDeclaration): OxcFunction | ArrowFunctionExpression | undefined {
  if (declaration.type !== 'VariableDeclarator' || !declaration.init) return undefined;

  const initializer = unwrapExpression(declaration.init);

  return initializer.type === 'ArrowFunctionExpression' || initializer.type === 'FunctionExpression'
    ? initializer
    : undefined;
}

function variableCall(declaration: NamedDeclaration): CallExpression | undefined {
  if (declaration.type !== 'VariableDeclarator' || !declaration.init) return undefined;

  const initializer = unwrapExpression(declaration.init);

  return initializer.type === 'CallExpression' ? initializer : undefined;
}

function isFunctionDeclaration(declaration: NamedDeclaration): declaration is OxcFunction {
  return declaration.type === 'FunctionDeclaration' || declaration.type === 'TSDeclareFunction';
}

function bindingName(pattern: BindingPattern): string | undefined {
  if (pattern.type === 'Identifier') return pattern.name.replace(/^_/, '');

  if (pattern.type === 'AssignmentPattern') return bindingName(pattern.left);

  return undefined;
}

function declarationName(declaration: NamedDeclaration): string | undefined {
  if (declaration.type === 'VariableDeclarator') return staticName(declaration.id);

  return 'id' in declaration ? staticName(declaration.id) : undefined;
}

function declarationNames(declaration: import('oxc-parser').Declaration): string[] {
  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.map((entry) => staticName(entry.id)).filter((name): name is string => !!name);
  }

  const name = 'id' in declaration ? staticName(declaration.id) : undefined;

  return name ? [name] : [];
}

function moduleName(name: import('oxc-parser').ModuleExportName): string {
  return name.type === 'Literal' ? String(name.value) : name.name;
}

function isUpper(value: string | undefined): boolean {
  return !!value && value >= 'A' && value <= 'Z';
}

function resolveSlugCollision(slug: string, framework: UtilEntry['framework'], seen: Set<string>): string {
  if (seen.has(slug)) {
    if (!framework) log.error(`Framework-agnostic slug collision: ${slug}`);

    slug = `${framework}-${slug}`;
  }

  seen.add(slug);
  return slug;
}
