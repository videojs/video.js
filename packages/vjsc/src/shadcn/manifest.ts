import { posix } from 'node:path';

import { type Registry, type RegistryItem, registryItemSchema, registrySchema } from 'shadcn/schema';

import type { ModuleMeta } from '../components/meta';
import type { RegistryCatalogOptions } from './types';
import { assertNoCollision, normalizeGroup, validateRegistryFiles } from './validate';

export type RegistryFile = NonNullable<RegistryItem['files']>[number];

/** One finished item: its public manifest and the editable files written beside it. */
export interface BuiltItem {
  readonly group: string;
  readonly manifest: RegistryItem;
  readonly sourceFiles: ReadonlyMap<string, string>;
}

export interface ShadcnOutputFile {
  readonly path: string;
  readonly content: string;
  readonly editable: boolean;
}

export function registryFile(path: string, target: string, type: RegistryFile['type']): RegistryFile {
  return { path, target, type };
}

/** The public manifest of one item: its authored fields, files, versioned dependencies, and merged metadata. */
export function buildManifest<Meta extends ModuleMeta>(
  item: RegistryItem & { readonly build: unknown },
  options: RegistryCatalogOptions<Meta>,
  files: readonly RegistryFile[],
  dependencies: ReadonlySet<string> = new Set(item.dependencies ?? []),
  registryDependencies: ReadonlySet<string> = new Set(item.registryDependencies ?? [])
): RegistryItem {
  const { build: _build, ...manifest } = item;

  return {
    ...manifest,
    ...(files.length ? { files: [...files] } : {}),
    ...optionalList('dependencies', versionDependencies(item.name, dependencies, options)),
    ...optionalList('registryDependencies', registryDependencies),
    ...mergedMeta(options.meta, item.meta),
  };
}

/** Group finished items into the catalog's included registries and list every file to emit. */
export function assembleRegistry<Meta extends ModuleMeta>(
  builtItems: readonly BuiltItem[],
  options: RegistryCatalogOptions<Meta>
): ShadcnOutputFile[] {
  const groups = new Map<string, RegistryItem[]>();
  const names = new Map<string, string>();

  for (const item of [...builtItems].sort((left, right) => left.manifest.name.localeCompare(right.manifest.name))) {
    const group = normalizeGroup(item.group);

    assertNoCollision(names, item.manifest.name, group, 'item name');
    groups.set(group, [...(groups.get(group) ?? []), item.manifest]);
  }

  for (const groupItems of groups.values()) validateRegistryFiles(groupItems);

  const registry = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: options.name,
    homepage: options.homepage,
    include: [...groups.keys()].sort().map((group) => `./${group}/registry.json`),
    items: [],
  } satisfies Registry;

  registrySchema.parse(registry);

  const files: ShadcnOutputFile[] = [jsonFile('registry.json', registry)];

  for (const [group, groupItems] of [...groups].sort(([left], [right]) => left.localeCompare(right))) {
    for (const item of groupItems) registryItemSchema.parse(item);

    files.push(jsonFile(`${group}/registry.json`, { items: groupItems }));
  }

  for (const item of builtItems) {
    for (const [path, content] of item.sourceFiles) {
      files.push({ path: posix.join(normalizeGroup(item.group), path), content, editable: true });
    }
  }

  return files;
}

function versionDependencies<Meta extends ModuleMeta>(
  itemName: string,
  dependencies: ReadonlySet<string>,
  options: RegistryCatalogOptions<Meta>
): Set<string> {
  return new Set(
    [...dependencies].map((dependency) => {
      const pinned = options.packages?.[dependency];

      if (!pinned && options.pinned?.(dependency)) {
        throw new Error(
          `Shadcn item \`${itemName}\` depends on \`${dependency}\` without a pinned requirement.\n` +
            'Reason: installs would resolve whatever version is current instead of the one this registry was built from.\n' +
            `Recommendation: add \`${dependency}\` to the registry's \`packages\`.`
        );
      }

      return pinned ?? dependency;
    })
  );
}

function jsonFile(path: string, value: unknown): ShadcnOutputFile {
  return { path, content: `${JSON.stringify(value, null, 2)}\n`, editable: false };
}

function mergedMeta(...values: Array<RegistryItem['meta'] | undefined>): { meta?: RegistryItem['meta'] } {
  const defined = values.filter((value): value is NonNullable<typeof value> => Boolean(value));

  return defined.length ? { meta: Object.assign({}, ...defined) } : {};
}

function optionalList<Key extends string>(key: Key, values: ReadonlySet<string>): Partial<Record<Key, string[]>> {
  const list = [...values].sort();

  return list.length ? ({ [key]: list } as Partial<Record<Key, string[]>>) : {};
}
