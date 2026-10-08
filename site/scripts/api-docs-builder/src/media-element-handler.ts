import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  CallExpression,
  Class,
  Expression,
  ParamPattern,
  ArrowFunctionExpression,
  MethodDefinition,
  ObjectExpression,
  TSType,
} from 'oxc-parser';

import { extractCSSVars } from './css-vars-handler.js';
import { collectDispatchedEvents, collectFires } from './event-handler.js';
import { abbreviateType, formatDetailedType } from './formatter.js';
import {
  expressionText,
  getJSDoc,
  getJSDocDescription,
  type NamedDeclaration,
  type OxcProject,
  OxcProject as Project,
  parameterPattern,
  type ResolvedMember,
  type ResolvedType,
  type SourceFile,
  sourceText,
  staticName,
  unwrapExpression,
  unwrapObjectExpression,
  unwrapType,
  walkAst,
} from './oxc-project.js';
import type {
  EngineOptionDef,
  HostPropertyDef,
  MediaEventDef,
  MediaReference,
  MediaTargetTag,
  ReactMediaReference,
} from './types.js';

const HOST_BASE_CLASSES = new Set(['HTMLMediaAdapter', 'HTMLVideoAdapter', 'HTMLAudioAdapter', 'EventTarget']);
const EXCLUDED_METHOD_NAMES = new Set([
  'attach',
  'detach',
  'destroy',
  'addEventListener',
  'removeEventListener',
  'querySelector',
  'querySelectorAll',
]);
const LITERAL_IDENTIFIERS = new Set(['NaN', 'Infinity']);
const INFERRED_MEDIA_PROPERTY_TYPES: Readonly<Record<string, string>> = {
  audioRenditions: 'AudioRenditionListLike | undefined',
  audioTracks: 'AudioTrackListLike | undefined',
  autoplay: 'boolean',
  buffered: 'TimeRangeLike',
  contentData: 'MediaContentData | undefined',
  controls: 'boolean',
  currentSrc: 'string',
  currentTime: 'number',
  defaultMuted: 'boolean',
  disablePictureInPicture: 'boolean',
  duration: 'number',
  ended: 'boolean',
  isFullscreen: 'boolean',
  isPictureInPicture: 'boolean',
  liveEdgeStart: 'number',
  loop: 'boolean',
  muted: 'boolean',
  paused: 'boolean',
  playbackRate: 'number',
  playsInline: 'boolean',
  poster: 'string',
  preload: 'MediaPreloadType',
  readyState: 'number',
  seekable: 'TimeRangeLike',
  seeking: 'boolean',
  src: 'string',
  streamType: 'MediaStreamType',
  targetLiveWindow: 'number',
  textTracks: 'TextTrackListLike',
  videoHeight: 'number',
  videoRenditions: 'VideoRenditionListLike | undefined',
  videoTracks: 'VideoTrackListLike | undefined',
  videoWidth: 'number',
  volume: 'number',
  webkitCurrentPlaybackTargetIsWireless: 'boolean | undefined',
  webkitPresentationMode: 'WebKitPresentationMode | undefined',
};

type InferredClassPropertyTypes = Readonly<Record<string, Readonly<Record<string, string>>>>;

const INFERRED_CLASS_PROPERTY_TYPES: InferredClassPropertyTypes = {
  HlsJsAdapter: { engine: 'Hls | null', error: 'MediaError | null' },
  NativeHlsMediaBase: { engine: 'null' },
  PlayerJsAdapter: { engine: 'Window | null' },
  ShakaMediaBase: { error: 'MediaError | null' },
  TikTokAdapter: { engine: 'Window | null' },
};

interface MediaElementSource {
  defineFilePath: string;
  className: string;
  tagName: string;
  mediaFilePath: string;
  hostFilePath: string;
  hostClassName: string;
  mediaType: 'video' | 'audio';
  targetTag: MediaTargetTag;
}

interface StaticMediaProperty {
  property: string;
  attribute: string;
}

interface HostExtraction {
  properties: Record<string, HostPropertyDef>;
  files: string[];
}

export interface MediaElementResult {
  name: string;
  reference: MediaReference;
}

