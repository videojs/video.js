import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import type { PackageManager } from '@videojs/installation';

import { tailwindStylesheet } from './css';
import { BASE_SKIN_LABELS, FRAMEWORK_LABELS, PRESET_LABELS, STYLING_LABELS, type SkinOptions } from './options';
import { htmlPlayer, presetModule, reactPlayer } from './player';
import { resolveRegistrySkin, type ResolvedSkin } from './registry';
import { VERSIONS } from './versions';
import { workbenchConfig } from './workbench';

/** Template files ship beside `dist/` in the published package. */
const TEMPLATES = new URL('../templates/', import.meta.url);

export interface Project {
  /** Files keyed by path relative to the project root. */
  files: Map<string, string>;
  /** Where the skin source lives, relative to the project root. */
  skinDirectory: string;
}

async function readTemplateDirectory(directory: string): Promise<Map<string, string>> {
  const root = new URL(`${directory}/`, TEMPLATES);
  const files = new Map<string, string>();
  const entries = await readdir(root, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const path = join(entry.parentPath, entry.name);
    // npm drops `.gitignore` from published packages, and a `tsconfig.json` would join the monorepo's project graph,
    // so templates prefix both with `_`.
    const target = relative(root.pathname, path).replace(/(^|\/)_(gitignore|tsconfig\.json)$/, (_, slash, name) =>
      name === 'gitignore' ? `${slash}.gitignore` : `${slash}${name}`
    );

    files.set(target, await readFile(path, 'utf8'));
  }

  return files;
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

/** How each package manager runs a package script, and a CLI it has not installed. Yarn 1 has no `dlx`. */
const RUNNERS = {
  npm: { run: 'npm run', dlx: 'npx --yes' },
  pnpm: { run: 'pnpm run', dlx: 'pnpm dlx' },
  yarn: { run: 'yarn run', dlx: 'npx --yes' },
  bun: { run: 'bun run', dlx: 'bunx' },
} as const satisfies Record<PackageManager, { run: string; dlx: string }>;

/**
 * Publishing goes through each host's own CLI, fetched on demand: it signs the user in, links or creates the project,
 * and prints the URL. `deploy` asks which host; `deploy:<host>` skips the question.
 */
function deployScripts(options: SkinOptions, packageName: string): Record<string, string> {
  const { run, dlx } = RUNNERS[options.packageManager];

  return {
    deploy: 'node apps/preview/deploy.mjs',
    // Build here and upload the output, so Vercel never installs the project: the deploy matches what was tested, and
    // projects pointing at local package builds deploy too.
    'deploy:vercel': `${dlx} vercel@latest build && ${dlx} vercel@latest deploy --prebuilt`,
    'deploy:netlify': `${dlx} netlify-cli@latest deploy --build`,
    'deploy:cloudflare': `${run} build && ${dlx} wrangler@latest pages deploy dist --project-name ${packageName}`,
  };
}

/** `vercel build`, and builds from a connected repository, read this, so the project needs no dashboard settings. */
function vercelConfig(options: SkinOptions): string {
  return `${JSON.stringify(
    {
      $schema: 'https://openapi.vercel.sh/vercel.json',
      framework: 'vite',
      buildCommand: `${RUNNERS[options.packageManager].run} build`,
      outputDirectory: 'dist',
    },
    null,
    2
  )}\n`;
}

/** Netlify reads this for `netlify deploy --build` and for builds from a connected repository. */
function netlifyConfig(options: SkinOptions): string {
  return `[build]\n  command = "${RUNNERS[options.packageManager].run} build"\n  publish = "dist"\n`;
}

function packageJson(options: SkinOptions, packageName: string, skin: ResolvedSkin): string {
  const isReact = options.framework === 'react';
  const dependencies = new Map(skin.dependencies);
  const videojsVersion = dependencies.get(isReact ? '@videojs/react' : '@videojs/html') || VERSIONS.videojs;

  if (isReact && !dependencies.get('@videojs/react')) dependencies.set('@videojs/react', videojsVersion);

  // The preview plays Mux media; the adapter is an optional peer of the framework packages.
  dependencies.set(`@videojs/mux-${presetModule(options.preset).kind}`, videojsVersion);

  // The workbench shell is React with Shadcn components, whichever framework the skin is written for.
  dependencies.set('react', VERSIONS.react);
  dependencies.set('react-dom', VERSIONS.react);
  dependencies.set('@base-ui/react', VERSIONS.baseUi);
  dependencies.set('@heroicons/react', VERSIONS.heroicons);
  dependencies.set('class-variance-authority', VERSIONS.classVarianceAuthority);
  dependencies.set('cn', VERSIONS.cn);

  for (const [name, version] of dependencies) {
    if (!version) dependencies.set(name, name === 'cn' ? VERSIONS.cn : 'latest');
  }

  const devDependencies = new Map<string, string>([
    ['@tailwindcss/vite', VERSIONS.tailwind],
    ['@types/react', VERSIONS.reactTypes],
    ['@types/react-dom', VERSIONS.reactTypes],
    ['@vitejs/plugin-react', VERSIONS.vitePluginReact],
    ['tailwindcss', VERSIONS.tailwind],
    ['typescript', VERSIONS.typescript],
    ['vite', VERSIONS.vite],
  ]);

  for (const [name, specifier] of Object.entries(options.overrides)) {
    if (dependencies.has(name)) dependencies.set(name, specifier);
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
      ...deployScripts(options, packageName),
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
  // \`pnpm deploy\` is a built-in command, so scripts named like built-ins always go through \`run\`.
  const runScript = RUNNERS[options.packageManager].run;
  const base = BASE_SKIN_LABELS[options.base].label;

  return `# ${options.name}

A Video.js ${PRESET_LABELS[options.preset].toLowerCase()} skin for ${FRAMEWORK_LABELS[options.framework]}, styled with ${STYLING_LABELS[options.styling]}. It started from the ${base} skin.

## Develop

\`\`\`sh
${run} dev
\`\`\`

The workbench opens your skin in a slimmed-down version of the Video.js sandbox. It plays NASA's Cosmic Dawn trailer from Mux, with chapters; change the media in \`apps/preview/src/frame/player\`. The options panel sets the player's width and aspect ratio, the color scheme, text direction, and language, and playback options such as autoplay, muted, loop, and preload. The arrow button opens the preview on its own.

## Publish

\`\`\`sh
${runScript} deploy
\`\`\`

It asks where to publish: Vercel, Netlify, or Cloudflare Pages. Name one to skip the question, such as \`${runScript} deploy vercel\`. The first time, the host's CLI signs you in and creates the project, then every run prints the URL. Vercel and Netlify publish a preview URL you can share; to publish to production instead, add \`--prod\` to the \`deploy:netlify\` script, or to both commands in \`deploy:vercel\`.

To publish on every push instead, put the project on GitHub and import it on Vercel or Netlify; \`vercel.json\` and \`netlify.toml\` already describe the build. The build uses relative URLs, so \`dist/\` also works on any static host, including in a subfolder.

## Where things live

- \`src/\`: your skin, and only your skin. Keep, rewrite, or delete any of it.
  - \`src/${options.preset}/\`: the skin component and its parts.
  - \`src/styles/\`: theme tokens and shared styles the skin imports, when it started from a packaged skin.
  - \`src/skin.css\`: global styles for the skin.
- \`apps/preview/\`: the workbench that previews the skin. You don't need to change it.
  - \`src/shell/\`: the Shadcn shell.
  - \`src/frame/\`: the page the shell frames. \`player\` mounts your skin in a player and sets the media it plays.
  - \`public/\`: files the preview serves, such as the chapters track.
- \`vercel.json\`, \`netlify.toml\`: how those hosts build the workbench.
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
  // Relative URLs, so the build works at a domain root or in a subfolder such as GitHub Pages.
  base: './',
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

  for (const directory of ['shared', options.framework]) {
    for (const [path, source] of await readTemplateDirectory(directory)) files.set(path, fill(source, templateValues));
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
  files.set('vercel.json', vercelConfig(options));
  files.set('netlify.toml', netlifyConfig(options));

  if (options.packageManager === 'pnpm') files.set('pnpm-workspace.yaml', pnpmWorkspace(options));

  return { files, skinDirectory: `src/${options.preset}` };
}
