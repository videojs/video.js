import { pascalCase } from '@videojs/utils/string';
import { bundleStyles, relativeImport } from 'vjsc/graph';
import type { RegistryCreatedItem } from 'vjsc/shadcn';

import type { SkinModuleMeta, SkinName } from '../../../src/meta.ts';
import { skinCatalogEntry } from '../../catalog.ts';
import { createHtmlSkinRegistration, createSourceOwnedHtml, type GeneratedHtmlSkin } from '../../packages/html.ts';
import { isSkinPreset, skinBaseStylesheet, skinPreset, skinStyleItemName } from '../../skin.ts';
import { skinSource } from '../../source.ts';
import type { SkinGraph, SkinGraphModule } from '../../variants.ts';
import { registryDocsUrl } from '../docs.ts';
import type { SkinRegistryItem, VideojsItemMeta } from '../meta.ts';
import { packageRequirements, registryPaths, type RegistryTarget } from '../targets.ts';
import { exportedComponentName } from './components.ts';
import { reactHelperDependency } from './support.ts';

export async function htmlSkinItem(
  skin: GeneratedHtmlSkin,
  graph: SkinGraph,
  target: RegistryTarget
): Promise<RegistryCreatedItem> {
  const meta = skin.root.meta;

  const { registryItem: name, directory } = skinCatalogEntry(meta.name);
  const template = createSourceOwnedHtml(skin.template);

  const styleTarget = `${directory}/skin.css`;
  const themeImport = relativeImport(`${directory}/skin.ts`, `styles/${skinBaseStylesheet(skin.preset, skin.theme)}`);
  const styleImport = relativeImport(`${directory}/skin.ts`, styleTarget);

  // The shared and preset theme items must load before the skin's own scoped rules.
  const registration = `import '${themeImport}';\nimport '${styleImport}';\n\n${createHtmlSkinRegistration(
    skin.elements,
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
      preset: skin.preset,
      media: skinCatalogEntry(skin.root.meta.name).media,
      public: true,
    } satisfies VideojsItemMeta,
    group: 'skins',
  };
}

export function skinItem(
  module: SkinGraphModule,
  meta: Extract<SkinModuleMeta, { type: 'skin' }>,
  target: RegistryTarget
): SkinRegistryItem {
  const skin = meta.name;
  const { preset, theme, media, directory, registryItem } = skinCatalogEntry(skin);
  const registryMeta = { role: 'skin', preset, media, public: true } satisfies VideojsItemMeta;

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
    target: `${directory}/skin.tsx`,
    place: (candidate, root) => skinModuleTarget(candidate, root, skin),
    stylesheet: target.styling === 'css' ? { target: `${directory}/skin.css` } : undefined,
    theme: `styles/${skinBaseStylesheet(preset, theme)}`,
  };
}

export function skinModuleTarget(module: SkinGraphModule, root: SkinGraphModule, skin: SkinName): string {
  if (module.id === root.id) return `${skinPreset(skin)}/skin.tsx`;

  const source = skinSource(module.sourcePath);

  switch (source.kind) {
    case 'component':
      throw new Error(`Reusable registry component was not published independently: \`${source.path}\`.`);
    case 'skin':
      return `${skinPreset(source.skin)}/${source.file}`;
    case 'shared':
      // Preset-shared modules compile with each theme's variants and stay beside that skin.
      return isSkinPreset(source.group)
        ? `${skinPreset(skin)}/${source.file}`
        : `${skinPreset(skin)}/${source.group}/${source.file}`;
    case 'theme':
      return `${skinPreset(skin)}/shared/${source.file}`;
    default:
      throw new Error(`Registry module is not below a skin or shared directory: \`${source.path}\`.`);
  }
}

function skinDocs(
  module: SkinGraphModule,
  meta: Extract<SkinModuleMeta, { type: 'skin' }>,
  skin: SkinName,
  target: RegistryTarget,
  directory: string
): string {
  const component = exportedComponentName(module);
  const { preset, media: mediaType } = skinCatalogEntry(skin);
  const player = `${pascalCase(preset)}Player`;
  const media = pascalCase(mediaType);

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