/** Generate media-element references using Oxc syntax and authored type declarations. */
export function generateMediaElementReferences(monorepoRoot: string): MediaElementResult[] {
  const project = new Project(monorepoRoot);
  const sources = discoverMediaElements(monorepoRoot, project);
  if (sources.length === 0) return [];

  const customMediaPath = path.join(
    monorepoRoot,
    'packages/media/src/dom/custom-media-element/custom-media-element.ts'
  );
  if (!fs.existsSync(customMediaPath)) return [];

  const staticProperties = extractStaticProperties(customMediaPath, project);
  const mediaTypesPath = path.join(monorepoRoot, 'packages/media/src/core/types.ts');
  const videoEvents = extractEventsFromTypes(mediaTypesPath, 'VideoEvents', project);
  const audioEvents = extractEventsFromTypes(mediaTypesPath, 'AudioEvents', project);
  const customEventNames = new Set([
    ...extractEventsFromTypes(mediaTypesPath, 'MediaStreamTypeEvents', project),
    ...extractEventsFromTypes(mediaTypesPath, 'MediaLiveEvents', project),
  ]);
  const mediaHostPath = path.join(monorepoRoot, 'packages/media/src/dom/html-media-adapter/html-media-adapter.ts');
  const videoHostPath = path.join(monorepoRoot, 'packages/media/src/dom/html-video-adapter/html-video-adapter.ts');
  const audioHostPath = path.join(monorepoRoot, 'packages/media/src/dom/html-audio-adapter/html-audio-adapter.ts');
  const baseMethods = extractPublicMethodNames(mediaHostPath, 'HTMLMediaAdapter', project);
  const videoMethods = mergeNames(baseMethods, extractPublicMethodNames(videoHostPath, 'HTMLVideoAdapter', project));
  const audioMethods = mergeNames(baseMethods, extractPublicMethodNames(audioHostPath, 'HTMLAudioAdapter', project));
  const nativeNames = collectNativeMemberNames();
  const baseHost = extractHostProperties(mediaHostPath, 'HTMLMediaAdapter', project, nativeNames);
  const videoHost = extractHostProperties(videoHostPath, 'HTMLVideoAdapter', project, nativeNames);
  const audioHost = extractHostProperties(audioHostPath, 'HTMLAudioAdapter', project, nativeNames);
  const videoBaseSurface = { ...baseHost.properties, ...videoHost.properties };
  const audioBaseSurface = { ...baseHost.properties, ...audioHost.properties };
  const videoCSSVars = cssVarsRecord(extractCSSVars(customMediaPath, project, 'Video'));
  const audioCSSVars = cssVarsRecord(extractCSSVars(customMediaPath, project, 'Audio'));
  const results: MediaElementResult[] = [];

  for (const source of sources) {
    const host = extractHostProperties(source.hostFilePath, source.hostClassName, project, nativeNames);
    const baseSurface =
      source.targetTag === 'video' ? videoBaseSurface : source.targetTag === 'audio' ? audioBaseSurface : {};
    const publicProperties = { ...baseSurface, ...host.properties };
    const propertyDefinitions: Record<string, HostPropertyDef> = {};

    for (const [name, definition] of Object.entries(baseSurface)) {
      if (!definition.overridesNative) propertyDefinitions[name] = definition;
    }

    Object.assign(propertyDefinitions, host.properties);

    const standardAttributes: string[] = [];
    const customAttributes: Record<string, HostPropertyDef> = {};

    for (const { property, attribute } of staticProperties) {
      const definition = publicProperties[property];

      if (source.targetTag === 'iframe') {
        if (definition) customAttributes[attribute] = { ...definition, readonly: false };
      } else if (definition && !definition.overridesNative) {
        customAttributes[attribute] = { ...definition, readonly: false };
      } else {
        standardAttributes.push(attribute);
      }
    }

    const files = [...new Set(host.files)];
    const fires = collectFires(files, project);
    const dispatched = collectDispatchedEvents(files, project);
    const contractEvents = source.mediaType === 'video' ? videoEvents : audioEvents;
    const contractSet = new Set(contractEvents);
    const customNames = new Set(fires.keys());

    if (source.targetTag === 'iframe') {
      for (const name of dispatched) {
        if (!contractSet.has(name)) customNames.add(name);
      }
    }

    const customEvents: MediaEventDef[] = [...customNames]
      .sort()
      .map((name) => ({ name, ...(fires.get(name) ? { description: fires.get(name)! } : {}) }));
    const customSet = new Set(customEvents.map((event) => event.name));
    const standardEvents = contractEvents.filter(
      (name) =>
        !customSet.has(name) && !customEventNames.has(name) && (source.targetTag !== 'iframe' || dispatched.has(name))
    );
    const baseMethodNames =
      source.targetTag === 'video' ? videoMethods : source.targetTag === 'audio' ? audioMethods : [];
    const methods = mergeNames(
      baseMethodNames,
      extractPublicMethodNames(source.hostFilePath, source.hostClassName, project)
    );
    const nativeProperties = Object.entries(baseSurface)
      .filter(([name, definition]) => definition.overridesNative && !(name in host.properties))
      .map(([name]) => name)
      .sort();
    const react = extractReactReference(monorepoRoot, source, project, publicProperties);
    const engineOptions = extractEngineOptions(source, project);
    const cssCustomProperties =
      source.targetTag === 'video' ? videoCSSVars : source.targetTag === 'audio' ? audioCSSVars : {};

    const reference: MediaReference = {
      name: source.className,
      tagName: source.tagName,
      mediaType: source.mediaType,
      ...(engineOptions ? { engineOptions } : {}),
      platforms: {
        html: {
          target: source.targetTag,
          attributes: { standard: standardAttributes.sort(), custom: customAttributes },
          properties: { definitions: propertyDefinitions, native: nativeProperties },
          events: { standard: standardEvents, custom: customEvents },
          methods,
          cssCustomProperties,
        },
        ...(react ? { react } : {}),
      },
    };

    results.push({ name: source.className, reference });
  }

  return results;
}

