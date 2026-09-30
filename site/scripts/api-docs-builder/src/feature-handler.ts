import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Expression, ObjectExpression, ObjectProperty, TSSignature, TSType } from 'oxc-parser';

import { abbreviateType, formatDetailedType } from './formatter.js';
import type { OxcProject, ResolvedDeclaration, ResolvedMember, SourceFile } from './oxc-project.js';
import {
  expressionText,
  getJSDocDescription,
  isOptionalParameter,
  literalValue,
  OxcProject as Project,
  parameterPattern,
  parameterTypeAnnotation,
  staticName,
  typeNameText,
  unwrapExpression,
  unwrapObjectExpression,
} from './oxc-project.js';
import type { FeatureActionDef, FeatureConfigDef, FeatureReference, FeatureStateDef } from './types.js';
import { log } from './utils.js';

const SKIP_FILES = new Set(['index.ts', 'presets.ts', 'feature.parts.ts']);
const UNRESOLVED_TYPE = 'unknown';

/**
 * Feature names whose kebab-cased form doesn't match the docs page slug. Example: `textTrack` →
 * `feature-text-tracks.mdx`.
 */
const FEATURE_SLUG_OVERRIDES: Record<string, string> = {
  textTrack: 'text-tracks',
};

/** Docs page slug for a feature's reference page, shared by feature and preset references. */
export function featureDocsSlug(featureName: string): string {
  const override = FEATURE_SLUG_OVERRIDES[featureName];
  if (override) return `reference/api/feature-${override}`;

  const kebab = featureName.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

  return `reference/api/feature-${kebab}`;
}

interface FeatureSource {
  file: SourceFile;
  name: string;
  stateTypeName?: string;
  derived: DerivedKeySource[];
  config: FeatureConfigSource[];
  description?: string;
}

interface DerivedKeySource {
  name: string;
  property: ObjectProperty;
  description?: string;
}

interface FeatureConfigSource {
  name: string;
  actionKey: string;
  stateKey: string;
  description?: string;
  defaultValue?: string;
  attribute?: string;
}

export interface FeatureResult {
  name: string;
  slug: string;
  reference: FeatureReference;
}

/** Generate feature references from authored feature and media-state declarations. */
export function generateFeatureReferences(monorepoRoot: string): FeatureResult[] {
  const featuresDir = path.join(monorepoRoot, 'packages/core/src/dom/store/features');
  const stateFilePath = path.join(monorepoRoot, 'packages/media/src/core/state.ts');
  if (!fs.existsSync(featuresDir) || !fs.existsSync(stateFilePath)) return [];

  const project = new Project(monorepoRoot);
  const sources = discoverFeatureSources(featuresDir, project);
  const results: FeatureResult[] = [];

  for (const source of sources) {
    const sourceState = source.stateTypeName
      ? project.resolveName(source.file.filePath, source.stateTypeName)
      : undefined;
    const publishedState = source.stateTypeName ? project.resolveName(stateFilePath, source.stateTypeName) : undefined;
    const config = extractFeatureConfig(project, source, sourceState);
    let shape: PublishedShape;

    if (!source.stateTypeName) {
      shape = { state: {}, actions: {} };
    } else if (publishedState) {
      shape = extractInterface(project, publishedState);
    } else if (sourceState) {
      shape = extractLocalPublishedShape(project, source, sourceState);
      shape.description = source.description;
    } else {
      log.warn(
        `feature "${source.name}": state() names "${source.stateTypeName}", which cannot be resolved — no reference generated.`
      );
      continue;
    }

    const reference: FeatureReference = {
      name: source.name,
      slug: source.name,
      docsSlug: featureDocsSlug(source.name),
      state: shape.state,
      actions: shape.actions,
      config,
    };

    if (shape.description) reference.description = shape.description;

    results.push({ name: source.name, slug: source.name, reference });
  }

  return results;
}

