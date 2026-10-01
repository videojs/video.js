import { generateCdnCode } from './cdn-code';
import { INSTALLATION_DEMO_SOURCES } from './defaults';
import { defaultInstallationExtensions, getInstallationExtension, type InstallationExtension } from './extensions';
import { getInstallationPlayerComponentName, getInstallationPreset, type Skin, type UseCase } from './presets';
import {
  getAdapterPackage,
  getInstallationRenderer,
  getMediaSubpath,
  isPresetRenderer,
  isVideoLikeRenderer,
  type Renderer,
} from './renderers';
import type { InstallMethod } from './selection';
import type { RegistryStyling } from './shadcn';

export interface InstallationOptions {
  useCase: UseCase;
  skin: Skin;
  media: Renderer;
  extensions?: readonly InstallationExtension[];
  sourceUrl: string;
  installMethod: InstallMethod;
}

export interface HTMLUsageCode {
  html: string;
  imports?: string;
}

export interface PackageManagerInstallCommands {
  npm: string;
  pnpm: string;
  yarn: string;
  bun: string;
}

export interface HTMLInstallCode extends PackageManagerInstallCommands {
  cdn: string;
}

export interface ReactCreateCode {
  'app/page.tsx': string;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function getDefaultSourceUrl(renderer: Renderer, useCase: UseCase): string {
  if (getInstallationPreset(useCase).live) {
    return INSTALLATION_DEMO_SOURCES.live;
  }

  return getInstallationRenderer(renderer).defaultSource;
}

export function resolveInstallationSourceUrl(sourceUrl: string, renderer: Renderer, useCase: UseCase): string {
  return sourceUrl.trim() || getDefaultSourceUrl(renderer, useCase);
}

function escapeHTMLAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Skin module basename within a preset group: `skin` or `neutral-skin`. */
function getSkinFile(skin: Exclude<Skin, 'none'>): 'skin' | 'neutral-skin' {
  return skin === 'neutral-video' || skin === 'neutral-audio' ? 'neutral-skin' : 'skin';
}

/** Packages a source install still needs after the registry item installs the core React or HTML package. */
export function generateSourceMediaInstallCode(
  renderer: Renderer,
  packageVersion?: string,
  extensions: readonly InstallationExtension[] = defaultInstallationExtensions(renderer)
): PackageManagerInstallCommands | null {
  const packages: string[] = [];
  const adapter = getAdapterPackage(renderer);

  if (adapter !== null) packages.push(adapter);

  packages.push(...extensions.map((extension) => getInstallationExtension(extension).packageName));

  if (packages.length === 0) return null;

  const value = versionPackages(packages, packageVersion);

  return packageManagerInstallCommands(value);
}

function versionPackages(packages: readonly string[], packageVersion?: string): string {
  return packages.map((packageName) => (packageVersion ? `${packageName}@${packageVersion}` : packageName)).join(' ');
}

function packageManagerInstallCommands(packages: string): PackageManagerInstallCommands {
  return {
    npm: `npm install ${packages}`,
    pnpm: `pnpm add ${packages}`,
    yarn: `yarn add ${packages}`,
    bun: `bun add ${packages}`,
  };
}

function installPackages(
  framework: '@videojs/html' | '@videojs/react',
  renderer: Renderer,
  extensions: readonly InstallationExtension[],
  packageVersion?: string
): string {
  const adapter = getAdapterPackage(renderer);
  const packages: string[] = [framework];

  if (adapter !== null) packages.push(adapter);

  packages.push(...extensions.map((extension) => getInstallationExtension(extension).packageName));

  return versionPackages(packages, packageVersion);
}

// ---------------------------------------------------------------------------
// HTML Install
// ---------------------------------------------------------------------------

export function generateHTMLInstallCode(
  opts: Pick<InstallationOptions, 'useCase' | 'skin' | 'media'> & Partial<Pick<InstallationOptions, 'extensions'>>,
  cdnMediaSubpaths: readonly string[],
  cdnBase?: string,
  packageVersion?: string
): HTMLInstallCode {
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const packages = installPackages('@videojs/html', opts.media, extensions, packageVersion);

  return {
    cdn: generateCdnCode(opts.useCase, opts.skin, opts.media, cdnMediaSubpaths, cdnBase, extensions),
    ...packageManagerInstallCommands(packages),
  };
}

// ---------------------------------------------------------------------------
// React Install
// ---------------------------------------------------------------------------

export function generateReactInstallCode(
  opts: Pick<InstallationOptions, 'media'> & Partial<Pick<InstallationOptions, 'extensions'>> = {
    media: 'html5-video',
  },
  packageVersion?: string
): PackageManagerInstallCommands {
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const packages = installPackages('@videojs/react', opts.media, extensions, packageVersion);

  return packageManagerInstallCommands(packages);
}

// ---------------------------------------------------------------------------
// HTML Usage
// ---------------------------------------------------------------------------

export function getRendererTag(renderer: Renderer): string {
  return getInstallationRenderer(renderer).htmlTag;
}

function getPlayerTag(useCase: UseCase): string {
  return `${getInstallationPreset(useCase).tagPrefix}-player`;
}

function isSizedVideoPlayer(useCase: UseCase): boolean {
  return getInstallationPreset(useCase).mediaType === 'video';
}

const htmlVideoLayout = ' style="display: block; width: 100%; aspect-ratio: 16 / 9;"';
const reactVideoLayout = ` style={{ width: '100%', aspectRatio: '16 / 9' }}`;
const reactTailwindVideoLayout = ' className="aspect-video w-full"';
const htmlContainerVideoLayout = ' style="position: relative; display: block; width: 100%; aspect-ratio: 16 / 9;"';
const reactContainerVideoLayout = ` style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}`;

export function getSkinTag(useCase: UseCase, skin: Exclude<Skin, 'none'>): string {
  const prefix = getInstallationPreset(useCase).tagPrefix;

  if (useCase === 'background-video') return `${prefix}-skin`;

  return getSkinFile(skin) === 'neutral-skin' ? `${prefix}-neutral-skin` : `${prefix}-skin`;
}

function generateMediaMarkup(
  tag: string,
  src: string,
  playsInline: string,
  extensions: readonly InstallationExtension[],
  indent: string
): string {
  return generateMediaMarkupWithSource(tag, `src="${escapeHTMLAttribute(src)}"`, playsInline, extensions, indent);
}

function generateMediaMarkupWithSource(
  tag: string,
  sourceAttribute: string,
  playsInline: string,
  extensions: readonly InstallationExtension[],
  indent: string
): string {
  const mediaEl = `${indent}<${tag} ${sourceAttribute}${playsInline}></${tag}>`;
  const extensionMarkup = extensions.map((extension) => {
    const { htmlTag } = getInstallationExtension(extension);

    if (extension !== 'mux-data') return `${indent}<${htmlTag}></${htmlTag}>`;

    return `${indent}<!--
${indent}    Mux Data monitors playback quality and is selected by default
${indent}    for Mux video and audio sources.
${indent}  -->
${indent}<${htmlTag}></${htmlTag}>`;
  });

  return [mediaEl, ...extensionMarkup].join('\n');
}

function generateHTMLMarkup(
  useCase: UseCase,
  skin: Skin,
  renderer: Renderer,
  url: string,
  extensions: readonly InstallationExtension[],
  mediaSlot?: string,
  layout: 'inline' | 'stylesheet' = 'inline'
): string {
  const playerTag = getPlayerTag(useCase);
  const tag = getRendererTag(renderer);
  const src = resolveInstallationSourceUrl(url, renderer, useCase);
  const playsInline = isVideoLikeRenderer(renderer) ? ' playsinline' : '';
  const mediaMarkup = (indent: string) =>
    mediaSlot === undefined
      ? generateMediaMarkup(tag, src, playsInline, extensions, indent)
      : indentBlock(mediaSlot, indent);

  const skinMediaComment = `    <!--
        Media are players without UIs, handling networking
        and display of the media. They are easily swappable
        to handle different sources.
      -->`;

  const playerComment = `<!--
  The player element owns and shares state between the UI
  components and Media. Put layout on the skin or container.
 -->`;

  if (skin === 'none' && useCase !== 'background-video') {
    const containerLayout = isSizedVideoPlayer(useCase) && layout === 'inline' ? htmlContainerVideoLayout : '';

    return `${playerComment}
<${playerTag}>
  <media-container${containerLayout}>
${skinMediaComment}
${mediaMarkup('    ')}
  </media-container>
</${playerTag}>`;
  }

  const skinTag = getSkinTag(useCase, skin === 'none' ? defaultSkinForUseCase(useCase) : skin);
  const skinLayout = isSizedVideoPlayer(useCase) && layout === 'inline' ? htmlVideoLayout : '';

  return `${playerComment}
<${playerTag}>
  <!--
    Skins contain the entire player UI and are easily swappable.
    Add the skin source to your project for full control over its
    UI components.
   -->
  <${skinTag}${skinLayout}>
${skinMediaComment}
${mediaMarkup('    ')}
  </${skinTag}>
</${playerTag}>`;
}

function generateSfcPlayerStyle(useCase: UseCase, skin: Skin): string {
  if (!isSizedVideoPlayer(useCase)) return '';

  const container = skin === 'none' && useCase !== 'background-video';
  const selector = container
    ? 'media-container'
    : getSkinTag(useCase, skin === 'none' ? defaultSkinForUseCase(useCase) : skin);
  const position = container ? '  position: relative;\n' : '';

  return `<style>
${selector} {
${position}  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>`;
}

function generateHTMLImports(
  useCase: UseCase,
  skin: Skin,
  renderer: Renderer,
  extensions: readonly InstallationExtension[]
): string {
  if (useCase === 'background-video') {
    const mediaSubpath = getMediaSubpath(renderer);
    const mediaImport = mediaSubpath ? `\nimport '@videojs/html/media/${mediaSubpath}';` : '';

    return `import '@videojs/html/background/player';
import '@videojs/html/background/skin';
import '@videojs/html/background/video';${mediaImport}`;
  }

  const group = getInstallationPreset(useCase).group;
  const mediaSubpath = getMediaSubpath(renderer);
  const mediaImport = mediaSubpath ? `\nimport '@videojs/html/media/${mediaSubpath}';` : '';

  const extensionImports = extensions
    .map((extension) => `\nimport '@videojs/html/extensions/${getInstallationExtension(extension).htmlSubpath}';`)
    .join('');

  if (skin === 'none') {
    return `import '@videojs/html/${group}/player';
import '@videojs/html/ui/container';${mediaImport}${extensionImports}`;
  }

  return `import '@videojs/html/${group}/player';
import '@videojs/html/${group}/${getSkinFile(skin)}';${mediaImport}${extensionImports}`;
}

export function generateHTMLUsageCode(
  opts: Pick<InstallationOptions, 'useCase' | 'skin' | 'media' | 'sourceUrl' | 'installMethod'> &
    Partial<Pick<InstallationOptions, 'extensions'>>
): HTMLUsageCode {
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const html = generateHTMLMarkup(opts.useCase, opts.skin, opts.media, opts.sourceUrl, extensions);
  const imports =
    opts.installMethod !== 'cdn' ? generateHTMLImports(opts.useCase, opts.skin, opts.media, extensions) : undefined;
  const result: HTMLUsageCode = { html };

  if (imports) result.imports = imports;

  return result;
}

// ---------------------------------------------------------------------------
// Vue and Svelte
// ---------------------------------------------------------------------------

function indentBlock(value: string, indent: string): string {
  return value
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n');
}

function getHTMLCustomElementTags(
  useCase: UseCase,
  skin: Skin,
  renderer: Renderer,
  extensions: readonly InstallationExtension[]
): string[] {
  const tags = [getPlayerTag(useCase)];

  if (skin !== 'none' || useCase === 'background-video') {
    tags.push(getSkinTag(useCase, skin === 'none' ? 'video' : skin));
  } else {
    tags.push('media-container');
  }

  const mediaTag = getRendererTag(renderer);

  if (mediaTag.includes('-')) tags.push(mediaTag);

  tags.push(...extensions.map((extension) => getInstallationExtension(extension).htmlTag));

  return [...new Set(tags)];
}

function defaultSkinForUseCase(useCase: UseCase): Exclude<Skin, 'none'> {
  return getInstallationPreset(useCase).mediaType;
}

export interface VueCustomElementConfigCode {
  'astro.config.mjs': string;
  'vite.config.ts': string;
  'nuxt.config.ts': string;
}

export interface VueCreateCode {
  component: string;
}

export interface VueUsageCode {
  'App.vue': string;
  'index.astro': string;
}

function vuePlayerImport(componentName: string, playerImport = `./components/${componentName}.vue`): string {
  return playerImport === '#components'
    ? `import { ${componentName} } from '#components';`
    : `import ${componentName} from '${playerImport}';`;
}

export interface SvelteCreateCode {
  component: string;
}

export interface SvelteUsageCode {
  '+page.svelte': string;
  'App.svelte': string;
  'index.astro': string;
}

function generateAstroComponentUsage(component: string, playerImport: string, media: string): string {
  return `---
import ${component} from '${playerImport}';
---

<${component} client:load>
${indentBlock(media, '  ')}
</${component}>`;
}

export function generateVueCustomElementConfigCode(
  opts: Pick<InstallationOptions, 'useCase' | 'skin' | 'media'> & Partial<Pick<InstallationOptions, 'extensions'>>
): VueCustomElementConfigCode {
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const tags = getHTMLCustomElementTags(opts.useCase, opts.skin, opts.media, extensions)
    .map((tag) => `'${tag}'`)
    .join(', ');
  const elementSet = `const videoJsElements = new Set([${tags}]);`;
  const isCustomElement = `(tag) => videoJsElements.has(tag)`;

  return {
    'astro.config.mjs': `import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

${elementSet}

export default defineConfig({
  integrations: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: ${isCustomElement},
        },
      },
    }),
  ],
});`,
    'vite.config.ts': `import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

${elementSet}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: ${isCustomElement},
        },
      },
    }),
  ],
});`,
    'nuxt.config.ts': `${elementSet}

export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      isCustomElement: ${isCustomElement},
    },
  },
});`,
  };
}

export function generateVueCreateCode(
  opts: Pick<InstallationOptions, 'useCase' | 'skin' | 'media'> & Partial<Pick<InstallationOptions, 'extensions'>>
): VueCreateCode {
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const imports = generateHTMLImports(opts.useCase, opts.skin, opts.media, extensions);
  const markup = generateHTMLMarkup(opts.useCase, opts.skin, opts.media, '', extensions, '<slot />', 'stylesheet');
  const style = generateSfcPlayerStyle(opts.useCase, opts.skin);

  return {
    component: `<script setup lang="ts">
${imports}
</script>

<template>
${indentBlock(markup, '  ')}
</template>${style ? `\n\n${style}` : ''}`,
  };
}

export function generateVueUsageCode(
  opts: Pick<InstallationOptions, 'useCase' | 'media' | 'sourceUrl'> &
    Partial<Pick<InstallationOptions, 'extensions'>> & { playerImport?: string | undefined }
): VueUsageCode {
  const componentName = getInstallationPlayerComponentName(opts.useCase);
  const source = resolveInstallationSourceUrl(opts.sourceUrl, opts.media, opts.useCase);
  const tag = getRendererTag(opts.media);
  const playsInline = isVideoLikeRenderer(opts.media) ? ' playsinline' : '';
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const media = generateMediaMarkup(tag, source, playsInline, extensions, '');

  return {
    'App.vue': `<script setup lang="ts">
${vuePlayerImport(componentName, opts.playerImport)}
</script>

<template>
  <${componentName}>
${indentBlock(media, '    ')}
  </${componentName}>
</template>`,
    'index.astro': generateAstroComponentUsage(
      componentName,
      opts.playerImport ?? `../components/${componentName}.vue`,
      media
    ),
  };
}

export function generateSvelteCreateCode(
  opts: Pick<InstallationOptions, 'useCase' | 'skin' | 'media'> & Partial<Pick<InstallationOptions, 'extensions'>>
): SvelteCreateCode {
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const imports = indentBlock(generateHTMLImports(opts.useCase, opts.skin, opts.media, extensions), '  ');
  const markup = generateHTMLMarkup(opts.useCase, opts.skin, opts.media, '', extensions, '<slot />', 'stylesheet');
  const style = generateSfcPlayerStyle(opts.useCase, opts.skin);

  return {
    component: `<script lang="ts">
${imports}
</script>

${markup}${style ? `\n\n${style}` : ''}`,
  };
}

export function generateSvelteUsageCode(
  opts: Pick<InstallationOptions, 'useCase' | 'media' | 'sourceUrl'> &
    Partial<Pick<InstallationOptions, 'extensions'>> & { playerImport?: string | undefined }
): SvelteUsageCode {
  const componentName = getInstallationPlayerComponentName(opts.useCase);
  const source = resolveInstallationSourceUrl(opts.sourceUrl, opts.media, opts.useCase);
  const tag = getRendererTag(opts.media);
  const playsInline = isVideoLikeRenderer(opts.media) ? ' playsinline' : '';
  const extensions = opts.extensions ?? defaultInstallationExtensions(opts.media);
  const media = generateMediaMarkupWithSource(tag, `src={${JSON.stringify(source)}}`, playsInline, extensions, '');
  const component = (path: string) => `<script lang="ts">
  import ${componentName} from '${path}';
</script>

<${componentName}>
${indentBlock(media, '  ')}
</${componentName}>`;

  return {
    '+page.svelte': component(`$lib/${componentName}.svelte`),
    'App.svelte': component(`./lib/${componentName}.svelte`),
    'index.astro': generateAstroComponentUsage(
      componentName,
      opts.playerImport ?? `../components/${componentName}.svelte`,
      media
    ),
  };
}

// ---------------------------------------------------------------------------
// React Create
// ---------------------------------------------------------------------------

export function getRendererComponent(renderer: Renderer): string {
  return getInstallationRenderer(renderer).reactComponent;
}

export function getSkinComponent(useCase: UseCase, skin: Exclude<Skin, 'none'>): string {
  const name = `${getInstallationPreset(useCase).componentPrefix}Skin`;

  return getSkinFile(skin) === 'neutral-skin' ? `Neutral${name}` : name;
}

function getPresetPlayer(useCase: UseCase): string {
  return getInstallationPlayerComponentName(useCase);
}

function generateReactMediaJsx(
  rendererJsx: string,
  extensions: readonly InstallationExtension[],
  indent: string
): string {
  const extensionJsx = extensions.map((extension) => {
    const { reactComponent } = getInstallationExtension(extension);

    if (extension !== 'mux-data') return `${indent}<${reactComponent} />`;

    return `${indent}{/* Mux Data monitors playback quality and is selected by default
${indent}    for Mux video and audio sources. */}
${indent}<${reactComponent} />`;
  });

  return [rendererJsx, ...extensionJsx].join('\n');
}

export function generateReactCreateCode(
  opts: Pick<InstallationOptions, 'useCase' | 'skin' | 'media' | 'sourceUrl'> &
    Partial<Pick<InstallationOptions, 'extensions'>>
): ReactCreateCode {
  const { useCase, skin, media: renderer } = opts;
  const extensions = opts.extensions ?? defaultInstallationExtensions(renderer);
  const rendererComponent = getRendererComponent(renderer);
  const playerComponent = getPresetPlayer(useCase);
  const source = resolveInstallationSourceUrl(opts.sourceUrl, renderer, useCase);

  const isBackgroundVideo = useCase === 'background-video';
  const isNoSkin = skin === 'none';
  const group = getInstallationPreset(useCase).group;

  const rendererProps = isVideoLikeRenderer(renderer)
    ? `src={${JSON.stringify(source)}} playsInline`
    : `src={${JSON.stringify(source)}}`;
  const rendererJsx = `<${rendererComponent} ${rendererProps} />`;
  const skinLayout = isSizedVideoPlayer(useCase) ? reactVideoLayout : '';
  const containerLayout = isSizedVideoPlayer(useCase) ? reactContainerVideoLayout : '';

  let presetImport: string;
  let mediaImport: string | null = null;
  let skinCssImport: string | null = null;
  let skinComponent: string | null = null;

  if (isBackgroundVideo) {
    skinComponent = getSkinComponent(useCase, 'video');
    skinCssImport = `@videojs/react/${group}/skin.css`;

    if (isPresetRenderer(renderer)) {
      presetImport = `import { ${playerComponent}, ${skinComponent}, ${rendererComponent} } from '@videojs/react/${group}';`;
    } else {
      presetImport = `import { ${playerComponent}, ${skinComponent} } from '@videojs/react/${group}';`;
      mediaImport = `import { ${rendererComponent} } from '@videojs/react/media/${getMediaSubpath(renderer) ?? renderer}';`;
    }
  } else if (isNoSkin) {
    if (isPresetRenderer(renderer)) {
      presetImport = `import { ${playerComponent}, ${rendererComponent} } from '@videojs/react/${group}';`;
    } else {
      presetImport = `import { ${playerComponent} } from '@videojs/react/${group}';`;
      mediaImport = `import { ${rendererComponent} } from '@videojs/react/media/${getMediaSubpath(renderer) ?? renderer}';`;
    }
  } else {
    skinComponent = getSkinComponent(useCase, skin);
    skinCssImport = `@videojs/react/${group}/${getSkinFile(skin)}.css`;

    if (isPresetRenderer(renderer)) {
      presetImport = `import { ${playerComponent}, ${skinComponent}, ${rendererComponent} } from '@videojs/react/${group}';`;
    } else {
      presetImport = `import { ${playerComponent}, ${skinComponent} } from '@videojs/react/${group}';`;
      mediaImport = `import { ${rendererComponent} } from '@videojs/react/media/${getMediaSubpath(renderer) ?? renderer}';`;
    }
  }

  const extensionImports = extensions.map((extension) => {
    const { htmlSubpath, reactComponent } = getInstallationExtension(extension);

    return `import { ${reactComponent} } from '@videojs/react/extensions/${htmlSubpath}';`;
  });

  const playerJsx = skinComponent
    ? `    <${playerComponent}>
      <${skinComponent}${skinLayout}>
        ${generateReactMediaJsx(rendererJsx, extensions, '        ')}
      </${skinComponent}>
    </${playerComponent}>`
    : `    <${playerComponent}>
      <Container${containerLayout}>
        ${generateReactMediaJsx(rendererJsx, extensions, '        ')}
      </Container>
    </${playerComponent}>`;

  const imports = [
    ...(skinCssImport ? [`import '${skinCssImport}';`] : []),
    ...(isNoSkin ? [`import { Container } from '@videojs/react';`] : []),
    presetImport,
    ...(mediaImport ? [mediaImport] : []),
    ...extensionImports,
  ].join('\n');

  return {
    'app/page.tsx': `${imports}

export default function Page() {
  return (
${playerJsx}
  );
}`,
  };
}

/** Build a React player around a skin component copied into the app by Shadcn. */
export function generateSourceReactCreateCode(
  opts: Pick<InstallationOptions, 'useCase' | 'skin' | 'media' | 'sourceUrl'> & {
    extensions?: readonly InstallationExtension[];
    componentsAlias?: string;
    styling?: RegistryStyling;
  }
): ReactCreateCode {
  const { useCase, media: renderer } = opts;
  const extensions = opts.extensions ?? defaultInstallationExtensions(renderer);
  const preset = getInstallationPreset(useCase);
  const playerComponent = getPresetPlayer(useCase);
  const rendererComponent = getRendererComponent(renderer);
  const source = resolveInstallationSourceUrl(opts.sourceUrl, renderer, useCase);
  // A registry theme changes the source behind the stable item name. Both the Default and Neutral catalogs export the
  // same local component (`VideoSkin`, `AudioSkin`, and so on).
  const skinComponent = `${preset.componentPrefix}Skin`;
  const rendererProps = isVideoLikeRenderer(renderer)
    ? `src={${JSON.stringify(source)}} playsInline`
    : `src={${JSON.stringify(source)}}`;
  const rendererJsx = `<${rendererComponent} ${rendererProps} />`;
  const skinLayout = isSizedVideoPlayer(useCase)
    ? opts.styling === 'tailwind'
      ? reactTailwindVideoLayout
      : reactVideoLayout
    : '';
  const presetImports = [playerComponent];
  let mediaImport: string | null = null;

  if (isPresetRenderer(renderer)) {
    presetImports.push(rendererComponent);
  } else {
    mediaImport = `import { ${rendererComponent} } from '@videojs/react/media/${getMediaSubpath(renderer) ?? renderer}';`;
  }

  const imports = [
    `import { ${presetImports.join(', ')} } from '@videojs/react/${preset.group}';`,
    ...(mediaImport ? [mediaImport] : []),
    ...extensions.map((extension) => {
      const { htmlSubpath, reactComponent } = getInstallationExtension(extension);

      return `import { ${reactComponent} } from '@videojs/react/extensions/${htmlSubpath}';`;
    }),
    `import { ${skinComponent} } from '${opts.componentsAlias ?? '@/components'}/videojs/${preset.flag}/skin';`,
  ].join('\n');

  return {
    'app/page.tsx': `${imports}

export default function Page() {
  return (
    <${playerComponent}>
      <${skinComponent}${skinLayout}>
        ${generateReactMediaJsx(rendererJsx, extensions, '        ')}
      </${skinComponent}>
    </${playerComponent}>
  );
}`,
  };
}

export interface SourceHTMLUsageCode {
  imports: string;
  media: string;
  /**
   * The video layout for the skin's root `media-container`, which replaces `anchor` in `skinFile`. The container is the
   * layout box, so audio skins, which size to their content, have none.
   */
  container: { anchor: string; code: string } | null;
  player: string;
  skinFile: string;
  /** The comment in `player` to replace with the contents of `skinFile`. */
  skinPlaceholder: string;
}

/** Build the imports and small edits needed to use an HTML skin copied into the app by Shadcn. */
export function generateSourceHTMLUsageCode(
  opts: Pick<InstallationOptions, 'useCase' | 'media' | 'sourceUrl'> & {
    extensions?: readonly InstallationExtension[];
    componentsAlias?: string;
    componentsDirectory?: string;
  }
): SourceHTMLUsageCode {
  const { useCase, media: renderer } = opts;
  const extensions = opts.extensions ?? defaultInstallationExtensions(renderer);
  const preset = getInstallationPreset(useCase);
  const mediaSubpath = getMediaSubpath(renderer);
  const tag = getRendererTag(renderer);
  const source = resolveInstallationSourceUrl(opts.sourceUrl, renderer, useCase);
  const playsInline = isVideoLikeRenderer(renderer) ? ' playsinline' : '';
  const skinFile = `${opts.componentsDirectory ?? 'components'}/videojs/${preset.flag}/skin.html`;
  const skinPlaceholder = `<!-- Paste the contents of ${skinFile} here. -->`;
  const imports = [
    `import '@videojs/html/${preset.group}/player';`,
    ...(mediaSubpath ? [`import '@videojs/html/media/${mediaSubpath}';`] : []),
    ...extensions.map(
      (extension) => `import '@videojs/html/extensions/${getInstallationExtension(extension).htmlSubpath}';`
    ),
    `import '${opts.componentsAlias ?? '@/components'}/videojs/${preset.flag}/skin';`,
  ].join('\n');

  return {
    imports,
    media: generateMediaMarkup(tag, source, playsInline, extensions, ''),
    container: isSizedVideoPlayer(useCase)
      ? { anchor: '<media-container', code: `<media-container${htmlVideoLayout}` }
      : null,
    player: `<${getPlayerTag(useCase)}>
  ${skinPlaceholder}
</${getPlayerTag(useCase)}>`,
    skinFile,
    skinPlaceholder,
  };
}