function discoverMediaElements(monorepoRoot: string, project: OxcProject): MediaElementSource[] {
  const defineDir = path.join(monorepoRoot, 'packages/html/src/define/media');
  if (!fs.existsSync(defineDir)) return [];

  const sources: MediaElementSource[] = [];

  const entryPaths = fs.readdirSync(defineDir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isFile() && entry.name.endsWith('.ts')) return [path.join(defineDir, entry.name)];

    const indexPath = path.join(defineDir, entry.name, 'index.ts');

    return entry.isDirectory() && fs.existsSync(indexPath) ? [indexPath] : [];
  });

  for (const entryPath of entryPaths) {
    for (const filePath of publicImplementationFiles(entryPath, project, new Set())) {
      const file = project.source(filePath);
      if (!file) continue;

      for (const statement of file.program.body) {
        if (statement.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'ClassDeclaration') continue;

        const declaration = statement.declaration;
        const name = declaration.id?.name;
        const tagName = staticStringClassProperty(declaration, 'tagName');
        const base = declaration.superClass;
        if (!name || !tagName || base?.type !== 'Identifier') continue;

        const mediaDeclaration = project.resolveName(filePath, base.name);
        if (!mediaDeclaration || mediaDeclaration.declaration.type !== 'ClassDeclaration') continue;

        const composition = findCustomMediaComposition(mediaDeclaration.file, mediaDeclaration.declaration, project);
        if (!composition) continue;

        const host = project.resolveName(mediaDeclaration.file.filePath, composition.hostClassName);
        if (!host || host.declaration.type !== 'ClassDeclaration') continue;

        // The composition may name the host through an import alias; property extraction needs the declared name.
        const hostClassName = host.declaration.id?.name ?? composition.hostClassName;

        sources.push({
          defineFilePath: filePath,
          className: stripElementSuffix(name),
          tagName,
          mediaFilePath: mediaDeclaration.file.filePath,
          hostFilePath: host.file.filePath,
          hostClassName,
          mediaType: composition.mediaType,
          targetTag: composition.targetTag,
        });
      }
    }
  }

  return sources;
}

function publicImplementationFiles(entryPath: string, project: OxcProject, visited: Set<string>): string[] {
  const absolute = path.resolve(entryPath);
  if (visited.has(absolute)) return [];

  visited.add(absolute);

  const file = project.source(absolute);
  if (!file) return [];

  const reexports = file.program.body.flatMap((statement) => {
    if (statement.type !== 'ExportAllDeclaration') return [];

    const target = project.resolveModule(file.filePath, statement.source.value);

    return target ? publicImplementationFiles(target, project, visited) : [];
  });

  return [absolute, ...reexports];
}

function findCustomMediaComposition(
  file: SourceFile,
  declaration: Class,
  project: OxcProject
): { hostClassName: string; mediaType: 'video' | 'audio'; targetTag: MediaTargetTag } | undefined {
  const expressions: Expression[] = [];

  if (declaration.superClass) expressions.push(resolveLocalExpression(file, declaration.superClass, project));

  for (const statement of file.program.body) {
    const candidate = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;

    if (candidate?.type === 'ClassDeclaration' && candidate.superClass) expressions.push(candidate.superClass);
  }

  for (const expression of expressions) {
    let found: { hostClassName: string; mediaType: 'video' | 'audio'; targetTag: MediaTargetTag } | undefined;

    walkAst(expression, (node) => {
      if (found || node.type !== 'CallExpression' || node.callee.type !== 'Identifier') return;

      if (node.callee.name !== 'CustomMediaElement' || node.arguments.length < 2) return;

      const target = node.arguments[0];
      const host = node.arguments[1];

      if (
        !target ||
        target.type !== 'Literal' ||
        typeof target.value !== 'string' ||
        !['video', 'audio', 'iframe'].includes(target.value) ||
        !host ||
        host.type !== 'Identifier'
      ) {
        return;
      }

      const targetTag = target.value as MediaTargetTag;

      found = {
        hostClassName: host.name,
        targetTag,
        mediaType:
          targetTag === 'audio' || (targetTag === 'iframe' && declaration.id?.name.endsWith('Audio'))
            ? 'audio'
            : 'video',
      };
    });

    if (found) return found;
  }

  return undefined;
}

function extractHostProperties(
  filePath: string,
  className: string,
  project: OxcProject,
  nativeNames: Set<string>
): HostExtraction {
  const properties: Record<string, HostPropertyDef> = {};
  const files: string[] = [];

  walkClassSurface(filePath, className, project, properties, nativeNames, files, new Set());

  const defaults = new Map<string, string>();

  for (const file of files) {
    for (const [name, value] of collectFileDefaults(file, project)) defaults.set(name, value);
  }

  for (const [name, definition] of Object.entries(properties)) {
    const value = defaults.get(name);

    if (value !== undefined) definition.default = value;
  }

  return { properties, files };
}

function walkClassSurface(
  filePath: string,
  className: string,
  project: OxcProject,
  properties: Record<string, HostPropertyDef>,
  nativeNames: Set<string>,
  files: string[],
  visited: Set<string>
): void {
  const resolved = project.resolveName(filePath, className);
  if (!resolved || resolved.declaration.type !== 'ClassDeclaration') return;

  const key = `${resolved.file.filePath}#${className}`;
  if (visited.has(key)) return;

  visited.add(key);

  if (resolved.declaration.superClass) {
    walkExtends(
      resolveLocalExpression(resolved.file, resolved.declaration.superClass, project),
      resolved.file,
      project,
      properties,
      nativeNames,
      files,
      visited
    );
  }

  files.push(resolved.file.filePath);
  applyClassMembers(resolved.file, resolved.declaration, project, properties, nativeNames);
}

function walkExtends(
  expression: Expression,
  file: SourceFile,
  project: OxcProject,
  properties: Record<string, HostPropertyDef>,
  nativeNames: Set<string>,
  files: string[],
  visited: Set<string>
): void {
  const value = resolveLocalExpression(file, expression, project);

  if (value.type === 'Identifier') {
    if (!HOST_BASE_CLASSES.has(value.name)) {
      walkClassSurface(file.filePath, value.name, project, properties, nativeNames, files, visited);
    }

    return;
  }

  if (value.type !== 'CallExpression') return;

  const { mixins, base } = unwindMixinChain(value);

  walkExtends(base, file, project, properties, nativeNames, files, visited);

  for (let index = mixins.length - 1; index >= 0; index--) {
    const mixin = resolveMixin(file.filePath, mixins[index]!, project);
    if (!mixin) continue;

    const key = `${mixin.file.filePath}#mixin#${mixins[index]}`;
    if (visited.has(key)) continue;

    visited.add(key);
    files.push(mixin.file.filePath);
    applyClassMembers(mixin.file, mixin.declaration, project, properties, nativeNames);
  }
}

