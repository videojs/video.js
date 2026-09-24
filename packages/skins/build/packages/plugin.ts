import { resolve } from 'node:path';

import { defineGraphPlugin } from 'vjsc/graph';

import type { SkinModuleMeta } from '../../src/meta.ts';
import type { SkinVariant } from '../variants.ts';
import { type GeneratedFile, syncGeneratedFiles } from './files.ts';
import { createHtmlPackageSkins } from './html.ts';
import { backgroundPresetCopies, packageOwnedPaths } from './outputs.ts';
import { createReactPackageSkins } from './react.ts';

export interface PackageSkinsPluginOptions {
  readonly workspaceDir: string;
  readonly format?: ((source: GeneratedFile) => string | Promise<string>) | undefined;
}

/** Generate ignored React and HTML package Skin inputs from the finalized VJSC module graph. */
export function packageSkinsPlugin(options: PackageSkinsPluginOptions): ReturnType<typeof defineGraphPlugin> {
  return defineGraphPlugin<SkinModuleMeta, SkinVariant>({
    name: 'skins:packages',
    watch: () =>
      [...backgroundPresetCopies.react, ...backgroundPresetCopies.html].map(([source]) =>
        resolve(options.workspaceDir, source)
      ),
    async generate(graph) {
      const profile = process.env.VIDEOJS_PROFILE_SKINS === '1';
      const generateStarted = performance.now();

      const [react, html] = await Promise.all([
        timed(() => createReactPackageSkins(graph, options)),
        timed(() => createHtmlPackageSkins(graph, options)),
      ]);

      const generated = [react.value, html.value];
      const generateEnded = performance.now();

      const files = await Promise.all(
        generated.flat().map(async (file) => {
          if (!options.format || !/\.(?:css|html|[cm]?[jt]sx?)$/.test(file.path)) return file;

          return { ...file, content: await options.format(file) };
        })
      );

      const formatEnded = performance.now();

      const changed = await syncGeneratedFiles(options.workspaceDir, files, [
        ...packageOwnedPaths('react'),
        ...packageOwnedPaths('html'),
      ]);

      const syncEnded = performance.now();

      if (profile) {
        this.info(
          `Profile: React ${duration(0, react.elapsed)}, HTML ${duration(0, html.elapsed)}, total render ${duration(generateStarted, generateEnded)}, format ${duration(generateEnded, formatEnded)}, sync ${duration(formatEnded, syncEnded)}.`
        );
      }

      if (changed > 0) this.info(`Generated ${changed} changed package Skin file${changed === 1 ? '' : 's'}.`);
    },
  });
}

async function timed<Value>(task: () => Promise<Value>): Promise<{ readonly elapsed: number; readonly value: Value }> {
  const started = performance.now();
  const value = await task();

  return { elapsed: performance.now() - started, value };
}

function duration(start: number, end: number): string {
  return `${((end - start) / 1000).toFixed(2)}s`;
}
