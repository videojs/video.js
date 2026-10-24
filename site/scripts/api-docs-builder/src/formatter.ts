import { uniq } from 'es-toolkit/array';
import type { BindingPattern, ParamPattern, TSSignature, TSType } from 'oxc-parser';

import type { OxcProject, ResolvedDeclaration, ResolvedMember, ResolvedType, SourceFile } from './oxc-project.js';
import {
  getJSDoc,
  isOptionalParameter,
  literalValue,
  parameterPattern,
  parameterTypeAnnotation,
  sourceText,
  staticName,
  typeNameText,
  unwrapObjectExpression,
  unwrapType,
} from './oxc-project.js';
import type { PropDef } from './types.js';

/**
 * Detect if a type string is a single function type (vs a top-level union).
 *
 * Removes parentheses around the whole type, then finds the end of the parameter list and checks if `=>` follows.
 * Returns `false` for top-level unions that happen to contain a function member (e.g., `((state: object) => string) |
 * undefined`).
 */
function isFunctionType(type: string): boolean {
  let value = type.trim();

  while (hasOuterParentheses(value)) value = value.slice(1, -1).trim();

  if (!value.startsWith('(')) return false;

  let depth = 0;

  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') depth--;

    if (depth === 0) {
      return value
        .slice(i + 1)
        .trimStart()
        .startsWith('=>');
    }
  }

  return false;
}

function hasOuterParentheses(type: string): boolean {
  if (!type.startsWith('(') || !type.endsWith(')')) return false;

  let depth = 0;

  for (let i = 0; i < type.length; i++) {
    if (type[i] === '(') depth++;
    else if (type[i] === ')') depth--;

    if (depth === 0) return i === type.length - 1;
  }

  return false;
}