function unwindMixinChain(call: CallExpression): { mixins: string[]; base: Expression } {
  const mixins: string[] = [];
  let current: Expression = call;

  while (current.type === 'CallExpression' && current.callee.type === 'Identifier') {
    mixins.push(current.callee.name);

    const argument = current.arguments[0];
    if (!argument || argument.type === 'SpreadElement') break;

    current = unwrapExpression(argument);
  }

  return { mixins, base: current };
}

function resolveMixin(
  filePath: string,
  name: string,
  project: OxcProject
): { file: SourceFile; declaration: Class } | undefined {
  const resolved = project.resolveName(filePath, name);
  if (!resolved) return undefined;

  const fn = functionFromDeclaration(resolved.declaration);
  if (!fn?.body) return undefined;

  const parameters = new Set(fn.params.map(parameterName).filter((value): value is string => !!value));
  let inner: Class | undefined;

  walkAst(fn.body, (node) => {
    if (inner || node.type !== 'ClassDeclaration' || !node.superClass) return;

    const superClass = unwrapExpression(node.superClass);

    if (superClass.type === 'Identifier' && parameters.has(superClass.name)) inner = node;
  });

  return inner ? { file: resolved.file, declaration: inner } : undefined;
}

function applyClassMembers(
  file: SourceFile,
  declaration: Class,
  project: OxcProject,
  properties: Record<string, HostPropertyDef>,
  nativeNames: Set<string>
): void {
  const getters = new Map<string, { type: string; description?: string }>();
  const setters = new Set<string>();

  for (const member of declaration.body.body) {
    if (member.type !== 'MethodDefinition' || (member.kind !== 'get' && member.kind !== 'set')) continue;

    const name = staticName(member.key);
    if (!name || member.key.type === 'PrivateIdentifier' || name.startsWith('_') || name === 'target') continue;

    if (member.kind === 'set') {
      setters.add(name);
      continue;
    }

    const returnType = member.value.returnType?.typeAnnotation ?? inferGetterType(declaration, member);
    const inferredClassType = declaration.id?.name
      ? INFERRED_CLASS_PROPERTY_TYPES[declaration.id.name]?.[name]
      : undefined;
    const type = returnType
      ? formatDetailedType(project, { file, type: returnType }, false)
      : (inferredClassType ?? INFERRED_MEDIA_PROPERTY_TYPES[name] ?? 'unknown');
    const description = getJSDocDescription(file, member);

    getters.set(name, { type, ...(description ? { description } : {}) });
  }

  for (const [name, getter] of getters) {
    const abbreviated = abbreviateType(name, getter.type);
    const definition: HostPropertyDef = { type: abbreviated ?? getter.type, readonly: !setters.has(name) };
    const description = getter.description ?? properties[name]?.description;

    if (abbreviated && abbreviated !== getter.type) definition.detailedType = getter.type;

    if (description) definition.description = description;

    if (nativeNames.has(name)) definition.overridesNative = true;

    properties[name] = definition;
  }
}

function inferGetterType(declaration: Class, getter: MethodDefinition): TSType | undefined {
  let returned: Expression | undefined;

  if (getter.value.body) {
    walkAst(getter.value.body, (node) => {
      if (!returned && node.type === 'ReturnStatement' && node.argument) returned = node.argument;
    });
  }

  if (!returned) return undefined;

  const value = unwrapExpression(returned);

  if (
    value.type === 'MemberExpression' &&
    value.object.type === 'ThisExpression' &&
    value.property.type === 'PrivateIdentifier'
  ) {
    const propertyName = value.property.name;
    const field = declaration.body.body.find(
      (member) => member.type === 'PropertyDefinition' && staticName(member.key) === propertyName
    );
    if (field?.type === 'PropertyDefinition') return field.typeAnnotation?.typeAnnotation;
  }

  return inferredExpressionType(value);
}

function inferredExpressionType(expression: Expression): TSType | undefined {
  if (expression.type === 'ObjectExpression') return syntheticKeyword('TSObjectKeyword', expression);

  if (expression.type === 'Literal') {
    if (expression.value === null) return syntheticKeyword('TSNullKeyword', expression);

    if (typeof expression.value === 'string') return syntheticKeyword('TSStringKeyword', expression);

    if (typeof expression.value === 'number') return syntheticKeyword('TSNumberKeyword', expression);

    if (typeof expression.value === 'boolean') return syntheticKeyword('TSBooleanKeyword', expression);
  }

  return undefined;
}

