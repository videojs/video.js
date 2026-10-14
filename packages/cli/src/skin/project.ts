import { tailwindStylesheet } from './css';
import { BASE_SKIN_LABELS, FRAMEWORK_LABELS, PRESET_LABELS, STYLING_LABELS, type SkinOptions } from './options';
import { htmlPlayer, presetModule, reactPlayer } from './player';
import { registryVersion, resolveRegistrySkin, type ResolvedSkin } from './registry';
import { loadTemplates } from './templates';
import { VERSIONS } from './versions';
import { workbenchConfig } from './workbench';

export interface Project {
  /** Files keyed by path relative to the project root. */
  files: Map<string, string>;
  /** Where the skin source lives, relative to the project root. */
  skinDirectory: string;
  /** The Video.js version the registry pinned the skin to. */
  registryVersion: string | undefined;
}

/**
 * A template's path in the project. A `tsconfig.json` would join the monorepo's project graph, and `.gitignore` is easy
 * to lose in tooling, so templates prefix both with `_`.
 */
function templateTarget(path: string): string {
  return path.replace(/(^|\/)_(gitignore|tsconfig\.json)$/, (_, slash: string, name: string) =>
    name === 'gitignore' ? `${slash}.gitignore` : `${slash}${name}`
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => `&#${character.charCodeAt(0)};`);
}

function fill(source: string, values: Readonly<Record<string, string>>): string {
  return source.replace(/__([A-Z_]+)__/g, (match, key: string) => values[key] ?? match);
}

function sortObject(entries: Iterable<[string, string]>): Record<string, string> {
  return Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b)));
}

/** Versions for packages the registry lists without one. */
const UNPINNED_VERSIONS: Readonly<Record<string, string>> = {
  cn: VERSIONS.cn,
  react: VERSIONS.react,
  'react-dom': VERSIONS.react,
};

function packageJson(options: SkinOptions, packageName: string, skin: ResolvedSkin): string {
  const isReact = options.framework === 'react';
  const dependencies = new Map(skin.dependencies);
  const videojsVersion = dependencies.get(isReact ? '@videojs/react' : '@videojs/html') || VERSIONS.videojs;

  if (isReact && !dependencies.get('@videojs/react')) dependencies.set('@videojs/react', videojsVersion);

  for (const [name, version] of dependencies) {
    if (!version) dependencies.set(name, UNPINNED_VERSIONS[name] ?? 'latest');
  }

  // Everything else serves the workbench, a React and Shadcn shell whichever framework the skin is written for. It goes
  // in devDependencies, so `dependencies` lists only what `src/` needs when it moves into an app.
  const devDependencies = new Map<string, string>([
    ['@base-ui/react', VERSIONS.baseUi],
    ['@heroicons/react', VERSIONS.heroicons],
    ['@tailwindcss/vite', VERSIONS.tailwind],
    ['@types/react', VERSIONS.reactTypes],
    ['@types/react-dom', VERSIONS.reactTypes],
    ['@vitejs/plugin-react', VERSIONS.vitePluginReact],
    // The preview plays Mux media; the adapter is an optional peer of the framework packages.
    [`@videojs/mux-${presetModule(options.preset).kind}`, videojsVersion],
    ['class-variance-authority', VERSIONS.classVarianceAuthority],
    ['cn', VERSIONS.cn],
    ['react', VERSIONS.react],
    ['react-dom', VERSIONS.react],
    ['tailwindcss', VERSIONS.tailwind],
    ['typescript', VERSIONS.typescript],
    ['vite', VERSIONS.vite],
  ]);

  for (const name of dependencies.keys()) devDependencies.delete(name);

  for (const [name, specifier] of Object.entries(options.overrides)) {
    if (dependencies.has(name)) dependencies.set(name, specifier);

    if (devDependencies.has(name)) devDependencies.set(name, specifier);
  }

  const manifest: Record<string, unknown> = {
    name: packageName,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      typecheck: 'tsc --noEmit',
    },
    dependencies: sortObject(dependencies),
    devDependencies: sortObject(devDependencies),
  };

  // Local tarballs depend on each other by version, so point npm at the same files for transitive installs.
  if (Object.keys(options.overrides).length > 0) manifest.overrides = sortObject(Object.entries(options.overrides));

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * Pnpm reads overrides from `pnpm-workspace.yaml`, and the file also stops a project created inside another pnpm
 * workspace from joining it.
 */
function pnpmWorkspace(options: SkinOptions): string {
  const lines = ['packages:', "  - '.'"];
  const overrides = Object.entries(options.overrides);

  if (overrides.length > 0) lines.push('overrides:', ...overrides.map(([name, value]) => `  '${name}': '${value}'`));

  return `${lines.join('\n')}\n`;
}

function skinManifest(options: SkinOptions, skin: ResolvedSkin): string {
  const videojs = skin.dependencies.get(options.framework === 'react' ? '@videojs/react' : '@videojs/html');

  return `${JSON.stringify(
    {
      name: options.name,
      framework: options.framework,
      styling: options.styling,
      preset: options.preset,
      base: options.base,
      videojs: videojs || VERSIONS.videojs,
      source: 'src',
    },
    null,
    2
  )}\n`;
}