function discoverFeatureSources(featuresDir: string, project: OxcProject): FeatureSource[] {
  const sources: FeatureSource[] = [];

  for (const entry of fs.readdirSync(featuresDir)) {
    if (!entry.endsWith('.ts') || SKIP_FILES.has(entry)) continue;

    const file = project.source(path.join(featuresDir, entry));
    if (!file) continue;

    for (const statement of file.program.body) {
      if (statement.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'VariableDeclaration')
        continue;

      for (const declaration of statement.declaration.declarations) {
        const exportName = staticName(declaration.id);
        if (!exportName?.endsWith('Feature') || exportName.endsWith('Features') || !declaration.init) continue;

        const initializer = unwrapExpression(declaration.init);
        if (initializer.type !== 'CallExpression') continue;

        const argument = initializer.arguments[0];
        if (!argument || argument.type === 'SpreadElement') continue;

        const feature = unwrapObjectExpression(argument);
        if (!feature) continue;

        const name = stringProperty(feature, 'name');
        const stateProperty = objectProperty(feature, 'state');
        if (!name || !stateProperty) continue;

        const stateFunction = unwrapExpression(stateProperty.value);
        if (stateFunction.type !== 'ArrowFunctionExpression' && stateFunction.type !== 'FunctionExpression') continue;

        if (!stateFunction.body) continue;

        const stateType = stateFunction.returnType?.typeAnnotation;
        const stateTypeName = stateType?.type === 'TSTypeReference' ? typeNameText(stateType.typeName) : undefined;
        const silent = isEmptyState(stateFunction.body);
        if (!stateTypeName && !silent) continue;

        const derivedObject = objectProperty(feature, 'derived');
        const configObject = objectProperty(feature, 'config');
        const derived = parseDerived(file, derivedObject?.value);
        const config = parseConfig(file, configObject?.value, name);
        const defaults = parseStateInitialValues(file, stateFunction.body);

        for (const item of config) item.defaultValue = defaults.get(item.stateKey);

        sources.push({
          file,
          name,
          ...(stateTypeName ? { stateTypeName } : {}),
          derived,
          config,
          ...(getJSDocDescription(file, declaration) ? { description: getJSDocDescription(file, declaration) } : {}),
        });
      }
    }
  }

  return sources;
}

function parseDerived(file: SourceFile, expression: Expression | undefined): DerivedKeySource[] {
  const object = expression ? unwrapObjectExpression(expression) : undefined;
  if (!object) return [];

  return object.properties.flatMap((property) => {
    if (property.type !== 'Property') return [];

    const name = staticName(property.key);
    if (!name) return [];

    const description = getJSDocDescription(file, property);

    return [{ name, property, ...(description ? { description } : {}) }];
  });
}

function parseConfig(file: SourceFile, expression: Expression | undefined, featureName: string): FeatureConfigSource[] {
  const object = expression ? unwrapObjectExpression(expression) : undefined;
  if (!object) return [];

  const entries: FeatureConfigSource[] = [];

  for (const property of object.properties) {
    if (property.type !== 'Property' || property.kind !== 'init') continue;

    const name = staticName(property.key);
    const value = unwrapObjectExpression(property.value);
    if (!name || !value) continue;

    const action = objectProperty(value, 'action');
    const state = objectProperty(value, 'state');
    const actionKey = action ? configKeyReference(action.value) : undefined;
    const stateKey = state ? configKeyReference(state.value) : undefined;

    if (!actionKey || !stateKey) {
      log.warn(
        `feature "${featureName}": config input "${name}" has an unreadable action or state — omitted from the reference.`
      );
      continue;
    }

    const html = objectProperty(value, 'html');
    const htmlObject = html ? unwrapObjectExpression(html.value) : undefined;
    const attribute = htmlObject ? stringProperty(htmlObject, 'attribute') : undefined;
    const description = getJSDocDescription(file, property);

    entries.push({
      name,
      actionKey,
      stateKey,
      ...(description ? { description } : {}),
      ...(attribute ? { attribute } : {}),
    });
  }

  return entries;
}

function parseStateInitialValues(
  file: SourceFile,
  body: Expression | import('oxc-parser').BlockStatement
): Map<string, string> {
  const result = new Map<string, string>();
  const object = body.type === 'BlockStatement' ? returnedObject(body) : unwrapObjectExpression(body);
  if (!object) return result;

  const constants = literalConstants(file);

  for (const property of object.properties) {
    if (property.type !== 'Property' || property.kind !== 'init') continue;

    const key = property.computed && property.key.type === 'Identifier' ? property.key.name : staticName(property.key);
    if (!key) continue;

    const initializer = unwrapExpression(property.value);
    if (initializer.type === 'Identifier' && initializer.name === 'undefined') continue;

    const resolved = initializer.type === 'Identifier' ? constants.get(initializer.name) : undefined;

    result.set(key, resolved ?? expressionText(file, initializer));
  }

  return result;
}