function extractEngineOptions(
  source: MediaElementSource,
  project: OxcProject
): Record<string, EngineOptionDef[]> | undefined {
  const sourceType = findAccessorType(source.hostFilePath, source.hostClassName, 'source', project);
  if (!sourceType) return undefined;

  const engineType = propertyType(project, nonNullable(sourceType), 'engine');
  if (!engineType) return undefined;

  const engines: Record<string, EngineOptionDef[]> = {};

  for (const engine of membersOf(project, nonNullable(engineType))) {
    if (engine.member.type !== 'TSPropertySignature' || !engine.member.typeAnnotation) continue;

    const engineName = staticName(engine.member.key);
    if (!engineName) continue;

    const configType: ResolvedType = {
      file: engine.file,
      type: engine.member.typeAnnotation.typeAnnotation,
      ...(engine.substitutions ? { substitutions: engine.substitutions } : {}),
    };
    const options: EngineOptionDef[] = [];

    for (const option of membersOf(project, nonNullable(configType))) {
      if (option.member.type !== 'TSPropertySignature' || !option.member.typeAnnotation) continue;

      const name = staticName(option.member.key);
      if (!name) continue;

      let type = formatDetailedType(
        project,
        {
          file: option.file,
          type: option.member.typeAnnotation.typeAnnotation,
          ...(option.substitutions ? { substitutions: option.substitutions } : {}),
          ...(option.deepPartial ? { deepPartial: true } : {}),
        },
        false
      );

      if (option.member.optional && !type.split(' | ').includes('undefined')) type += ' | undefined';

      const abbreviated = abbreviateType(name, type);
      const definition: EngineOptionDef = { name, type: abbreviated ?? type };

      if (abbreviated && abbreviated !== type) definition.detailedType = type;

      const description = getJSDocDescription(option.file, option.member)?.replace(/\s+/g, ' ').trim();

      if (description) definition.description = description;

      options.push(definition);
    }

    if (options.length > 0) engines[engineName] = options.sort((a, b) => a.name.localeCompare(b.name));
  }

  return Object.keys(engines).length > 0 ? engines : undefined;
}

function findAccessorType(
  filePath: string,
  className: string,
  propertyName: string,
  project: OxcProject,
  visited = new Set<string>()
): ResolvedType | undefined {
  const resolved = project.resolveName(filePath, className);
  if (!resolved || resolved.declaration.type !== 'ClassDeclaration') return undefined;

  const key = `${resolved.file.filePath}#${className}`;
  if (visited.has(key)) return undefined;

  visited.add(key);

  for (const member of resolved.declaration.body.body) {
    if (
      member.type === 'MethodDefinition' &&
      member.kind === 'get' &&
      staticName(member.key) === propertyName &&
      member.value.returnType
    ) {
      return { file: resolved.file, type: member.value.returnType.typeAnnotation };
    }
  }

  const superClass = resolved.declaration.superClass
    ? resolveLocalExpression(resolved.file, resolved.declaration.superClass, project)
    : undefined;

  if (superClass?.type === 'Identifier')
    return findAccessorType(resolved.file.filePath, superClass.name, propertyName, project, visited);

  if (superClass?.type === 'CallExpression') {
    const { mixins, base } = unwindMixinChain(superClass);

    for (const mixinName of mixins) {
      const mixin = resolveMixin(resolved.file.filePath, mixinName, project);
      const accessor = mixin ? findDirectAccessorType(mixin.file, mixin.declaration, propertyName) : undefined;
      if (accessor) return accessor;
    }

    if (base.type === 'Identifier') {
      return findAccessorType(resolved.file.filePath, base.name, propertyName, project, visited);
    }
  }

  return undefined;
}

function findDirectAccessorType(file: SourceFile, declaration: Class, propertyName: string): ResolvedType | undefined {
  const member = declaration.body.body.find(
    (entry) =>
      entry.type === 'MethodDefinition' &&
      entry.kind === 'get' &&
      staticName(entry.key) === propertyName &&
      !!entry.value.returnType
  );

  return member?.type === 'MethodDefinition' && member.value.returnType
    ? { file, type: member.value.returnType.typeAnnotation }
    : undefined;
}

function propertyType(project: OxcProject, type: ResolvedType, name: string): ResolvedType | undefined {
  const member = membersOf(project, type).find(
    (entry) => entry.member.type === 'TSPropertySignature' && staticName(entry.member.key) === name
  );

  return member?.member.type === 'TSPropertySignature' && member.member.typeAnnotation
    ? {
        file: member.file,
        type: member.member.typeAnnotation.typeAnnotation,
        ...(member.substitutions ? { substitutions: member.substitutions } : {}),
      }
    : undefined;
}

function membersOf(project: OxcProject, type: ResolvedType): ResolvedMember[] {
  const node = unwrapType(type.type);

  if (node.type === 'TSUnionType' || node.type === 'TSIntersectionType') {
    return node.types.flatMap((member) => membersOf(project, { ...type, type: member }));
  }

  return project.interfaceMembers(type);
}

function nonNullable(type: ResolvedType): ResolvedType {
  const node = unwrapType(type.type);
  if (node.type !== 'TSUnionType') return type;

  const members = node.types.filter(
    (member) => member.type !== 'TSNullKeyword' && member.type !== 'TSUndefinedKeyword'
  );

  return members.length === 1 ? { ...type, type: members[0]! } : type;
}

const defaultsCache = new Map<string, Map<string, string>>();

function collectFileDefaults(filePath: string, project: OxcProject): Map<string, string> {
  const cached = defaultsCache.get(filePath);
  if (cached) return cached;

  const defaults = new Map<string, string>();

  defaultsCache.set(filePath, defaults);

  const file = project.source(filePath);
  if (!file) return defaults;

  for (const statement of file.program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;

    // An adapter's `static defaultProps`: declared on the class itself, on a mixin it composes, or inherited.
    if (declaration?.type === 'ClassDeclaration' && declaration.id) {
      const reference = {
        type: 'MemberExpression',
        object: declaration.id,
        property: { type: 'Identifier', name: 'defaultProps', start: declaration.id.start, end: declaration.id.end },
        computed: false,
        optional: false,
        start: declaration.id.start,
        end: declaration.id.end,
      } as Expression;
      const resolved = resolveDefaultsObject(file, reference, project);
      if (!resolved) continue;

      for (const [property, value] of objectEntries(resolved.object, resolved.file, project, new Set()))
        defaults.set(property, value);
    }
  }

  return defaults;
}

