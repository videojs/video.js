// oxlint-disable anti-slop/no-known-value-widening
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import browserslist from 'browserslist';
import { defineConfig, normalizePath, type Plugin, type PluginOption } from 'vite-plus';

import { mirrorTemplatesToSrc } from './scripts/shared';

// Locate @videojs/cdn through Node resolution rather than a workspace-relative
// path, so the sandbox also works when the package is installed from a registry.
// The manifest is the anchor because bundles only exist after `pnpm build:cdn`.
const cdnDir = normalizePath(dirname(createRequire(__filename).resolve('@videojs/cdn/package.json')));
const cssTarget = browserslist(undefined, { path: __dirname }).map((browser) => {
  const [name, version] = browser.split(' ');

  return `${name === 'ios_saf' ? 'ios' : name}${version!.split('-')[0]}`;
});
const cdnI18nRegistry = `${cdnDir}/i18n.dev.js`;
const cdnSourceI18n = `${cdnDir}/src/i18n.ts`;

const cdnSandboxMainSrc = resolve(__dirname, 'src/cdn/main.ts');
const cdnSandboxMainTemplate = resolve(__dirname, 'templates/cdn/main.ts');
// The StackBlitz template pkg.pr.new uploads is this directory alone, with the framework packages installed from the
// preview. Tasks that build sibling packages only exist inside the workspace.
const hasWorkspace = existsSync(resolve(__dirname, '../../pnpm-workspace.yaml'));
const hasWorkspaceSkins = existsSync(resolve(__dirname, '../../packages/skins/package.json'));

type TaskPath = string | { auto: boolean } | { pattern: string; base: 'package' | 'workspace' };

// Copies of the shared helpers in `build/task.ts`. This file may not import from outside the directory: Vite+ fails to
// start when a config import is missing, and the template has no `build/` beside it.
/** Stable automatic inputs shared by cached build and generator tasks. */
const cachedTaskInputs: TaskPath[] = [
  { auto: true },
  '!*.tsbuildinfo',
  '!**/*.tsbuildinfo',
  '!node_modules/.astro',
  '!node_modules/.astro/**',
  '!node_modules/.vite',
  '!node_modules/.vite/**',
  { pattern: '!node_modules/.modules.yaml', base: 'workspace' },
];

/** Stable automatic outputs shared by cached tasks with dynamic write sets. */
const cachedTaskOutputs: TaskPath[] = [
  { auto: true },
  '!*.tsbuildinfo',
  '!**/*.tsbuildinfo',
  '!node_modules/.astro',
  '!node_modules/.astro/**',
  '!node_modules/.vite',
  '!node_modules/.vite/**',
  { pattern: '!node_modules/.modules.yaml', base: 'workspace' },
];

/** Build the same task in each workspace dependency used by this package; nothing to build outside the workspace. */
function workspaceTaskDependencies(task = 'build') {
  return hasWorkspace ? [{ task, from: ['dependencies', 'devDependencies'] as const }] : [];
}