function literalConstants(file: SourceFile): Map<string, string> {
  const result = new Map<string, string>();

  for (const statement of file.program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'VariableDeclaration' || declaration.kind !== 'const') continue;

    for (const item of declaration.declarations) {
      const name = staticName(item.id);
      const value = item.init ? literalValue(item.init) : undefined;
      if (!name || value === undefined) continue;

      result.set(name, typeof value === 'string' ? `'${value.replaceAll("'", "\\'")}'` : String(value));
    }
  }

  return result;
}

interface PublishedShape {
  state: Record<string, FeatureStateDef>;
  actions: Record<string, FeatureActionDef>;
  description?: string;
}

function extractInterface(project: OxcProject, declaration: ResolvedDeclaration): PublishedShape {
  const name = 'id' in declaration.declaration ? staticName(declaration.declaration.id) : undefined;
  if (!name) return { state: {}, actions: {} };

  const reference: import('oxc-parser').TSTypeReference = {
    type: 'TSTypeReference',
    typeName: { type: 'Identifier', name, start: declaration.declaration.start, end: declaration.declaration.end },
    typeArguments: null,
    start: declaration.declaration.start,
    end: declaration.declaration.end,
  };
  const shape = extractMembers(project, project.interfaceMembers({ file: declaration.file, type: reference }));

  return {
    ...shape,
    ...(getJSDocDescription(declaration.file, declaration.declaration)
      ? { description: getJSDocDescription(declaration.file, declaration.declaration) }
      : {}),
  };
}

function extractLocalPublishedShape(
  project: OxcProject,
  source: FeatureSource,
  declaration: ResolvedDeclaration
): PublishedShape {
  const shape = extractInterface(project, declaration);

  for (const item of source.derived) {
    const type = derivedReturnType(item.property);
    const definition: FeatureStateDef = {
      type: type ? formatDetailedType(project, { file: source.file, type }, false) : UNRESOLVED_TYPE,
    };

    if (item.description) definition.description = item.description;

    shape.state[item.name] = definition;
  }

  return shape;
}

function extractMembers(project: OxcProject, members: readonly ResolvedMember[]): PublishedShape {
  const state: Record<string, FeatureStateDef> = {};
  const actions: Record<string, FeatureActionDef> = {};

  for (const resolved of members) {
    const member = resolved.member;
    if ('computed' in member && member.computed) continue;

    const name = 'key' in member ? staticName(member.key) : undefined;
    if (!name) continue;

    const description = getJSDocDescription(resolved.file, member);

    if (member.type === 'TSMethodSignature') {
      const type = formatMethod(project, resolved.file, member, resolved.substitutions);
      const abbreviated = abbreviateType(name, type);
      const definition: FeatureActionDef = { type: abbreviated ?? type };

      if (abbreviated && abbreviated !== type) definition.detailedType = type;

      if (description) definition.description = description;

      actions[name] = definition;
      continue;
    }

    if (member.type !== 'TSPropertySignature' || !member.typeAnnotation) continue;

    if (member.typeAnnotation.typeAnnotation.type === 'TSFunctionType') {
      const type = formatDetailedType(
        project,
        { file: resolved.file, type: member.typeAnnotation.typeAnnotation, substitutions: resolved.substitutions },
        member.optional
      );
      const abbreviated = abbreviateType(name, type);
      const definition: FeatureActionDef = { type: abbreviated ?? type };

      if (abbreviated && abbreviated !== type) definition.detailedType = type;

      if (description) definition.description = description;

      actions[name] = definition;
    } else {
      const definition: FeatureStateDef = {
        type: formatDetailedType(
          project,
          { file: resolved.file, type: member.typeAnnotation.typeAnnotation, substitutions: resolved.substitutions },
          member.optional
        ),
      };

      if (description) definition.description = description;

      state[name] = definition;
    }
  }

  return { state, actions };
}

