import type { Graph, GraphModule } from 'vjsc/graph';
import { bundleStyles, relativeImport, rewriteImports, stripStyleImports } from 'vjsc/graph';

import type { SkinModuleMeta } from '../../src/meta.ts';
import { skinCatalogEntry } from '../catalog.ts';
import { skinClassNameMergeImport } from '../imports.ts';
import { skinBaseStylesheet, skinPresets, skinSourceDirectory } from '../skin.ts';
import { type SkinRoot, skinRoots } from '../variants.ts';
import type { GeneratedPackageFile } from './files.ts';
import { addCopiedFiles, addGenerated, generatedFiles } from './utils.ts';

const packageRoot = 'packages/react/src';
const internalRoot = `${packageRoot}/internal/skins`;
const radioGroupImports = new Set([
  '@videojs/react/ui/audio-track-radio-group',
  '@videojs/react/ui/captions-radio-group',
  '@videojs/react/ui/playback-rate-radio-group',
  '@videojs/react/ui/quality-radio-group',
]);

export interface CreateReactPackageSkinsOptions {
  readonly workspaceDir: string;
  readonly baseStyles?: readonly string[] | undefined;
}

/** Generate package-local React Skin implementations from one finalized VJSC module graph. */
export async function createReactPackageSkins(
  graph: Graph<SkinModuleMeta>,
  options: CreateReactPackageSkinsOptions
): Promise<GeneratedPackageFile[]> {
  const skins = skinRoots(graph, { target: 'react', style: 'css' });
  const sharedSourcePaths = collectSharedSourcePaths(skins);
  const destinations = new Map<string, string>();

  for (const skin of skins) {
    for (const module of skin.modules) {
      destinations.set(module.id, reactModulePath(skin, module, sharedSourcePaths));
    }
  }

  const generated = new Map<string, string>();

  for (const [destination, modules] of modulesByDestination(skins, destinations)) {
    const stripped = new Set(modules.map((module) => stripStyleImports(module.source)));
    const candidates = stripped.size === 1 ? [modules[0]!] : modules;

    for (const module of candidates) {
      const source = rewriteImports(graph, module, ({ dependency, reference }) => {
        if (reference.specifier === skinClassNameMergeImport) return '@videojs/utils/style';

        const frameworkImport = reactFrameworkImport(reference.specifier);
        if (frameworkImport) return relativeImport(destination, frameworkImport);

        if (!dependency) return undefined;

        const target = destinations.get(dependency.id);
        if (!target) throw new Error(`React Skin dependency has no generated target: \`${dependency.sourcePath}\`.`);

        return relativeImport(destination, target);
      });

      addGenerated(generated, destination, stripStyleImports(source));
    }
  }

  for (const skin of skins) {
    const publicRoot = `${packageRoot}/presets/${skin.preset}`;
    const entry = skinCatalogEntry(skin.root.meta.name);
    const publicName = skin.theme === 'minimal' ? 'minimal-skin' : 'skin';
    const component = entry.component;
    const generatedComponent = entry.exportName;
    const generatedRoot = destinations.get(skin.root.id)!;

    addGenerated(
      generated,
      `${publicRoot}/${publicName}.tsx`,
      reactSkinWrapper({
        component,
        generatedComponent,
        importSource: relativeImport(`${publicRoot}/${publicName}.tsx`, generatedRoot),
        video: skin.preset.endsWith('video'),
        live: skin.preset.startsWith('live'),
      })
    );
    addGenerated(
      generated,
      `${publicRoot}/${publicName}.css`,
      await bundleStyles(graph, skin.modules, {
        label: `${skin.theme}-${skin.preset}`,
        files: options.baseStyles ?? [`./styles/${skinBaseStylesheet(skin.preset, skin.theme)}`],
        // Packaged skins reach browsers without `@scope`; the registry keeps it.
        flattenScopes: true,
      })
    );
  }

  await addCopiedFiles(generated, options.workspaceDir, [
    ['packages/skins/src/presets/background/react/skin.tsx', `${packageRoot}/presets/background/skin.tsx`],
    ['packages/skins/src/presets/background/react/skin.css', `${packageRoot}/presets/background/skin.css`],
  ]);

  return generatedFiles(generated);
}