/** Branch and commit for the copied report; falls back when the checkout has no git metadata, as on StackBlitz. */
function describeGit(...args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * What the skins' Vite preset contributes when the sandbox runs inside the workspace: the plugins that compile authored
 * skins on request from `packages/skins/src`, and the packages those must never prebundle. The preset's `vjsc` dedupe
 * entry is not taken because the sandbox does not depend on the compiler; the icons and skins packages already share
 * one copy through the store.
 */
export interface SkinsSource {
  readonly plugins: PluginOption[];
  readonly resolve: {
    readonly alias: { readonly find: string | RegExp; readonly replacement: string }[];
  };
  readonly optimizeDeps: { readonly exclude: string[] };
}

// Vite+ loads this file to schedule tasks before it has built anything, so nothing here may import the compiler. The
// dev and build commands read `vite.workspace.config.ts` instead, which adds the preset once its dependencies exist.
const workspaceConfig = hasWorkspaceSkins ? ' --config vite.workspace.config.ts' : '';

/** True when the importer is one of the prebuilt @videojs/cdn chunks. */
function isCdnChunk(importer?: string): boolean {
  return importer !== undefined && normalizePath(importer).startsWith(`${cdnDir}/`);
}

/** True when this import should share the single CDN i18n registry module instance. */
function resolvesToCdnI18nRegistry(source: string, importer?: string): boolean {
  const normalizedSource = normalizePath(source);

  if (source === '@videojs/cdn/i18n' || normalizedSource === cdnI18nRegistry || normalizedSource === cdnSourceI18n) {
    return true;
  }

  const isRelativeI18nChunk =
    source === './i18n.dev.js' || source === '../i18n.dev.js' || source.endsWith('/i18n.dev.js');
  if (isRelativeI18nChunk && isCdnChunk(importer)) return true;

  if (source === '@videojs/core/i18n' && isCdnChunk(importer)) {
    return true;
  }

  return false;
}

function resolveCdnDevEntry(subpath: string): string | null {
  const devPath = resolve(cdnDir, `${subpath}.dev.js`);

  return existsSync(devPath) ? devPath : null;
}

/** Resolve CDN sandbox imports to the prebuilt development entries and registry. */
function cdnSandboxI18nPlugin(): Plugin {
  return {
    name: 'cdn-sandbox-i18n',
    enforce: 'pre',
    resolveId: {
      filter: {
        id: /^@videojs\/(?:core\/i18n|cdn(?:\/.*)?)$|(?:^|\/)i18n\.dev\.js$|\/cdn\/src\/i18n\.ts$|\/src\/cdn\/main\.ts$/,
      },
      handler(source, importer) {
        if (source === cdnSandboxMainSrc && existsSync(cdnSandboxMainTemplate)) {
          return cdnSandboxMainTemplate;
        }

        if (resolvesToCdnI18nRegistry(source, importer)) {
          return cdnI18nRegistry;
        }

        const cdnEntryMatch = source.match(/^@videojs\/cdn\/(.+)$/);

        if (cdnEntryMatch && cdnEntryMatch[1] !== 'i18n') {
          const devEntry = resolveCdnDevEntry(cdnEntryMatch[1]);
          if (devEntry) return devEntry;
        }

        return null;
      },
    },
  };
}

/** Keep gitignored `src/` aligned with `templates/` so CDN i18n markup is never stale. */
function sandboxTemplateSyncPlugin(): Plugin {
  return {
    name: 'sandbox-template-sync',
    async buildStart() {
      await mirrorTemplatesToSrc();
    },
  };
}

/** Discover sandbox entries by finding subdirectories of src/ that contain an index.html. */
function getSandboxEntries(): Record<string, string> {
  const srcDir = resolve(__dirname, 'src');
  const entries: Record<string, string> = {};

  // `src` is generated and gitignored. Vite+ loads every workspace config
  // before it can schedule the setup command that creates this directory.
  if (!existsSync(srcDir)) return entries;

  for (const entry of readdirSync(srcDir)) {
    const dir = resolve(srcDir, entry);
    const indexHtml = resolve(dir, 'index.html');

    if (statSync(dir).isDirectory() && existsSync(indexHtml)) {
      entries[entry] = indexHtml;
    }
  }

  return entries;
}

function serveAppShell(): Plugin {
  const shellSrc = resolve(__dirname, 'app/index.html');
  const shellEntry = normalizePath(resolve(__dirname, 'app/main.tsx'));
  const shellDest = resolve(__dirname, 'src/index.html');

  return {
    name: 'serve-app-shell',
    buildStart() {
      const html = readFileSync(shellSrc, 'utf-8').replace(/(src|href)="\.\/([^"]+)"/g, '$1="../app/$2"');

      // Unit tests load this config without the setup task, so the scratch tree may not exist yet.
      mkdirSync(dirname(shellDest), { recursive: true });

      writeFileSync(shellDest, html);
    },
    closeBundle() {
      rmSync(shellDest, { force: true });
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.originalUrl ?? req.url ?? '/';
        const { pathname } = new URL(requestUrl, 'http://localhost');

        if (pathname === '/' || pathname === '/index.html') {
          const html = readFileSync(shellSrc, 'utf-8').replace('./main.tsx', `/@fs/${shellEntry}`);
          const transformed = await server.transformIndexHtml('/app/index.html', html, requestUrl);

          res.setHeader('Content-Type', 'text/html');
          res.end(transformed);
          return;
        }

        next();
      });
    },
  };
}