function objectEntries(
  object: ObjectExpression,
  file: SourceFile,
  project: OxcProject,
  visited: Set<string>
): Map<string, string> {
  const entries = new Map<string, string>();

  for (const property of object.properties) {
    if (property.type === 'Property' && property.kind === 'init') {
      const name = staticName(property.key);
      const value = serializeDefault(property.value, file, project);

      if (name && value !== undefined) entries.set(name, value);

      continue;
    }

    if (property.type !== 'SpreadElement') continue;

    const resolved = resolveDefaultsObject(file, property.argument, project);
    if (!resolved) continue;

    const key = `${resolved.file.filePath}#${expressionText(file, property.argument)}`;
    if (visited.has(key)) continue;

    visited.add(key);

    for (const [name, value] of objectEntries(resolved.object, resolved.file, project, visited))
      entries.set(name, value);
  }

  return entries;
}

function objectNames(
  object: ObjectExpression,
  file: SourceFile,
  project: OxcProject,
  visited: Set<string>
): Set<string> {
  const names = new Set<string>();

  for (const property of object.properties) {
    if (property.type === 'Property') {
      const name = staticName(property.key);

      if (name) names.add(name);

      continue;
    }

    if (property.type !== 'SpreadElement') continue;

    const resolved = resolveDefaultsObject(file, property.argument, project);
    if (!resolved) continue;

    const key = `${resolved.file.filePath}#${expressionText(file, property.argument)}`;
    if (visited.has(key)) continue;

    visited.add(key);

    for (const name of objectNames(resolved.object, resolved.file, project, visited)) names.add(name);
  }

  return names;
}

function resolveConstObject(
  filePath: string,
  name: string,
  project: OxcProject
): { file: SourceFile; object: ObjectExpression } | undefined {
  const resolved = project.resolveName(filePath, name);
  if (resolved?.declaration.type !== 'VariableDeclarator' || !resolved.declaration.init) return undefined;

  const object = unwrapObjectExpression(resolved.declaration.init);

  return object ? { file: resolved.file, object } : undefined;
}

/**
 * Resolve the object literal behind a defaults expression: an adapter's `static defaultProps`, which may itself alias a
 * const or spread a parent adapter's defaults.
 */
function resolveDefaultsObject(
  file: SourceFile,
  expression: Expression,
  project: OxcProject,
  visited: Set<string> = new Set()
): { file: SourceFile; object: ObjectExpression } | undefined {
  const value = unwrapExpression(expression);
  if (value.type === 'ObjectExpression') return { file, object: value };

  if (value.type === 'Identifier') return resolveConstObject(file.filePath, value.name, project);

  if (
    value.type !== 'MemberExpression' ||
    value.computed ||
    value.object.type !== 'Identifier' ||
    value.property.type !== 'Identifier'
  ) {
    return undefined;
  }

  const owner = project.resolveName(file.filePath, value.object.name);
  if (!owner) return undefined;

  const key = `${owner.file.filePath}#${value.object.name}.${value.property.name}`;
  if (visited.has(key)) return undefined;

  visited.add(key);

  // A const object's member (`defaults.streamType`) resolves through the const itself.
  if (owner.declaration.type === 'VariableDeclarator') {
    return resolveConstObject(owner.file.filePath, value.object.name, project);
  }

  if (owner.declaration.type !== 'ClassDeclaration') return undefined;

  const member = owner.declaration.body.body.find(
    (entry) => entry.type === 'PropertyDefinition' && entry.static && staticName(entry.key) === value.property.name
  );

  if (member?.type === 'PropertyDefinition' && member.value) {
    return resolveDefaultsObject(owner.file, member.value, project, visited);
  }

  // Not declared here: inherited through the extends chain. A mixin's inner class may declare the static (the SPF
  // adapters do), so each mixin is checked before falling through to the base class.
  // The parent may be named through a local alias (`const AdapterBase = Mixin(Host)`), so resolve that first.
  const superClass = owner.declaration.superClass
    ? unwrapExpression(resolveLocalExpression(owner.file, owner.declaration.superClass, project))
    : undefined;
  if (!superClass) return undefined;

  if (superClass.type === 'CallExpression') {
    const { mixins, base } = unwindMixinChain(superClass);

    for (const mixin of mixins) {
      const inner = resolveMixin(owner.file.filePath, mixin, project);
      const member = inner?.declaration.body.body.find(
        (entry) => entry.type === 'PropertyDefinition' && entry.static && staticName(entry.key) === value.property.name
      );

      if (inner && member?.type === 'PropertyDefinition' && member.value) {
        return resolveDefaultsObject(inner.file, member.value, project, visited);
      }
    }

    const parent = unwrapExpression(base);
    if (parent.type !== 'Identifier') return undefined;

    return resolveDefaultsObject(owner.file, { ...value, object: { ...parent } } as Expression, project, visited);
  }

  if (superClass.type !== 'Identifier') return undefined;

  return resolveDefaultsObject(owner.file, { ...value, object: { ...superClass } } as Expression, project, visited);
}