function readme(options: SkinOptions): string {
  const run = options.packageManager === 'npm' ? 'npm run' : options.packageManager;
  const base = BASE_SKIN_LABELS[options.base].label;

  return `# ${options.name}

A Video.js ${PRESET_LABELS[options.preset].toLowerCase()} skin for ${FRAMEWORK_LABELS[options.framework]}, styled with ${STYLING_LABELS[options.styling]}. It started from the ${base} skin.

## Develop

\`\`\`sh
${run} dev
\`\`\`

The workbench opens your skin in a slimmed-down version of the Video.js sandbox. It plays NASA's Cosmic Dawn trailer from Mux, with chapters; change the media in \`apps/preview/src/frame/player\`. The options panel sets the player's width and aspect ratio, the color scheme, text direction, and language, and playback options such as autoplay, muted, loop, and preload. The arrow button opens the preview on its own.

## Where things live

- \`src/\`: your skin, and only your skin. Keep, rewrite, or delete any of it.
  - \`src/${options.preset}/\`: the skin component and its parts.
  - \`src/styles/\`: theme tokens and shared styles the skin imports, when it started from a packaged skin.
  - \`src/skin.css\`: global styles for the skin.
- \`apps/preview/\`: the workbench that previews the skin. You don't need to change it.
  - \`src/shell/\`: the Shadcn shell.
  - \`src/frame/\`: the page the shell frames. \`player\` mounts your skin in a player and sets the media it plays.
  - \`public/\`: files the preview serves, such as the chapters track.
- \`skin.json\`: what this skin is built from. Keep it; it records the Video.js version the skin was created with.

## Learn more

- [Build your own skin](https://videojs.org/docs/framework/${options.framework}/guides/build-your-own-skin)
- [Customize skins](https://videojs.org/docs/framework/${options.framework}/guides/customize-skins)
- [UI components](https://videojs.org/docs/framework/${options.framework}/guides/ui-components)
`;
}

function viteConfig(): string {
  return `import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const path = (file: string) => fileURLToPath(new URL(file, import.meta.url));

// The workbench in apps/preview serves the app; \`@/\` imports reach the skin in src/.
export default defineConfig({
  root: path('./apps/preview'),
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@preview': path('./apps/preview/src'),
      '@': path('./src'),
    },
  },
  server: {
    fs: { allow: [path('.')] },
  },
  build: {
    outDir: path('./dist'),
    emptyOutDir: true,
    rolldownOptions: {
      // The workbench shell, and the preview page it frames.
      input: { workbench: path('./apps/preview/index.html'), preview: path('./apps/preview/preview.html') },
    },
  },
});
`;
}

function agentsGuide(options: SkinOptions): string {
  return `# Agent guide

This project is a Video.js ${FRAMEWORK_LABELS[options.framework]} skin. The skin is everything in \`src/\`, starting from \`src/${options.preset}/skin\`. \`apps/preview/\` is a workbench that previews it; change it only when asked.

- Run \`npx @videojs/cli agents skills\` to install the Video.js skill, and read https://videojs.org/docs/framework/${options.framework}/guides/build-your-own-skin before changing the skin.
- Keep the error dialog, hotkeys, and status announcer unless you replace them.
- Keep controls in source order that matches their visual order.
`;
}

/** Every file of a new skin project. */
export async function createProject(options: SkinOptions, packageName: string): Promise<Project> {
  const skin = await resolveRegistrySkin({
    registry: options.registry,
    framework: options.framework,
    styling: options.styling,
    theme: options.base,
    preset: options.preset,
  });

  const files = new Map<string, string>();
  const templateValues = {
    SKIN_NAME: escapeHtml(options.name),
    PREVIEW_EXTENSION: options.framework === 'react' ? 'tsx' : 'ts',
  };

  const templates = await loadTemplates(options.templates, ['shared', options.framework]);

  for (const directory of templates.values()) {
    for (const [path, source] of directory) files.set(templateTarget(path), fill(source, templateValues));
  }

  files.set('vite.config.ts', viteConfig());
  files.set(
    'src/skin.css',
    options.styling === 'tailwind'
      ? tailwindStylesheet(skin.themeVars, skin.css)
      : '/* Global styles for the skin, loaded only in the preview. */\n'
  );

  files.set('apps/preview/src/shell/config.ts', workbenchConfig(options, packageName));
  files.set(
    options.framework === 'react' ? 'apps/preview/src/frame/player.tsx' : 'apps/preview/src/frame/player.ts',
    options.framework === 'react' ? reactPlayer(options.preset) : htmlPlayer(options.preset)
  );

  for (const [path, source] of skin.files) files.set(path, source);

  files.set('package.json', packageJson(options, packageName, skin));
  files.set('skin.json', skinManifest(options, skin));
  files.set('README.md', readme(options));
  files.set('AGENTS.md', agentsGuide(options));

  if (options.packageManager === 'pnpm') files.set('pnpm-workspace.yaml', pnpmWorkspace(options));

  return { files, skinDirectory: `src/${options.preset}`, registryVersion: registryVersion(skin) };
}
