import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { __unstable__loadDesignSystem, compile, normalizePath } from '@tailwindcss/node';
import { isString } from '@videojs/utils/predicate';
import { createTwMerge, defaultConfig } from 'cn/config';

/** Operations style generation needs from a loaded Tailwind v4 design system. */
export interface DesignSystem {
  /** Files that contribute to the loaded Tailwind design. */
  readonly watchFiles: ReadonlySet<string>;
  /** Merge utilities using the loaded theme tokens. */
  merge(utilities: string): string;
  /** Return whether Tailwind recognizes a candidate. */
  recognizesCandidate(candidate: string): boolean;
  /** Return Tailwind's compiled CSS for one candidate. */
  candidateCss(candidate: string): string | undefined;
  /** Compile semantic CSS containing Tailwind directives such as `@apply`. Results are memoized by source. */
  compileCss(css: string): Promise<string>;
}

/** Load a design system from a Tailwind v4 entry CSS file. */
export async function loadDesignSystem(cssPath: string): Promise<DesignSystem> {
  const absolute = resolve(cssPath);
  const base = dirname(absolute);
  const raw = readFileSync(absolute, 'utf8');
  const reference = `@reference "${normalizePath(absolute)}";`;
  const watchFiles = await collectWatchFiles(absolute, reference);
  const design = await __unstable__loadDesignSystem(raw, { base });
  const theme = Object.fromEntries(
    Object.keys(defaultConfig().theme).map((group) => [group, design.theme.keysInNamespaces([`--${group}`])])
  );
  const merge = createTwMerge({ extend: { theme } });
  const candidateCache = new Map<string, string | undefined>();
  const candidateCss = (candidate: string): string | undefined => {
    if (candidateCache.has(candidate)) return candidateCache.get(candidate);

    const css = design.candidatesToCss([candidate])[0];
    const compiled = isString(css) && css.trim().length > 0 ? css : undefined;

    candidateCache.set(candidate, compiled);
    return compiled;
  };

  const compiled = new Map<string, Promise<string>>();
  const compileReferencedCss = (css: string): Promise<string> => {
    const cached = compiled.get(css);
    if (cached) return cached;

    const result = compile(`${reference}\n${css}`, {
      base,
      onDependency(path) {
        watchFiles.add(resolve(path));
      },
    }).then((compiler) => compiler.build([]));

    compiled.set(css, result);
    result.catch(() => {
      if (compiled.get(css) === result) compiled.delete(css);
    });

    return result;
  };

  return {
    watchFiles,
    merge,
    recognizesCandidate(candidate: string): boolean {
      return candidateCss(candidate) !== undefined;
    },
    candidateCss,
    compileCss: compileReferencedCss,
  };
}

/** The Node design loader discards dependency callbacks; only the compiler exposes its resolved imports. */
async function collectWatchFiles(path: string, reference: string): Promise<Set<string>> {
  const files = new Set([path]);

  await compile(reference, {
    base: dirname(path),
    onDependency(dependency) {
      files.add(resolve(dependency));
    },
  });

  return files;
}