function serializeDefault(expression: Expression, file: SourceFile, project: OxcProject): string | undefined {
  const value = unwrapExpression(expression);

  if (value.type === 'Literal' || value.type === 'UnaryExpression' || value.type === 'TemplateLiteral') {
    return expressionText(file, value);
  }

  if (value.type === 'Identifier') return LITERAL_IDENTIFIERS.has(value.name) ? value.name : undefined;

  if (value.type === 'ObjectExpression') return value.properties.length === 0 ? '{}' : '{…}';

  if (value.type === 'ArrayExpression') {
    const text = expressionText(file, value);

    return text.length <= 24 ? text : '[…]';
  }

  if (
    value.type === 'MemberExpression' &&
    !value.computed &&
    value.object.type === 'Identifier' &&
    value.property.type === 'Identifier'
  ) {
    const resolved = resolveConstObject(file.filePath, value.object.name, project);
    const property = resolved?.object.properties.find(
      (entry) => entry.type === 'Property' && staticName(entry.key) === value.property.name
    );

    return resolved && property?.type === 'Property'
      ? serializeDefault(property.value, resolved.file, project)
      : undefined;
  }

  return undefined;
}

function extractStaticProperties(filePath: string, project: OxcProject): StaticMediaProperty[] {
  const file = project.source(filePath);
  if (!file) return [];

  const properties: StaticMediaProperty[] = [];

  walkAst(file.program, (node) => {
    if (node.type !== 'PropertyDefinition' || !node.static || staticName(node.key) !== 'properties' || !node.value) {
      return;
    }

    const object = unwrapObjectExpression(node.value);
    if (!object) return;

    for (const property of object.properties) {
      if (property.type !== 'Property' || property.kind !== 'init') continue;

      const name = staticName(property.key);
      if (!name) continue;

      const config = unwrapObjectExpression(property.value);
      const attributeProperty = config?.properties.find(
        (entry) => entry.type === 'Property' && staticName(entry.key) === 'attribute'
      );
      const attribute =
        attributeProperty?.type === 'Property' && attributeProperty.value.type === 'Literal'
          ? attributeProperty.value.value
          : undefined;

      properties.push({ property: name, attribute: typeof attribute === 'string' ? attribute : name.toLowerCase() });
    }
  });

  return properties;
}

function extractReactReference(
  monorepoRoot: string,
  source: MediaElementSource,
  project: OxcProject,
  propertyDefinitions: Record<string, HostPropertyDef>
): ReactMediaReference | undefined {
  const directory = path.basename(path.dirname(source.mediaFilePath));
  const reactDirectory = path.join(monorepoRoot, 'packages/react/src/media', directory);
  const sourceBaseName = path.basename(source.mediaFilePath, path.extname(source.mediaFilePath));
  const candidates = [
    path.join(reactDirectory, 'adapter.tsx'),
    path.join(reactDirectory, `${sourceBaseName}.tsx`),
    path.join(reactDirectory, 'index.ts'),
  ];
  const reactSource = candidates.flatMap((candidate) => {
    if (!fs.existsSync(candidate)) return [];

    return [project.resolveExport(candidate, source.className) ?? project.source(candidate)].filter(
      (value): value is NonNullable<typeof value> => Boolean(value)
    );
  })[0];
  const file = reactSource && 'file' in reactSource ? reactSource.file : reactSource;
  if (!file) return undefined;

  const filePath = file.filePath;

  let target: MediaTargetTag | undefined;
  let acceptsNativeProps = false;
  let mediaRefType: string | undefined;
  let defaultsExpression: Expression | undefined;

  walkAst(file.program, (node) => {
    if (node.type === 'TSInterfaceDeclaration' && node.id.name === `${source.className}Props`) {
      acceptsNativeProps = node.extends.some((heritage) =>
        /(?:Video|Audio)HTMLAttributes/.test(sourceText(file, heritage))
      );

      for (const heritage of node.extends) {
        const match = /^MediaRefProps<\s*(\w+)\s*>$/.exec(sourceText(file, heritage));

        if (match) mediaRefType = match[1];
      }
    }

    if (node.type === 'VariableDeclarator' && staticName(node.id) === source.className && node.init) {
      const initializer = unwrapExpression(node.init);

      if (
        initializer.type === 'CallExpression' &&
        initializer.callee.type === 'Identifier' &&
        initializer.callee.name === 'forwardRef'
      ) {
        const reference = initializer.typeArguments?.params[0];
        const name = reference ? sourceText(file, reference) : '';

        if (name === 'HTMLVideoElement') target = 'video';

        if (name === 'HTMLAudioElement') target = 'audio';

        if (name === 'HTMLIFrameElement') target = 'iframe';
      }
    }

    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'useSyncProps') {
      const defaults = node.arguments[2];

      if (defaults && defaults.type !== 'SpreadElement') defaultsExpression = defaults;
    }
  });

  if (!target) return undefined;

  const props: Record<string, HostPropertyDef> = {};
  const resolved = defaultsExpression ? resolveDefaultsObject(file, defaultsExpression, project) : undefined;

  if (resolved) {
    const defaults = objectEntries(resolved.object, resolved.file, project, new Set());

    for (const name of [...objectNames(resolved.object, resolved.file, project, new Set())].sort()) {
      const definition = propertyDefinitions[name];
      const property: HostPropertyDef = definition
        ? { ...definition, readonly: false }
        : { type: 'unknown', readonly: false };
      const defaultValue = defaults.get(name);

      if (defaultValue !== undefined) property.default = defaultValue;

      props[name] = property;
    }
  }

  const mediaRef = mediaRefType ? { type: mediaRefType, ...importedFrom(file, mediaRefType) } : undefined;

  return { target, acceptsNativeProps, props, ...(mediaRef ? { mediaRef } : {}) };
}

