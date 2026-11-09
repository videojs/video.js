import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  BindingPattern,
  Class,
  Comment,
  Declaration,
  Expression,
  Function as OxcFunction,
  ImportDeclaration,
  Node,
  ObjectExpression,
  ParamPattern,
  Program,
  PropertyKey,
  TSSignature,
  TSType,
  VariableDeclarator,
} from 'oxc-parser';
import { parseSync } from 'oxc-parser';
import { walk } from 'oxc-walker';

export interface SourceFile {
  readonly filePath: string;
  readonly source: string;
  readonly program: Program;
  readonly comments: readonly Comment[];
}

export type NamedDeclaration = Declaration | VariableDeclarator;

export interface ResolvedDeclaration {
  readonly file: SourceFile;
  readonly declaration: NamedDeclaration;
}

export interface ResolvedType {
  readonly file: SourceFile;
  readonly type: TSType;
  readonly substitutions?: ReadonlyMap<string, ResolvedType>;
  readonly deepPartial?: boolean;
}

export interface ResolvedMember {
  readonly file: SourceFile;
  readonly member: TSSignature;
  readonly substitutions?: ReadonlyMap<string, ResolvedType>;
  readonly deepPartial?: boolean;
}

export interface JSDoc {
  readonly description?: string;
  readonly tags: ReadonlyMap<string, readonly string[]>;
  readonly params: ReadonlyMap<string, string>;
}

interface ModuleIndex {
  readonly declarations: ReadonlyMap<string, readonly NamedDeclaration[]>;
  readonly imports: ReadonlyMap<string, { readonly imported: string; readonly source: string }>;
  readonly namespaceImports: ReadonlyMap<string, string>;
  readonly namedExports: ReadonlyMap<string, { readonly local: string; readonly source?: string }>;
  readonly exportAll: readonly string[];
}

/**
 * Cached Oxc source project with the small amount of module and type resolution the docs conventions need. This
 * intentionally resolves authored declarations, not the complete TypeScript language.
 */
export class OxcProject {
  readonly monorepoRoot: string;

  readonly #files = new Map<string, SourceFile>();
  readonly #indexes = new Map<string, ModuleIndex>();
  readonly #packageRoots = new Map<string, string>();

  constructor(monorepoRoot: string) {
    this.monorepoRoot = path.resolve(monorepoRoot);
    this.#indexPackages();
  }

  source(filePath: string): SourceFile | undefined {
    const absolute = path.resolve(filePath);
    const cached = this.#files.get(absolute);
    if (cached) return cached;

    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return undefined;

    const source = fs.readFileSync(absolute, 'utf8');
    const parsed = parseSync(absolute, source);

    if (parsed.errors.length > 0) {
      throw new Error(`${absolute}:\n${parsed.errors.map((error) => error.message).join('\n')}`);
    }

    const file: SourceFile = {
      filePath: absolute,
      source,
      program: parsed.program,
      comments: parsed.comments,
    };

    this.#files.set(absolute, file);
    return file;
  }

  resolveModule(fromFile: string, specifier: string): string | undefined {
    if (specifier.startsWith('.')) {
      return resolveFile(path.resolve(path.dirname(fromFile), specifier));
    }

    const packageName = specifier.startsWith('@')
      ? specifier.split('/').slice(0, 2).join('/')
      : specifier.split('/')[0]!;
    const packageRoot = this.#packageRoots.get(packageName);
    if (!packageRoot) return resolveExternalModule(fromFile, specifier, this.monorepoRoot);

    const subpath = specifier.slice(packageName.length).replace(/^\//, '');
    const manifestPath = path.join(packageRoot, 'package.json');

    const sourceCandidates = subpath
      ? [
          path.join(packageRoot, 'src', subpath),
          path.join(packageRoot, 'src', 'dom', subpath),
          path.join(packageRoot, 'src', 'playback', subpath),
          path.join(packageRoot, 'src', 'playback', 'adapters', subpath),
          path.join(packageRoot, 'src', 'playback', 'engines', subpath),
        ]
      : [path.join(packageRoot, 'src', 'index'), path.join(packageRoot, 'src', 'core', 'index')];

    for (const candidate of sourceCandidates) {
      const resolved = resolveFile(candidate);
      if (resolved) return resolved;
    }

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
        exports?: Record<string, string | Record<string, string>>;
      };
      const key = subpath ? `./${subpath}` : '.';
      const target = resolvePackageExport(manifest.exports, key, subpath);

      if (target) {
        const resolved = resolveFile(path.resolve(packageRoot, target));
        if (resolved) return resolved;
      }
    }

