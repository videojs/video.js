import type { BindingPattern, BindingRestElement, Node, Program } from '@oxc-project/types';
import { parseSync } from 'oxc-parser';
import { walk } from 'oxc-walker';

import { parseError } from './errors';
import { moduleExportName } from './traverse';

/** One name an `import` declaration binds; `default` and `*` name the default and namespace imports. */
export interface ImportBinding {
  readonly imported: string;
  readonly local: string;
}

export interface ImportReference {
  readonly specifier: string;
  readonly kind: 'static' | 'dynamic' | 'type';
  readonly start: number;
  readonly end: number;
  readonly quote: string;
  /** Value bindings of an `import` declaration; empty for side-effect, re-export, dynamic, and type references. */
  readonly bindings: readonly ImportBinding[];
}

export interface ImportReplacement extends ImportReference {
  readonly replacement: string;
}

export interface ModuleAnalysis {
  readonly imports: readonly ImportReference[];
  /** Names the module exports at runtime, including `default`; `export *` re-exports are not expanded. */
  readonly exports: readonly string[];
}

/** Locate editable ESM import specifiers without changing source formatting. */
export function analyzeImports(source: string, fileName: string): ImportReference[] {
  return [...analyzeModule(source, fileName).imports];
}

/** Read a module's import references and runtime export names from one parse. */
export function analyzeModule(source: string, fileName: string): ModuleAnalysis {
  const parsed = parseSync(fileName, source);
  if (parsed.errors.length > 0) throw parseError(`Cannot analyze \`${fileName}\`.`, fileName, source, parsed.errors);

  const references: ImportReference[] = [];

  walk(parsed.program, {
    enter(node) {
      const reference = importReference(node);
      if (!reference) return;

      const { literal, kind } = reference;

      references.push({
        specifier: literal.value,
        kind,
        start: literal.start,
        end: literal.end,
        quote: source[literal.start] === '`' ? '`' : source[literal.start] === '"' ? '"' : "'",
        bindings: node.type === 'ImportDeclaration' && kind === 'static' ? importBindings(node) : [],
      });
    },
  });

  return { imports: references, exports: exportNames(parsed.program) };
}

function exportNames(program: Program): string[] {
  const names = new Set<string>();

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      names.add('default');
    } else if (statement.type === 'ExportAllDeclaration') {
      if (statement.exported && statement.exportKind !== 'type') names.add(moduleExportName(statement.exported));
    } else if (statement.type === 'ExportNamedDeclaration' && statement.exportKind !== 'type') {
      for (const specifier of statement.specifiers) {
        if (specifier.exportKind !== 'type') names.add(moduleExportName(specifier.exported));
      }

      for (const name of declaredNames(statement.declaration)) names.add(name);
    }
  }

  return [...names];
}

function declaredNames(declaration: Extract<Node, { type: 'ExportNamedDeclaration' }>['declaration']): string[] {
  if (!declaration) return [];

  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.flatMap((declarator) => bindingNames(declarator.id));
  }

  if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') {
    return declaration.id ? [declaration.id.name] : [];
  }

  // Types, interfaces, and ambient declarations have no runtime binding.
  return declaration.type === 'TSEnumDeclaration' && !declaration.declare ? [declaration.id.name] : [];
}

function bindingNames(pattern: BindingPattern | BindingRestElement): string[] {
  switch (pattern.type) {
    case 'Identifier':
      return [pattern.name];
    case 'ObjectPattern':
      return pattern.properties.flatMap((property) =>
        property.type === 'RestElement' ? bindingNames(property.argument) : bindingNames(property.value)
      );
    case 'ArrayPattern':
      return pattern.elements.flatMap((element) => (element ? bindingNames(element) : []));
    case 'AssignmentPattern':
      return bindingNames(pattern.left);
    case 'RestElement':
      return bindingNames(pattern.argument);
    default:
      return [];
  }
}

/** Replace import specifiers while preserving all other authored source text. */
export function replaceImportSpecifiers(source: string, replacements: readonly ImportReplacement[]): string {
  let output = source;

  for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
    output =
      output.slice(0, replacement.start) +
      replacement.quote +
      escapeSpecifier(replacement.replacement, replacement.quote) +
      replacement.quote +
      output.slice(replacement.end);
  }

  return output;
}

interface StaticSpecifier {
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

function importReference(
  node: Node
): { readonly literal: StaticSpecifier; readonly kind: ImportReference['kind'] } | undefined {
  if (node.type === 'ImportDeclaration') {
    const typeOnly =
      node.importKind === 'type' ||
      (node.specifiers.length > 0 &&
        node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type'));

    return { literal: node.source, kind: typeOnly ? 'type' : 'static' };
  }

  if (node.type === 'ExportNamedDeclaration' && node.source) {
    const typeOnly =
      node.exportKind === 'type' ||
      (node.specifiers.length > 0 && node.specifiers.every((specifier) => specifier.exportKind === 'type'));

    return { literal: node.source, kind: typeOnly ? 'type' : 'static' };
  }

  if (node.type === 'ExportAllDeclaration') {
    return { literal: node.source, kind: node.exportKind === 'type' ? 'type' : 'static' };
  }

  if (node.type === 'ImportExpression') {
    // `typeof` narrows the literal union to a string literal; a predicate would narrow only its value.
    if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
      return { literal: node.source, kind: 'dynamic' };
    }

    if (node.source.type === 'TemplateLiteral' && node.source.expressions.length === 0) {
      const value = node.source.quasis[0]?.value.cooked;

      if (value !== null && value !== undefined) {
        return { literal: { value, start: node.source.start, end: node.source.end }, kind: 'dynamic' };
      }
    }
  }

  if (node.type === 'TSImportType') return { literal: node.source, kind: 'type' };

  return undefined;
}

function importBindings(node: Extract<Node, { type: 'ImportDeclaration' }>): ImportBinding[] {
  const bindings: ImportBinding[] = [];

  for (const specifier of node.specifiers) {
    if (specifier.type === 'ImportDefaultSpecifier')
      bindings.push({ imported: 'default', local: specifier.local.name });
    else if (specifier.type === 'ImportNamespaceSpecifier')
      bindings.push({ imported: '*', local: specifier.local.name });
    else if (specifier.importKind !== 'type') {
      bindings.push({ imported: moduleExportName(specifier.imported), local: specifier.local.name });
    }
  }

  return bindings;
}

function escapeSpecifier(specifier: string, quote: string): string {
  return specifier.replaceAll('\\', '\\\\').replaceAll(quote, `\\${quote}`);
}