function extractFeatureConfig(
  project: OxcProject,
  source: FeatureSource,
  sourceState: ResolvedDeclaration | undefined
): Record<string, FeatureConfigDef> {
  const config: Record<string, FeatureConfigDef> = {};
  const sourceStateName =
    sourceState && 'id' in sourceState.declaration ? staticName(sourceState.declaration.id) : undefined;
  const members =
    sourceState && sourceStateName
      ? project.interfaceMembers({
          file: sourceState.file,
          type: {
            type: 'TSTypeReference',
            typeName: {
              type: 'Identifier',
              name: sourceStateName,
              start: sourceState.declaration.start,
              end: sourceState.declaration.end,
            },
            typeArguments: null,
            start: sourceState.declaration.start,
            end: sourceState.declaration.end,
          },
        })
      : [];

  for (const entry of source.config) {
    const member = members.find((resolved) => memberMatches(resolved.member, entry.actionKey));
    const parameterType = member ? firstParameterType(member.member) : undefined;
    let type = parameterType
      ? formatDetailedType(
          project,
          { file: member!.file, type: parameterType, substitutions: member!.substitutions },
          false
        )
      : UNRESOLVED_TYPE;

    if (type === UNRESOLVED_TYPE) {
      log.warn(
        `feature "${source.name}": config input "${entry.name}" points at action "${entry.actionKey}", which has no matching source-state member — type left as "${UNRESOLVED_TYPE}".`
      );
    } else {
      type = configUnionOrder(type);
    }

    const definition: FeatureConfigDef = { type };

    if (entry.defaultValue) definition.default = entry.defaultValue;

    if (entry.description) definition.description = entry.description;

    if (entry.attribute) definition.attribute = entry.attribute;

    config[entry.name] = definition;
  }

  return config;
}

function memberMatches(member: TSSignature, actionKey: string): boolean {
  if (!('key' in member)) return false;

  if ('computed' in member && member.computed && member.key.type === 'Identifier') return member.key.name === actionKey;

  return staticName(member.key) === actionKey;
}

function firstParameterType(member: TSSignature): TSType | undefined {
  const parameter =
    member.type === 'TSMethodSignature'
      ? member.params[0]
      : member.type === 'TSPropertySignature' && member.typeAnnotation?.typeAnnotation.type === 'TSFunctionType'
        ? member.typeAnnotation.typeAnnotation.params[0]
        : undefined;
  if (!parameter) return undefined;

  return parameterTypeAnnotation(parameter);
}

function formatMethod(
  project: OxcProject,
  file: SourceFile,
  member: Extract<TSSignature, { type: 'TSMethodSignature' }>,
  substitutions?: ReadonlyMap<string, import('./oxc-project.js').ResolvedType>
): string {
  const parameters = member.params.map((parameter) => {
    const pattern = parameterPattern(parameter);
    const binding = pattern.type === 'AssignmentPattern' ? pattern.left : pattern;
    const name = binding.type === 'Identifier' ? binding.name.replace(/^_/, '') : '...';
    const annotation = parameterTypeAnnotation(parameter);
    const optional = parameter.type !== 'RestElement' && isOptionalParameter(parameter);
    const type = annotation
      ? formatDetailedType(project, { file, type: annotation, substitutions }, optional)
      : UNRESOLVED_TYPE;

    return `${parameter.type === 'RestElement' ? '...' : ''}${name}${optional ? '?' : ''}: ${type}`;
  });
  const returnType = member.returnType
    ? formatDetailedType(project, { file, type: member.returnType.typeAnnotation, substitutions }, false)
    : 'void';

  return `(${parameters.join(', ')}) => ${returnType}`;
}

function derivedReturnType(property: ObjectProperty): TSType | undefined {
  const value = unwrapExpression(property.value);

  return value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression'
    ? value.returnType?.typeAnnotation
    : undefined;
}

function objectProperty(object: ObjectExpression, name: string): ObjectProperty | undefined {
  return object.properties.find(
    (property): property is ObjectProperty =>
      property.type === 'Property' && property.kind === 'init' && staticName(property.key) === name
  );
}

function stringProperty(object: ObjectExpression, name: string): string | undefined {
  const property = objectProperty(object, name);
  const value = property ? literalValue(property.value) : undefined;

  return typeof value === 'string' ? value : undefined;
}

function configKeyReference(expression: Expression): string | undefined {
  const value = unwrapExpression(expression);
  if (value.type === 'Identifier') return value.name;

  return value.type === 'Literal' && typeof value.value === 'string' ? value.value : undefined;
}

function returnedObject(block: import('oxc-parser').BlockStatement): ObjectExpression | undefined {
  for (const statement of block.body) {
    if (statement.type === 'ReturnStatement' && statement.argument) return unwrapObjectExpression(statement.argument);
  }

  return undefined;
}

function isEmptyState(body: Expression | import('oxc-parser').BlockStatement): boolean {
  return body.type !== 'BlockStatement' && unwrapObjectExpression(body)?.properties.length === 0;
}

function configUnionOrder(type: string): string {
  const members = type.split(' | ');
  if (!members.includes('undefined') || !members.includes('null')) return type;

  return ['undefined', 'null', ...members.filter((member) => member !== 'undefined' && member !== 'null')].join(' | ');
}
