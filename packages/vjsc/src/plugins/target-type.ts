import type {
  JSXOpeningElement,
  Node,
  Function as OxcFunction,
  Program,
  TSInterfaceDeclaration,
  TSType,
  TSTypeQuery,
  TSTypeReference,
} from '@oxc-project/types';
import { walk } from 'oxc-walker';

import { createSourceText, jsxNamePath, renderSourceRange, type SourceEdit, sourceError } from '../ast';
import {
  boundCanonicalPath,
  canonicalPath,
  COMPONENT_SOURCE,
  resolveTargetElement,
  type TargetBindings,
} from '../target/bindings';
import {
  type ComponentTarget,
  isTargetElement,
  TARGET_ELEMENT,
  type TargetElement,
  type TargetImport,
  type TargetPropsReference,
  type TargetReference,
} from '../target/definition';
import { claimGeneratedName, type TargetModule } from '../target/module';

interface PropsHelper {
  readonly annotation: TSType;
  readonly reference: TSTypeReference;
  readonly includesChildren: boolean;
  readonly inlineMembers: readonly TSType[];
  readonly sourceInterface?: SourcePropsInterface | undefined;
}

interface SourcePropsInterface {
  readonly declaration: TSInterfaceDeclaration;
  readonly exported: boolean;
}

interface ResolvedProps {
  readonly type: string;
  readonly children?: string | undefined;
}

const SOURCE_TYPE_NAMES = new Set(['ClassNameValue', 'Props', 'PropsWithChildren', 'PropsOf']);

interface TypeBindings extends TargetBindings {
  /** Source types imported from `vjsc/components`, by local name, mapped to the name they import. */
  readonly sourceTypes: ReadonlyMap<string, string>;
}

/** The module the source-type step lowers, with its `vjsc/components` source types indexed. */
interface TypeModule extends TargetModule {
  readonly bindings: TypeBindings;
}

/** An element a target renders, together with that target. */
interface ResolvedElement {
  readonly target: ComponentTarget;
  readonly element: TargetElement;
}

/**
 * Rewrite the source types a module imports from `vjsc/components` for its targets, and give each component typed with
 * `Props` or `PropsWithChildren` an exported props interface that extends the props of the element it forwards to.
 */
export function lowerSourceTypes(module: TargetModule): void {
  if (!module.code.includes(COMPONENT_SOURCE)) return;

  const bindings = typeBindings(module.bindings);
  if (bindings.sourceTypes.size === 0) return;

  const types: TypeModule = { ...module, bindings };
  const { ast, magicString } = types;
  const sourceInterfaces = collectSourceInterfaces(ast);

  transformSourceTypes(types);

  walk(ast, {
    enter(node, parent) {
      if (node.type !== 'FunctionDeclaration' || !node.id || !node.body) return;

      const helper = propsHelper(node.params[0], sourceInterfaces, bindings);
      if (!helper) return;

      const forwarded = forwardedBinding(node.params[0]);
      if (!forwarded) return;

      const root = forwardedTarget(node, forwarded, types);
      if (!root) return;

      const props = targetProps(root, types);
      if (!props) return;

      // Children are typed by the part that renders them. That is usually the root, but a
      // compound wrapper may hand them to a nested part instead, such as an image's `render`.
      const childrenPart = helper.includesChildren ? childrenTarget(node, node.params[0], types) : undefined;
      const childrenProps =
        childrenPart && !sameTargetElement(root, childrenPart) ? targetProps(childrenPart, types) : undefined;

      const insertion = parent?.type === 'ExportNamedDeclaration' ? parent.start : node.start;
      const interfaceName =
        helper.sourceInterface?.declaration.id.name ?? claimGeneratedName(module, `${node.id.name}Props`, insertion);
      const heritage = targetHeritage(props, helper.includesChildren && !childrenProps);
      const members = helper.inlineMembers.map((type) => rewriteSourceTypeText(type, types)).filter(Boolean);

      if (declaresChildren(helper)) {
        // The authored props already say what children are; only the heritage needs to make room.
      } else if (childrenProps) {
        members.push(`children?: ${childrenProps.type}[${JSON.stringify(childrenProps.children ?? 'children')}];`);
      } else if (helper.includesChildren && props.children && props.children !== 'children') {
        members.push(`children?: ${props.type}[${JSON.stringify(props.children)}];`);
      }

      if (helper.sourceInterface) {
        const source = helper.sourceInterface;

        if (!source.exported) magicString.appendLeft(source.declaration.start, 'export ');

        magicString.overwrite(source.declaration.id.end, source.declaration.body.start, ` extends ${heritage} `);

        if (members.length > 0) {
          magicString.appendLeft(source.declaration.body.end - 1, `\n${members.join('\n')}\n`);
        }
      } else {
        const declaration = members.length
          ? `export interface ${interfaceName} extends ${heritage} {\n${members.join('\n')}\n}\n\n`
          : `export type ${interfaceName} = ${heritage};\n\n`;

        magicString.appendLeft(insertion, declaration);
      }

      magicString.overwrite(helper.annotation.start, helper.annotation.end, interfaceName);
      this.skip();
    },
  });
}