    const candidates = subpath
      ? [path.join(packageRoot, 'src', subpath), path.join(packageRoot, 'src', subpath, 'index')]
      : [path.join(packageRoot, 'src', 'index')];

    for (const candidate of candidates) {
      const resolved = resolveFile(candidate);
      if (resolved) return resolved;
    }

    return undefined;
  }

  declarations(filePath: string, name: string): readonly ResolvedDeclaration[] {
    const file = this.source(filePath);
    if (!file) return [];

    return (this.#index(file).declarations.get(name) ?? []).map((declaration) => ({ file, declaration }));
  }

  resolveName(filePath: string, name: string, visited: Set<string> = new Set()): ResolvedDeclaration | undefined {
    const key = `${path.resolve(filePath)}#${name}`;
    if (visited.has(key)) return undefined;

    visited.add(key);

    const file = this.source(filePath);
    if (!file) return undefined;

    const index = this.#index(file);
    const local = index.declarations.get(name)?.[0];
    if (local) return { file, declaration: local };

    const imported = index.imports.get(name);

    if (imported) {
      const target = this.resolveModule(file.filePath, imported.source);
      if (target) return this.resolveExport(target, imported.imported, visited);
    }

    const exported = index.namedExports.get(name);

    if (exported?.source) {
      const target = this.resolveModule(file.filePath, exported.source);
      if (target) return this.resolveExport(target, exported.local, visited);
    }

    return undefined;
  }

  resolveExport(filePath: string, name: string, visited: Set<string> = new Set()): ResolvedDeclaration | undefined {
    const key = `${path.resolve(filePath)}::${name}`;
    if (visited.has(key)) return undefined;

    visited.add(key);

    const file = this.source(filePath);
    if (!file) return undefined;

    const index = this.#index(file);
    const exported = index.namedExports.get(name);

    if (exported) {
      if (exported.source) {
        const target = this.resolveModule(file.filePath, exported.source);
        if (target) return this.resolveExport(target, exported.local, visited);
      } else {
        const local = index.declarations.get(exported.local)?.[0];
        if (local) return { file, declaration: local };

        const imported = index.imports.get(exported.local);

        if (imported) {
          const target = this.resolveModule(file.filePath, imported.source);
          if (target) return this.resolveExport(target, imported.imported, visited);
        }
      }
    }

    const direct = index.declarations.get(name)?.[0];
    if (direct && isDeclarationExported(file, direct)) return { file, declaration: direct };

    for (const specifier of index.exportAll) {
      const target = this.resolveModule(file.filePath, specifier);
      const resolved = target ? this.resolveExport(target, name, visited) : undefined;
      if (resolved) return resolved;
    }

    return undefined;
  }

  resolveType(type: ResolvedType): ResolvedType | undefined {
    const unwrapped = unwrapType(type.type);
    if (unwrapped.type !== 'TSTypeReference') return undefined;

    const substituted =
      unwrapped.typeName.type === 'Identifier' ? type.substitutions?.get(unwrapped.typeName.name) : undefined;
    if (substituted) return substituted;

    const declaration = this.resolveTypeDeclaration(type.file.filePath, unwrapped.typeName);
    if (!declaration) return undefined;

    const declarationType = typeFromDeclaration(declaration.declaration);
    if (!declarationType) return undefined;

    const parameters = typeParametersFromDeclaration(declaration.declaration);
    const args = unwrapped.typeArguments?.params ?? [];
    const substitutions = new Map<string, ResolvedType>(type.substitutions);

    parameters.forEach((parameter, index) => {
      const argument = args[index] ?? parameter.default ?? parameter.constraint;

      if (argument)
        substitutions.set(parameter.name.name, { file: type.file, type: argument, substitutions: type.substitutions });
    });

    return {
      file: declaration.file,
      type: declarationType,
      ...(substitutions.size > 0 ? { substitutions } : {}),
    };
  }

  interfaceMembers(type: ResolvedType, visited: Set<string> = new Set()): ResolvedMember[] {
    const reference = unwrapType(type.type);
    const utilityMembers =
      reference.type === 'TSTypeReference' ? this.#utilityTypeMembers(type, reference, visited) : undefined;
    if (utilityMembers) return utilityMembers;

    const resolved = this.resolveType(type) ?? type;
    const name =
      reference.type === 'TSTypeReference'
        ? typeNameText(reference.typeName)
        : sourceText(resolved.file, resolved.type);
    const key = `${resolved.file.filePath}#${name}`;
    if (visited.has(key)) return [];

    visited.add(key);

    if (reference.type === 'TSTypeLiteral') {
      return reference.members.map((member) => ({
        file: type.file,
        member,
        ...(type.substitutions ? { substitutions: type.substitutions } : {}),
      }));
    }

    const declaration =
      reference.type === 'TSTypeReference'
        ? this.resolveTypeDeclaration(type.file.filePath, reference.typeName)
        : undefined;
    if (declaration?.file.filePath.includes(`${path.sep}node_modules${path.sep}`)) return [];

    if (!declaration || declaration.declaration.type !== 'TSInterfaceDeclaration') {
      if (declaration?.declaration.type === 'ClassDeclaration') {
        return classTypeMembers(declaration.file, declaration.declaration, type.substitutions);
      }

      if (resolved.type !== type.type && resolved.type.type === 'TSTypeReference') {
        return this.interfaceMembers(resolved, visited);
      }

      if (resolved.type.type === 'TSIntersectionType' || resolved.type.type === 'TSUnionType') {
        return resolved.type.types.flatMap((member) =>
          this.interfaceMembers({ ...resolved, type: member }, new Set(visited))
        );
      }

      return resolved.type.type === 'TSTypeLiteral'
        ? resolved.type.members.map((member) => ({
            file: resolved.file,
            member,
            ...(resolved.substitutions ? { substitutions: resolved.substitutions } : {}),
          }))
        : [];
    }

    const iface = declaration.declaration;
    const parameters = iface.typeParameters?.params ?? [];
    // Only the interface's own type parameters are in scope inside it; the caller's names mean nothing there.
    const substitutions = new Map<string, ResolvedType>();
    const referenceArgs = reference.type === 'TSTypeReference' ? (reference.typeArguments?.params ?? []) : [];

    parameters.forEach((parameter, index) => {
      const argument = referenceArgs[index] ?? parameter.default ?? parameter.constraint;

      if (argument)
        substitutions.set(parameter.name.name, { file: type.file, type: argument, substitutions: type.substitutions });
    });

    const members: ResolvedMember[] = [];

    for (const heritage of iface.extends) {
      const heritageType = expressionToType(heritage.expression, heritage.typeArguments);

      if (heritageType) {
        members.push(
          ...this.interfaceMembers(
            {
              file: declaration.file,
              type: heritageType,
              ...(substitutions.size > 0 ? { substitutions } : {}),
            },
            visited
          )
        );
      }
    }

    members.push(
      ...iface.body.body.map((member) => ({
        file: declaration.file,
        member,
        ...(substitutions.size > 0 ? { substitutions } : {}),
      }))
    );
    return members;
  }

  /** Whether a file exports its local declaration `name`, under any name. */
  isExported(file: SourceFile, name: string): boolean {
    for (const entry of this.#index(file).namedExports.values()) {
      if (entry.local === name && !entry.source) return true;
    }

    return false;
  }

  resolveTypeDeclaration(filePath: string, name: import('oxc-parser').TSTypeName): ResolvedDeclaration | undefined {
    if (name.type === 'Identifier') return this.resolveName(filePath, name.name);

    const parts = typeNameText(name).split('.');
    const root = parts[0]!;
    const file = this.source(filePath);
    if (!file) return undefined;

    const index = this.#index(file);
    const namespaceSource = index.namespaceImports.get(root);
    const imported = index.imports.get(root);
    const source = namespaceSource ?? imported?.source;

    if (source) {
      const target = this.resolveModule(filePath, source);

      if (target) {
        if (imported) {
          const importedDeclaration = this.resolveExport(target, imported.imported);

          if (importedDeclaration) {
            const importedName = declarationName(importedDeclaration.declaration) ?? imported.imported;
            const nested = this.resolveName(
              importedDeclaration.file.filePath,
              [importedName, ...parts.slice(1)].join('.')
            );
            if (nested) return nested;
          }
        }

        return this.resolveName(target, parts.join('.')) ?? this.resolveExport(target, parts.slice(1).join('.'));
      }
    }

    return this.resolveName(filePath, parts.join('.'));
  }

  #utilityTypeMembers(
    type: ResolvedType,
    reference: import('oxc-parser').TSTypeReference,
    visited: Set<string>
  ): ResolvedMember[] | undefined {
    if (reference.typeName.type !== 'Identifier') return undefined;

    const utility = reference.typeName.name;
    const source = reference.typeArguments?.params[0];

    if (!source || !['Pick', 'Omit', 'Partial', 'Required', 'Readonly', 'DeepPartial'].includes(utility)) {
      return undefined;
    }

    const members = this.interfaceMembers({ ...type, type: source }, new Set(visited));

    if (utility === 'Partial' || utility === 'DeepPartial') {
      return members.map((member) => ({
        ...member,
        member: member.member.type === 'TSPropertySignature' ? { ...member.member, optional: true } : member.member,
        ...(utility === 'DeepPartial' ? { deepPartial: true } : {}),
      }));
    }

    if (utility !== 'Pick' && utility !== 'Omit') return members;

    const keys = reference.typeArguments?.params[1]
      ? literalTypeNames(reference.typeArguments.params[1]!)
      : new Set<string>();

    return members.filter((member) => {
      const name = 'key' in member.member ? staticName(member.member.key) : undefined;

      return utility === 'Pick' ? !!name && keys.has(name) : !name || !keys.has(name);
    });
  }

  classDeclaration(filePath: string, name: string): ResolvedDeclaration | undefined {
    const resolved = this.resolveName(filePath, name);

    return resolved?.declaration.type === 'ClassDeclaration' ? resolved : undefined;
  }

  classHierarchy(
    filePath: string,
    name: string,
    visited = new Set<string>()
  ): Array<{ file: SourceFile; declaration: Class }> {
    const resolved = this.resolveName(filePath, name);
    if (!resolved || resolved.declaration.type !== 'ClassDeclaration') return [];

    const key = `${resolved.file.filePath}#${name}`;
    if (visited.has(key)) return [];

    visited.add(key);

    const classNode = resolved.declaration;
    const hierarchy: Array<{ file: SourceFile; declaration: Class }> = [];

    if (classNode.superClass?.type === 'Identifier') {
      hierarchy.push(...this.classHierarchy(resolved.file.filePath, classNode.superClass.name, visited));
    }

    hierarchy.push({ file: resolved.file, declaration: classNode });
    return hierarchy;
  }

  importedNamespace(filePath: string, localName: string): string | undefined {
    const file = this.source(filePath);

    return file ? this.#index(file).namespaceImports.get(localName) : undefined;
  }

  #index(file: SourceFile): ModuleIndex {
    const cached = this.#indexes.get(file.filePath);
    if (cached) return cached;

    const declarations = new Map<string, NamedDeclaration[]>();
    const imports = new Map<string, { imported: string; source: string }>();
    const namespaceImports = new Map<string, string>();
    const namedExports = new Map<string, { local: string; source?: string }>();
    const exportAll: string[] = [];

    for (const statement of file.program.body) {
      if (statement.type === 'ImportDeclaration') {
        indexImport(statement, imports, namespaceImports);
        continue;
      }

      if (statement.type === 'ExportAllDeclaration') {
        if (!statement.exported) exportAll.push(statement.source.value);

        continue;
      }

      if (statement.type === 'ExportNamedDeclaration') {
        if (statement.declaration) addDeclaration(declarations, statement.declaration);

        for (const specifier of statement.specifiers) {
          namedExports.set(moduleName(specifier.exported), {
            local: moduleName(specifier.local),
            ...(statement.source ? { source: statement.source.value } : {}),
          });
        }

        if (statement.declaration) {
          for (const name of declarationNames(statement.declaration)) namedExports.set(name, { local: name });
        }

        continue;
      }

      if (isDeclaration(statement)) addDeclaration(declarations, statement);
    }

    const index: ModuleIndex = { declarations, imports, namespaceImports, namedExports, exportAll };

    this.#indexes.set(file.filePath, index);
    return index;
  }

  #indexPackages(): void {
    const packagesDir = path.join(this.monorepoRoot, 'packages');
    if (!fs.existsSync(packagesDir)) return;

    for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const packageRoot = path.join(packagesDir, entry.name);

      // Fixture packages may omit a manifest, so `src/` also marks a package directory.
      if (fs.existsSync(path.join(packageRoot, 'package.json')) || fs.existsSync(path.join(packageRoot, 'src'))) {
        this.#indexPackage(entry.name, packageRoot);
        continue;
      }

      // Anything else is a bucket (e.g. `adapters/`) whose children are packages.
      for (const child of fs.readdirSync(packageRoot, { withFileTypes: true })) {
        if (!child.isDirectory()) continue;

        const childRoot = path.join(packageRoot, child.name);

        if (fs.existsSync(path.join(childRoot, 'package.json'))) this.#indexPackage(child.name, childRoot);
      }
    }
  }

  #indexPackage(dirName: string, packageRoot: string): void {
    const manifestPath = path.join(packageRoot, 'package.json');
    let packageName = `@videojs/${dirName}`;

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { name?: string };

      if (manifest.name) packageName = manifest.name;
    }

    this.#packageRoots.set(packageName, packageRoot);
  }
}