/** The module a top-level import binds `name` from, so docs can show where to import a type the source names. */
function importedFrom(file: SourceFile, name: string): { module?: string } {
  for (const statement of file.program.body) {
    if (statement.type !== 'ImportDeclaration') continue;

    if (statement.specifiers.some((specifier) => specifier.local.name === name)) {
      return { module: statement.source.value };
    }
  }

  return {};
}

function extractPublicMethodNames(filePath: string, className: string, project: OxcProject): string[] {
  const resolved = project.resolveName(filePath, className);
  if (!resolved || resolved.declaration.type !== 'ClassDeclaration') return [];

  return resolved.declaration.body.body.flatMap((member) => {
    if (
      member.type !== 'MethodDefinition' ||
      member.kind !== 'method' ||
      member.static ||
      member.accessibility === 'private' ||
      member.accessibility === 'protected' ||
      member.key.type === 'PrivateIdentifier' ||
      getJSDoc(resolved.file, member)?.tags.has('internal')
    ) {
      return [];
    }

    const name = staticName(member.key);

    return name && !name.startsWith('_') && !EXCLUDED_METHOD_NAMES.has(name) ? [name] : [];
  });
}

function extractEventsFromTypes(filePath: string, interfaceName: string, project: OxcProject): string[] {
  const declaration = project.resolveName(filePath, interfaceName);
  const name = declaration && 'id' in declaration.declaration ? staticName(declaration.declaration.id) : undefined;
  if (!declaration || !name) return [];

  const type: import('oxc-parser').TSTypeReference = {
    type: 'TSTypeReference',
    typeName: { type: 'Identifier', name, start: declaration.declaration.start, end: declaration.declaration.end },
    typeArguments: null,
    start: declaration.declaration.start,
    end: declaration.declaration.end,
  };

  return project.interfaceMembers({ file: declaration.file, type }).flatMap((entry) => {
    if (entry.member.type !== 'TSPropertySignature') return [];

    const name = staticName(entry.member.key);

    return name ? [name] : [];
  });
}

function collectNativeMemberNames(): Set<string> {
  // Native media properties surfaced by the Video.js media hosts. Keeping this
  // authored list beside extraction avoids coupling Oxc parsing to whichever
  // TypeScript lib.dom happens to be installed for Astro.
  return new Set([
    'autoplay',
    'buffered',
    'controls',
    'crossOrigin',
    'currentSrc',
    'currentTime',
    'defaultMuted',
    'defaultPlaybackRate',
    'disablePictureInPicture',
    'disableRemotePlayback',
    'duration',
    'ended',
    'error',
    'loop',
    'muted',
    'paused',
    'playbackRate',
    'played',
    'playsInline',
    'poster',
    'preload',
    'readyState',
    'remote',
    'seekable',
    'seeking',
    'src',
    'textTracks',
    'title',
    'videoHeight',
    'videoWidth',
    'volume',
  ]);
}

function resolveLocalExpression(file: SourceFile, expression: Expression, project: OxcProject): Expression {
  const value = unwrapExpression(expression);
  if (value.type !== 'Identifier') return value;

  const local = project.declarations(file.filePath, value.name)[0]?.declaration;

  return local?.type === 'VariableDeclarator' && local.init ? unwrapExpression(local.init) : value;
}

function functionFromDeclaration(
  declaration: NamedDeclaration
): import('oxc-parser').Function | ArrowFunctionExpression | undefined {
  if (declaration.type === 'FunctionDeclaration' || declaration.type === 'TSDeclareFunction') return declaration;

  if (declaration.type !== 'VariableDeclarator' || !declaration.init) return undefined;

  const initializer = unwrapExpression(declaration.init);

  return initializer.type === 'ArrowFunctionExpression' || initializer.type === 'FunctionExpression'
    ? initializer
    : undefined;
}

function parameterName(parameter: ParamPattern): string | undefined {
  const pattern = parameterPattern(parameter);

  return pattern.type === 'Identifier' ? pattern.name : undefined;
}

function staticStringClassProperty(declaration: Class, name: string): string | undefined {
  const member = declaration.body.body.find(
    (entry) => entry.type === 'PropertyDefinition' && entry.static && staticName(entry.key) === name
  );

  return member?.type === 'PropertyDefinition' &&
    member.value?.type === 'Literal' &&
    typeof member.value.value === 'string'
    ? member.value.value
    : undefined;
}

function stripElementSuffix(name: string): string {
  return name.endsWith('Element') ? name.slice(0, -'Element'.length) : name;
}

function syntheticKeyword(
  type: 'TSObjectKeyword' | 'TSStringKeyword' | 'TSNumberKeyword' | 'TSBooleanKeyword' | 'TSNullKeyword',
  source: { start: number; end: number }
): TSType {
  return { type, start: source.start, end: source.end };
}

function mergeNames(first: readonly string[], second: readonly string[]): string[] {
  return [...new Set([...first, ...second])].sort();
}

function cssVarsRecord(extraction: ReturnType<typeof extractCSSVars>): Record<string, { description: string }> {
  return Object.fromEntries(extraction?.vars.map((entry) => [entry.name, { description: entry.description }]) ?? []);
}
