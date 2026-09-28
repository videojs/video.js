import { existsSync, globSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { transform } from 'lightningcss';

import { cssExclude, cssTargets } from '../css-targets.ts';
import { resolveImports } from './resolve-css-imports.ts';
import type { BuildPlugin } from './types.ts';

interface CopyCssPluginOptions {
  outDir: string;
  /** Package root whose CSS files are copied. Defaults to the current working directory. */
  rootDir?: string;
  /** Glob, relative to `rootDir`, selecting the CSS files to copy. Defaults to every `.css` file under `src`. */
  pattern?: string;
  inline?: boolean;
  rebuild?: boolean;
  /**
   * Map a source path to an output path relative to `outDir`, or null to skip the file. Defaults to mirroring the `src`
   * tree.
   */
  rename?: (file: string) => string | null;
  /** Drop an `@import`ed file, by resolved absolute path, instead of inlining it. */
  omitImport?: (file: string) => boolean;
  minify?: boolean;
}

function mirrorSrcTree(file: string): string {
  return file.replace(/^src\//, '');
}

export function copyCssPlugin(options: CopyCssPluginOptions): BuildPlugin {
  const {
    outDir,
    rootDir = process.cwd(),
    pattern = 'src/**/*.css',
    inline = true,
    rebuild = true,
    rename = mirrorSrcTree,
    omitImport,
    minify = false,
  } = options;
  let poll: ReturnType<typeof setInterval> | undefined;
  let state = new Map<string, string>();

  function getSourceCssFiles() {
    return globSync(pattern, { cwd: rootDir });
  }

  function getCssFiles() {
    return new Set(getSourceCssFiles().map((file) => join(rootDir, file)));
  }

  function getState() {
    return new Map(
      [...getCssFiles()].map((file) => {
        const { mtimeMs, size } = statSync(file);

        return [file, `${mtimeMs}:${size}`];
      })
    );
  }

  function writeCss() {
    for (const file of getSourceCssFiles()) {
      const target = rename(file);
      if (target === null) continue;

      const source = join(rootDir, file);
      const content = readFileSync(source, 'utf-8');
      let output = inline ? resolveImports(content, dirname(source), omitImport) : content;

      // Lower every copy, minified or not, so published CSS matches the root `browserslist`.
      output = transform({
        filename: source,
        code: Buffer.from(output),
        minify,
        targets: cssTargets,
        exclude: cssExclude,
      }).code.toString();

      const outFile = join(outDir, target);
      if (existsSync(outFile) && readFileSync(outFile, 'utf-8') === output) continue;

      mkdirSync(dirname(outFile), { recursive: true });
      writeFileSync(outFile, output);
    }
  }

  function checkCss() {
    try {
      const next = getState();
      if (next.size === state.size && [...next].every(([file, value]) => state.get(file) === value)) return;

      writeCss();
      state = next;
    } catch (error) {
      console.error(error);
    }
  }

  return {
    name: 'copy-css',
    buildStart() {
      if (!rebuild && process.argv.includes('--watch')) {
        if (!poll) {
          state = getState();
          poll = setInterval(checkCss, 100);
        }

        return;
      }

      for (const file of getCssFiles()) {
        this.addWatchFile(file);
      }
    },
    writeBundle: writeCss,
    closeWatcher() {
      clearInterval(poll);
    },
  };
}