export function walkAst(root: Node, visitor: (node: Node, parent: Node | null) => void): void {
  walk(root, {
    enter(node, parent) {
      visitor(node, parent);
    },
  });
}

export function sourceText(file: SourceFile, node: { readonly start: number; readonly end: number }): string {
  return file.source.slice(node.start, node.end);
}

export function staticName(
  key:
    | PropertyKey
    | BindingPattern
    | import('oxc-parser').TSTypeName
    | import('oxc-parser').ModuleExportName
    | undefined
    | null
): string | undefined {
  if (!key) return undefined;

  if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') return key.name;

  if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')) {
    return String(key.value);
  }

  if (key.type === 'TSQualifiedName') return typeNameText(key);

  return undefined;
}

export function unwrapExpression(expression: Expression): Expression {
  let current = expression;

  while (
    current.type === 'ParenthesizedExpression' ||
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSTypeAssertion' ||
    current.type === 'TSNonNullExpression'
  ) {
    current = current.expression;
  }

  return current;
}

export function unwrapObjectExpression(expression: Expression | null | undefined): ObjectExpression | undefined {
  if (!expression) return undefined;

  const unwrapped = unwrapExpression(expression);

  return unwrapped.type === 'ObjectExpression' ? unwrapped : undefined;
}

/** The binding a parameter declares, looking through a rest element or a constructor parameter property. */
export function parameterPattern(parameter: ParamPattern): BindingPattern {
  if (parameter.type === 'RestElement') return parameter.argument;

  if (parameter.type === 'TSParameterProperty') return parameter.parameter;

  return parameter;
}

