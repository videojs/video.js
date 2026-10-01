import { posix } from 'node:path';

import { type Graph, type GraphModule, bundleStyles } from 'vjsc/graph';
import type { RegistryCreatedItem, RegistryModuleItem } from 'vjsc/shadcn';

import { isSkinName, type SkinModuleMeta, type SkinName } from '../../../src/meta.ts';
import { skinCatalogEntry } from '../../catalog.ts';
import { createHtmlSkinRegistration, createSourceOwnedHtml, type RenderedHtmlSkin } from '../../packages/html.ts';
import { isSkinPreset, skinBaseStylesheet, skinDirectory, skinPreset, skinStyleItemName } from '../../skin.ts';
import { registryDocsUrl } from '../docs.ts';
import type { VideojsRegistryMeta } from '../meta.ts';
import { packageRequirements, registryPaths, type RegistryTarget } from '../targets.ts';
import { exportedComponentName } from './components.ts';
import { reactHelperDependency } from './support.ts';

export async function htmlSkinItem(
  skin: RenderedHtmlSkin,
  graph: Graph<SkinModuleMeta>,
  target: RegistryTarget
): Promise<RegistryCreatedItem> {
  const meta = skin.root.meta;

  const { registryItem: name, directory } = skinCatalogEntry(meta.name);
  const template = createSourceOwnedHtml(skin.template);

  const styleTarget = `${directory}/skin.css`;
  const themeImport = relativeRegistryImport(
    `${directory}/skin.ts`,
    `styles/${skinBaseStylesheet(skin.preset, skin.theme)}`
  );
  const styleImport = relativeRegistryImport(`${directory}/skin.ts`, styleTarget);

  // The shared and preset theme items must load before the skin's own scoped rules.
  const registration = `import '${themeImport}';\nimport '${styleImport}';\n\n${createHtmlSkinRegistration(
    template,
    skin.modules,
    'registry'
  )}`;

  const files: NonNullable<RegistryCreatedItem['files']> = [
    {
      path: 'skin.html',
      target: `${registryPaths.install}/${directory}/skin.html`,
      type: 'registry:file',
      content: template,
    },
    {
      path: 'skin.ts',
      target: `${registryPaths.install}/${directory}/skin.ts`,
      type: 'registry:file',
      content: registration,
    },
    {
      path: 'skin.css',
      target: `${registryPaths.install}/${directory}/skin.css`,
      type: 'registry:style',
      // Theme tokens, resets, and preset styles ship through the skin's registry dependency closure.
      content: await bundleStyles(graph, skin.modules, { label: name }),
    },
  ];

  return {
    name,
    type: 'registry:block',
    title: meta.title,
    description: meta.description,
    categories: ['media', 'skins', skin.preset],
    docs: skinDocs(skin.root, meta, meta.name, target, directory),
    dependencies: ['@videojs/html'],
    registryDependencies: [`@videojs/${skinStyleItemName(skin.preset, skin.theme)}`],
    files,
    meta: {
      role: 'skin',
      framework: 'html',
      styling: target.styling,
      preset: skin.preset,
      media: skin.preset.endsWith('audio') ? 'audio' : 'video',
      theme: skin.theme,
      public: true,
    } satisfies VideojsRegistryMeta,
    group: 'skins',
  };
}

export function skinItem(
  module: GraphModule<SkinModuleMeta>,
  meta: Extract<SkinModuleMeta, { type: 'skin' }>,
  target: RegistryTarget
): RegistryModuleItem<SkinModuleMeta> {
  const skin = meta.name;
  if (!isSkinName(skin)) throw new Error(`Unknown Skin registry module: \`${skin}\`.`);

  const { preset, theme, directory, registryItem } = skinCatalogEntry(skin);
  const registryMeta = {
    role: 'skin',
    framework: target.framework,
    styling: target.styling,
    preset,
    media: preset.endsWith('audio') ? 'audio' : 'video',
    theme,
    public: true,
  } satisfies VideojsRegistryMeta;

  return {
    name: registryItem,
    type: 'registry:block',
    title: meta.title,
    description: meta.description,
    categories: ['media', 'skins', preset],
    docs: skinDocs(module, meta, skin, target, directory),
    registryDependencies: reactHelperDependency(target),
    meta: registryMeta,
    group: 'skins',
    directives: ['use client'],
    target: (candidate, root) => skinModuleTarget(candidate, root, skin),
    stylesheet: target.styling === 'css' ? { target: `${directory}/skin.css` } : undefined,
    theme: `styles/${skinBaseStylesheet(preset, theme)}`,
  };
}

function relativeRegistryImport(importer: string, target: string): string {
  const specifier = posix.relative(posix.dirname(importer), target);

  return specifier.startsWith('.') ? specifier : `./${specifier}`;
}

export function skinModuleTarget(
  module: GraphModule<SkinModuleMeta>,
  root: GraphModule<SkinModuleMeta>,
  skin: SkinName
): string {
  if (module.id === root.id) return `${skinDirectory(skin)}/skin.tsx`;

  const sourcePath = module.sourcePath;

  if (sourcePath.startsWith('components/')) {
    throw new Error(`Reusable registry component was not published independently: \`${sourcePath}\`.`);
  }

  if (!sourcePath.startsWith('skins/')) throw new Error(`Unsupported registry source: \`${sourcePath}\`.`);

  const match = /^skins\/([^/]+)\/([^/]+)\/(.+)$/.exec(sourcePath);
  if (!match) throw new Error(`Unsupported registry source: \`${sourcePath}\`.`);

  const [, theme, preset, filename] = match;
  const owner = `${theme}-${preset}`;
  if (isSkinName(owner)) return `${skinDirectory(owner)}/${filename}`;

  // Preset-shared modules compile with each theme's variants and stay beside that skin.
  if (theme === 'shared' && preset && isSkinPreset(preset)) return `${skinDirectory(skin)}/${filename}`;

  if (theme === 'shared' && preset && filename) return `${skinDirectory(skin)}/${preset}/${filename}`;

  if (theme === 'compat' && preset === 'shared') return `${skinDirectory(skin)}/shared/${filename}`;

  throw new Error(`Unsupported registry source: \`${sourcePath}\`.`);
}

function skinDocs(
  module: GraphModule<SkinModuleMeta>,
  meta: Extract<SkinModuleMeta, { type: 'skin' }>,
  skin: SkinName,
  target: RegistryTarget,
  directory: string
): string {
  const component = exportedComponentName(module);
  const preset = skinPreset(skin);
  const player = `${pascalCase(preset)}Player`;
  const media = preset.endsWith('audio') ? 'Audio' : 'Video';

  if (target.framework === 'html') {
    return `Installs editable ${meta.title} source under \`${registryPaths.install}/${directory}\` together with the shared theme stylesheet. Requires \`${packageRequirements.html}\`; import the matching Player and media registrations before using the installed light-DOM template.`;
  }

  return `Requires \`${packageRequirements.react}\`, which is installed with this item. The native media element below handles browser-supported sources; [install a playback adapter](${registryDocsUrl(target, 'concepts/media-sources')}) for HLS, DASH, embeds, or another engine.

\`\`\`tsx
import { ${media}, ${player} } from '@videojs/react/${preset}';

import { ${component} } from '${registryPaths.import}/${directory}/skin';

export function Player({ src }: { src: string }) {
  return (
    <${player}>
      <${component} className="aspect-video w-full">
        <${media} src={src} />
      </${component}>
    </${player}>
  );
}
\`\`\``;
}

function pascalCase(value: string): string {
  return value.replace(/(?:^|-)([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}
