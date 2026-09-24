import { bundleStyles, emitModules, relativeImport, stripStyleImports } from 'vjsc/graph';

import { reactSubpathComponents } from '../../../react/vjsc/components.ts';
import type { SkinName } from '../../src/meta.ts';
import { skinCatalogEntry } from '../catalog.ts';
import { skinClassNameMergeImport } from '../imports.ts';
import { skinBaseStylesheet } from '../skin.ts';
import { skinSource } from '../source.ts';
import { type SkinGraph, type SkinGraphModule, skinRoots } from '../variants.ts';
import type { GeneratedFile } from './files.ts';
import { backgroundPresetCopies, packageInternalRoot, packageSourceRoot, reactPresetPath } from './outputs.ts';
import { addCopiedFiles, addGenerated, generatedFiles } from './utils.ts';

const packageRoot = packageSourceRoot.react;
const internalRoot = packageInternalRoot.react;
const subpathImports = new Set(Object.values(reactSubpathComponents));

export interface CreateReactPackageSkinsOptions {
  readonly workspaceDir: string;
  readonly baseStyles?: readonly string[] | undefined;
}

/** Generate package-local React Skin implementations from one finalized VJSC module graph. */
export async function createReactPackageSkins(
  graph: SkinGraph,
  options: CreateReactPackageSkinsOptions
): Promise<GeneratedFile[]> {
  const skins = skinRoots(graph, { target: 'react', style: 'css' });
  const skinNames = new Map(skins.map((skin) => [skin.root.id, skin.root.meta.name]));
  const generated = new Map<string, string>();
  const modules = emitModules(graph, {
    roots: skins.map((skin) => skin.root),
    place: ({ module, root, shared }) => reactModulePath(skinNames.get(root.id)!, module, shared),
    resolveImport({ reference, destination }) {
      if (reference.specifier === skinClassNameMergeImport) return '@videojs/utils/style';

      const frameworkImport = reactFrameworkImport(reference.specifier);

      return frameworkImport ? relativeImport(destination, frameworkImport) : undefined;
    },
    // Package skins bundle their CSS into one stylesheet per skin, so only module sources decide sharing.
    transform: stripStyleImports,
  });

  for (const [destination, source] of modules) addGenerated(generated, destination, source);

  for (const skin of skins) {
    const publicModule = reactPresetPath(skin.preset, skin.theme, 'tsx');
    const entry = skinCatalogEntry(skin.root.meta.name);
    const component = entry.component;
    const generatedComponent = entry.exportName;
    const generatedRoot = reactModulePath(skin.root.meta.name, skin.root, false);

    addGenerated(
      generated,
      publicModule,
      reactSkinWrapper({
        component,
        generatedComponent,
        importSource: relativeImport(publicModule, generatedRoot),
        video: entry.media === 'video',
        live: entry.live,
      })
    );
    addGenerated(
      generated,
      reactPresetPath(skin.preset, skin.theme, 'css'),
      await bundleStyles(graph, skin.modules, {
        label: `${skin.theme}-${skin.preset}`,
        files: options.baseStyles ?? [`./styles/${skinBaseStylesheet(skin.preset, skin.theme)}`],
        // Packaged skins reach browsers without `@scope`; the registry keeps it.
        flattenScopes: true,
      })
    );
  }

  await addCopiedFiles(generated, options.workspaceDir, backgroundPresetCopies.react);

  return generatedFiles(generated);
}

function reactModulePath(skin: SkinName, module: SkinGraphModule, shared: boolean): string {
  const source = skinSource(module.sourcePath);
  if (source.kind === 'skin' && source.skin === skin) return `${internalRoot}/${skin}/${source.file}`;

  return shared ? `${internalRoot}/shared/${module.sourcePath}` : `${internalRoot}/${skin}/${module.sourcePath}`;
}

function reactFrameworkImport(specifier: string): string | undefined {
  if (specifier === '@videojs/react' || subpathImports.has(specifier) || specifier === 'cn') {
    return `${packageRoot}/internal/skin-primitives.ts`;
  }

  if (specifier === '@videojs/react/icons') return `${packageRoot}/icons/index.ts`;

  const family = specifier.match(/^@videojs\/react\/icons\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)?.[1];
  if (family) return `${packageRoot}/icons/${family}/index.ts`;

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