/**
 * The type a parameter declares, wherever the parser hangs it. A default value (`name = value`) wraps the pattern in an
 * `AssignmentPattern` whose `left` carries the annotation, and a rest parameter (`...name: T[]`) keeps it on the rest
 * element rather than on its argument.
 */
export function parameterTypeAnnotation(parameter: ParamPattern): TSType | undefined {
  if (parameter.type === 'RestElement' && parameter.typeAnnotation) return parameter.typeAnnotation.typeAnnotation;

  const pattern = parameterPattern(parameter);
  const target = pattern.type === 'AssignmentPattern' ? pattern.left : pattern;

  return target.typeAnnotation?.typeAnnotation ?? undefined;
}

/** A parameter is optional when marked `?`, given a default value, or declared as a rest parameter. */
export function isOptionalParameter(parameter: ParamPattern): boolean {
  const pattern = parameterPattern(parameter);
  if (parameter.type === 'RestElement' || pattern.type === 'AssignmentPattern') return true;

  return 'optional' in pattern && !!pattern.optional;
}

export function unwrapType(type: TSType): TSType {
  let current = type;

  while (current.type === 'TSParenthesizedType') current = current.typeAnnotation;

  return current;
}

export function expressionText(file: SourceFile, expression: Expression): string {
  return sourceText(file, expression).trim();
}

