import type { ImportDeclaration, Node, Program } from '@oxc-project/types';
import { parseSync } from 'oxc-parser';
import { walk } from 'oxc-walker';

import { jsxNamePath, parseError, type SourceEdit, sourceError } from '../ast';
import { COMPONENT_SOURCE } from '../target/bindings';
import type { TargetModule } from '../target/module';
import { isRenderTargetMarker } from '../target/render-target';
import { moduleFilename } from '../utils/module-id';

/**
 * Reject JSX that still names a canonical import or carries a render marker. Either means no target rule consumed the
 * element, so the output would reference a component source that does not exist at runtime.
 *
 * @param consumed - Ranges this stage lowers itself, such as templates, whose canonical names are expected.
 */
export function assertLowered(module: TargetModule, consumed: readonly SourceEdit[]): void {
  const sources = canonicalSources(module);
  const canonical = new Set<string>();

  for (const statement of module.ast.body) {
    if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue;

    if (!sources.has(statement.source.value)) continue;

    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type') canonical.add(specifier.local.name);
    }
  }

  walk(module.ast, {
    enter(node) {
      if (node.type === 'JSXAttribute' && node.name.type === 'JSXIdentifier' && isRenderTargetMarker(node.name.name)) {
        throw sourceError(
          `\`$render\` marker \`${node.name.name}\` was not consumed by the component target.\n` +
            'Reason: the canonical host lowered without handing its render target to a component rule.\n' +
            'Recommendation: call consumeRenderTarget() in the rule that lowers this component or part.',
          node.start
        );
      }

      if (node.type !== 'JSXOpeningElement') return;

      const path = jsxNamePath(node.name);
      if (!canonical.has(path[0]!) || consumed.some((edit) => node.start >= edit.start && node.end <= edit.end)) return;

      throw sourceError(
        `<${path.join('.')}> was not lowered by the component target.\n` +
          'Reason: the target has no rule for this component or part and its resolver returned nothing.\n' +
          'Recommendation: add a rule for it, return a target element from `components.resolve`, or unwrap() it.',
        node.start
      );
    },
  });
}

/**
 * Remove canonical and type-only imports the lowered module no longer references, and turn imports it references only
 * as types into `import type`. References are read from a parse of the module as the stage leaves it, so bindings that
 * lowering dropped or copied are counted exactly.
 */
export function pruneImports(module: TargetModule): void {
  const sources = canonicalSources(module);
  const declarations = module.ast.body.filter(
    (statement): statement is ImportDeclaration =>
      statement.type === 'ImportDeclaration' &&
      statement.specifiers.length > 0 &&
      (sources.has(statement.source.value) || isTypeOnlyImport(statement))
  );
  if (declarations.length === 0) return;

  const filename = moduleFilename(module.id);
  const code = module.magicString.toString();
  const lowered = parseSync(filename, code);

  if (lowered.errors.length > 0)
    throw parseError(`VJSC lowered \`${module.id}\` to invalid syntax.`, filename, code, lowered.errors);

  const imported = new Set(declarations.flatMap((declaration) => declaration.specifiers.map(localName)));
  const referenced = referencedBindings(lowered.program, imported);

  for (const declaration of declarations) {
    const kept = declaration.specifiers.filter((specifier) => referenced.all.has(localName(specifier)));
    const typeOnly = kept.length > 0 && kept.every((specifier) => !referenced.runtime.has(localName(specifier)));
    if (kept.length === declaration.specifiers.length && (!typeOnly || isTypeOnlyImport(declaration))) continue;

    if (kept.length === 0) {
      module.magicString.remove(declaration.start, declaration.end);
    } else {
      module.magicString.overwrite(declaration.start, declaration.end, renderImport(declaration, kept, typeOnly));
    }
  }
}

function canonicalSources(module: TargetModule): ReadonlySet<string> {
  return new Set([COMPONENT_SOURCE, ...module.targets.map((target) => target.source)]);
}

function isTypeOnlyImport(declaration: ImportDeclaration): boolean {
  return (
    declaration.importKind === 'type' ||
    declaration.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
  );
}

function referencedBindings(
  ast: Program,
  imported: ReadonlySet<string>
): { readonly all: ReadonlySet<string>; readonly runtime: ReadonlySet<string> } {
  const all = new Set<string>();
  const runtime = new Set<string>();

  walk(ast, {
    enter(node, parent) {
      if (
        node.type === 'Identifier' &&
        imported.has(node.name) &&
        !isImportBinding(parent) &&
        !isPropertyName(node, parent)
      ) {
        all.add(node.name);

        if (!isTypeReference(parent)) runtime.add(node.name);
      }

      if (node.type === 'JSXIdentifier' && imported.has(node.name)) {
        all.add(node.name);
        runtime.add(node.name);
      }
    },
  });

  return { all, runtime };
}

function isTypeReference(parent: Node | null): boolean {
  return (
    parent?.type === 'TSQualifiedName' ||
    parent?.type === 'TSTypeQuery' ||
    parent?.type === 'TSTypeReference' ||
    parent?.type === 'TSInterfaceHeritage'
  );
}

function isPropertyName(node: { readonly type: 'Identifier'; readonly name: string }, parent: Node | null): boolean {
  return Boolean(
    (parent?.type === 'TSQualifiedName' && parent.right === node) ||
    (parent?.type === 'MemberExpression' && !parent.computed && parent.property === node) ||
    (parent?.type === 'Property' && !parent.computed && parent.key === node && !parent.shorthand) ||
    (parent?.type === 'PropertyDefinition' && !parent.computed && parent.key === node) ||
    (parent?.type === 'MethodDefinition' && !parent.computed && parent.key === node) ||
    (parent?.type === 'AccessorProperty' && !parent.computed && parent.key === node) ||
    (parent?.type === 'TSPropertySignature' && !parent.computed && parent.key === node) ||
    (parent?.type === 'TSMethodSignature' && !parent.computed && parent.key === node)
  );
}

function isImportBinding(parent: Node | null): boolean {
  return (
    parent?.type === 'ImportSpecifier' ||
    parent?.type === 'ImportDefaultSpecifier' ||
    parent?.type === 'ImportNamespaceSpecifier'
  );
}

function renderImport(
  declaration: ImportDeclaration,
  specifiers: readonly ImportDeclaration['specifiers'][number][],
  typeOnly = false
): string {
  const prefix = typeOnly || declaration.importKind === 'type' ? 'import type ' : 'import ';
  const defaultSpecifier = specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');
  const namespace = specifiers.find((specifier) => specifier.type === 'ImportNamespaceSpecifier');
  const named = specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');
  const clauses: string[] = [];

  if (defaultSpecifier) clauses.push(defaultSpecifier.local.name);

  if (namespace?.type === 'ImportNamespaceSpecifier') clauses.push(`* as ${namespace.local.name}`);

  if (named.length > 0) {
    const entries = named.map((specifier) => {
      if (specifier.type !== 'ImportSpecifier') throw new Error('Expected a named import.');

      const imported =
        specifier.imported.type === 'Identifier' ? specifier.imported.name : JSON.stringify(specifier.imported.value);
      const alias = imported === specifier.local.name ? imported : `${imported} as ${specifier.local.name}`;

      return !typeOnly && declaration.importKind !== 'type' && specifier.importKind === 'type'
        ? `type ${alias}`
        : alias;
    });

    clauses.push(`{ ${entries.join(', ')} }`);
  }

  return `${prefix}${clauses.join(', ')} from ${JSON.stringify(declaration.source.value)};`;
}

function localName(specifier: ImportDeclaration['specifiers'][number]): string {
  return specifier.local.name;
}