function typeBindings(bindings: TargetBindings): TypeBindings {
  const sourceTypes = new Map<string, string>();

  for (const [local, binding] of bindings.imports) {
    if (binding.source !== COMPONENT_SOURCE) continue;

    if (SOURCE_TYPE_NAMES.has(binding.imported) || binding.imported.startsWith('Vjsc')) {
      sourceTypes.set(local, binding.imported);
    }
  }

  return { ...bindings, sourceTypes };
}

function transformSourceTypes(module: TypeModule): void {
  const { bindings, magicString } = module;

  walk(module.ast, {
    enter(node, parent) {
      if (
        node.type === 'TSInterfaceHeritage' &&
        node.expression.type === 'Identifier' &&
        bindings.sourceTypes.get(node.expression.name) === 'PropsOf'
      ) {
        const props = propsOfReference(node.typeArguments?.params[0], module)?.type;
        if (!props) return;

        magicString.overwrite(node.start, node.end, props);
        this.skip();
        return;
      }

      if (node.type !== 'TSTypeReference' || node.typeName.type !== 'Identifier') return;

      const sourceType = bindings.sourceTypes.get(node.typeName.name);
      if (!sourceType) return;

      if (sourceType === 'PropsOf') {
        const props = propsOfReference(node.typeArguments?.params[0], module);
        if (!props) return;

        for (const edit of propsOfEdits(node, parent, props)) magicString.overwrite(edit.start, edit.end, edit.content);

        this.skip();
        return;
      }

      if (sourceType === 'Props' || sourceType === 'PropsWithChildren') return;

      const targetImport = uniqueTargetType(sourceType, module.targets, node.start);
      if (!targetImport) return;

      magicString.overwrite(node.start, node.end, module.typeImports.reference(targetImport));
      this.skip();
    },
  });
}

function uniqueTargetType(name: string, targets: readonly ComponentTarget[], pos: number): TargetImport | undefined {
  const references = targets.flatMap((target) => (target.types[name] ? [target.types[name]!] : []));
  if (references.length > 1) throw sourceError(`More than one component target defines source type \`${name}\`.`, pos);

  return references[0];
}

function propsHelper(
  parameter: OxcFunction['params'][number] | undefined,
  sourceInterfaces: ReadonlyMap<string, SourcePropsInterface>,
  bindings: TypeBindings
): PropsHelper | undefined {
  const pattern = parameter?.type === 'AssignmentPattern' ? parameter.left : parameter;
  const annotation = pattern && 'typeAnnotation' in pattern ? pattern.typeAnnotation?.typeAnnotation : undefined;
  if (!annotation) return undefined;

  const types = annotation.type === 'TSIntersectionType' ? annotation.types : [annotation];

  for (const type of types) {
    if (type.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier') continue;

    // Match the imported name, so an aliased `Props` counts and an unrelated local `Props` does not.
    const helper = bindings.sourceTypes.get(type.typeName.name);
    if (helper !== 'Props' && helper !== 'PropsWithChildren') continue;

    return {
      annotation,
      reference: type,
      includesChildren: helper === 'PropsWithChildren',
      inlineMembers: [
        ...types.filter((candidate) => candidate.type === 'TSTypeLiteral'),
        ...inlineTypeMembers(type.typeArguments?.params[0]),
      ],
      sourceInterface: sourcePropsInterface(type.typeArguments?.params[0], sourceInterfaces),
    };
  }

  return undefined;
}

/** Whether the authored props declare `children` themselves, inline or on the source interface. */
function declaresChildren(helper: PropsHelper): boolean {
  const members = [
    ...helper.inlineMembers.flatMap((type) => (type.type === 'TSTypeLiteral' ? type.members : [])),
    ...(helper.sourceInterface?.declaration.body.body ?? []),
  ];

  return members.some(
    (member) =>
      member.type === 'TSPropertySignature' && member.key.type === 'Identifier' && member.key.name === 'children'
  );
}

function collectSourceInterfaces(ast: Program): ReadonlyMap<string, SourcePropsInterface> {
  const interfaces = new Map<string, SourcePropsInterface>();

  for (const statement of ast.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'TSInterfaceDeclaration') continue;

    interfaces.set(declaration.id.name, {
      declaration,
      exported: statement.type === 'ExportNamedDeclaration',
    });
  }

  return interfaces;
}