export function literalValue(expression: Expression | null | undefined): string | number | boolean | null | undefined {
  const unwrapped = expression ? unwrapExpression(expression) : undefined;
  if (unwrapped?.type !== 'Literal') return undefined;

  return typeof unwrapped.value === 'bigint' || unwrapped.value instanceof RegExp ? undefined : unwrapped.value;
}

export function typeNameText(name: import('oxc-parser').TSTypeName): string {
  if (name.type === 'Identifier') return name.name;

  if (name.type === 'ThisExpression') return 'this';

  return `${typeNameText(name.left)}.${name.right.name}`;
}

export function getJSDoc(file: SourceFile, node: { readonly start: number }): JSDoc | undefined {
  let candidate: Comment | undefined;

  for (const comment of file.comments) {
    if (comment.end > node.start || comment.type !== 'Block' || !comment.value.startsWith('*')) continue;

    if (!candidate || comment.end > candidate.end) candidate = comment;
  }

  if (!candidate) return undefined;

  const between = file.source.slice(candidate.end, node.start);
  if (!isJSDocBindingGap(between)) return undefined;

  return parseJSDoc(candidate.value);
}

export function getJSDocDescription(file: SourceFile, node: { readonly start: number }): string | undefined {
  return getJSDoc(file, node)?.description;
}

