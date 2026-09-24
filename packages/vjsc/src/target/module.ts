import type { Program } from '@oxc-project/types';
import type { RolldownMagicString } from 'rolldown';

import { sourceError } from '../ast/errors';
import { collectIdentifierNames, ModuleImports } from '../ast/imports';
import { indexTargetBindings, type TargetBindings } from './bindings';
import type { ComponentTarget } from './definition';

/** The source a target stage receives for one module. */
export interface TargetSource {
  readonly id: string;
  readonly code: string;
  readonly ast: Program;
  readonly magicString: RolldownMagicString;
}

/**
 * One module a target stage transforms. Its steps read one AST and bindings index and edit one MagicString, and the
 * imports they request are committed together when the stage finishes.
 */
export interface TargetModule extends TargetSource {
  readonly targets: readonly ComponentTarget[];
  readonly bindings: TargetBindings;
  /** Runtime imports the stage adds. */
  readonly imports: ModuleImports;
  /** Type-only imports the stage adds. They share local names with `imports`, so the two never collide. */
  readonly typeImports: ModuleImports;
  /** Identifiers the module uses or the stage has allocated, which new imports avoid. */
  readonly names: Set<string>;
  /** Names the module declares at its top level or the stage has declared there. */
  readonly declared: Set<string>;
}

export function createTargetModule(source: TargetSource, targets: readonly ComponentTarget[]): TargetModule {
  const names = collectIdentifierNames(source.ast);

  return {
    ...source,
    targets,
    bindings: indexTargetBindings(source.ast, targets),
    // Lowered code often imports a runtime component whose name the authored module already binds to its canonical
    // counterpart, such as `Menu`, so a collision takes a descriptive suffix rather than a number.
    imports: new ModuleImports(source.ast, source.magicString, {
      collisionSuffix: 'Primitive',
      defaultImportName: 'Target',
      usedNames: names,
    }),
    typeImports: new ModuleImports(source.ast, source.magicString, {
      kind: 'type',
      collisionSuffix: 'Type',
      usedNames: names,
    }),
    names,
    declared: topLevelNames(source.ast),
  };
}

/** Insert the imports every step of the stage requested. */
export function commitTargetImports(module: TargetModule): void {
  module.imports.commit();
  module.typeImports.commit();
}

/**
 * Claim a generated top-level name. Generated names are public, such as a component's props interface, so a name the
 * module already uses is an error rather than a silently renamed export.
 */
export function claimGeneratedName(module: TargetModule, name: string, pos: number): string {
  if (module.declared.has(name)) {
    throw sourceError(
      `VJSC needs to declare \`${name}\`, but the module already declares that name.\n` +
        'Reason: generated declarations are exported under fixed names.\n' +
        `Recommendation: rename the existing \`${name}\` binding.`,
      pos
    );
  }

  module.declared.add(name);
  module.names.add(name);
  return name;
}

function topLevelNames(ast: Program): Set<string> {
  const names = new Set<string>();

  for (const statement of ast.body) {
    if (statement.type === 'ImportDeclaration') {
      for (const specifier of statement.specifiers) names.add(specifier.local.name);

      continue;
    }

    const declaration =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? statement.declaration
        : statement;

    if (declaration?.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === 'Identifier') names.add(declarator.id.name);
      }
    } else if (
      (declaration?.type === 'FunctionDeclaration' ||
        declaration?.type === 'ClassDeclaration' ||
        declaration?.type === 'TSTypeAliasDeclaration' ||
        declaration?.type === 'TSInterfaceDeclaration' ||
        declaration?.type === 'TSEnumDeclaration') &&
      declaration.id
    ) {
      names.add(declaration.id.name);
    }
  }

  return names;
}
