import type { ImportDeclaration, JSXElementName, Program } from '@oxc-project/types';
import { isFunction } from '@videojs/utils/predicate';

import { sourceError } from '../ast/errors';
import { jsxNamePath, moduleExportName } from '../ast/traverse';
import {
  type ComponentPath,
  type ComponentRule,
  type ComponentTarget,
  isTargetElement,
  type PrimitiveTargetRule,
  type TargetElement,
} from './definition';

/** Module specifier of the authoring runtime whose primitives and types targets lower. */
export const COMPONENT_SOURCE = 'vjsc/components';

/** A canonical component or part reached through a target's source import. */
export interface CanonicalPath extends ComponentPath {
  readonly target: ComponentTarget;
}

/** Local bindings a module holds for canonical component sources. */
export interface CanonicalBindings {
  /** Namespace imports such as `import * as $ from '@videojs/core/vjsc'`. */
  readonly namespaces: ReadonlyMap<string, ComponentTarget>;
  /** Named imports such as `import { Menu } from '@videojs/core/vjsc'`. */
  readonly named: ReadonlyMap<string, CanonicalPath>;
}

/** A local binding for a `vjsc/components` primitive owned by exactly one target. */
export interface PrimitiveBinding {
  readonly name: string;
  readonly rule: PrimitiveTargetRule<object>;
  readonly target: ComponentTarget;
}

/** One named import, by the name its module exports. */
export interface ImportedBinding {
  readonly source: string;
  readonly imported: string;
  /** Whether the import provides only a type, through `import type` or an inline `type` modifier. */
  readonly type: boolean;
}

/** Every import binding the target stages consult, read from one scan of the module's import declarations. */
export interface TargetBindings extends CanonicalBindings {
  /** Named imports from every source, by local name. */
  readonly imports: ReadonlyMap<string, ImportedBinding>;
  /** Runtime primitives from `vjsc/components` that a selected target lowers, by local name. */
  readonly primitives: ReadonlyMap<string, PrimitiveBinding>;
  /** Local name of the `vjsc/components` `Template` primitive, when the module imports it. */
  readonly template: string | undefined;
}

/** Index the module's imports for the selected targets. */
export function indexTargetBindings(ast: Program, targets: readonly ComponentTarget[]): TargetBindings {
  const bySource = new Map<string, ComponentTarget>();
  const namespaces = new Map<string, ComponentTarget>();
  const named = new Map<string, CanonicalPath>();
  const imports = new Map<string, ImportedBinding>();
  const primitives = new Map<string, PrimitiveBinding>();
  let template: string | undefined;

  for (const target of targets) {
    if (bySource.has(target.source)) {
      throw new Error(`More than one component target was provided for \`${target.source}\`.`);
    }

    bySource.set(target.source, target);
  }

  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration') continue;

    const source = statement.source.value;
    const target = statement.importKind === 'type' ? undefined : bySource.get(source);

    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        if (target) namespaces.set(specifier.local.name, target);

        continue;
      }

      if (specifier.type !== 'ImportSpecifier') continue;

      const imported = importedName(specifier);
      const type = statement.importKind === 'type' || specifier.importKind === 'type';

      imports.set(specifier.local.name, { source, imported, type });

      if (type) continue;

      if (target) named.set(specifier.local.name, { target, component: imported, parts: [] });

      if (source !== COMPONENT_SOURCE) continue;

      if (imported === 'Template') {
        template = specifier.local.name;
        continue;
      }

      const primitive = primitiveOwner(targets, imported, specifier.start);

      if (primitive) primitives.set(specifier.local.name, primitive);
    }
  }

  return { namespaces, named, imports, primitives, template };
}

/** The name a local binding imports from `vjsc/components`, whether as a type or a value. */
export function componentExport(bindings: TargetBindings, local: string): string | undefined {
  const binding = bindings.imports.get(local);

  return binding?.source === COMPONENT_SOURCE ? binding.imported : undefined;
}

/** Whether a local name is bound to a canonical component source, as a namespace or a named import. */
export function isCanonicalBinding(bindings: CanonicalBindings, local: string): boolean {
  return bindings.namespaces.has(local) || bindings.named.has(local);
}

/** Resolve a JSX element name such as `$.Menu.Trigger` or `Menu.Trigger` to its canonical path. */
export function canonicalPath(name: JSXElementName, bindings: CanonicalBindings): CanonicalPath | undefined {
  return boundCanonicalPath(jsxNamePath(name), bindings);
}

/** Resolve an identifier path such as `['$', 'Menu', 'Trigger']` to its canonical path. */
export function boundCanonicalPath(path: readonly string[], bindings: CanonicalBindings): CanonicalPath | undefined {
  if (path.length === 0) return undefined;

  const namespace = bindings.namespaces.get(path[0]!);
  if (namespace && path.length > 1) return { target: namespace, component: path[1]!, parts: path.slice(2) };

  const named = bindings.named.get(path[0]!);

  return named ? { ...named, parts: path.slice(1) } : undefined;
}

/** A canonical path as authored, such as `Slider.Thumbnail.Image`. */
export function displayPath(path: Pick<ComponentPath, 'component' | 'parts'>): string {
  return [path.component, ...path.parts].join('.');
}

/** The explicit rule a target configured for a canonical path, if any. */
export function configuredRule(path: CanonicalPath): ComponentRule<object> | undefined {
  let rule = path.target.components.rules[path.component] as ComponentRule<object> | undefined;
  if (path.parts.length === 0 || !rule) return rule;

  const { parts } = path;

  for (const [index, part] of parts.entries()) {
    if (!rule) return undefined;

    if (isFunction(rule) || isTargetElement(rule)) {
      return part === 'Root' && index === parts.length - 1 ? rule : undefined;
    }

    rule = (rule as Readonly<Record<string, ComponentRule<object> | undefined>>)[part];
  }

  return rule;
}

/** The rule that lowers a canonical path: the one the target configured, or else its conventional one. */
export function resolveTargetRule(path: CanonicalPath): ComponentRule<object> | undefined {
  return configuredRule(path) ?? (path.target.components.resolve(componentPath(path)) as ComponentRule<object>);
}

/**
 * The element whose props a canonical path's generated types follow: the element the target configured for it, or else
 * its conventional element. A rewrite decides its output only when it runs, so types follow the convention.
 */
export function resolveTargetElement(path: CanonicalPath): TargetElement | undefined {
  const configured = configuredRule(path);
  if (isTargetElement(configured)) return configured;

  const resolved = path.target.components.resolve(componentPath(path));

  return isTargetElement(resolved) ? resolved : undefined;
}

/** The imported name of an import specifier, ignoring any local alias. */
export function importedName(specifier: ImportDeclaration['specifiers'][number]): string {
  if (specifier.type !== 'ImportSpecifier') return specifier.local.name;

  return moduleExportName(specifier.imported);
}

/** The primitive rule a target defines for a `vjsc/components` export. */
export function primitiveRule(target: ComponentTarget, name: string): PrimitiveTargetRule<object> | undefined {
  return (target.primitives as Readonly<Record<string, PrimitiveTargetRule<object> | undefined>>)[name];
}

function componentPath(path: CanonicalPath): ComponentPath {
  return { component: path.component, parts: path.parts };
}

function primitiveOwner(targets: readonly ComponentTarget[], name: string, pos: number): PrimitiveBinding | undefined {
  const owners = targets.flatMap((target) => {
    const rule = primitiveRule(target, name);

    return rule ? [{ name, rule, target }] : [];
  });
  if (owners.length > 1) throw sourceError(`More than one component target defines the \`${name}\` primitive.`, pos);

  return owners[0];
}