export function getJSDocTag(file: SourceFile, node: { readonly start: number }, tagName: string): string | undefined {
  return getJSDoc(file, node)?.tags.get(tagName)?.at(-1);
}

export function hasJSDocTag(file: SourceFile, node: { readonly start: number }, tagName: string): boolean {
  return getJSDoc(file, node)?.tags.has(tagName) ?? false;
}

export function parseJSDoc(value: string): JSDoc {
  const lines = value
    .replace(/^\*/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\* ?/, '').trim());
  const description: string[] = [];
  const tags = new Map<string, string[]>();
  const params = new Map<string, string>();
  let activeTag: { name: string; value: string } | undefined;

  const commitTag = () => {
    if (!activeTag) return;

    const value = activeTag.value.trim();
    const values = tags.get(activeTag.name) ?? [];

    values.push(value);
    tags.set(activeTag.name, values);

    if (activeTag.name === 'param') {
      const match = value.match(/^(\S+)\s*(?:-\s*)?([\s\S]*)$/);

      if (match) params.set(match[1]!, match[2]!.trim());
    }

    activeTag = undefined;
  };

  for (const line of lines) {
    const tag = line.match(/^@(\S+)\s*(.*)$/);

    if (tag) {
      commitTag();
      activeTag = { name: tag[1]!, value: tag[2] ?? '' };
      continue;
    }

    const inlineTag = line.match(/^(.*?)\s+@(\S+)\s*(.*)$/);

    if (inlineTag) {
      if (activeTag) {
        activeTag.value += `${activeTag.value ? '\n' : ''}${inlineTag[1]}`;
        commitTag();
      } else if (inlineTag[1]) {
        description.push(inlineTag[1]);
      }

      activeTag = { name: inlineTag[2]!, value: inlineTag[3] ?? '' };
      continue;
    }

    if (activeTag) {
      activeTag.value += `${activeTag.value ? '\n' : ''}${line}`;
    } else {
      description.push(line);
    }
  }

  commitTag();

  const cleanDescription = description.join('\n').trim();

  return {
    ...(cleanDescription ? { description: cleanDescription } : {}),
    tags,
    params,
  };
}

export function functionReturnType(fn: OxcFunction): TSType | undefined {
  return fn.returnType?.typeAnnotation;
}

export function typeFromDeclaration(declaration: NamedDeclaration): TSType | undefined {
  if (declaration.type === 'TSTypeAliasDeclaration') return declaration.typeAnnotation;

  if (declaration.type === 'TSInterfaceDeclaration') {
    return { ...declaration.body, type: 'TSTypeLiteral', members: declaration.body.body };
  }

  if (declaration.type === 'VariableDeclarator') return declaration.id.typeAnnotation?.typeAnnotation;

  if (declaration.type === 'FunctionDeclaration') return declaration.returnType?.typeAnnotation;

  if (declaration.type === 'TSDeclareFunction') return declaration.returnType?.typeAnnotation;

  return undefined;
}

function typeParametersFromDeclaration(declaration: NamedDeclaration): readonly import('oxc-parser').TSTypeParameter[] {
  if (
    declaration.type === 'TSTypeAliasDeclaration' ||
    declaration.type === 'TSInterfaceDeclaration' ||
    declaration.type === 'FunctionDeclaration' ||
    declaration.type === 'TSDeclareFunction' ||
    declaration.type === 'ClassDeclaration'
  ) {
    return declaration.typeParameters?.params ?? [];
  }

  return [];
}

function expressionToType(
  expression: Expression,
  typeArguments: import('oxc-parser').TSTypeParameterInstantiation | null
): TSType | undefined {
  if (expression.type === 'Identifier' || expression.type === 'ThisExpression') {
    return {
      type: 'TSTypeReference',
      typeName: expression,
      typeArguments,
      start: expression.start,
      end: expression.end,
    };
  }

  if (expression.type === 'MemberExpression' && !expression.computed && expression.property.type === 'Identifier') {
    const left = expressionToType(expression.object, null);
    if (left?.type !== 'TSTypeReference') return undefined;

    return {
      type: 'TSTypeReference',
      typeName: {
        type: 'TSQualifiedName',
        left: left.typeName,
        right: expression.property,
        start: expression.start,
        end: expression.end,
      },
      typeArguments,
      start: expression.start,
      end: expression.end,
    };
  }

  return undefined;
}