function sourcePropsInterface(
  type: TSType | undefined,
  interfaces: ReadonlyMap<string, SourcePropsInterface>
): SourcePropsInterface | undefined {
  return type?.type === 'TSTypeReference' && type.typeName.type === 'Identifier'
    ? interfaces.get(type.typeName.name)
    : undefined;
}

function inlineTypeMembers(type: TSType | undefined): TSType[] {
  if (!type) return [];

  if (type.type === 'TSTypeLiteral') return [type];

  if (type.type === 'TSIntersectionType') return type.types.flatMap(inlineTypeMembers);

  return [];
}

function rewriteSourceTypeText(type: TSType, module: TypeModule): string {
  const edits: SourceEdit[] = [];

  walk(type, {
    enter(node, parent) {
      if (node.type !== 'TSTypeReference' || node.typeName.type !== 'Identifier') return;

      const name = module.bindings.sourceTypes.get(node.typeName.name);

      if (name === 'PropsOf') {
        const props = propsOfReference(node.typeArguments?.params[0], module);
        if (!props) return;

        edits.push(...propsOfEdits(node, parent, props));
        this.skip();
        return;
      }

      if (name !== 'ClassNameValue' && !name?.startsWith('Vjsc')) return;

      const target = uniqueTargetType(name, module.targets, node.start);
      if (!target) return;

      edits.push({ start: node.typeName.start, end: node.typeName.end, content: module.typeImports.reference(target) });
    },
  });

  return renderSourceRange(createSourceText(module.code, edits), type.start + 1, type.end - 1).value.trim();
}

function propsOfReference(type: TSType | undefined, module: TypeModule): ResolvedProps | undefined {
  if (type?.type !== 'TSTypeQuery') return undefined;

  const path = typeQueryPath(type.exprName);
  const canonical = boundCanonicalPath(path, module.bindings);

  if (canonical) {
    const element = resolveTargetElement(canonical);

    return element ? targetProps({ target: canonical.target, element }, module) : undefined;
  }

  if (path.length !== 1) return undefined;

  const target = uniqueTargetType('PropsOf', module.targets, type.start);
  if (!target) return undefined;

  const componentProps = module.typeImports.reference(target);

  return { type: `NonNullable<${componentProps}<typeof ${path[0]}>>` };
}

/**
 * Replace a `PropsOf<typeof Part>` reference, and when it indexes `['children']` on a part whose target calls children
 * something else, such as `render`, the index follows the target's name.
 */
function propsOfEdits(node: TSTypeReference, parent: Node | null | undefined, props: ResolvedProps): SourceEdit[] {
  const edits: SourceEdit[] = [{ start: node.start, end: node.end, content: props.type }];

  if (
    props.children &&
    props.children !== 'children' &&
    parent?.type === 'TSIndexedAccessType' &&
    parent.objectType === node &&
    parent.indexType.type === 'TSLiteralType' &&
    parent.indexType.literal.type === 'Literal' &&
    parent.indexType.literal.value === 'children'
  ) {
    edits.push({
      start: parent.indexType.start,
      end: parent.indexType.end,
      content: JSON.stringify(props.children),
    });
  }

  return edits;
}

function typeQueryPath(name: TSTypeQuery['exprName']): string[] {
  if (name.type === 'Identifier') return [name.name];

  if (name.type !== 'TSQualifiedName') return [];

  return [...typeQueryPath(name.left), name.right.name];
}

function forwardedBinding(parameter: OxcFunction['params'][number] | undefined): string | undefined {
  const pattern = parameter?.type === 'AssignmentPattern' ? parameter.left : parameter;
  if (pattern?.type !== 'ObjectPattern') return undefined;

  const rest = pattern.properties.find((property) => property.type === 'RestElement');

  return rest?.type === 'RestElement' && rest.argument.type === 'Identifier' ? rest.argument.name : undefined;
}

/** The local name the component destructures its `children` prop into, if any. */
function childrenBinding(parameter: OxcFunction['params'][number] | undefined): string | undefined {
  const pattern = parameter?.type === 'AssignmentPattern' ? parameter.left : parameter;
  if (pattern?.type !== 'ObjectPattern') return undefined;

  for (const property of pattern.properties) {
    if (property.type !== 'Property' || property.key.type !== 'Identifier' || property.key.name !== 'children') {
      continue;
    }

    const value = property.value.type === 'AssignmentPattern' ? property.value.left : property.value;

    return value.type === 'Identifier' ? value.name : undefined;
  }

  return undefined;
}

