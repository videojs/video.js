import { readFile } from 'node:fs/promises';

import type { ModuleMeta } from '../components/meta';
import { createClosureKeys, type Graph, type GraphModule } from '../graph';
import { readTailwindRegistryTheme, type TailwindRegistryTheme } from './tailwind';

/** Facts about one finalized graph that every registry catalog built from it shares. */
export interface RegistryAnalysis<Meta extends ModuleMeta> {
  /** Identity of a module's source, compiled styles, and import closure; equal keys are interchangeable modules. */
  closureKey(module: GraphModule<Meta>): string;
  /** Read an authored file once per build. */
  readFile(filename: string): Promise<string>;
  /** Read a Tailwind source's registry theme once per build. */
  tailwindTheme(path: string): Promise<TailwindRegistryTheme>;
}

// Keyed by the module map, which a finalized graph exposes unchanged until the next build replaces it.
const analyses = new WeakMap<ReadonlyMap<string, unknown>, RegistryAnalysis<ModuleMeta>>();

/** Analyze a finalized graph once, however many catalogs are built from it. */
export function analyzeGraph<Meta extends ModuleMeta>(graph: Graph<Meta>): RegistryAnalysis<Meta> {
  const cached = analyses.get(graph.modules);
  if (cached) return cached as unknown as RegistryAnalysis<Meta>;

  const files = new Map<string, Promise<string>>();
  const themes = new Map<string, Promise<TailwindRegistryTheme>>();
  const analysis: RegistryAnalysis<Meta> = {
    closureKey: createClosureKeys(graph, { styles: true }),
    readFile(filename) {
      let file = files.get(filename);

      if (!file) {
        file = readFile(filename, 'utf8');
        files.set(filename, file);
      }

      return file;
    },
    tailwindTheme(path) {
      let theme = themes.get(path);

      if (!theme) {
        theme = readTailwindRegistryTheme(graph.root, path);
        themes.set(path, theme);
      }

      return theme;
    },
  };

  analyses.set(graph.modules, analysis as unknown as RegistryAnalysis<ModuleMeta>);
  return analysis;
}