function resolveFile(candidate: string): string | undefined {
  const stripped = candidate.replace(/\.(?:mjs|cjs|js)$/, '');
  const candidates = [
    candidate,
    stripped,
    `${stripped}.ts`,
    `${stripped}.tsx`,
    `${stripped}.d.ts`,
    path.join(stripped, 'index.ts'),
    path.join(stripped, 'index.tsx'),
    path.join(stripped, 'index.d.ts'),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return path.resolve(filePath);
  }

  return undefined;
}

function resolveExternalModule(fromFile: string, specifier: string, monorepoRoot: string): string | undefined {
  const packageName = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!;
  const subpath = specifier.slice(packageName.length).replace(/^\//, '');
  let current = path.dirname(fromFile);

  while (current.startsWith(monorepoRoot)) {
    const packageRoot = path.join(current, 'node_modules', packageName);
    const manifestPath = path.join(packageRoot, 'package.json');

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
        types?: string;
        typings?: string;
        exports?: Record<string, string | Record<string, string>>;
      };
      const key = subpath ? `./${subpath}` : '.';
      const target =
        resolvePackageExport(manifest.exports, key, subpath) ??
        (!subpath ? (manifest.types ?? manifest.typings) : subpath);

      if (target) {
        const declaration = resolveDeclarationFile(path.resolve(packageRoot, target));
        if (declaration) return declaration;
      }

      return resolveDeclarationFile(path.join(packageRoot, subpath || 'index'));
    }

    const parent = path.dirname(current);
    if (parent === current) break;

    current = parent;
  }

  return undefined;
}

function resolveDeclarationFile(candidate: string): string | undefined {
  const stripped = candidate.replace(/\.(?:mjs|cjs|js)$/, '');
  const candidates = [
    candidate.endsWith('.d.ts') ? candidate : `${stripped}.d.ts`,
    path.join(stripped, 'index.d.ts'),
    candidate,
  ];

  return candidates.find((filePath) => fs.existsSync(filePath) && fs.statSync(filePath).isFile());
}

function resolvePackageExport(
  exports: Record<string, string | Record<string, string>> | undefined,
  key: string,
  subpath: string
): string | undefined {
  if (!exports) return undefined;

  const exact = exports[key];
  if (exact) return typeof exact === 'string' ? exact : (exact.types ?? exact.development ?? exact.default);

  for (const [pattern, value] of Object.entries(exports)) {
    if (!pattern.includes('*')) continue;

    const [prefix, suffix] = pattern.split('*');
    if (!key.startsWith(prefix!) || !key.endsWith(suffix!)) continue;

    const wildcard = key.slice(prefix!.length, key.length - suffix!.length);
    const target = typeof value === 'string' ? value : (value.types ?? value.development ?? value.default);
    if (target) return target.replace('*', wildcard || subpath);
  }

  return undefined;
}

function indexImport(
  declaration: ImportDeclaration,
  imports: Map<string, { imported: string; source: string }>,
  namespaces: Map<string, string>
): void {
  for (const specifier of declaration.specifiers) {
    if (specifier.type === 'ImportNamespaceSpecifier') {
      namespaces.set(specifier.local.name, declaration.source.value);
      continue;
    }

    if (specifier.type === 'ImportDefaultSpecifier') {
      imports.set(specifier.local.name, { imported: 'default', source: declaration.source.value });
      continue;
    }

    imports.set(specifier.local.name, {
      imported: moduleName(specifier.imported),
      source: declaration.source.value,
    });
  }
}

function addDeclaration(declarations: Map<string, NamedDeclaration[]>, declaration: Declaration): void {
  if (declaration.type === 'VariableDeclaration') {
    for (const variable of declaration.declarations) {
      const name = staticName(variable.id);

      if (name) addNamedDeclaration(declarations, name, variable);
    }

    return;
  }

  if (declaration.type === 'TSModuleDeclaration') {
    const name = staticName(declaration.id);

    if (name) {
      addNamedDeclaration(declarations, name, declaration);
      addNamespaceDeclarations(declarations, name, declaration.body);
    }

    return;
  }

  const name = declarationName(declaration);

  if (name) addNamedDeclaration(declarations, name, declaration);
}