export function reactPackageSkinOwnedPaths(): string[] {
  const publicPaths = skinPresets.flatMap((preset) =>
    ['skin.tsx', 'skin.css', 'minimal-skin.tsx', 'minimal-skin.css'].map(
      (filename) => `${packageRoot}/presets/${preset}/${filename}`
    )
  );

  return [
    internalRoot,
    ...publicPaths,
    `${packageRoot}/presets/background/skin.tsx`,
    `${packageRoot}/presets/background/skin.css`,
  ];
}

function reactModulePath(
  skin: SkinRoot,
  module: GraphModule<SkinModuleMeta>,
  sharedSourcePaths: ReadonlySet<string>
): string {
  const ownedPrefix = `skins/${skinSourceDirectory(skin.root.meta.name)}/`;

  if (module.sourcePath.startsWith(ownedPrefix)) {
    return `${internalRoot}/${skin.root.meta.name}/${module.sourcePath.slice(ownedPrefix.length)}`;
  }

  return sharedSourcePaths.has(module.sourcePath)
    ? `${internalRoot}/shared/${module.sourcePath}`
    : `${internalRoot}/${skin.root.meta.name}/${module.sourcePath}`;
}

/**
 * Source paths whose generated module can be emitted once for every skin. A shared module resolves its imports through
 * one skin, so its own source must be identical across skins and every module it imports must be shared as well;
 * otherwise a minimal skin would import the default skin's copy of, say, an icon-bearing button.
 */
function collectSharedSourcePaths(skins: readonly SkinRoot[]): ReadonlySet<string> {
  const variants = new Map<string, Set<string>>();
  const dependencies = new Map<string, Set<string>>();

  for (const skin of skins) {
    const modules = new Map(skin.modules.map((module) => [module.id, module]));

    for (const module of skin.modules) {
      const sources = variants.get(module.sourcePath) ?? new Set<string>();
      const imported = dependencies.get(module.sourcePath) ?? new Set<string>();

      sources.add(stripStyleImports(module.source));

      for (const reference of module.imports) {
        const dependency = reference.resolvedId === undefined ? undefined : modules.get(reference.resolvedId);

        if (dependency) imported.add(dependency.sourcePath);
      }

      variants.set(module.sourcePath, sources);
      dependencies.set(module.sourcePath, imported);
    }
  }

  const shared = new Set([...variants].filter(([, sources]) => sources.size === 1).map(([sourcePath]) => sourcePath));

  for (let changed = true; changed;) {
    changed = false;

    for (const sourcePath of [...shared]) {
      if ([...(dependencies.get(sourcePath) ?? [])].every((dependency) => shared.has(dependency))) continue;

      shared.delete(sourcePath);
      changed = true;
    }
  }

  return shared;
}

function reactFrameworkImport(specifier: string): string | undefined {
  if (specifier === '@videojs/react' || radioGroupImports.has(specifier) || specifier === 'cn') {
    return `${packageRoot}/internal/skin-primitives.ts`;
  }

  if (specifier === '@videojs/react/icons') return `${packageRoot}/icons/index.ts`;

  if (specifier === '@videojs/react/icons/minimal') return `${packageRoot}/icons/minimal/index.ts`;

  return undefined;
}

function reactSkinWrapper(options: {
  readonly component: string;
  readonly generatedComponent: string;
  readonly importSource: string;
  readonly video: boolean;
  /** Live skins have no time slider, so they take no thumbnail render override. */
  readonly live: boolean;
}): string {
  const props = `${options.component}Props`;
  const base = options.video ? (options.live ? 'BaseVideoSkinProps' : 'OnDemandVideoSkinProps') : 'BaseSkinProps';

  return `'use client';

import { ${options.generatedComponent} as Skin } from '${options.importSource}';

import type { ${base} } from '../types';

export interface ${props} extends ${base} {}

export function ${options.component}(props: ${props}) {
  return <Skin {...props} />;
}
`;
}

function modulesByDestination(
  skins: readonly SkinRoot[],
  destinations: ReadonlyMap<string, string>
): Array<readonly [string, readonly GraphModule<SkinModuleMeta>[]]> {
  const grouped = new Map<string, Map<string, GraphModule<SkinModuleMeta>>>();

  for (const skin of skins) {
    for (const module of skin.modules) {
      const destination = destinations.get(module.id)!;
      const modules = grouped.get(destination) ?? new Map();

      modules.set(module.id, module);
      grouped.set(destination, modules);
    }
  }

  return [...grouped]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([destination, modules]) => [destination, [...modules.values()]] as const);
}