function splitTopLevel(type: string, separator: '|' | '&'): string[] {
  const parts: string[] = [];
  let start = 0;
  let parentheses = 0;
  let braces = 0;
  let brackets = 0;
  let angles = 0;
  let quote: "'" | '"' | '`' | undefined;

  for (let i = 0; i < type.length; i++) {
    const character = type[i]!;

    if (quote) {
      if (character === quote && type[i - 1] !== '\\') quote = undefined;

      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === '(') parentheses++;
    else if (character === ')') parentheses--;
    else if (character === '{') braces++;
    else if (character === '}') braces--;
    else if (character === '[') brackets++;
    else if (character === ']') brackets--;
    else if (character === '<') angles++;
    else if (character === '>' && type[i - 1] !== '=') angles = Math.max(0, angles - 1);

    if (character === separator && parentheses === 0 && braces === 0 && brackets === 0 && angles === 0) {
      parts.push(type.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(type.slice(start).trim());
  return parts;
}

function splitTopLevelUnion(type: string): string[] {
  return splitTopLevel(type, '|');
}

function splitTopLevelIntersection(type: string): string[] {
  return splitTopLevel(type, '&');
}

function abbreviateFunctionMember(type: string): string | undefined {
  if (isFunctionType(type)) return 'function';

  const intersectionMembers = splitTopLevelIntersection(type);
  if (intersectionMembers.length === 1) return undefined;

  let abbreviated = false;
  const displayMembers = intersectionMembers.map((member) => {
    if (!isFunctionType(member)) return member;

    abbreviated = true;

    return 'function';
  });

  return abbreviated ? displayMembers.join(' & ') : undefined;
}

/**
 * Get abbreviated type for display in collapsed rows.
 *
 * Returns an abbreviated string when abbreviation adds value, `undefined` otherwise.
 */
export function abbreviateType(name: string, type: string): string | undefined {
  // Pure function types (no union) → "function"
  // Also matches function types whose return is a union (e.g., `(state: object) => X | undefined`)
  if (isFunctionType(type)) {
    return 'function';
  }

  // Callbacks → "function"
  if (/^(on|get)[A-Z]/.test(name) && type.includes('=>')) {
    return 'function';
  }

  // className/style/render → simplified
  if (name === 'className' && type.includes('=>')) {
    return 'string | function';
  }

  if (name === 'style' && type.includes('=>')) {
    return 'CSSProperties | function';
  }

  if (name === 'render' && type.includes('=>')) {
    return 'ReactElement | function';
  }

  // Simple types → no abbreviation needed
  if (['boolean', 'string', 'number'].includes(type)) {
    return undefined;
  }

  // Object literal > 40 chars → "object"
  if (type.startsWith('{ ') && type.length > 40) {
    return 'object';
  }

  const unionMembers = splitTopLevelUnion(type);
  const abbreviatedFunctionMembers: string[] = [];
  const otherMembers: string[] = [];

  for (const member of unionMembers) {
    const abbreviated = abbreviateFunctionMember(member);

    if (abbreviated) abbreviatedFunctionMembers.push(abbreviated);
    else otherMembers.push(member);
  }

  if (abbreviatedFunctionMembers.length > 0) {
    return uniq([...otherMembers, ...abbreviatedFunctionMembers]).join(' | ');
  }

  // Short unions (less than 3 members and under 40 chars) → no abbreviation
  if (unionMembers.length < 3 && type.length < 40) {
    return undefined;
  }

  // Any other type > 40 chars → truncated for display, full in detailedType
  if (type.length > 40) {
    return `${type.slice(0, 37)}...`;
  }

  // Complex unions → no abbreviation needed (show full type)
  return undefined;
}

/** Format a list of properties into API reference format. */
export function formatProperties(project: OxcProject, props: readonly ResolvedMember[]): Record<string, PropDef> {
  const result: Record<string, PropDef> = {};

  for (const prop of props) {
    if (prop.member.type !== 'TSPropertySignature') continue;

    const name = staticName(prop.member.key);
    if (!name || !prop.member.typeAnnotation) continue;

    // Skip ref for components
    if (name === 'ref') continue;

    // Skip props marked with @ignore
    const documentation = getJSDoc(prop.file, prop.member);
    if (documentation?.tags.has('ignore')) continue;

    const resolvedType: ResolvedType = {
      file: prop.file,
      type: prop.member.typeAnnotation.typeAnnotation,
      ...(prop.substitutions ? { substitutions: prop.substitutions } : {}),
    };
    const expandedType = formatDetailedType(project, resolvedType, prop.member.optional);
    const abbreviated = abbreviateType(name, expandedType);

    const entry: PropDef = { type: abbreviated ?? expandedType };

    if (abbreviated && expandedType !== abbreviated) entry.detailedType = expandedType;

    const defaultValue = documentation?.tags.get('default')?.at(-1) ?? documentation?.tags.get('defaultValue')?.at(-1);

    if (defaultValue !== undefined) entry.default = defaultValue;

    if (!prop.member.optional) entry.required = true;

    if (documentation?.description !== undefined) entry.description = documentation.description;

    result[name] = entry;
  }

  return result;
}

/**
 * Format a type into a human-readable string, expanding type aliases when possible.
 *
 * Resolves referenced declarations through the OXC project so aliases like `TimeType` expand to their underlying union
 * (`'current' | 'duration' | 'remaining'`).
 */
export function formatDetailedType(
  project: OxcProject,
  type: ResolvedType,
  removeUndefined: boolean,
  visited: Set<string> = new Set(),
  expandInterfaces = true
): string {
  if (type.deepPartial) return formatDeepPartialType(project, type, removeUndefined, visited);

  const node = unwrapType(type.type);

  if (node.type === 'TSTypeReference') {
    const name = typeNameText(node.typeName);
    const substituted = node.typeName.type === 'Identifier' ? type.substitutions?.get(name) : undefined;
    if (substituted) return formatDetailedType(project, substituted, removeUndefined, visited, expandInterfaces);

    const declaration = project.resolveTypeDeclaration(type.file.filePath, node.typeName);
    const key = `${declaration?.file.filePath ?? type.file.filePath}#${name}`;

    if (!visited.has(key)) {
      const resolved = project.resolveType(type);

      if (resolved) {
        if (resolved.file.filePath.includes(`${pathSeparator}node_modules${pathSeparator}`)) {
          return formatTypeReference(project, type, node);
        }

        const displayType = displayTypeHint(declaration);
        if (displayType) return formatDisplayType(displayType, resolved.substitutions, rootContext(project));

        if (declaration?.declaration.type === 'TSInterfaceDeclaration') {
          if (!expandInterfaces) return formatTypeReference(project, type, node);

          visited.add(key);

          const members = withoutOverriddenProperties(project.interfaceMembers(type));
          if (members.length === 0) return formatType(type, removeUndefined, project);

          return `{ ${members
            .map((member) => formatDetailedSignature(project, member, visited))
            .filter(Boolean)
            .join('; ')} }`;
        }

        visited.add(key);
        return formatDetailedType(project, resolved, removeUndefined, visited, expandInterfaces);
      }
    }

    return formatTypeReference(project, type, node);
  }

  if (node.type === 'TSUnionType') {
    const formattedMemberTypes = uniq(
      orderMembers(flattenUnionMembers(node.types, removeUndefined)).map((member) =>
        formatDetailedType(project, { ...type, type: member }, removeUndefined, visited, expandInterfaces)
      )
    );

    return joinMembers(formattedMemberTypes, ' | ');
  }

  if (node.type === 'TSIntersectionType') {
    const formattedMemberTypes = orderMembers(node.types).map((member) =>
      formatDetailedType(project, { ...type, type: member }, false, visited, expandInterfaces)
    );

    return joinMembers(formattedMemberTypes, ' & ');
  }

  if (node.type === 'TSIndexedAccessType') {
    const objectName = typeQueryName(node.objectType);
    const indexName = keyofTypeQueryName(node.indexType);

    if (objectName && objectName === indexName) {
      const values = formatConstObjectUnion(project, type.file, objectName, 'values');
      if (values) return values;
    }
  }

  const keyofName = keyofTypeQueryName(node);

  if (keyofName) {
    const keys = formatConstObjectUnion(project, type.file, keyofName, 'keys');
    if (keys) return keys;
  }

  return formatType(type, removeUndefined, project);
}

const pathSeparator = process.platform === 'win32' ? '\\' : '/';

/** The `@displayType` template on an alias, which stands in for a type the syntax-only formatter cannot print. */
function displayTypeHint(declaration: ResolvedDeclaration | undefined): string | undefined {
  return declaration ? getJSDoc(declaration.file, declaration.declaration)?.tags.get('displayType')?.at(-1) : undefined;
}

function formatDisplayType(
  template: string,
  substitutions: ReadonlyMap<string, ResolvedType> | undefined,
  context: FormatContext
): string {
  return template
    .replace(/\{([A-Za-z_$][\w$]*)\}/g, (placeholder, name: string) => {
      const substitution = substitutions?.get(name);

      return substitution ? formatTypeWith(substitution, false, context) : placeholder;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A reference the syntax formatter should not print by name: one whose alias carries a `@displayType` hint, or a
 * module-private alias that a reader cannot import.
 */
function formatResolvableReference(
  type: ResolvedType,
  reference: import('oxc-parser').TSTypeReference,
  removeUndefined: boolean,
  { project, resolving }: FormatContext
): string | undefined {
  const declaration = project.resolveTypeDeclaration(type.file.filePath, reference.typeName);
  if (!declaration) return undefined;

  const key = `${declaration.file.filePath}#${typeNameText(reference.typeName)}`;
  const displayType = displayTypeHint(declaration);
  if (resolving.has(key) || (!displayType && !isModulePrivateAlias(project, declaration))) return undefined;

  const resolved = project.resolveType(type);
  if (!resolved) return undefined;

  const context = { project, resolving: new Set([...resolving, key]) };

  return displayType
    ? formatDisplayType(displayType, resolved.substitutions, context)
    : formatTypeWith(resolved, removeUndefined, context);
}

function isModulePrivateAlias(project: OxcProject, { file, declaration }: ResolvedDeclaration): boolean {
  return (
    declaration.type === 'TSTypeAliasDeclaration' &&
    !file.filePath.includes(`${pathSeparator}node_modules${pathSeparator}`) &&
    !project.isExported(file, declaration.id.name)
  );
}

/** `Api['input']` names one member of an interface; print that member's type instead of the lookup. */
function indexedMemberType(
  project: OxcProject,
  type: ResolvedType,
  access: import('oxc-parser').TSIndexedAccessType
): ResolvedType | undefined {
  const index = unwrapType(access.indexType);
  const key = index.type === 'TSLiteralType' && 'value' in index.literal ? index.literal.value : undefined;
  if (typeof key !== 'string') return undefined;

  const resolved = project
    .interfaceMembers({ ...type, type: access.objectType })
    .find(({ member }) => member.type === 'TSPropertySignature' && staticName(member.key) === key);
  const annotation = resolved?.member.type === 'TSPropertySignature' ? resolved.member.typeAnnotation : undefined;
  if (!resolved || !annotation) return undefined;

  return resolved.substitutions
    ? { file: resolved.file, type: annotation.typeAnnotation, substitutions: resolved.substitutions }
    : { file: resolved.file, type: annotation.typeAnnotation };
}

/**
 * Join union or intersection members. A member that is itself a conditional (or, inside an intersection, a union) must
 * be grouped, or `A extends B ? C : D | undefined` reads as a union inside the false branch.
 */
function joinMembers(members: readonly string[], separator: ' | ' | ' & '): string {
  if (members.length < 2) return members.join(separator);

  const grouped: readonly TopLevelOperator[] = separator === ' & ' ? ['?', '|'] : ['?'];

  return members.map((member) => (hasTopLevelOperator(member, grouped) ? `(${member})` : member)).join(separator);
}

/**
 * Whether a formatted type has one of `operators` outside every bracket. `?` counts only when a space follows, which is
 * a conditional type's true branch rather than an optional member.
 */
type TopLevelOperator = '?' | '|' | '&';

function hasTopLevelOperator(text: string, operators: readonly TopLevelOperator[]): boolean {
  let depth = 0;

  for (let index = 0; index < text.length; index++) {
    const char = text[index]!;

    if ('([{<'.includes(char)) depth++;
    else if (')]}'.includes(char) || (char === '>' && text[index - 1] !== '=')) depth--;
    else if (depth === 0 && (char === '|' || char === '&') && operators.includes(char)) return true;
    else if (depth === 0 && char === '?' && text[index + 1] === ' ' && operators.includes('?')) return true;
  }

  return false;
}

function formatTypeReference(
  project: OxcProject,
  type: ResolvedType,
  reference: import('oxc-parser').TSTypeReference
): string {
  const name = typeNameText(reference.typeName);
  if (name === 'ReactElement' || name === 'React.ReactElement') return 'ReactElement';

  const displayName = name.startsWith('React.') ? name.slice('React.'.length) : name;
  const args = reference.typeArguments?.params ?? [];

  return args.length > 0
    ? `${displayName}<${args.map((argument) => formatType({ ...type, type: argument }, false, project)).join(', ')}>`
    : displayName;
}

/** An expanded interface member: its types expand in turn, but nested interfaces keep their names. */
function formatDetailedSignature(project: OxcProject, resolved: ResolvedMember, visited: Set<string>): string {
  const { file, member, substitutions, deepPartial } = resolved;
  const format: TypeFormatter = (memberType, removeUndefined) => {
    let type: ResolvedType = { file, type: memberType };

    if (substitutions) type = { ...type, substitutions };

    if (deepPartial) type = { ...type, deepPartial };

    return formatDetailedType(project, type, removeUndefined, new Set(visited), false);
  };

  return formatSignature(file, member, substitutions, format, !!deepPartial);
}

function withoutOverriddenProperties(members: readonly ResolvedMember[]): ResolvedMember[] {
  const names = new Set<string>();
  const result: ResolvedMember[] = [];

  for (let index = members.length - 1; index >= 0; index--) {
    const resolved = members[index]!;
    const member = resolved.member;

    if (member.type === 'TSPropertySignature') {
      const name = staticName(member.key);
      if (name && names.has(name)) continue;

      if (name) names.add(name);
    }

    result.push(resolved);
  }

  return result.reverse();
}

function formatDeepPartialType(
  project: OxcProject,
  type: ResolvedType,
  removeUndefined: boolean,
  visited: Set<string>
): string {
  const node = unwrapType(type.type);

  if (node.type === 'TSTypeReference') {
    const name = typeNameText(node.typeName);
    const key = `${type.file.filePath}#deep-partial#${name}`;

    if (!visited.has(key)) {
      const resolved = project.resolveType(type);

      if (resolved) {
        visited.add(key);
        return formatDeepPartialType(project, { ...resolved, deepPartial: true }, removeUndefined, visited);
      }
    }
  }

  if (node.type === 'TSTypeLiteral') {
    const members = node.members.flatMap((member) => {
      if (member.type !== 'TSPropertySignature' || !member.typeAnnotation) return [];

      const name = staticName(member.key);
      if (!name) return [];

      const memberType = formatDeepPartialType(
        project,
        { ...type, type: member.typeAnnotation.typeAnnotation, deepPartial: true },
        true,
        new Set(visited)
      );

      return [`${name}?: ${memberType}`];
    });

    return members.length > 0 ? `{ ${members.join('; ')} }` : 'object';
  }

  if (node.type === 'TSUnionType') {
    return uniq(
      orderMembers(flattenUnionMembers(node.types, removeUndefined)).map((member) =>
        formatDeepPartialType(project, { ...type, type: member, deepPartial: true }, removeUndefined, new Set(visited))
      )
    ).join(' | ');
  }

  if (node.type === 'TSIntersectionType') {
    return node.types
      .map((member) =>
        formatDeepPartialType(project, { ...type, type: member, deepPartial: true }, false, new Set(visited))
      )
      .join(' & ');
  }

  return formatDetailedType(project, { ...type, deepPartial: false }, removeUndefined, visited);
}

/** Format a type into a human-readable string. */
/** Project access for the syntax formatter, used to honour `@displayType` and see through module-private aliases. */
interface FormatContext {
  readonly project: OxcProject;
  /** Aliases being expanded, so a recursive alias prints its name instead of looping. */
  readonly resolving: ReadonlySet<string>;
}

/**
 * Format a type as written. With a project, references that carry a `@displayType` hint or name a module-private alias
 * are resolved; everything else keeps its declared spelling.
 */
export function formatType(type: ResolvedType, removeUndefined: boolean, project?: OxcProject): string {
  return formatTypeWith(type, removeUndefined, project ? rootContext(project) : undefined);
}

function rootContext(project: OxcProject): FormatContext {
  return { project, resolving: new Set() };
}

function formatTypeWith(type: ResolvedType, removeUndefined: boolean, context?: FormatContext): string {
  const node = unwrapType(type.type);
  const keyword = keywordName(node);
  if (keyword) return keyword;

  const format: TypeFormatter = (memberType, removeMemberUndefined) =>
    formatTypeWith({ ...type, type: memberType }, removeMemberUndefined, context);

  if (node.type === 'TSTypeReference') {
    const name = typeNameText(node.typeName);
    const substituted = node.typeName.type === 'Identifier' ? type.substitutions?.get(node.typeName.name) : undefined;
    if (substituted) return formatTypeWith(substituted, removeUndefined, context);

    const resolved = context ? formatResolvableReference(type, node, removeUndefined, context) : undefined;
    if (resolved !== undefined) return resolved;

    if (name === 'ReactElement' || name === 'React.ReactElement') return 'ReactElement';

    const displayName = name.startsWith('React.') ? name.slice('React.'.length) : name;
    const args = node.typeArguments?.params ?? [];

    return args.length > 0
      ? `${displayName}<${args.map((argument) => format(argument, false)).join(', ')}>`
      : displayName;
  }

  if (node.type === 'TSUnionType') {
    const formattedMemberTypes = uniq(
      orderMembers(flattenUnionMembers(node.types, removeUndefined)).map((member) => format(member, removeUndefined))
    );

    return joinMembers(formattedMemberTypes, ' | ');
  }

  if (node.type === 'TSIntersectionType') {
    return joinMembers(
      orderMembers(node.types).map((member) => format(member, false)),
      ' & '
    );
  }

  if (node.type === 'TSTypeLiteral') {
    // `{}` is a type of its own (`string & {}` keeps literals out of a union); `object` would misstate it.
    if (node.members.length === 0) return '{}';

    return `{ ${node.members
      .map((member) => formatSignature(type.file, member, type.substitutions, format))
      .filter(Boolean)
      .join('; ')} }`;
  }

  if (node.type === 'TSLiteralType') {
    return normalizeQuotes(sourceText(type.file, node.literal));
  }

  if (node.type === 'TSArrayType') {
    const formattedMemberType = format(node.elementType, false);

    // An element that resolved to a union, intersection, or conditional binds looser than `[]`.
    return hasTopLevelOperator(formattedMemberType, ['?', '|', '&'])
      ? `(${formattedMemberType})[]`
      : `${formattedMemberType}[]`;
  }

  if (node.type === 'TSFunctionType' || node.type === 'TSConstructorType') {
    const typeParameters = node.typeParameters ? normalizeTypeText(sourceText(type.file, node.typeParameters)) : '';
    const params = node.params
      .map((parameter) => formatParameter(type.file, parameter, type.substitutions, format))
      .join(', ');
    const returnType = format(node.returnType.typeAnnotation, false);

    return `(${node.type === 'TSConstructorType' ? 'new ' : ''}${typeParameters}(${params}) => ${returnType})`;
  }

  if (node.type === 'TSTupleType') {
    return `[${node.elementTypes.map((member) => format(tupleElementType(member), false)).join(', ')}]`;
  }

  if (context && node.type === 'TSIndexedAccessType') {
    const member = indexedMemberType(context.project, type, node);
    if (member) return formatTypeWith(member, removeUndefined, context);
  }

  if (node.type === 'TSConditionalType' || node.type === 'TSMappedType' || node.type === 'TSInferType') {
    return sourceText(type.file, node).replace(/\s+/g, ' ').trim();
  }

  return normalizeTypeText(sourceText(type.file, node));
}

function flattenUnionMembers(members: readonly TSType[], removeUndefined: boolean): TSType[] {
  return members
    .filter((member) => !removeUndefined || member.type !== 'TSUndefinedKeyword')
    .flatMap((member) => {
      if (member.type === 'TSUnionType') return member.types;

      return member;
    });
}

/** Order members so null, undefined, and any come last. */
function orderMembers(members: readonly TSType[]): readonly TSType[] {
  let ordered = pushToEnd(members, 'any');

  ordered = pushToEnd(ordered, 'null');
  ordered = pushToEnd(ordered, 'undefined');
  return ordered;
}

function pushToEnd(members: readonly TSType[], name: string): readonly TSType[] {
  const index = members.findIndex((member) => keywordName(member) === name);

  if (index !== -1) {
    const member = members[index];

    return [...members.slice(0, index), ...members.slice(index + 1), member!];
  }

  return members;
}

function normalizeQuotes(str: string): string {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str
      .replaceAll("'", "\\'")
      .replaceAll('\\"', '"')
      .replace(/^"(.*)"$/, "'$1'");
  }

  return str;
}

function keywordName(type: TSType): string | undefined {
  const names: Partial<Record<TSType['type'], string>> = {
    TSAnyKeyword: 'any',
    TSBigIntKeyword: 'bigint',
    TSBooleanKeyword: 'boolean',
    TSIntrinsicKeyword: 'intrinsic',
    TSNeverKeyword: 'never',
    TSNullKeyword: 'null',
    TSNumberKeyword: 'number',
    TSObjectKeyword: 'object',
    TSStringKeyword: 'string',
    TSSymbolKeyword: 'symbol',
    TSThisType: 'this',
    TSUndefinedKeyword: 'undefined',
    TSUnknownKeyword: 'unknown',
    TSVoidKeyword: 'void',
  };

  return names[type.type];
}

type TypeFormatter = (type: TSType, removeUndefined: boolean) => string;

/** A member keyed by a constant, such as `[CUE_TYPE]`, is private by convention: readers can't name the key. */
export function isConstantKeyed(member: TSSignature): boolean {
  return 'computed' in member && member.computed && member.key.type === 'Identifier';
}

function formatSignature(
  file: SourceFile,
  member: TSSignature,
  substitutions?: ReadonlyMap<string, ResolvedType>,
  format: TypeFormatter = (type, removeUndefined) => formatType({ file, type, substitutions }, removeUndefined),
  optionalProperties = false
): string {
  if (isConstantKeyed(member)) return '';

  if (member.type === 'TSPropertySignature') {
    const name = staticName(member.key);
    if (!name || !member.typeAnnotation) return '';

    const optional = !!member.optional || optionalProperties;

    return `${name}${optional ? '?' : ''}: ${format(member.typeAnnotation.typeAnnotation, optional)}`;
  }

  if (member.type === 'TSMethodSignature') {
    const name = staticName(member.key);
    if (!name) return '';

    const params = member.params.map((parameter) => formatParameter(file, parameter, substitutions, format)).join(', ');
    const returnType = member.returnType ? format(member.returnType.typeAnnotation, false) : 'void';

    return `${name}${member.optional ? '?' : ''}(${params}): ${returnType}`;
  }

  if (member.type === 'TSCallSignatureDeclaration' || member.type === 'TSConstructSignatureDeclaration') {
    const typeParameters = member.typeParameters ? normalizeTypeText(sourceText(file, member.typeParameters)) : '';
    const params = member.params.map((parameter) => formatParameter(file, parameter, substitutions, format)).join(', ');
    const returnType = member.returnType ? format(member.returnType.typeAnnotation, false) : 'void';
    const prefix = member.type === 'TSConstructSignatureDeclaration' ? 'new ' : '';

    return `${prefix}${typeParameters}(${params}): ${returnType}`;
  }

  return normalizeTypeText(sourceText(file, member)).replace(/;$/, '');
}

function typeQueryName(type: TSType): string | undefined {
  const node = unwrapType(type);

  return node.type === 'TSTypeQuery' && node.exprName.type === 'Identifier' ? node.exprName.name : undefined;
}

function keyofTypeQueryName(type: TSType): string | undefined {
  const node = unwrapType(type);

  return node.type === 'TSTypeOperator' && node.operator === 'keyof' ? typeQueryName(node.typeAnnotation) : undefined;
}

function formatConstObjectUnion(
  project: OxcProject,
  file: SourceFile,
  name: string,
  members: 'keys' | 'values'
): string | undefined {
  const resolved = project.resolveName(file.filePath, name);
  if (resolved?.declaration.type !== 'VariableDeclarator') return undefined;

  const object = unwrapObjectExpression(resolved.declaration.init);
  if (!object) return undefined;

  const literals: string[] = [];

  for (const property of object.properties) {
    if (property.type !== 'Property') return undefined;

    if (members === 'keys') {
      const key = staticName(property.key);
      if (key === undefined) return undefined;

      literals.push(formatLiteralValue(key));
      continue;
    }

    const value = literalValue(property.value);
    if (value === undefined) return undefined;

    literals.push(formatLiteralValue(value));
  }

  return literals.length > 0 ? uniq(literals).join(' | ') : 'never';
}

function formatLiteralValue(value: string | number | boolean | null): string {
  return normalizeQuotes(String(JSON.stringify(value)));
}

function formatParameter(
  file: SourceFile,
  parameter: ParamPattern,
  substitutions?: ReadonlyMap<string, ResolvedType>,
  formatter: TypeFormatter = (type, removeUndefined) => formatType({ file, type, substitutions }, removeUndefined)
): string {
  const name = bindingName(parameterPattern(parameter));
  const annotation = parameterTypeAnnotation(parameter);
  // A rest parameter is optional by nature but reads `...name`, not `...name?`.
  const optional = parameter.type !== 'RestElement' && isOptionalParameter(parameter);
  const type = annotation ? formatter(annotation, optional) : 'unknown';

  return `${parameter.type === 'RestElement' ? '...' : ''}${name}${optional ? '?' : ''}: ${type}`;
}

function bindingName(pattern: BindingPattern): string {
  if (pattern.type === 'Identifier') return pattern.name;

  if (pattern.type === 'AssignmentPattern') return bindingName(pattern.left);

  return '...';
}

function tupleElementType(element: import('oxc-parser').TSTupleElement): TSType {
  if (element.type === 'TSOptionalType' || element.type === 'TSRestType') return element.typeAnnotation;

  return element;
}

function normalizeTypeText(value: string): string {
  return normalizeQuotes(value.replace(/\s+/g, ' ').trim()) || 'unknown';
}
