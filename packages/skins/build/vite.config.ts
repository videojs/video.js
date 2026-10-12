import { resolve } from 'node:path';

import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';
import { vjscPlugin, vjscRegistryPlugin } from 'vjsc/plugins';

import { skinCatalog } from './catalog.ts';
import { packageDir, skinCompilerOptions, skinEntries, skinUtils } from './config.ts';
import { skinClassNameMergeImport } from './imports.ts';
import { packageSkinsPlugin } from './packages/plugin.ts';
import { formatSource } from './registry/format.ts';
import { registryItems } from './registry/items/index.ts';
import { registryStyles } from './registry/items/styles.ts';
import type { VideojsCatalogMeta } from './registry/meta.ts';
import { registryPackages, registryPaths, registryTargets } from './registry/targets.ts';

export const skinBuildConfig: PackUserConfig = {
  name: 'skins',
  cwd: packageDir,
  entry: { registry: skinUtils },
  outDir: 'dist/registry/source',
  clean: true,
  dts: false,
  sourcemap: false,
  platform: 'browser',
  format: 'es',
  inputOptions: {
    experimental: {
      nativeMagicString: true,
    },
  },
  ignoreWatch: [/[/\\]packages[/\\][^/\\]+[/\\]dist(?:[/\\]|$)/],
  report: process.env.CI === 'true',
  deps: {
    neverBundle: true,
    onlyBundle: false,
  },
  plugins: [
    vjscPlugin({
      ...skinCompilerOptions,
      entries: skinEntries,
      // The build only captures the graph; the registry and package writers emit everything it produces.
      assetsOnly: true,
    }),
    vjscRegistryPlugin({
      name: 'videojs',
      homepage: 'https://videojs.org',
      namespace: '@videojs',
      format: formatSource,
      paths: registryPaths,
      imports: {
        '@videojs/utils/style': '@/lib/resolve-class-name',
        [skinClassNameMergeImport]: '@/lib/utils',
      },
      packages: registryPackages,
      // Every Video.js dependency must install the version this registry was built from.
      pinned: (name) => name.startsWith('@videojs/'),
      catalogs: registryTargets.map((target) => ({
        output: target.output,
        meta: {
          framework: target.framework,
          styling: target.styling,
          theme: target.theme,
        } satisfies VideojsCatalogMeta,
        items: registryItems(target),
        styles: registryStyles(target),
      })),
    }),
    {
      name: 'skins:catalog',
      generateBundle() {
        for (const target of registryTargets) {
          this.emitFile({
            type: 'asset',
            fileName: `${target.output}/catalog.json`,
            source: `${JSON.stringify(
              skinCatalog.filter((skin) => skin.theme === target.theme),
              null,
              2
            )}\n`,
          });
        }
      },
    },
    packageSkinsPlugin({
      workspaceDir: resolve(packageDir, '../..'),
      format: formatSource,
    }),
  ],
};

export default defineConfig({ pack: skinBuildConfig });