/** The single target element that renders the component's `children`, when exactly one does. */
function childrenTarget(
  declaration: OxcFunction,
  parameter: OxcFunction['params'][number] | undefined,
  module: TypeModule
): ResolvedElement | undefined {
  const binding = childrenBinding(parameter);
  if (!binding) return undefined;

  const matches: ResolvedElement[] = [];

  walk(declaration, {
    enter(node, parent) {
      if (
        node.type !== 'JSXExpressionContainer' ||
        node.expression.type !== 'Identifier' ||
        node.expression.name !== binding ||
        parent?.type !== 'JSXElement'
      ) {
        return;
      }

      const resolved = openingTarget(parent.openingElement, module.bindings);

      if (resolved) matches.push(resolved);
    },
  });

  return uniqueElement(matches);
}

/** The single target element the component spreads its forwarded props onto, when exactly one receives them. */
function forwardedTarget(declaration: OxcFunction, binding: string, module: TypeModule): ResolvedElement | undefined {
  const matches: ResolvedElement[] = [];

  walk(declaration, {
    enter(node, parent) {
      if (
        node.type !== 'JSXSpreadAttribute' ||
        node.argument.type !== 'Identifier' ||
        node.argument.name !== binding ||
        parent?.type !== 'JSXOpeningElement'
      ) {
        return;
      }

      const resolved = openingTarget(parent, module.bindings);

      if (resolved) matches.push(resolved);
    },
  });

  return uniqueElement(matches);
}

/** The one element every match resolves to, or none when there is no match or the matches disagree. */
function uniqueElement(matches: readonly ResolvedElement[]): ResolvedElement | undefined {
  const first = matches[0];

  return first && matches.every((match) => sameTargetElement(first, match)) ? first : undefined;
}

function openingTarget(opening: JSXOpeningElement, bindings: TypeBindings): ResolvedElement | undefined {
  const path = canonicalPath(opening.name, bindings);

  if (path) {
    const element = resolveTargetElement(path);

    return element ? { target: path.target, element } : undefined;
  }

  const names = jsxNamePath(opening.name);
  const primitive = names.length === 1 ? bindings.primitives.get(names[0]!) : undefined;
  if (!primitive) return undefined;

  return isTargetElement(primitive.rule) ? { target: primitive.target, element: primitive.rule } : undefined;
}

function targetProps(resolved: ResolvedElement, module: TargetModule): ResolvedProps | undefined {
  return targetReferenceProps(resolved.element[TARGET_ELEMENT], resolved.target, module, new Set());
}

function targetReferenceProps(
  reference: TargetReference,
  target: ComponentTarget,
  module: TargetModule,
  seen: Set<TargetReference>
): ResolvedProps | undefined {
  if (seen.has(reference)) throw new Error('vjsc/target: component target references form a cycle.');

  seen.add(reference);

  if (reference.kind === 'component') {
    const resolved = target.components.resolve({ component: reference.component, parts: reference.parts });

    return isTargetElement(resolved) ? targetReferenceProps(resolved[TARGET_ELEMENT], target, module, seen) : undefined;
  }

  if (!reference.props) return undefined;

  const type = renderPropsReference(reference, reference.props, module);

  return reference.props.children ? { type, children: reference.props.children } : { type };
}

function renderPropsReference(
  reference: Exclude<TargetReference, { kind: 'component' }>,
  props: TargetPropsReference,
  module: TargetModule
): string {
  let local: string;

  if (reference.kind === 'import' && reference.import.from === props.from && reference.import.name === props.name) {
    // Component values and their public props commonly live on sibling paths
    // of the same namespace (`Menu.Root` and `Menu.RootProps`). Import the
    // namespace root once instead of appending the props path to the value path.
    local = module.imports.reference({ from: reference.import.from, name: reference.import.name });
  } else {
    local = module.typeImports.reference(props);
  }

  const path = props.path?.length ? `.${props.path.join('.')}` : '';

  return props.intrinsic ? `${local}${path}<${JSON.stringify(props.intrinsic)}>` : `${local}${path}`;
}

function targetHeritage(props: ResolvedProps, includesChildren: boolean): string {
  const omitted = new Set<string>();

  if (!includesChildren || (props.children && props.children !== 'children')) omitted.add('children');

  if (props.children && props.children !== 'children') omitted.add(props.children);

  if (omitted.size === 0) return props.type;

  return `Omit<${props.type}, ${[...omitted].map((name) => JSON.stringify(name)).join(' | ')}>`;
}

function sameTargetElement(left: ResolvedElement, right: ResolvedElement): boolean {
  return left.target === right.target && left.element[TARGET_ELEMENT] === right.element[TARGET_ELEMENT];
}
