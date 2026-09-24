import { isPlainObject, isString } from '@videojs/utils/predicate';

import type { ComponentMeta } from '../components/meta';

/** The key VJSC's facts live under in a module's Rolldown metadata, which every plugin shares. */
const BUILD_META_KEY = 'vjsc';

/** Facts compiler passes record on a module's Rolldown metadata for the graph to read once the build ends. */
export interface ModuleBuildMeta {
  /** Static metadata the component metadata pass read from the module's `meta` export and path defaults. */
  readonly moduleMeta?: ComponentMeta | undefined;
  /** Declared cascade order of the style output files this module's CSS assets belong to. */
  readonly styleOrder?: readonly string[] | undefined;
  /** Facts target transforms recorded with `annotate`, keyed by the transform that owns them. */
  readonly annotations?: Readonly<Record<string, unknown>> | undefined;
}

export function readModuleBuildMeta(meta: unknown): ModuleBuildMeta | undefined {
  const facts = isPlainObject(meta) ? meta[BUILD_META_KEY] : undefined;
  if (!isPlainObject(facts)) return undefined;

  const moduleMeta = isComponentMeta(facts.moduleMeta) ? facts.moduleMeta : undefined;
  const styleOrder = readStringArray(facts.styleOrder);
  const annotations = isPlainObject(facts.annotations) ? facts.annotations : undefined;

  return { moduleMeta, styleOrder, annotations };
}

/** A module's Rolldown metadata with VJSC's facts updated, leaving every other plugin's metadata as it was. */
export function mergeModuleBuildMeta(meta: unknown, update: ModuleBuildMeta): Readonly<Record<string, unknown>> {
  const current = isPlainObject(meta) ? meta : {};
  const facts = isPlainObject(current[BUILD_META_KEY]) ? current[BUILD_META_KEY] : {};

  return { ...current, [BUILD_META_KEY]: { ...facts, ...update } };
}

/**
 * A copy of resolved metadata without VJSC's facts, for a module identity of its own. A query variant starts from its
 * file's resolver metadata but must not share the object, or record the facts of another variant.
 */
export function withoutModuleBuildMeta(meta: unknown): Record<string, unknown> {
  if (!isPlainObject(meta)) return {};

  const { [BUILD_META_KEY]: _facts, ...rest } = meta;

  return rest;
}

function readStringArray(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.every((entry) => isString(entry)) ? value : undefined;
}

function isComponentMeta(value: unknown): value is ComponentMeta {
  return isPlainObject(value) && isString(value.name);
}
