import { omit } from 'es-toolkit/object';
import type { Expression } from 'oxc-parser';

import { formatProperties } from './formatter.js';
import type { OxcProject, ResolvedMember, SourceFile } from './oxc-project.js';
import {
  expressionText,
  getJSDoc,
  getJSDocDescription,
  staticName,
  unwrapExpression,
  unwrapObjectExpression,
} from './oxc-project.js';
import type { CoreExtraction, ExtractedProp } from './types.js';

/** Extract Props, State, and defaultProps from a core component file. */
export function extractCore(filePath: string, project: OxcProject, componentName: string): CoreExtraction | null {
  const propsDeclaration = project.resolveName(filePath, `${componentName}Props`);
  const stateDeclaration = project.resolveName(filePath, `${componentName}State`);
  if (!propsDeclaration && !stateDeclaration) return null;

  let props: ExtractedProp[] = [];
  let description: string | undefined;
  let defaultProps = extractDefaultProps(filePath, project, componentName);

  const propsName =
    propsDeclaration && 'id' in propsDeclaration.declaration ? staticName(propsDeclaration.declaration.id) : undefined;

  if (propsDeclaration && propsName) {
    const type = referenceType(propsName, propsDeclaration.declaration.start, propsDeclaration.declaration.end);
    const members = project.interfaceMembers({ file: propsDeclaration.file, type });

    props = Object.entries(formatProperties(project, members)).map(([name, definition]) => ({ name, ...definition }));
    description = getJSDocDescription(propsDeclaration.file, propsDeclaration.declaration);
    defaultProps = omit(defaultProps, internalPropNames(members));
  }

  let state: ExtractedProp[] = [];

  const stateName =
    stateDeclaration && 'id' in stateDeclaration.declaration ? staticName(stateDeclaration.declaration.id) : undefined;

  if (stateDeclaration && stateName) {
    const type = referenceType(stateName, stateDeclaration.declaration.start, stateDeclaration.declaration.end);

    state = Object.entries(
      formatProperties(project, project.interfaceMembers({ file: stateDeclaration.file, type }))
    ).map(([name, definition]) => ({ name, ...definition }));
  }

  return {
    ...(description ? { description } : {}),
    props,
    state,
    defaultProps,
  };
}

/** Props whose most derived declaration is `@internal`: the core controls them, so inherited defaults do not apply. */
function internalPropNames(members: readonly ResolvedMember[]): string[] {
  const internal = new Map<string, boolean>();

  for (const { file, member } of members) {
    if (member.type !== 'TSPropertySignature') continue;

    const name = staticName(member.key);
    if (!name) continue;

    internal.set(name, getJSDoc(file, member)?.tags.has('internal') ?? false);
  }

  return [...internal].filter(([, isInternal]) => isInternal).map(([name]) => name);
}

/**
 * Extract the authored values from a component core's static defaultProps object, following spreads of other cores'
 * defaults.
 */
export function extractDefaultProps(
  filePath: string,
  project: OxcProject,
  componentName: string
): Record<string, string> {
  return classDefaultProps(filePath, project, `${componentName}Core`, new Set());
}

function classDefaultProps(
  filePath: string,
  project: OxcProject,
  className: string,
  visited: Set<string>
): Record<string, string> {
  const resolved = project.classDeclaration(filePath, className);
  if (!resolved || resolved.declaration.type !== 'ClassDeclaration') return {};

  const key = `${resolved.file.filePath}#${className}`;
  if (visited.has(key)) return {};

  visited.add(key);

  const defaultProps: Record<string, string> = {};

  for (const member of resolved.declaration.body.body) {
    if (member.type !== 'PropertyDefinition' || !member.static || staticName(member.key) !== 'defaultProps') continue;

    const object = unwrapObjectExpression(member.value);
    if (!object) continue;

    for (const property of object.properties) {
      if (property.type === 'SpreadElement') {
        const spreadClassName = defaultPropsOwner(property.argument);

        if (spreadClassName) {
          Object.assign(defaultProps, classDefaultProps(resolved.file.filePath, project, spreadClassName, visited));
        }

        continue;
      }

      if (property.kind !== 'init') continue;

      const name = staticName(property.key);
      if (!name) continue;

      const value = getPropertyValue(property.value, resolved.file, project);

      if (value !== undefined) defaultProps[name] = value;
    }
  }

  visited.delete(key);

  return defaultProps;
}

/** Get `Owner` from a `...Owner.defaultProps` spread argument. */
function defaultPropsOwner(node: Expression): string | undefined {
  const expression = unwrapExpression(node);

  if (
    expression.type !== 'MemberExpression' ||
    expression.computed ||
    expression.object.type !== 'Identifier' ||
    staticName(expression.property) !== 'defaultProps'
  ) {
    return undefined;
  }

  return expression.object.name;
}

/** Get the display form of an authored default value. */
export function getPropertyValue(node: Expression, file: SourceFile, project: OxcProject): string | undefined {
  const expression = unwrapExpression(node);

  if (expression.type === 'Identifier') {
    const constant = project.resolveName(file.filePath, expression.name);

    if (constant?.declaration.type === 'VariableDeclarator' && constant.declaration.init) {
      const init = unwrapExpression(constant.declaration.init);
      if (init.type === 'Literal') return getPropertyValue(init, constant.file, project);
    }
  }

  if (expression.type === 'Literal') {
    if (typeof expression.value === 'string') return `'${expression.value.replaceAll("'", "\\'")}'`;

    if (expression.value === null) return 'null';

    if (typeof expression.value === 'number' || typeof expression.value === 'boolean') return String(expression.value);
  }

  if (expression.type === 'ArrayExpression' && expression.elements.length === 0) return '[]';

  if (expression.type === 'ObjectExpression' && expression.properties.length === 0) return '{}';

  return expressionText(file, expression);
}

function referenceType(name: string, start: number, end: number): import('oxc-parser').TSTypeReference {
  return {
    type: 'TSTypeReference',
    typeName: { type: 'Identifier', name, start, end },
    typeArguments: null,
    start,
    end,
  };
}
