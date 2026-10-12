import type { ImportDeclaration, Program } from '@oxc-project/types';
import { walk } from 'oxc-walker';
import type { RolldownMagicString } from 'rolldown';

import { moduleExportName } from './traverse';

export interface ModuleImport {
  readonly from: string;
  readonly name: string;
  readonly path?: readonly string[] | undefined;
}

export interface ModuleImportsOptions {
  readonly collisionSuffix?: string | undefined;
  readonly defaultImportName?: string | undefined;
  /**
   * Whether the collection emits `import type` statements. Type collections may reuse any existing import, including
   * type-only ones, because a value import also provides its type.
   */
  readonly kind?: 'value' | 'type' | undefined;
  /**
   * Names taken in the module, shared with other collections that insert into the same module so a value import and a
   * type import never allocate the same local. Defaults to the identifiers the module already declares.
   */
  readonly usedNames?: Set<string> | undefined;
}

/** Collect collision-safe runtime or type-only imports and insert them together. */
export class ModuleImports {
  readonly #ast: Program;
  readonly #magicString: RolldownMagicString;
  readonly #usedNames: Set<string>;
  readonly #existing = new Map<string, string>();
  readonly #requested = new Map<string, Map<string, string>>();
  readonly #sideEffects = new Set<string>();
  readonly #statements: string[] = [];
  readonly #options: ModuleImportsOptions;

  constructor(ast: Program, magicString: RolldownMagicString, options: ModuleImportsOptions = {}) {
    this.#ast = ast;
    this.#magicString = magicString;
    this.#options = options;
    this.#usedNames = options.usedNames ?? collectIdentifierNames(ast);

    for (const statement of ast.body) {
      if (statement.type !== 'ImportDeclaration') continue;

      if (statement.importKind === 'type' && options.kind !== 'type') continue;

      this.#collectExisting(statement);
    }
  }

  reference(moduleImport: ModuleImport): string {
    const key = importKey(moduleImport.from, moduleImport.name);
    let local = this.#existing.get(key);

    if (!local) {
      let imports = this.#requested.get(moduleImport.from);

      if (!imports) {
        imports = new Map();
        this.#requested.set(moduleImport.from, imports);
      }

      local = imports.get(moduleImport.name);

      if (!local) {
        local = this.#allocateName(moduleImport.name);
        imports.set(moduleImport.name, local);
      }
    }

    return moduleImport.path?.length ? `${local}.${moduleImport.path.join('.')}` : local;
  }

  sideEffect(source: string): void {
    if (!this.#hasRuntimeImportFrom(source)) this.#sideEffects.add(source);
  }

  /** Add a top-level statement after this collection's imports. */
  statement(code: string): void {
    this.#statements.push(code);
  }

  commit(): void {
    const statements = [
      ...[...this.#sideEffects].map((source) => `import ${JSON.stringify(source)};`),
      ...[...this.#requested].map(([source, imports]) => {
        const specifiers = [...imports].map(([imported, local]) =>
          imported === local ? imported : `${imported} as ${local}`
        );
        const keyword = this.#options.kind === 'type' ? 'import type' : 'import';

        return `${keyword} { ${specifiers.join(', ')} } from ${JSON.stringify(source)};`;
      }),
      ...this.#statements,
    ];

    insertModuleImports(this.#ast, this.#magicString, statements);
  }

  #collectExisting(declaration: ImportDeclaration): void {
    const source = declaration.source.value;

    for (const specifier of declaration.specifiers) {
      if (specifier.type !== 'ImportSpecifier') continue;

      if (specifier.importKind === 'type' && this.#options.kind !== 'type') continue;

      this.#existing.set(importKey(source, moduleExportName(specifier.imported)), specifier.local.name);
    }
  }

  #allocateName(imported: string): string {
    const base = imported === 'default' ? (this.#options.defaultImportName ?? 'Imported') : imported;

    if (!this.#usedNames.has(base)) {
      this.#usedNames.add(base);
      return base;
    }

    const importedName = `${base}${this.#options.collisionSuffix ?? 'Import'}`;
    let candidate = importedName;
    let suffix = 2;

    while (this.#usedNames.has(candidate)) candidate = `${importedName}${suffix++}`;

    this.#usedNames.add(candidate);
    return candidate;
  }

  #hasRuntimeImportFrom(source: string): boolean {
    return this.#ast.body.some(
      (statement) =>
        statement.type === 'ImportDeclaration' &&
        statement.source.value === source &&
        statement.importKind !== 'type' &&
        (statement.specifiers.length === 0 ||
          statement.specifiers.some(
            (specifier) => specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type'
          ))
    );
  }
}

function importKey(source: string, name: string): string {
  return `${source}\0${name}`;
}

export function collectIdentifierNames(ast: Program): Set<string> {
  const names = new Set<string>();

  walk(ast, {
    enter(node) {
      if (node.type === 'Identifier') names.add(node.name);
    },
  });

  return names;
}

export function insertModuleImports(
  ast: Program,
  magicString: RolldownMagicString,
  statements: readonly string[]
): void {
  if (statements.length === 0) return;

  let leadingEnd: number | undefined;

  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration' && !('directive' in statement && statement.directive)) break;

    leadingEnd = statement.end;
  }

  if (leadingEnd !== undefined) {
    magicString.appendLeft(leadingEnd, `\n${statements.join('\n')}\n`);
    return;
  }

  const insertion = ast.body[0]?.start ?? ast.hashbang?.end ?? 0;
  const prefix = ast.body.length === 0 && ast.hashbang ? '\n' : '';

  magicString.appendLeft(insertion, `${prefix}${statements.join('\n')}\n`);
}