function sandboxHeadPlugin(): Plugin {
  return {
    name: 'sandbox-head',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { charset: 'UTF-8' },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
          injectTo: 'head-prepend',
        },
        {
          tag: 'link',
          attrs: { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css', crossorigin: true },
          injectTo: 'head',
        },
      ];
    },
  };
}

/** The sandbox config, plus the skins preset's contribution when the workspace overlay supplies one. */
export function createSandboxConfig(skinsSource?: SkinsSource) {
  return defineConfig({
    run: {
      tasks: {
        dev: {
          command: `vp dev --host${workspaceConfig}`,
          cache: false,
          dependsOn: ['setup', ...workspaceTaskDependencies(), ...(hasWorkspace ? ['@videojs/cdn#build:cdn'] : [])],
        },
        setup: {
          command: 'tsx scripts/setup.ts',
          dependsOn: [
            ...(hasWorkspace ? ['@videojs/core#build'] : []),
            ...(hasWorkspaceSkins ? ['@videojs/skins#build:shadcn'] : []),
          ],
          cache: {
            // Setup deterministically mirrors tracked templates into the gitignored
            // scratch tree. Keep that generated tree out of its own fingerprint.
            input: [
              'scripts/setup.ts',
              'scripts/shared.ts',
              'scripts/generate-cdn-locale-loaders.ts',
              'scripts/sync-source-owned-skins.ts',
              'templates/**',
              { pattern: 'packages/skins/dist/shadcn/r/**', base: 'workspace' },
            ],
            output: ['src/**', 'app/_generated/**', 'app/shared/i18n/cdn-locale-loaders.generated.ts'],
          },
        },
        'test:ci': {
          command: 'pnpm test',
          cache: false,
          // The shell helpers import built workspace packages, so their builds must exist before vitest resolves them.
          dependsOn: workspaceTaskDependencies(),
        },
        build: {
          command: `vp build${workspaceConfig}`,
          dependsOn: ['setup', ...workspaceTaskDependencies(), ...(hasWorkspace ? ['@videojs/cdn#build:cdn'] : [])],
          cache: {
            // The app-shell plugin creates this file for the build and removes it
            // afterwards. Workspace dependencies are fingerprinted through the task
            // graph, not their mutable package-local node_modules links.
            input: [...cachedTaskInputs, '!src/index.html', '!node_modules/@videojs', '!node_modules/@videojs/**'],
            output: [...cachedTaskOutputs, '!src/index.html'],
          },
        },
      },
    },
    root: 'src',
    appType: 'mpa',
    define: {
      __DEV__: 'true',
      __WORKSPACE_SKINS__: JSON.stringify(skinsSource !== undefined),
      // Setup installs the registry skins from the local build inside the workspace; elsewhere they exist only when the
      // hosted registry answered. The dev server and build load this file after setup, so the check is current.
      __REGISTRY_SKINS__: JSON.stringify(
        hasWorkspace ||
          existsSync(resolve(__dirname, 'app/_generated/registry/react-tailwind-default/components/videojs'))
      ),
      __SANDBOX_BRANCH__: JSON.stringify(describeGit('rev-parse', '--abbrev-ref', 'HEAD')),
      __SANDBOX_COMMIT__: JSON.stringify(describeGit('rev-parse', '--short', 'HEAD')),
    },
    test: {
      clearMocks: false,
      // The shell's tables and helpers, not the templates: those run under Playwright from `apps/e2e`.
      root: __dirname,
      include: ['app/tests/**/*.test.ts'],
      environment: 'node',
    },
    plugins: [
      sandboxTemplateSyncPlugin(),
      cdnSandboxI18nPlugin(),
      ...(skinsSource?.plugins ?? []),
      tailwindcss(),
      // Explicit, because a compiled authored module with nothing left to lower keeps its JSX, and the nearest tsconfig
      // under `packages/skins/src` would otherwise send that JSX to the compiler's own runtime.
      react({ jsxImportSource: 'react' }),
      serveAppShell(),
      sandboxHeadPlugin(),
    ],
    resolve: {
      alias: [
        {
          find: '@registry-react-tailwind-default',
          replacement: resolve(__dirname, 'app/_generated/registry/react-tailwind-default'),
        },
        {
          find: '@registry-react-tailwind-minimal',
          replacement: resolve(__dirname, 'app/_generated/registry/react-tailwind-minimal'),
        },
        {
          find: '@registry-react-css-default',
          replacement: resolve(__dirname, 'app/_generated/registry/react-css-default'),
        },
        {
          find: '@registry-react-css-minimal',
          replacement: resolve(__dirname, 'app/_generated/registry/react-css-minimal'),
        },
        { find: '@registry-html-default', replacement: resolve(__dirname, 'app/_generated/registry/html-default') },
        { find: '@registry-html-minimal', replacement: resolve(__dirname, 'app/_generated/registry/html-minimal') },
        { find: '@app', replacement: resolve(__dirname, 'app') },
        { find: '@videojs/cdn/i18n', replacement: cdnI18nRegistry },
        ...(existsSync(cdnSandboxMainTemplate)
          ? [{ find: cdnSandboxMainSrc, replacement: cdnSandboxMainTemplate }]
          : []),
        ...(skinsSource?.resolve.alias ?? []),
      ],
      conditions: ['development', 'import', 'module', 'browser', 'default'],
      // Authored skins import the framework packages from inside `packages/skins`, which depends on neither; dedupe
      // resolves them from here, which is also what keeps one copy of each in the page.
      dedupe: [
        '@videojs/core',
        '@videojs/html',
        '@videojs/icons',
        '@videojs/react',
        '@videojs/utils',
        'react',
        'react-dom',
      ],
    },
    optimizeDeps: {
      // The Sandbox can load every media adapter and generated React skin. Prebundle their runtime dependencies before
      // serving so discovering a new route cannot hot-reload an already mounted player graph during development or E2E.
      include: [
        '@base-ui/react/button',
        '@base-ui/react/dialog',
        '@base-ui/react/input',
        '@base-ui/react/merge-props',
        '@base-ui/react/select',
        '@base-ui/react/separator',
        '@base-ui/react/slider',
        '@base-ui/react/switch',
        '@base-ui/react/toggle',
        '@base-ui/react/toggle-group',
        '@base-ui/react/tooltip',
        '@base-ui/react/use-render',
        '@videojs/html > @videojs/element > @lit/context',
        '@videojs/media > dashjs',
        '@videojs/media > hls.js',
        '@videojs/media > mux-embed',
        '@videojs/react > react-compiler-runtime',
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
      ],
      exclude: [
        '@videojs/core',
        '@videojs/html',
        '@videojs/react',
        '@videojs/spf',
        '@videojs/store',
        '@videojs/utils',
        ...(skinsSource?.optimizeDeps.exclude ?? []),
      ],
      noDiscovery: true,
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      cssTarget,
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      rolldownOptions: {
        experimental: {
          nativeMagicString: true,
        },
        // This resolver substitutes the prebuilt CDN graph, whose downstream
        // processing time is attributed to the plugin rather than its fast hooks.
        checks: {
          pluginTimings: false,
        },
        input: {
          main: resolve(__dirname, 'src/index.html'),
          ...getSandboxEntries(),
        },
        onwarn(warning, defaultHandler) {
          if (warning.code === 'COMMONJS_VARIABLE_IN_ESM') return;

          defaultHandler(warning);
        },
      },
    },
  });
}

export default createSandboxConfig();