function addNamespaceDeclarations(
  declarations: Map<string, NamedDeclaration[]>,
  prefix: string,
  body: import('oxc-parser').TSModuleBlock | import('oxc-parser').TSModuleDeclaration | null
): void {
  if (!body) return;

  if (body.type === 'TSModuleDeclaration') {
    const name = staticName(body.id);

    if (name) addNamespaceDeclarations(declarations, `${prefix}.${name}`, body.body);

    return;
  }

  for (const statement of body.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (!declaration || !isDeclaration(declaration)) continue;

    if (declaration.type === 'VariableDeclaration') {
      for (const variable of declaration.declarations) {
        const name = staticName(variable.id);

        if (name) addNamedDeclaration(declarations, `${prefix}.${name}`, variable);
      }

      continue;
    }

    if (declaration.type === 'TSModuleDeclaration') {
      const name = staticName(declaration.id);

      if (name) addNamespaceDeclarations(declarations, `${prefix}.${name}`, declaration.body);

      continue;
    }

    const name = declarationName(declaration);

    if (name) addNamedDeclaration(declarations, `${prefix}.${name}`, declaration);
  }
}

function addNamedDeclaration(
  declarations: Map<string, NamedDeclaration[]>,
  name: string,
  declaration: NamedDeclaration
): void {
  const existing = declarations.get(name) ?? [];

  existing.push(declaration);
  declarations.set(name, existing);
}

function declarationNames(declaration: Declaration): string[] {
  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.flatMap((variable) => {
      const name = staticName(variable.id);

      return name ? [name] : [];
    });
  }

  const name = declarationName(declaration);

  return name ? [name] : [];
}

function declarationName(declaration: NamedDeclaration): string | undefined {
  if (declaration.type === 'VariableDeclarator') return staticName(declaration.id);

  if (
    declaration.type === 'FunctionDeclaration' ||
    declaration.type === 'TSDeclareFunction' ||
    declaration.type === 'ClassDeclaration' ||
    declaration.type === 'TSTypeAliasDeclaration' ||
    declaration.type === 'TSInterfaceDeclaration' ||
    declaration.type === 'TSEnumDeclaration' ||
    declaration.type === 'TSModuleDeclaration'
  ) {
    return staticName(declaration.id);
  }

  return undefined;
}

function classTypeMembers(
  file: SourceFile,
  declaration: Class,
  substitutions?: ReadonlyMap<string, ResolvedType>
): ResolvedMember[] {
  return declaration.body.body.flatMap((member) => {
    if (member.type !== 'PropertyDefinition' || !member.typeAnnotation || member.static) return [];

    const signature: import('oxc-parser').TSPropertySignature = {
      type: 'TSPropertySignature',
      key: member.key,
      computed: member.computed,
      optional: !!member.optional,
      readonly: !!member.readonly,
      typeAnnotation: member.typeAnnotation,
      accessibility: null,
      static: false,
      start: member.start,
      end: member.end,
    };

    return [{ file, member: signature, ...(substitutions ? { substitutions } : {}) }];
  });
}

function literalTypeNames(type: TSType): Set<string> {
  const node = unwrapType(type);
  const members = node.type === 'TSUnionType' ? node.types : [node];

  return new Set(
    members.flatMap((member) => {
      const value = member.type === 'TSLiteralType' ? literalValue(member.literal) : undefined;

      return typeof value === 'string' ? [value] : [];
    })
  );
}

function moduleName(name: import('oxc-parser').ModuleExportName): string {
  return name.type === 'Literal' ? String(name.value) : name.name;
}

function isDeclaration(node: Node): node is Declaration {
  return [
    'VariableDeclaration',
    'FunctionDeclaration',
    'TSDeclareFunction',
    'ClassDeclaration',
    'TSTypeAliasDeclaration',
    'TSInterfaceDeclaration',
    'TSEnumDeclaration',
    'TSModuleDeclaration',
    'TSImportEqualsDeclaration',
  ].includes(node.type);
}

function isDeclarationExported(file: SourceFile, declaration: NamedDeclaration): boolean {
  return file.program.body.some(
    (statement) =>
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration !== null &&
      (statement.declaration === declaration ||
        (statement.declaration.type === 'VariableDeclaration' &&
          statement.declaration.declarations.includes(declaration as VariableDeclarator)))
  );
}

/** Compiler and linter directives sit between a declaration and its JSDoc without detaching it. */
const DIRECTIVE_COMMENT = /\/\/\s*(?:@ts-(?:expect-error|ignore|nocheck)|(?:eslint|oxlint)-disable-next-line)\b[^\n]*/g;

function isJSDocBindingGap(gap: string): boolean {
  return /^(?:\s|export\b|default\b|declare\b|abstract\b|async\b|const\b|let\b|var\b|readonly\b|static\b)*$/.test(
    gap.replace(DIRECTIVE_COMMENT, '')
  );
}
